"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ComfortRing } from "./comfort-ring";

interface HeroCardProps {
  hero: {
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
  };
}

function formatLastPlayed(timestamp: number): string {
  if (!timestamp) return "Never";
  
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 86400) return "Today";
  if (diff < 172800) return "Yesterday";
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} weeks ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

export function HeroCard({ hero }: HeroCardProps) {
  const winrateColor = hero.winrate >= 55 ? "text-green-500" : 
                       hero.winrate >= 45 ? "text-yellow-500" : 
                       "text-red-500";

  return (
    <Link href={`/heroes/${hero.heroId}`}>
      <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-700">
                {hero.heroIcon && (
                  <img 
                    src={hero.heroIcon} 
                    alt={hero.heroName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
              <div>
                <CardTitle className="text-sm font-medium text-white line-clamp-1">
                  {hero.heroName}
                </CardTitle>
                <p className="text-xs text-gray-400">
                  {hero.games} games
                </p>
              </div>
            </div>
            <ComfortRing score={hero.comfortScore} size={50} strokeWidth={4} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">Winrate</span>
              <p className={`font-semibold ${winrateColor}`}>
                {hero.winrate}%
              </p>
            </div>
            <div>
              <span className="text-gray-400">KDA</span>
              <p className="font-semibold text-white">
                {hero.avgKda.toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-gray-400">GPM</span>
              <p className="font-semibold text-white">
                {hero.avgGpm}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Last</span>
              <p className="font-semibold text-white text-xs">
                {formatLastPlayed(hero.lastPlayed)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function HeroCardSkeleton() {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-slate-700 animate-pulse" />
            <div>
              <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-12 bg-slate-700 rounded mt-1 animate-pulse" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-slate-700 animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-3 w-12 bg-slate-700 rounded animate-pulse mb-1" />
              <div className="h-4 w-16 bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
