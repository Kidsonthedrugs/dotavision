"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Scoreboard } from "@/components/match";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Hero } from "@/types";
import { formatDuration, formatNumber, calculateKDA } from "@/lib/utils";
import type { Match, MatchPlayer } from "@/lib/opendota";

async function fetchMatchDetails(matchId: string): Promise<Match> {
  const response = await fetch(`/api/match/${matchId}`);
  if (!response.ok) throw new Error("Failed to fetch match details");
  return response.json();
}

async function fetchHeroes(): Promise<Record<number, Hero>> {
  const response = await fetch("/api/heroes");
  if (!response.ok) throw new Error("Failed to fetch heroes");
  const heroes: Hero[] = await response.json();
  return heroes.reduce((acc, hero) => {
    acc[hero.id] = hero;
    return acc;
  }, {} as Record<number, Hero>);
}

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params.id as string;
  const [steamId, setSteamId] = useState<string | null>(null);

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
  const trackedAccountId = parseInt(demoSteamId);

  const { data: match, isLoading: matchLoading, error: matchError } = useQuery({
    queryKey: ["match", matchId],
    queryFn: () => fetchMatchDetails(matchId),
    enabled: !!matchId,
    staleTime: 10 * 60 * 1000,
  });

  const { data: heroes = {}, isLoading: heroesLoading } = useQuery({
    queryKey: ["heroes"],
    queryFn: fetchHeroes,
    staleTime: 24 * 60 * 60 * 1000,
  });

  // Find tracked player
  const trackedPlayer = match?.players.find(
    (p) => p.account_id === trackedAccountId
  );
  const trackedHero = trackedPlayer ? heroes[trackedPlayer.hero_id] : null;

  // Calculate player averages for comparison
  const { data: playerAverages } = useQuery({
    queryKey: ["playerAverages", trackedAccountId, trackedPlayer?.hero_id],
    queryFn: async () => {
      if (!trackedPlayer?.hero_id) return null;
      const response = await fetch(
        `/api/player/${trackedAccountId}/heroes/${trackedPlayer.hero_id}`
      );
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!trackedPlayer?.hero_id && !!trackedAccountId,
    staleTime: 10 * 60 * 1000,
  });

  if (matchLoading || heroesLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-background-tertiary rounded" />
        <div className="h-64 bg-background-tertiary rounded-xl" />
        <div className="h-96 bg-background-tertiary rounded-xl" />
      </div>
    );
  }

  if (matchError || !match) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-danger text-center">
            Failed to load match details. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isRadiantWin = match.radiant_win;
  const playerTeam = trackedPlayer
    ? trackedPlayer.player_slot < 128
      ? "radiant"
      : "dire"
    : null;
  const isPlayerWin = playerTeam
    ? (playerTeam === "radiant" && isRadiantWin) ||
      (playerTeam === "dire" && !isRadiantWin)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {trackedHero && (
            <div className="w-16 h-16 rounded-lg bg-background-tertiary overflow-hidden">
              <img
                src={`https://cdn.cloudflare.steamstatic.com${trackedHero.img}`}
                alt={trackedHero.localizedName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Match {match.match_id}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {isPlayerWin !== null && (
                <span
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    isPlayerWin
                      ? "bg-health/20 text-health"
                      : "bg-danger/20 text-danger"
                  }`}
                >
                  {isPlayerWin ? "VICTORY" : "DEFEAT"}
                </span>
              )}
              <span className="text-foreground-muted">
                {formatDuration(match.duration)}
              </span>
              <span className="text-foreground-muted">•</span>
              <span className="text-foreground-muted">
                {new Date(match.start_time * 1000).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Player Stats Comparison */}
      {trackedPlayer && playerAverages && (
        <Card>
          <CardHeader>
            <CardTitle>Performance vs Your Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-6">
              <StatComparison
                label="KDA"
                current={calculateKDA(
                  trackedPlayer.kills,
                  trackedPlayer.deaths,
                  trackedPlayer.assists
                )}
                average={playerAverages.avgKDA}
              />
              <StatComparison
                label="GPM"
                current={trackedPlayer.gold_per_min}
                average={playerAverages.avgGPM}
              />
              <StatComparison
                label="XPM"
                current={trackedPlayer.xp_per_min}
                average={playerAverages.avgXPM}
              />
              <StatComparison
                label="Net Worth"
                current={trackedPlayer.net_worth}
                average={playerAverages.avgNetWorth}
                format="number"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Breakdown */}
      {trackedPlayer && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {/* Laning Phase (0-10 min) */}
              <div className="bg-background-secondary rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground-muted mb-3">
                  Laning Phase (0-10 min)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">CS @10</span>
                    <span className="text-foreground">{trackedPlayer.last_hits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Denies</span>
                    <span className="text-foreground">{trackedPlayer.denies}</span>
                  </div>
                </div>
              </div>

              {/* Mid Game (10-25 min) */}
              <div className="bg-background-secondary rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground-muted mb-3">
                  Mid Game (10-25 min)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Kills</span>
                    <span className="text-foreground">{trackedPlayer.kills}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Deaths</span>
                    <span className="text-foreground">{trackedPlayer.deaths}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Assists</span>
                    <span className="text-foreground">{trackedPlayer.assists}</span>
                  </div>
                </div>
              </div>

              {/* Late Game (25+ min) */}
              <div className="bg-background-secondary rounded-lg p-4">
                <h4 className="text-sm font-medium text-foreground-muted mb-3">
                  Late Game (25+ min)
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Net Worth</span>
                    <span className="text-accent">
                      {formatNumber(trackedPlayer.net_worth)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Hero Damage</span>
                    <span className="text-danger">
                      {formatNumber(trackedPlayer.hero_damage)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Tower Damage</span>
                    <span className="text-warning">
                      {formatNumber(trackedPlayer.tower_damage)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scoreboard */}
      <Scoreboard
        match={match}
        heroes={heroes}
        trackedAccountId={trackedAccountId}
      />

      {/* AI Insight (optional) */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground-muted text-sm">
            {isPlayerWin === true
              ? `Great game! You played well on ${trackedHero?.localizedName || "this hero"}. Your ${trackedPlayer && trackedPlayer.kills > trackedPlayer.deaths ? "aggressive playstyle" : "consistent performance"} helped secure the victory.`
              : isPlayerWin === false
                ? `Tough match. Consider reviewing your laning phase - you had ${trackedPlayer?.denies || 0} denies compared to the enemy offlaner. Your farm at ${trackedPlayer?.gold_per_min || 0} GPM could be improved.`
                : "Join a match to see AI-powered insights about your performance."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatComparisonProps {
  label: string;
  current: number;
  average: number;
  format?: "kda" | "number";
}

function StatComparison({
  label,
  current,
  average,
  format = "number",
}: StatComparisonProps) {
  const diff = current - average;
  const percentDiff = average !== 0 ? (diff / average) * 100 : 0;
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  return (
    <div>
      <p className="text-sm text-foreground-muted mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground">
          {format === "number" ? formatNumber(current) : current.toFixed(1)}
        </span>
        <span
          className={`text-sm ${
            isPositive
              ? "text-health"
              : isNeutral
                ? "text-foreground-muted"
                : "text-danger"
          }`}
        >
          {isPositive ? "+" : ""}
          {format === "number" ? formatNumber(Math.round(diff)) : diff.toFixed(1)}
          {!isNeutral && (
            <span className="text-foreground-muted">
              ({isPositive ? "+" : ""}
              {percentDiff.toFixed(1)}%)
            </span>
          )}
        </span>
      </div>
      <p className="text-xs text-foreground-muted">Avg: {format === "number" ? formatNumber(average) : average.toFixed(1)}</p>
    </div>
  );
}
