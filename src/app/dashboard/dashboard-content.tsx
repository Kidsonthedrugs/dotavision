"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { SessionCard, QuickStats, RecentMatches } from "@/components/dashboard";
import { MMRGraph, PerformanceHeatmap } from "@/components/charts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MmrHistory, SessionSummary, PlayerQuickStats, MatchCache, Hero } from "@/types";

// Mock data fetching functions - replace with actual API calls
async function fetchMMRHistory(steamId: string): Promise<MmrHistory[]> {
  const response = await fetch(`/api/player/${steamId}/mmr`);
  if (!response.ok) throw new Error("Failed to fetch MMR history");
  return response.json();
}

async function fetchSession(steamId: string): Promise<SessionSummary | null> {
  const response = await fetch(`/api/player/${steamId}/session`);
  if (!response.ok) return null;
  return response.json();
}

async function fetchQuickStats(steamId: string): Promise<PlayerQuickStats | null> {
  const response = await fetch(`/api/player/${steamId}`);
  if (!response.ok) return null;
  return response.json();
}

async function fetchRecentMatches(steamId: string): Promise<Array<MatchCache & { hero?: Hero }>> {
  const response = await fetch(`/api/player/${steamId}/matches?limit=10`);
  if (!response.ok) throw new Error("Failed to fetch matches");
  return response.json();
}

async function fetchHeatmapData(steamId: string) {
  const response = await fetch(`/api/player/${steamId}/heatmap`);
  if (!response.ok) return [];
  return response.json();
}

export default function DashboardContent() {
  const [timeRange, setTimeRange] = useState<"30" | "90" | "365">("90");
  const searchParams = useSearchParams();
  
  // Get user from query params, localStorage, or context
  const [steamId, setSteamId] = useState<string | null>(null);

  useEffect(() => {
    // First try to get from query param
    const queryId = searchParams.get("id");
    if (queryId) {
      setSteamId(queryId);
      // Also save to localStorage for persistence
      localStorage.setItem("dotavision-steamid", queryId);
      return;
    }
    
    // Fall back to localStorage
    const stored = localStorage.getItem("dotavision-steamid");
    if (stored) {
      setSteamId(stored);
      return;
    }
    
    // Fall back to old storage format
    const oldStored = localStorage.getItem("dotavision-state");
    if (oldStored) {
      try {
        const parsed = JSON.parse(oldStored);
        if (parsed.user?.steamId) {
          setSteamId(parsed.user.steamId);
        }
      } catch (e) {
        console.error("Failed to parse stored state", e);
      }
    }
  }, [searchParams]);

  // Demo mode: use Arteezy's profile for demo purposes
  // In production, get from auth session
  const demoSteamId = steamId || "86745912"; // Arteezy (pro player)

  // Queries
  const { data: mmrHistory = [], isLoading: mmrLoading } = useQuery({
    queryKey: ["mmrHistory", demoSteamId, timeRange],
    queryFn: () => fetchMMRHistory(demoSteamId),
    enabled: !!demoSteamId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["session", demoSteamId],
    queryFn: () => fetchSession(demoSteamId),
    enabled: !!demoSteamId,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000, // Refresh every minute for live session data
  });

  const { data: quickStats, isLoading: statsLoading } = useQuery({
    queryKey: ["quickStats", demoSteamId],
    queryFn: () => fetchQuickStats(demoSteamId),
    enabled: !!demoSteamId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentMatches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ["recentMatches", demoSteamId],
    queryFn: () => fetchRecentMatches(demoSteamId),
    enabled: !!demoSteamId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: heatmapData = [], isLoading: heatmapLoading } = useQuery({
    queryKey: ["heatmap", demoSteamId],
    queryFn: () => fetchHeatmapData(demoSteamId),
    enabled: !!demoSteamId,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-foreground-muted">
            Track your Dota 2 performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground-muted">
            Last synced: Just now
          </span>
          <button className="px-3 py-1.5 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <QuickStats stats={quickStats || null} isLoading={statsLoading} />

      {/* Session Card */}
      <SessionCard session={session || null} isLoading={sessionLoading} />

      {/* MMR Graph */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>MMR Progress</CardTitle>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Estimated ±30 per game
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <MMRGraph
            data={mmrHistory}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            isLoading={mmrLoading}
          />
        </CardContent>
      </Card>

      {/* Recent Matches */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Recent Matches
        </h2>
        <RecentMatches
          matches={recentMatches}
          isLoading={matchesLoading}
        />
      </div>

      {/* Performance Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Time</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceHeatmap
            data={heatmapData}
            isLoading={heatmapLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
