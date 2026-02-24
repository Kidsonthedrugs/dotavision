"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MatchTable } from "@/components/match";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MatchCache, Hero } from "@/types";

async function fetchMatches(steamId: string, page: number = 1): Promise<{
  items: Array<MatchCache & { hero?: Hero }>;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}> {
  const response = await fetch(`/api/player/${steamId}/matches?page=${page}&limit=20`);
  if (!response.ok) throw new Error("Failed to fetch matches");
  return response.json();
}

export default function MatchesPage() {
  const [steamId, setSteamId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [selectedMatches, setSelectedMatches] = useState<bigint[]>([]);

  useEffect(() => {
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

  const demoSteamId = steamId || "123456789";

  const { data, isLoading, error } = useQuery({
    queryKey: ["matches", demoSteamId, page],
    queryFn: () => fetchMatches(demoSteamId, page),
    enabled: !!demoSteamId,
    staleTime: 2 * 60 * 1000,
  });

  const handleSelectMatch = (matchId: bigint) => {
    setSelectedMatches((prev) => {
      if (prev.includes(matchId)) {
        return prev.filter((id) => id !== matchId);
      }
      return [...prev, matchId];
    });
  };

  const handleBulkAnalyze = () => {
    // TODO: Implement bulk analysis
    console.log("Analyzing matches:", selectedMatches);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Match History</h1>
          <p className="text-sm text-foreground-muted">
            {data?.total ? `${data.total} total matches` : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedMatches.length > 0 && (
            <button
              onClick={handleBulkAnalyze}
              className="px-4 py-2 bg-accent text-background rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              Analyze {selectedMatches.length} Matches
            </button>
          )}
        </div>
      </div>

      {/* Match Table */}
      {error ? (
        <Card>
          <CardContent className="p-8">
            <p className="text-danger text-center">
              Failed to load matches. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <MatchTable
            matches={data?.items || []}
            isLoading={isLoading}
            onSelectMatch={handleSelectMatch}
            selectedMatches={selectedMatches}
          />

          {/* Pagination */}
          {data && data.hasMore && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-card border border-card-border rounded-lg text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background-tertiary transition-colors"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-foreground-muted">
                Page {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-card border border-card-border rounded-lg text-foreground hover:bg-background-tertiary transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
