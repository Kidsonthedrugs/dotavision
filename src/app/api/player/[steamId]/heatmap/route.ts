import { NextRequest, NextResponse } from "next/server";
import { getPlayerMatches } from "@/lib/opendota";
import { cacheGet, cacheSet } from "@/lib/redis";
import { CACHE_TTL } from "@/lib/constants";

interface HeatmapData {
  day: number;
  hour: number;
  winRate: number | null;
  games: number;
  wins: number;
}

/**
 * Validate Steam ID format
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

    // FIX 3: Add input validation
    if (!isValidSteamId(steamId)) {
      return NextResponse.json(
        { success: false, error: "Invalid Steam ID format" },
        { status: 400 }
      );
    }

    // FIX 3: Try cache first (15 min TTL)
    const cacheKey = `heatmap:${steamId}`;
    const cached = await cacheGet<HeatmapData[]>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // FIX 3: Fetch real data from OpenDota
    // Fetch last 200 matches to build heatmap
    const matches = await getPlayerMatches(steamId, { limit: 200 });

    // Build 7x24 grid (day x hour)
    const grid: HeatmapData[][] = [];
    
    // Initialize grid
    for (let day = 0; day < 7; day++) {
      grid[day] = [];
      for (let hour = 0; hour < 24; hour++) {
        grid[day][hour] = {
          day,
          hour,
          winRate: null,
          games: 0,
          wins: 0,
        };
      }
    }

    // Populate grid with match data
    for (const match of matches) {
      // Convert Unix timestamp to day/hour
      const date = new Date(match.start_time * 1000);
      const day = date.getUTCDay(); // 0 = Sunday
      const hour = date.getUTCHours();
      
      // Determine win/loss
      const isRadiant = match.player_slot < 128;
      const isWin = isRadiant ? match.radiant_win : !match.radiant_win;
      
      const cell = grid[day][hour];
      cell.games++;
      if (isWin) {
        cell.wins++;
      }
    }

    // Calculate win rates
    const heatmap: HeatmapData[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const cell = grid[day][hour];
        heatmap.push({
          day,
          hour,
          games: cell.games,
          wins: cell.wins,
          winRate: cell.games > 0 ? (cell.wins / cell.games) * 100 : null,
        });
      }
    }

    // Cache for 15 minutes
    await cacheSet(cacheKey, heatmap, 15 * 60);

    return NextResponse.json({
      success: true,
      data: heatmap,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching heatmap data:", error);

    // Try to return cached data if available
    const cacheKey = `heatmap:${await params.then(p => p.steamId)}`;
    const cached = await cacheGet<HeatmapData[]>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        warning: "Using cached data due to API error",
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch heatmap data" },
      { status: 500 }
    );
  }
}
