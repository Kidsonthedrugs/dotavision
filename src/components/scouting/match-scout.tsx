"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Data interface for match scouting
 */
export interface ScoutingData {
  player: {
    accountId: string;
    heroId: number;
    team: "radiant" | "dire";
  };
  enemies: Array<{
    accountId: string;
    heroId: number;
    heroName: string;
    // From their stats
    gamesOnHero: number;
    winrateOnHero: number;
    avgKda: number;
    // Their weaknesses
    worstMatchups: string[]; // Heroes they lose to
  }>;
}

interface MatchScoutProps {
  matchData: ScoutingData;
}

/**
 * Get hero image URL from hero ID (OpenDota format)
 */
function getHeroImageUrl(heroId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${getHeroAssetName(heroId)}.png`;
}

/**
 * Get hero icon URL from hero ID
 */
function getHeroIconUrl(heroId: number): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/${getHeroAssetName(heroId)}.png`;
}

/**
 * Get hero asset name from hero ID (OpenDota convention)
 */
function getHeroAssetName(heroId: number): string {
  // Common hero ID to name mapping
  const heroNames: Record<number, string> = {
    1: "antimage",
    2: "axe",
    3: "bane",
    4: "bloodseeker",
    5: "crystal_maiden",
    6: "drow_ranger",
    7: "earthshaker",
    8: "juggernaut",
    9: "mirana",
    10: "morphling",
    11: "nevermore",
    12: "phantom_lancer",
    13: "puck",
    14: "pudge",
    15: "razor",
    16: "sand_king",
    17: "storm_spirit",
    18: "sven",
    19: "tiny",
    20: "vengefulspirit",
    21: "windrunner",
    22: "zuus",
    23: "kunkka",
    25: "lina",
    26: "lion",
    27: "shadow_shaman",
    28: "slardar",
    29: "tidehunter",
    30: "witch_doctor",
    31: "lich",
    32: "riki",
    33: "enigma",
    34: "tinker",
    35: "snake",
    36: "necrophos",
    37: "warlock",
    38: "beastmaster",
    39: "queenofpain",
    40: "、火",
    41: "luna",
    42: "doom_bringer",
    43: "panda",
    44: "passive",
    45: "vampire",
    46: "phantom_assassin",
    47: "pugna",
    48: "templar_assassin",
    49: "viper",
    50: "clinkz",
    51: "bristleback",
    52: "spectre",
    53: "ancient_apparition",
    54: "doom_bringer",
    55: "ursa",
    56: "furion",
    57: "life_stealer",
    58: "dark_seer",
    59: "clinkz",
    60: "omniknight",
    61: "enchantress",
    62: "huskar",
    63: "night_stalker",
    64: "broodmother",
    65: "bounty_hunter",
    66: "weaver",
    67: "jakiro",
    68: "batrider",
    69: "chen",
    70: "spectre",
    71: "ancient_apparition",
    72: "drow_ranger",
    73: "morphling",
    74: "phantom_lancer",
    75: "puck",
    76: "pudge",
    77: "razor",
    78: "sand_king",
    79: "storm_spirit",
    80: "sven",
  };

  // Default to a generic hero image if not found
  return heroNames[heroId] || "npc_dota_hero_hero";
}

/**
 * Format winrate with color coding
 */
function getWinrateColor(winrate: number): string {
  if (winrate >= 55) return "text-green-500";
  if (winrate >= 45) return "text-yellow-500";
  return "text-red-500";
}

/**
 * Format winrate percentage
 */
function formatWinrate(winrate: number): string {
  return `${winrate.toFixed(1)}%`;
}

/**
 * Format KDA ratio
 */
function formatKDA(kda: number): string {
  return kda.toFixed(2);
}

export function MatchScout({ matchData }: MatchScoutProps) {
  const { enemies } = matchData;

  if (!enemies || enemies.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-red-500">
            Enemy Scouting Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">No enemy data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-red-500">
          Enemy Scouting Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enemies.map((enemy, index) => {
            const isUnfamiliar = enemy.gamesOnHero < 5;
            const heroImageUrl = getHeroIconUrl(enemy.heroId);

            return (
              <Card
                key={`${enemy.accountId}-${enemy.heroId}-${index}`}
                className="bg-slate-900 border-red-900/50 hover:border-red-700/50 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    {/* Hero Image */}
                    <div className="w-14 h-14 rounded-md overflow-hidden bg-slate-700 flex-shrink-0">
                      <img
                        src={heroImageUrl}
                        alt={enemy.heroName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder on error
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.parentElement!.innerHTML =
                            '<div class="w-full h-full flex items-center justify-center text-2xl">?</div>';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold text-white truncate">
                        {enemy.heroName}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-400">
                          {enemy.gamesOnHero} games
                        </span>
                        <span className="text-gray-600">•</span>
                        <span
                          className={`text-sm font-medium ${getWinrateColor(
                            enemy.winrateOnHero
                          )}`}
                        >
                          {formatWinrate(enemy.winrateOnHero)} WR
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* KDA */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg KDA</span>
                    <span className="text-sm font-medium text-white">
                      {formatKDA(enemy.avgKda)}
                    </span>
                  </div>

                  {/* Warning for unfamiliar heroes */}
                  {isUnfamiliar && (
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-md p-2">
                      <p className="text-xs text-yellow-500 font-medium">
                        ⚠️ Unfamiliar with this hero ({enemy.gamesOnHero}{" "}
                        games)
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Limited data available - may be off-role or trying
                        something new
                      </p>
                    </div>
                  )}

                  {/* Worst Matchups */}
                  {enemy.worstMatchups && enemy.worstMatchups.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-400 block mb-2">
                        Counters this hero:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {enemy.worstMatchups.slice(0, 4).map((hero, idx) => (
                          <Badge
                            key={`${enemy.heroId}-${hero}-${idx}`}
                            variant="outline"
                            className="bg-green-900/20 border-green-700/30 text-green-400 text-xs"
                          >
                            {hero}
                          </Badge>
                        ))}
                        {enemy.worstMatchups.length > 4 && (
                          <Badge
                            variant="outline"
                            className="bg-green-900/20 border-green-700/30 text-green-400 text-xs"
                          >
                            +{enemy.worstMatchups.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
