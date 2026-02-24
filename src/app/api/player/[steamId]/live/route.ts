import { NextRequest, NextResponse } from "next/server";
import { getPlayerRecentMatches, getLiveGames, isProPlayer, type LiveGame } from "@/lib/opendota";
import { getCachedPlayer, cacheSet } from "@/lib/redis";
import { CACHE_TTL, REDIS_KEYS, GAME_MODES } from "@/lib/constants";

// Types for live game status
export type PlayerLiveStatus = "in_game" | "in_queue" | "online" | "offline" | "unknown";

export interface CurrentMatch {
  matchId: string;
  gameMode: string;
  duration: number;
  heroId?: number;
}

export interface LiveGameResponse {
  isLive: boolean;
  status: PlayerLiveStatus;
  lastMatchEnd?: number;
  minutesSinceLastMatch?: number;
  currentMatch?: CurrentMatch | null;
}

// Game mode map for quick lookup
const gameModeMap = new Map<number, string>(
  GAME_MODES.map((gm) => [gm.id, gm.name])
);

// Get game mode name from ID
function getGameModeName(gameModeId: number): string {
  return gameModeMap.get(gameModeId) || `Mode ${gameModeId}`;
}

// Check if player is in a live pro game
async function checkProPlayerLive(steamId: string): Promise<{ inLiveGame: boolean; liveGame: LiveGame | null }> {
  try {
    const liveGames = await getLiveGames();
    const numericSteamId = Number(steamId);

    for (const game of liveGames) {
      const playerInGame = game.players.some((p) => p.account_id === numericSteamId);
      if (playerInGame) {
        const player = game.players.find((p) => p.account_id === numericSteamId);
        return {
          inLiveGame: true,
          liveGame: {
            ...game,
            players: game.players.map((p) => ({
              ...p,
              // Ensure we include the hero_id for the current player
              hero_id: p.account_id === numericSteamId ? p.hero_id : p.hero_id,
            })),
          },
        };
      }
    }

    return { inLiveGame: false, liveGame: null };
  } catch (error) {
    console.error("Error checking pro player live status:", error);
    return { inLiveGame: false, liveGame: null };
  }
}

// Check recent matches to determine if player is in game or recently played
async function checkRecentMatches(steamId: string): Promise<{
  inGame: boolean;
  lastMatchEnd?: number;
  minutesSinceLastMatch?: number;
  currentMatch?: CurrentMatch;
}> {
  try {
    const recentMatches = await getPlayerRecentMatches(steamId);

    if (!recentMatches || recentMatches.length === 0) {
      return { inGame: false };
    }

    // Get the most recent match
    const mostRecent = recentMatches[0];
    const now = Math.floor(Date.now() / 1000);
    const matchEndTime = mostRecent.start_time + mostRecent.duration;
    const minutesSinceLastMatch = Math.floor((now - matchEndTime) / 60);

    // Check if the match ended recently (within last 5 minutes - might still be in post-game)
    const recentlyEnded = minutesSinceLastMatch <= 5;

    // Calculate when the match ended
    const lastMatchEnd = matchEndTime;

    // If match ended in the last 10 minutes, player might still be in queue/post-game
    if (minutesSinceLastMatch <= 10) {
      return {
        inGame: minutesSinceLastMatch <= 5, // Still in game if ended within 5 mins
        lastMatchEnd,
        minutesSinceLastMatch,
        currentMatch: {
          matchId: mostRecent.match_id.toString(),
          gameMode: getGameModeName(mostRecent.game_mode),
          duration: mostRecent.duration,
          heroId: mostRecent.hero_id,
        },
      };
    }

    // Match ended more than 10 minutes ago - player is offline
    return {
      inGame: false,
      lastMatchEnd,
      minutesSinceLastMatch,
    };
  } catch (error) {
    console.error("Error checking recent matches:", error);
    return { inGame: false };
  }
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

    // Try to get from cache first (short cache for live data - 30 seconds)
    const cacheKey = `${REDIS_KEYS.PLAYER}live:${steamId}`;
    const cached = await getCachedPlayer(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Determine player status
    const result: LiveGameResponse = {
      isLive: false,
      status: "unknown",
    };

    // First check if it's a pro player in a live game
    const isPro = await isProPlayer(steamId);

    if (isPro) {
      const proLiveResult = await checkProPlayerLive(steamId);

      if (proLiveResult.inLiveGame && proLiveResult.liveGame) {
        const game = proLiveResult.liveGame;
        const player = game.players.find((p) => p.account_id === Number(steamId));

        result.isLive = true;
        result.status = "in_game";
        result.currentMatch = {
          matchId: `live_${game.leagueid}_${game.start_time}`,
          gameMode: getGameModeName(game.game_mode),
          duration: Math.floor((Date.now() / 1000 - game.start_time)),
          heroId: player?.hero_id,
        };
      } else {
        // Pro player but not in live game - check recent matches
        const recentResult = await checkRecentMatches(steamId);

        if (recentResult.inGame) {
          result.isLive = true;
          result.status = "in_game";
          result.lastMatchEnd = recentResult.lastMatchEnd;
          result.minutesSinceLastMatch = recentResult.minutesSinceLastMatch;
          result.currentMatch = recentResult.currentMatch;
        } else if (recentResult.minutesSinceLastMatch !== undefined && recentResult.minutesSinceLastMatch <= 30) {
          // Recently played (within 30 minutes)
          result.isLive = false;
          result.status = "online";
          result.lastMatchEnd = recentResult.lastMatchEnd;
          result.minutesSinceLastMatch = recentResult.minutesSinceLastMatch;
        } else {
          result.status = "offline";
        }
      }
    } else {
      // Not a pro player - just check recent matches
      const recentResult = await checkRecentMatches(steamId);

      if (recentResult.inGame) {
        result.isLive = true;
        result.status = "in_game";
        result.lastMatchEnd = recentResult.lastMatchEnd;
        result.minutesSinceLastMatch = recentResult.minutesSinceLastMatch;
        result.currentMatch = recentResult.currentMatch;
      } else if (recentResult.minutesSinceLastMatch !== undefined && recentResult.minutesSinceLastMatch <= 30) {
        // Recently played (within 30 minutes)
        result.isLive = false;
        result.status = "online";
        result.lastMatchEnd = recentResult.lastMatchEnd;
        result.minutesSinceLastMatch = recentResult.minutesSinceLastMatch;
      } else if (recentResult.minutesSinceLastMatch !== undefined) {
        result.status = "offline";
        result.lastMatchEnd = recentResult.lastMatchEnd;
        result.minutesSinceLastMatch = recentResult.minutesSinceLastMatch;
      } else {
        // No recent matches found - could not determine status
        result.status = "unknown";
      }
    }

    // Cache the result for 30 seconds (live data should be fresh)
    await cacheSet(cacheKey, result, 30);

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching live game status:", error);

    // Try to return cached data if available
    try {
      const { steamId } = await params;
      const cacheKey = `${REDIS_KEYS.PLAYER}live:${steamId}`;
      const cached = await getCachedPlayer(cacheKey);
      if (cached) {
        return NextResponse.json({
          success: true,
          data: cached,
          cached: true,
          warning: "Using cached data due to API error",
        });
      }
    } catch {
      // Cache error, continue to error response
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch live game status" },
      { status: 500 }
    );
  }
}
