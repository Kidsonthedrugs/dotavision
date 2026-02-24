"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeroWinChart, HeroKdaTrendChart, HeroDurationChart } from "@/components/hero/hero-charts";
import { ItemBuilds } from "@/components/hero/item-builds";
import { Matchups } from "@/components/hero/matchups";
import { ComfortRing } from "@/components/hero/comfort-ring";

interface HeroData {
  heroId: number;
  heroName: string;
  heroIcon: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  avgKda: number;
  avgGpm: number;
  comfortScore: number;
  lastPlayed: number;
}

interface RecentMatch {
  matchId: number;
  heroId: number;
  result: "win" | "lose";
  duration: number;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
  kda: number;
  startTime: number;
  laneRole: number | null;
}

interface ItemBuilds {
  startingItems: Array<{ id: number; name: string; count: number }>;
  coreItems: Array<{ id: number; name: string; count: number }>;
  situationalItems: Array<{ id: number; name: string; count: number }>;
}

interface MatchupHero {
  heroId: number;
  heroName: string;
  heroIcon: string;
  games: number;
  wins: number;
  winrate: number;
  winrateDelta: number;
}

interface HeroDetailResponse {
  hero: HeroData;
  recentMatches: RecentMatch[];
  itemBuilds: ItemBuilds;
  matchups: {
    bestAllies: MatchupHero[];
    worstEnemies: MatchupHero[];
  };
  trends: {
    kdaOverTime: number[];
    winDurations: number[];
    lossDurations: number[];
  };
}

function HeroDetailContent() {
  const searchParams = useSearchParams();
  const steamId = searchParams.get("id") || "86745912";
  const heroId = searchParams.get("hero");
  
  const [data, setData] = useState<HeroDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHeroDetail() {
      if (!heroId) {
        setError("No hero specified");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/player/${steamId}/heroes/${heroId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to fetch hero details");
        }
      } catch (err) {
        setError("Failed to fetch hero details");
      } finally {
        setLoading(false);
      }
    }

    fetchHeroDetail();
  }, [steamId, heroId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="h-8 w-48 bg-slate-700 rounded animate-pulse mb-4" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-700 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <p className="text-red-400">{error || "Hero not found"}</p>
          <Link href={`/heroes?id=${steamId}`}>
            <Button className="mt-4 bg-blue-600">Back to Heroes</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { hero, recentMatches, itemBuilds, matchups, trends } = data;
  const winrateColor = hero.winrate >= 55 ? "text-green-500" : 
                     hero.winrate >= 45 ? "text-yellow-500" : 
                     "text-red-500";

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href={`/heroes?id=${steamId}`}>
        <Button variant="outline" className="bg-slate-800 border-slate-700 text-white">
          ← Back to Heroes
        </Button>
      </Link>

      {/* Hero Header */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
              {hero.heroIcon && (
                <img 
                  src={hero.heroIcon}
                  alt={hero.heroName}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{hero.heroName}</h1>
              <p className="text-gray-400">{hero.games} total games</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-gray-400 text-sm">Winrate</p>
                  <p className={`text-2xl font-bold ${winrateColor}`}>{hero.winrate}%</p>
                  <p className="text-gray-500 text-xs">{hero.wins}W / {hero.losses}L</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Avg KDA</p>
                  <p className="text-2xl font-bold text-white">{hero.avgKda.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Avg GPM</p>
                  <p className="text-2xl font-bold text-white">{hero.avgGpm}</p>
                </div>
                <div className="flex items-center">
                  <ComfortRing score={hero.comfortScore} size={70} strokeWidth={6} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Win/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <HeroWinChart hero={hero} />
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">KDA Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <HeroKdaTrendChart kdaOverTime={trends.kdaOverTime} />
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white">Game Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <HeroDurationChart 
              winDurations={trends.winDurations} 
              lossDurations={trends.lossDurations} 
            />
          </CardContent>
        </Card>
      </div>

      {/* Item Builds & Matchups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ItemBuilds builds={itemBuilds} />
        <Matchups matchups={matchups} />
      </div>

      {/* Recent Matches */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white">Recent Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentMatches.slice(0, 10).map((match) => (
              <div 
                key={match.matchId}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded"
              >
                <div className="flex items-center gap-4">
                  <span className={match.result === "win" ? "text-green-500" : "text-red-500"}>
                    {match.result === "win" ? "WIN" : "LOSS"}
                  </span>
                  <span className="text-gray-400">
                    {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-white">{match.kills}/{match.deaths}/{match.assists}</span>
                  <span className="text-gray-400">{match.gpm} GPM</span>
                </div>
              </div>
            ))}
            {recentMatches.length === 0 && (
              <p className="text-gray-500 text-center py-4">No recent matches</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HeroDetailPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <HeroDetailContent />
      </Suspense>
    </div>
  );
}
