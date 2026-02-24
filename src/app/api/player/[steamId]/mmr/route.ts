import { NextRequest, NextResponse } from "next/server";
import { getPlayerMatches, getPlayerProfile } from "@/lib/opendota";
import { cacheGet, cacheSet } from "@/lib/redis";
import { CACHE_TTL } from "@/lib/constants";
import { MmrHistory } from "@/types";

/**
 * Validate Steam ID format (Steam64 or Account ID)
 */
function isValidSteamId(steamId: string): boolean {
  const steam64Regex = /^7656119\d{10}$/;
  const accountIdRegex = /^\d{1,10}$/;
  return steam64Regex.test(steamId) || accountIdRegex.test(steamId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  try {
    const { steamId } = await params;

    // FIX 2: Add input validation
    if (!isValidSteamId(steamId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Steam ID format" },
        { status: 400 }
      );
    }

    // FIX 2: Try cache first (10 min TTL)
    const cacheKey = `mmr:${steamId}`;
    const cached = await cacheGet<MmrHistory[]>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // FIX 2: Fetch real data from OpenDota
    // Option A: Use match-based estimation
    // Get player profile for current MMR estimate
    let currentMMR = 2500; // Default estimate
    try {
      const profile = await getPlayerProfile(steamId);
      if (profile.mmr_estimate?.estimate) {
        currentMMR = profile.mmr_estimate.estimate;
      }
    } catch {
      // Use default if profile fetch fails
    }

    // Get time range from query params (default to 365 days to capture more history)
    const { searchParams } = new URL(request.url);
    let days = parseInt(searchParams.get("days") || "365");
    
    // Fetch matches for the time period
    const now = Math.floor(Date.now() / 1000);
    let cutoff = now - days * 24 * 60 * 60;
    
    const matches = await getPlayerMatches(steamId, { limit: 500 });
    
    // If no matches in requested period, expand to all available matches
    let periodMatches = matches
      .filter((m) => m.start_time >= cutoff)
      .sort((a, b) => a.start_time - b.start_time);
    
    // If still no matches, use all available matches (ignore date filter)
    if (periodMatches.length === 0 && matches.length > 0) {
      periodMatches = [...matches].sort((a, b) => a.start_time - b.start_time);
      days = 365; // Reset for note purposes
      cutoff = matches[matches.length - 1]?.start_time || now;
    }

    // Build MMR history by walking backwards from current estimate
    const history: MmrHistory[] = [];
    let estimatedMMR = currentMMR;
    
    // Process matches in reverse order (newest first) to build history
    const reversedMatches = [...periodMatches].reverse();
    
    for (const match of reversedMatches) {
      const timestamp = match.start_time * 1000;
      
      // Determine if player won
      const isRadiant = match.player_slot < 128;
      const isWin = isRadiant ? match.radiant_win : !match.radiant_win;
      
      // Estimate MMR change: +/- 30 per game
      const change = isWin ? 30 : -30;
      estimatedMMR = Math.max(0, estimatedMMR - change);
      
      history.push({
        timestamp,
        mmr: estimatedMMR,
        change,
        matchId: match.match_id,
      });
    }

    // If we have no matches in the period, create a single point
    if (history.length === 0) {
      history.push({
        timestamp: Date.now(),
        mmr: currentMMR,
        change: 0,
        matchId: 0,
      });
    }

    // Cache for 10 minutes
    await cacheSet(cacheKey, history, CACHE_TTL.PLAYER);

    return NextResponse.json({
      success: true,
      data: history,
      cached: false,
      note: "MMR is estimated based on match outcomes. Actual MMR may vary.",
    });
  } catch (error) {
    console.error("Error fetching MMR history:", error);

    // Try to return cached data if available
    const cacheKey = `mmr:${await params.then(p => p.steamId)}`;
    const cached = await cacheGet<MmrHistory[]>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        warning: "Using cached data due to API error",
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch MMR history" },
      { status: 500 }
    );
  }
}
