import { NextRequest, NextResponse } from "next/server";
import { getPlayerMatches } from "@/lib/opendota";
import { getCachedPlayerMatches, cacheSet } from "@/lib/redis";
import { CACHE_TTL, REDIS_KEYS } from "@/lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  try {
    const { steamId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const heroId = searchParams.get("heroId");

    // Validate steamId
    if (!steamId || isNaN(Number(steamId))) {
      return NextResponse.json(
        { success: false, error: "Invalid Steam ID" },
        { status: 400 }
      );
    }

    // Try to get from cache first
    const cached = await getCachedPlayerMatches(steamId, page);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch from OpenDota API
    const matches = await getPlayerMatches(steamId, {
      limit,
      offset: (page - 1) * limit,
      heroId: heroId ? parseInt(heroId) : undefined,
    });

    // Cache the result
    const cacheKey = `${REDIS_KEYS.PLAYER_MATCHES}${steamId}:${page}`;
    await cacheSet(cacheKey, matches, CACHE_TTL.MATCHES);

    return NextResponse.json({
      success: true,
      data: matches,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching player matches:", error);

    const { steamId } = await params;
    const cached = await getCachedPlayerMatches(steamId, 1);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        warning: "Using cached data due to API error",
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch player matches" },
      { status: 500 }
    );
  }
}
