import { NextRequest, NextResponse } from "next/server";
import { getPlayerMatches } from "@/lib/opendota";
import { cacheGet, cacheSet } from "@/lib/redis";

export interface TrendPoint {
  gameNumber: number;
  date: string;
  gpm: number;
  xpm: number;
  kda: number;
  winrate: number;
  heroDamage: number;
  towerDamage: number;
  gameDuration: number;
}

export interface TrendsResponse {
  trends: TrendPoint[];
  rollingAverages: {
    gpm: number[];
    kda: number[];
    winrate: number[];
  };
  summary: {
    totalGames: number;
    avgGpm: number;
    avgKda: number;
    overallWinrate: number;
    totalWins: number;
    totalLosses: number;
  };
  streaks: {
    longestWinStreak: number;
    longestLossStreak: number;
    currentStreak: number;
    currentStreakType: "win" | "loss" | "none";
  };
  records: {
    highestKda: number;
    highestGpm: number;
    longestGame: number;
    shortestWin: number;
  };
}

// Helper to calculate KDA
function calculateKda(kills: number, deaths: number, assists: number): number {
  return deaths === 0 ? (kills + assists) : (kills + assists) / deaths;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  try {
    const { steamId } = await params;

    // Validate steamId
    if (!steamId || isNaN(Number(steamId))) {
      return NextResponse.json(
        { success: false, error: "Invalid Steam ID" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = `player:trends:${steamId}`;
    const cached = await cacheGet<TrendsResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch last 500 matches
    const matches = await getPlayerMatches(steamId, { limit: 500 });

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          trends: [],
          rollingAverages: { gpm: [], kda: [], winrate: [] },
          summary: {
            totalGames: 0,
            avgGpm: 0,
            avgKda: 0,
            overallWinrate: 0,
            totalWins: 0,
            totalLosses: 0,
          },
          streaks: {
            longestWinStreak: 0,
            longestLossStreak: 0,
            currentStreak: 0,
            currentStreakType: "none",
          },
          records: {
            highestKda: 0,
            highestGpm: 0,
            longestGame: 0,
            shortestWin: 9999,
          },
        },
        cached: false,
      });
    }

    // Process matches into trends (reverse to get chronological order)
    const sortedMatches = [...matches].sort((a, b) => a.start_time - b.start_time);
    
    const trends: TrendPoint[] = [];
    let totalWins = 0;
    let totalLosses = 0;
    let totalGpm = 0;
    let totalKda = 0;

    // For streak tracking
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let lastWon: boolean | null = null;

    // For records
    let highestKda = 0;
    let highestGpm = 0;
    let longestGame = 0;
    let shortestWin = 9999;

    sortedMatches.forEach((match, index) => {
      const isRadiant = match.player_slot < 128;
      const won = match.radiant_win === isRadiant;
      
      if (won) {
        totalWins++;
        currentWinStreak++;
        if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
        if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak;
        currentLossStreak = 0;
      } else {
        totalLosses++;
        currentLossStreak++;
        if (currentLossStreak > longestLossStreak) longestLossStreak = currentLossStreak;
        if (currentWinStreak > longestWinStreak) longestWinStreak = currentWinStreak;
        currentWinStreak = 0;
      }

      const kda = calculateKda(match.kills, match.deaths, match.assists);
      totalGpm += match.gold_per_min || 0;
      totalKda += kda;

      const date = new Date(match.start_time * 1000).toISOString().split('T')[0];

      trends.push({
        gameNumber: index + 1,
        date,
        gpm: match.gold_per_min || 0,
        xpm: match.xp_per_min || 0,
        kda,
        winrate: won ? 1 : 0,
        heroDamage: match.hero_damage || 0,
        towerDamage: match.tower_damage || 0,
        gameDuration: match.duration || 0,
      });

      // Track records
      if (kda > highestKda) highestKda = kda;
      if ((match.gold_per_min || 0) > highestGpm) highestGpm = match.gold_per_min || 0;
      if ((match.duration || 0) > longestGame) longestGame = match.duration || 0;
      if (won && (match.duration || 0) < shortestWin) shortestWin = match.duration || 0;
    });

    // Calculate rolling averages (20-game window)
    const windowSize = 20;
    const rollingGpm: number[] = [];
    const rollingKda: number[] = [];
    const rollingWinrate: number[] = [];

    for (let i = 0; i < trends.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = trends.slice(start, i + 1);
      
      const avgGpm = window.reduce((sum, t) => sum + t.gpm, 0) / window.length;
      const avgKda = window.reduce((sum, t) => sum + t.kda, 0) / window.length;
      const winrate = window.reduce((sum, t) => sum + t.winrate, 0) / window.length;
      
      rollingGpm.push(Math.round(avgGpm));
      rollingKda.push(Math.round(avgKda * 100) / 100);
      rollingWinrate.push(Math.round(winrate * 1000) / 10);
    }

    // Determine current streak
    const currentStreak = lastWon === true ? currentWinStreak : (lastWon === false ? currentLossStreak : 0);
    const currentStreakType: "win" | "loss" | "none" = lastWon === true ? "win" : (lastWon === false ? "loss" : "none");

    const response: TrendsResponse = {
      trends,
      rollingAverages: {
        gpm: rollingGpm,
        kda: rollingKda,
        winrate: rollingWinrate,
      },
      summary: {
        totalGames: matches.length,
        avgGpm: Math.round(totalGpm / matches.length),
        avgKda: Math.round((totalKda / matches.length) * 100) / 100,
        overallWinrate: Math.round((totalWins / matches.length) * 1000) / 10,
        totalWins,
        totalLosses,
      },
      streaks: {
        longestWinStreak,
        longestLossStreak,
        currentStreak,
        currentStreakType,
      },
      records: {
        highestKda: Math.round(highestKda * 100) / 100,
        highestGpm,
        longestGame,
        shortestWin: shortestWin === 9999 ? 0 : shortestWin,
      },
    };

    // Cache the result (15 min)
    await cacheSet(cacheKey, response, 900);

    return NextResponse.json({
      success: true,
      data: response,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching player trends:", error);

    const { steamId } = await params;
    const cacheKey = `player:trends:${steamId}`;
    const cached = await cacheGet<TrendsResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        warning: "Using cached data due to API error",
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch player trends" },
      { status: 500 }
    );
  }
}
