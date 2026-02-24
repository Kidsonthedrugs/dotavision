"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MatchupHero {
  heroId: number;
  heroName: string;
  heroIcon: string;
  games: number;
  wins: number;
  winrate: number;
  winrateDelta: number;
}

interface MatchupsProps {
  matchups: {
    bestAllies: MatchupHero[];
    worstEnemies: MatchupHero[];
  };
}

export function Matchups({ matchups }: MatchupsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Best Allies */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-400">Best Allies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {matchups.bestAllies.length > 0 ? (
            matchups.bestAllies.map((ally) => (
              <Link 
                key={ally.heroId}
                href={`/heroes/${ally.heroId}`}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded overflow-hidden bg-slate-700">
                    {ally.heroIcon && (
                      <img 
                        src={ally.heroIcon}
                        alt={ally.heroName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <span className="text-white text-sm">{ally.heroName}</span>
                </div>
                <div className="text-right">
                  <span className="text-green-400 font-medium">
                    {ally.winrate.toFixed(0)}%
                  </span>
                  <span className="text-gray-500 text-xs ml-1">
                    ({ally.games}g)
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              No ally data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Worst Enemies */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-red-400">Worst Enemies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {matchups.worstEnemies.length > 0 ? (
            matchups.worstEnemies.map((enemy) => (
              <Link 
                key={enemy.heroId}
                href={`/heroes/${enemy.heroId}`}
                className="flex items-center justify-between p-2 rounded hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded overflow-hidden bg-slate-700">
                    {enemy.heroIcon && (
                      <img 
                        src={enemy.heroIcon}
                        alt={enemy.heroName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <span className="text-white text-sm">{enemy.heroName}</span>
                </div>
                <div className="text-right">
                  <span className="text-red-400 font-medium">
                    {enemy.winrate.toFixed(0)}%
                  </span>
                  <span className="text-gray-500 text-xs ml-1">
                    ({enemy.games}g)
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              No enemy data available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
