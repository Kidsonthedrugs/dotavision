"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendData {
  trends: Array<{
    gameNumber: number;
    date: string;
    kda: number;
    winrate: number;
    gameDuration: number;
  }>;
  rollingAverages: {
    kda: number[];
    winrate: number[];
  };
  summary: {
    totalGames: number;
    avgKda: number;
    overallWinrate: number;
    totalWins: number;
    totalLosses: number;
  };
  streaks: {
    longestWinStreak: number;
    longestLossStreak: number;
    currentStreak: number;
    currentStreakType: string;
  };
  records: {
    highestKda: number;
    longestGame: number;
    shortestWin: number;
  };
}

export default function AnalyticsPage() {
  const { user, selectedPlayerId } = useAppStore();
  // Use selectedPlayerId if viewing someone else's stats, otherwise use own steamId
  const steamId = selectedPlayerId || user?.steamId;
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrends() {
      if (!steamId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/player/${steamId}/trends`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to load trends");
        }
      } catch (err) {
        setError("Failed to fetch trends data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, [steamId]);

  if (!steamId) {
    return (
      <div className="p-6">
        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardContent className="pt-6">
            <p className="text-[var(--color-foreground-muted)]">
              Please log in to view your analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardContent className="pt-6">
            <p className="text-red-500">{error || "Failed to load analytics data"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">Analytics</h1>
        <p className="text-[var(--color-foreground-muted)] mt-1">
          Track your performance trends over time
        </p>
      </div>

      {/* Data Limitation Notice */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-blue-200 text-sm font-medium">
              Note: GPM and XPM trends require detailed match parsing
            </p>
            <p className="text-blue-300/70 text-xs mt-1">
              OpenDota's basic match API doesn't include farm stats. Only parsed matches (~10%) have GPM/XPM data. 
              KDA and Winrate trends use all match data and are fully accurate.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-foreground-muted)]">
              Total Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--color-foreground)]">
              {data.summary.totalGames}
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
              {data.summary.totalWins}W - {data.summary.totalLosses}L
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-foreground-muted)]">
              Overall Winrate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--color-foreground)]">
              {data.summary.overallWinrate}%
            </div>
            <p className="text-sm text-green-500 mt-1">
              ↑ {data.summary.overallWinrate > 50 ? "Above" : "Below"} 50%
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-foreground-muted)]">
              Average KDA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--color-foreground)]">
              {data.summary.avgKda.toFixed(2)}
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
              Kills + Assists / Deaths
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-foreground-muted)]">
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--color-foreground)]">
              {data.streaks.currentStreak > 0 
                ? `${data.streaks.currentStreak} ${data.streaks.currentStreakType === "win" ? "🔥" : "📉"}`
                : "-"
              }
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
              {data.streaks.currentStreakType === "win" ? "Winning" : data.streaks.currentStreakType === "loss" ? "Losing" : "No streak"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Winrate Trend Chart */}
      <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[var(--color-foreground)]">
            Winrate Trend (Rolling 20 Games)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1">
            {data.rollingAverages.winrate.slice(-100).map((winrate, i) => (
              <div
                key={i}
                className="flex-1 rounded-t transition-all hover:opacity-80"
                style={{
                  height: `${winrate}%`,
                  backgroundColor: winrate >= 50 ? "var(--color-success)" : "var(--color-danger)",
                  minHeight: "4px",
                }}
                title={`Game ${i + 1}: ${winrate}%`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-[var(--color-foreground-muted)]">
            <span>100 games ago</span>
            <span>Now</span>
          </div>
        </CardContent>
      </Card>

      {/* KDA Trend Chart */}
      <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[var(--color-foreground)]">
            KDA Trend (Rolling 20 Games)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-1">
            {data.rollingAverages.kda.slice(-100).map((kda, i) => {
              const maxKda = Math.max(...data.rollingAverages.kda.slice(-100));
              const height = Math.min((kda / maxKda) * 100, 100);
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t transition-all hover:opacity-80 bg-[var(--color-accent)]"
                  style={{ height: `${height}%`, minHeight: "4px" }}
                  title={`Game ${i + 1}: KDA ${kda.toFixed(2)}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-sm text-[var(--color-foreground-muted)]">
            <span>100 games ago</span>
            <span>Now</span>
          </div>
        </CardContent>
      </Card>

      {/* Records */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-foreground-muted)]">
              🏆 Longest Win Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-500">
              {data.streaks.longestWinStreak}
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
              consecutive wins
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-foreground-muted)]">
              📉 Longest Loss Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">
              {data.streaks.longestLossStreak}
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
              consecutive losses
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-foreground-muted)]">
              ⚡ Best KDA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-[var(--color-accent)]">
              {data.records.highestKda.toFixed(1)}
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
              highest KDA in a game
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Game Durations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-foreground-muted)]">
              ⏱️ Longest Game
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--color-foreground)]">
              {formatDuration(data.records.longestGame)}
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
              longest match duration
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-card-border)] bg-[var(--color-card)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--color-foreground-muted)]">
              ⚡ Quickest Win
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {data.records.shortestWin > 0 ? formatDuration(data.records.shortestWin) : "-"}
            </div>
            <p className="text-sm text-[var(--color-foreground-muted)] mt-1">
              fastest victory
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
