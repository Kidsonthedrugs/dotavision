import { NextRequest, NextResponse } from "next/server";
import { getPlayerProfile } from "@/lib/opendota";
import { getCachedPlayer, cacheSet } from "@/lib/redis";
import { CACHE_TTL, REDIS_KEYS } from "@/lib/constants";

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

    // Try to get from cache first
    const cached = await getCachedPlayer(steamId);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch from OpenDota API
    const profile = await getPlayerProfile(steamId);

    // Cache the result
    const cacheKey = `${REDIS_KEYS.PLAYER}${steamId}`;
    await cacheSet(cacheKey, profile, CACHE_TTL.PLAYER);

    return NextResponse.json({
      success: true,
      data: profile,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching player profile:", error);

    // Return cached data if available even on error
    const { steamId } = await params;
    const cached = await getCachedPlayer(steamId);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        warning: "Using cached data due to API error",
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch player profile" },
      { status: 500 }
    );
  }
}
