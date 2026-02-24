"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { InsightCard, SummaryCard } from "@/components/insights";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { InsightsResponse, PlayerInsight, InsightCategory } from "@/lib/insight-generator";

type FilterCategory = "all" | InsightCategory;

// Fetch insights from API
async function fetchInsights(steamId: string): Promise<InsightsResponse> {
  const response = await fetch(`/api/player/${steamId}/insights`);
  if (!response.ok) {
    throw new Error("Failed to fetch insights");
  }
  const json = await response.json();
  return json.data;
}

export default function InsightsPage() {
  const [filter, setFilter] = useState<FilterCategory>("all");
  const [steamId, setSteamId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    // Get user from localStorage
    const stored = localStorage.getItem("dotavision-state");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.user?.steamId) {
          setSteamId(parsed.user.steamId);
        }
      } catch (e) {
        console.error("Failed to parse stored state", e);
      }
    }
  }, []);

  // Demo mode: use Arteezy's profile for demo purposes
  const demoSteamId = steamId || "86745912";

  // Fetch insights data
  const {
    data: insightsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["insights", demoSteamId],
    queryFn: () => fetchInsights(demoSteamId),
    enabled: !!demoSteamId,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  useEffect(() => {
    if (insightsData?.generatedAt) {
      setLastUpdated(new Date(insightsData.generatedAt));
    }
  }, [insightsData]);

  // Filter insights based on category
  const filteredInsights = insightsData?.insights.filter(
    (insight) => filter === "all" || insight.category === filter
  ) || [];

  // Group insights by category for organized display
  const groupedInsights = {
    strength: insightsData?.insights.filter((i) => i.category === "strength") || [],
    weakness: insightsData?.insights.filter((i) => i.category === "weakness") || [],
    tip: insightsData?.insights.filter((i) => i.category === "tip") || [],
    warning: insightsData?.insights.filter((i) => i.category === "warning") || [],
  };

  const filterButtons: { key: FilterCategory; label: string; count: number }[] = [
    { key: "all", label: "All", count: insightsData?.insights.length || 0 },
    { key: "strength", label: "Strengths", count: groupedInsights.strength.length },
    { key: "weakness", label: "Weaknesses", count: groupedInsights.weakness.length },
    { key: "tip", label: "Tips", count: groupedInsights.tip.length },
    { key: "warning", label: "Warnings", count: groupedInsights.warning.length },
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-800 rounded-xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !insightsData) {
    return (
      <div className="p-6">
        <Card className="bg-red-900/20 border-red-500/50">
          <CardContent className="pt-6">
            <p className="text-red-400">Failed to load insights. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Summary Card */}
      <SummaryCard summary={insightsData.summary} />

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <Button
            key={btn.key}
            variant={filter === btn.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(btn.key)}
            className="gap-2"
          >
            {btn.label}
            <span className="text-xs opacity-70">({btn.count})</span>
          </Button>
        ))}
      </div>

      {/* Insights Grid */}
      {filter === "all" ? (
        // Show grouped insights when "all" is selected
        <div className="space-y-8">
          {/* Strengths */}
          {groupedInsights.strength.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                <span>💪</span> Your Strengths
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedInsights.strength.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            </section>
          )}

          {/* Weaknesses */}
          {groupedInsights.weakness.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <span>⚠️</span> Areas to Improve
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedInsights.weakness.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            </section>
          )}

          {/* Tips */}
          {groupedInsights.tip.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                <span>💡</span> Tips & Recommendations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedInsights.tip.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            </section>
          )}

          {/* Warnings */}
          {groupedInsights.warning.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <span>🚨</span> Warnings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedInsights.warning.map((insight, idx) => (
                  <InsightCard key={idx} insight={insight} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        // Show filtered insights
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsights.length > 0 ? (
            filteredInsights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} />
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="pt-6 text-center text-gray-400">
                No {filter} insights found.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Last Updated Footer */}
      {lastUpdated && (
        <div className="text-center text-sm text-gray-500">
          Last updated {formatTimeAgo(lastUpdated)}
        </div>
      )}
    </div>
  );
}
