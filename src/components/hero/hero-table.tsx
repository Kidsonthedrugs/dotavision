"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComfortRing } from "./comfort-ring";

type SortField = "games" | "winrate" | "avgKda" | "avgGpm" | "comfortScore";
type SortOrder = "asc" | "desc";

interface HeroTableProps {
  heroes: Array<{
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
  }>;
}

function formatLastPlayed(timestamp: number): string {
  if (!timestamp) return "Never";
  
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 86400) return "Today";
  if (diff < 172800) return "Yesterday";
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

export function HeroTable({ heroes }: HeroTableProps) {
  const [sortField, setSortField] = useState<SortField>("games");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedHeroes = [...heroes].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const order = sortOrder === "asc" ? 1 : -1;
    return (aVal - bVal) * order;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Hero Statistics</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-2 text-gray-400 font-medium text-sm">Hero</th>
              <th 
                className="text-right py-3 px-2 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                onClick={() => handleSort("games")}
              >
                Games <SortIcon field="games" />
              </th>
              <th 
                className="text-right py-3 px-2 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                onClick={() => handleSort("winrate")}
              >
                Winrate <SortIcon field="winrate" />
              </th>
              <th 
                className="text-right py-3 px-2 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                onClick={() => handleSort("avgKda")}
              >
                KDA <SortIcon field="avgKda" />
              </th>
              <th 
                className="text-right py-3 px-2 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                onClick={() => handleSort("avgGpm")}
              >
                GPM <SortIcon field="avgGpm" />
              </th>
              <th 
                className="text-center py-3 px-2 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                onClick={() => handleSort("comfortScore")}
              >
                Comfort <SortIcon field="comfortScore" />
              </th>
              <th className="text-right py-3 px-2 text-gray-400 font-medium text-sm">Last</th>
            </tr>
          </thead>
          <tbody>
            {sortedHeroes.map((hero) => {
              const winrateColor = hero.winrate >= 55 ? "text-green-500" : 
                                 hero.winrate >= 45 ? "text-yellow-500" : 
                                 "text-red-500";
              
              return (
                <tr 
                  key={hero.heroId} 
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="py-3 px-2">
                    <Link 
                      href={`/heroes/${hero.heroId}`}
                      className="flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded overflow-hidden bg-slate-700 flex-shrink-0">
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
                      <span className="text-white text-sm font-medium">
                        {hero.heroName}
                      </span>
                    </Link>
                  </td>
                  <td className="text-right py-3 px-2 text-white">
                    {hero.games}
                  </td>
                  <td className={`text-right py-3 px-2 font-medium ${winrateColor}`}>
                    {hero.winrate}%
                  </td>
                  <td className="text-right py-3 px-2 text-white">
                    {hero.avgKda.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-2 text-white">
                    {hero.avgGpm}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex justify-center">
                      <ComfortRing 
                        score={hero.comfortScore} 
                        size={36} 
                        strokeWidth={3}
                        showLabel={false}
                      />
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-gray-400 text-sm">
                    {formatLastPlayed(hero.lastPlayed)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
