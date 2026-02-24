import { NextRequest, NextResponse } from "next/server";
import { getPlayerMatches, getPlayerProfile } from "@/lib/opendota";
import { cacheGet, cacheSet } from "@/lib/redis";
import { CACHE_TTL } from "@/lib/constants";

interface SessionData {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  netMMR: number;
  avgMatchDuration: number;
  tiltScore: number;
  peakHour: number;
  bestHero: string | null;
  worstHero: string | null;
}

/**
 * Validate Steam ID format (Steam64 or Account ID)
 */
function isValidSteamId(steamId: string): boolean {
  // Steam64 ID: 17 digits starting with 7656119
  const steam64Regex = /^7656119\d{10}$/;
  // Account ID: 1-10 digits
  const accountIdRegex = /^\d{1,10}$/;
  return steam64Regex.test(steamId) || accountIdRegex.test(steamId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  try {
    const { steamId } = await params;

    // FIX 1: Add input validation
    if (!isValidSteamId(steamId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Steam ID format" },
        { status: 400 }
      );
    }

    // FIX 1: Try cache first
    const cacheKey = `session:${steamId}`;
    const cached = await cacheGet<SessionData>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // FIX 1: Fetch real data from OpenDota
    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000);

    // Fetch more matches to find recent ones (last 100 matches)
    const matches = await getPlayerMatches(steamId, { limit: 100 });

    // Filter to today's matches only
    const todayMatches = matches.filter((m) => m.start_time >= todayTimestamp);

    // If no matches today, check yesterday (for players in different timezones)
    let recentMatches = todayMatches;
    if (recentMatches.length === 0) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayTimestamp = Math.floor(yesterday.getTime() / 1000);
      recentMatches = matches.filter(
        (m) => m.start_time >= yesterdayTimestamp && m.start_time < todayTimestamp
      );
    }

    // Use recentMatches (today OR yesterday)
    const sessionMatches = recentMatches;

    if (sessionMatches.length === 0) {
      // No matches in recent timeframe - return empty session with last played info
      const lastMatch = matches[0]; // Most recent match
      
      const sessionData: SessionData = {
        totalMatches: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        netMMR: 0,
        avgMatchDuration: 0,
        tiltScore: 0,
        peakHour: new Date().getHours(),
        bestHero: null,
        worstHero: null,
      };

      await cacheSet(cacheKey, sessionData, CACHE_TTL.PLAYER);

      return NextResponse.json({
        success: true,
        data: sessionData,
        cached: false,
        lastMatchTime: lastMatch?.start_time || null,
      });
    }

    // Calculate wins/losses
    // OpenDota: radiant_win = true means Radiant team won
    // player_slot 0-4 = Radiant, 128-132 = Dire
    const wins = sessionMatches.filter((m) => {
      const isRadiant = m.player_slot < 128;
      return isRadiant ? m.radiant_win : !m.radiant_win;
    }).length;
    const losses = sessionMatches.length - wins;

    // Calculate tilt score: consecutive losses from most recent
    let tiltScore = 0;
    const sortedMatches = [...sessionMatches].sort((a, b) => b.start_time - a.start_time);
    for (const match of sortedMatches) {
      const isRadiant = match.player_slot < 128;
      const isWin = isRadiant ? match.radiant_win : !match.radiant_win;
      if (!isWin) {
        tiltScore++;
      } else {
        break;
      }
      if (tiltScore >= 3) break;
    }

    // Calculate average duration
    const totalDuration = sessionMatches.reduce((sum, m) => sum + m.duration, 0);
    const avgMatchDuration = Math.round(totalDuration / sessionMatches.length);

    // Find peak hour (most games played hour)
    const hourCounts = new Array(24).fill(0);
    for (const match of sessionMatches) {
      const date = new Date(match.start_time * 1000);
      hourCounts[date.getUTCHours()]++;
    }
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Calculate net MMR (estimated: +30 per win, -30 per loss)
    const netMMR = wins * 30 - losses * 30;

    // Find best/worst hero by performance
    const heroStats = new Map<number, { wins: number; losses: number }>();
    for (const match of sessionMatches) {
      const isRadiant = match.player_slot < 128;
      const isWin = isRadiant ? match.radiant_win : !match.radiant_win;
      const existing = heroStats.get(match.hero_id) || { wins: 0, losses: 0 };
      if (isWin) {
        existing.wins++;
      } else {
        existing.losses++;
      }
      heroStats.set(match.hero_id, existing);
    }

    let bestHero: string | null = null;
    let worstHero: string | null = null;
    let bestWinrate = -1;
    let worstWinrate = 101;

    for (const [heroId, stats] of heroStats) {
      if (stats.wins + stats.losses >= 1) {
        const winrate = (stats.wins / (stats.wins + stats.losses)) * 100;
        if (winrate > bestWinrate) {
          bestWinrate = winrate;
          bestHero = `hero_${heroId}`;
        }
        if (winrate < worstWinrate) {
          worstWinrate = winrate;
          worstHero = `hero_${heroId}`;
        }
      }
    }

    const sessionData: SessionData = {
      totalMatches: todayMatches.length,
      wins,
      losses,
      winRate: (wins / todayMatches.length) * 100,
      netMMR,
      avgMatchDuration,
      tiltScore,
      peakHour,
      bestHero,
      worstHero,
    };

    // Cache the result for 2 minutes
    await cacheSet(cacheKey, sessionData, CACHE_TTL.PLAYER);

    return NextResponse.json({
      success: true,
      data: sessionData,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch session data" },
      { status: 500 }
    );
  }
}
