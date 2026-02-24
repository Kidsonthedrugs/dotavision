"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HeroCard, HeroCardSkeleton } from "@/components/hero/hero-card";
import { HeroTable } from "@/components/hero/hero-table";
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

interface HeroesResponse {
  heroes: HeroData[];
  mostPlayed: HeroData | null;
  bestWinrate: HeroData | null;
  mostComfortable: HeroData | null;
}

function HeroesContent() {
  const searchParams = useSearchParams();
  const steamId = searchParams.get("id") || "86745912";
  
  const [data, setData] = useState<HeroesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [minGames, setMinGames] = useState(5);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  useEffect(() => {
    async function fetchHeroes() {
      try {
        setLoading(true);
        const response = await fetch(`/api/player/${steamId}/heroes`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to fetch heroes");
        }
      } catch (err) {
        setError("Failed to fetch heroes");
      } finally {
        setLoading(false);
      }
    }

    fetchHeroes();
  }, [steamId]);

  const filteredHeroes = data?.heroes.filter(hero => {
    const matchesSearch = hero.heroName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGames = hero.games >= minGames;
    return matchesSearch && matchesGames;
  }) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-slate-700 rounded animate-pulse mb-2" />
                <div className="h-8 w-16 bg-slate-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <HeroCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <p className="text-red-400">{error}</p>
          <p className="text-gray-400 mt-2">Try again later or check the Steam ID.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data?.mostPlayed && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Most Played</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded overflow-hidden bg-slate-700">
                  {data.mostPlayed.heroIcon && (
                    <img 
                      src={data.mostPlayed.heroIcon}
                      alt={data.mostPlayed.heroName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="font-bold text-white">{data.mostPlayed.heroName}</p>
                  <p className="text-sm text-gray-400">{data.mostPlayed.games} games</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {data?.bestWinrate && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Best Winrate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded overflow-hidden bg-slate-700">
                  {data.bestWinrate.heroIcon && (
                    <img 
                      src={data.bestWinrate.heroIcon}
                      alt={data.bestWinrate.heroName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="font-bold text-green-400">{data.bestWinrate.winrate}%</p>
                  <p className="text-sm text-gray-400">{data.bestWinrate.heroName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {data?.mostComfortable && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400">Most Comfortable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded overflow-hidden bg-slate-700">
                    {data.mostComfortable.heroIcon && (
                      <img 
                        src={data.mostComfortable.heroIcon}
                        alt={data.mostComfortable.heroName}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white">{data.mostComfortable.heroName}</p>
                    <p className="text-sm text-gray-400">{data.mostComfortable.games} games</p>
                  </div>
                </div>
                <ComfortRing score={data.mostComfortable.comfortScore} size={50} strokeWidth={4} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 w-full sm:w-auto">
          <Input
            placeholder="Search heroes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white w-full sm:w-64"
          />
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Min Games:</span>
            <Input
              type="number"
              min={1}
              max={100}
              value={minGames}
              onChange={(e) => setMinGames(parseInt(e.target.value) || 1)}
              className="bg-slate-800 border-slate-700 text-white w-20"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-blue-600" : "bg-slate-800"}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            className={viewMode === "table" ? "bg-blue-600" : "bg-slate-800"}
          >
            Table
          </Button>
        </div>
      </div>

      {/* Heroes Grid/Table */}
      {filteredHeroes.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">No heroes match your filters</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your search or minimum games filter</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredHeroes.map((hero) => (
            <HeroCard key={hero.heroId} hero={hero} />
          ))}
        </div>
      ) : (
        <HeroTable heroes={filteredHeroes} />
      )}
    </div>
  );
}

export default function HeroesPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Heroes</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <HeroesContent />
      </Suspense>
    </div>
  );
}
