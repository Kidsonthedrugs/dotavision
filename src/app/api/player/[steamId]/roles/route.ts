import { NextRequest, NextResponse } from "next/server";
import { getPlayerMatches, getMatch, type MatchPlayer, type Match } from "@/lib/opendota";
import { cacheGet, cacheSet } from "@/lib/redis";
import { CACHE_TTL } from "@/lib/constants";
import {
  detectRole,
  getRoleNameFromLaneRole,
  calculateVersatilityScore,
  getRoleRecommendation,
} from "@/lib/role-detection";

export interface RoleDistribution {
  role: number;
  roleName: string;
  games: number;
  wins: number;
}

export interface RoleStats {
  role: number;
  roleName: string;
  games: number;
  wins: number;
  winrate: number;
  avgKda: number;
  avgGpm: number;
  impactScore: number;
}

export interface BestRole {
  role: number;
  roleName: string;
  winrate: number;
  games: number;
}

export interface RolesResponse {
  distribution: RoleDistribution[];
  perRoleStats: RoleStats[];
  bestRole: BestRole | null;
  versatilityScore: number;
  unknownCount: number;
  unknownNote: string;
  parsedCount: number;
  totalCount: number;
}

// Extended match type with version field
interface MatchWithVersion extends MatchPlayer {
  version: number | null;
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
    const cacheKey = `player:roles:${steamId}`;
    const cached = await cacheGet<RolesResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch matches - default response includes kills, deaths, assists, gold_per_min etc.
    // version field is included by default
    const matches = await getPlayerMatches(steamId, { 
      limit: 500,
    });

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          distribution: [],
          perRoleStats: [],
          bestRole: null,
          versatilityScore: 0,
          unknownCount: 0,
          unknownNote: "",
          parsedCount: 0,
          totalCount: 0,
        },
        cached: false,
      });
    }

    // Type assertion for matches with version
    const matchesWithVersion = matches as MatchWithVersion[];

    // Find parsed matches (version !== null) - these have lane_role data
    const parsedMatchIds: number[] = [];
    const matchMap = new Map<number, MatchPlayer>();
    
    for (const match of matchesWithVersion) {
      matchMap.set(match.match_id, match);
      if (match.version !== null) {
        parsedMatchIds.push(match.match_id);
      }
    }

    // Fetch lane_role for parsed matches (limit to 50 to avoid rate limits)
    const limitedParsedIds = parsedMatchIds.slice(0, 50);
    const laneRoleMap = new Map<number, { lane_role: number | null; lane: number | null; is_roaming: boolean | null; gold_per_min: number }>();
    
    // Fetch in parallel
    const fetchPromises = limitedParsedIds.map(async (matchId) => {
      try {
        const matchData = await getMatch(matchId.toString());
        if (matchData && matchData.players) {
          // Find the player in this match by matching player_slot
          const originalMatch = matchMap.get(matchId);
          if (originalMatch) {
            const player = matchData.players.find(
              (p) => p.player_slot === originalMatch.player_slot
            );
            if (player) {
              laneRoleMap.set(matchId, {
                lane_role: player.lane_role,
                lane: player.lane,
                is_roaming: player.is_roaming,
                gold_per_min: player.gold_per_min || 0,
              });
            }
          }
        }
      } catch (e) {
        // Silently fail for individual match fetches
        console.error(`Failed to fetch match ${matchId}:`, e);
      }
    });

    await Promise.all(fetchPromises);

    // Calculate role distribution using enhanced match data
    const roleCounts = new Map<number, { games: number; wins: number; totalKda: number; totalGpm: number }>();
    let unknownCount = 0;
    let parsedWithRole = 0;

    for (const match of matchesWithVersion) {
      // Try to get lane_role from our fetched data
      let laneRole: number | null = null;
      let lane: number | null = null;
      let isRoaming: boolean | null = null;
      
      const enhancedData = laneRoleMap.get(match.match_id);
      if (enhancedData) {
        laneRole = enhancedData.lane_role;
        lane = enhancedData.lane;
        isRoaming = enhancedData.is_roaming;
      }

      // Create enhanced match object for role detection (merging original with fetched lane data)
      const matchForRole: MatchPlayer = {
        ...match,
        lane_role: laneRole,
        lane: lane,
        is_roaming: isRoaming,
      };
      
      const role = detectRole(matchForRole);
      
      // Skip matches where we can't determine role
      if (role === 0) {
        unknownCount++;
        continue;
      }

      if (laneRole !== null) {
        parsedWithRole++;
      }
      
      // Calculate win: radiant_win matches player_slot (radiant = 0-127)
      const isRadiant = match.player_slot < 128;
      const won = match.radiant_win === isRadiant;

      if (!roleCounts.has(role)) {
        roleCounts.set(role, { games: 0, wins: 0, totalKda: 0, totalGpm: 0 });
      }

      const stats = roleCounts.get(role)!;
      stats.games++;
      if (won) stats.wins++;
      
      const kda = (match.kills + match.assists) / Math.max(match.deaths, 1);
      stats.totalKda += kda;
      
      // Use gpm from enhanced data if available, otherwise default to 0
      const gpm = enhancedData ? enhancedData.gold_per_min : 0;
      stats.totalGpm += gpm;
    }

    // Build distribution
    const distribution: RoleDistribution[] = Array.from(roleCounts.entries())
      .map(([role, stats]) => ({
        role,
        roleName: getRoleNameFromLaneRole(role),
        games: stats.games,
        wins: stats.wins,
      }))
      .sort((a, b) => b.games - a.games);

    // Build per-role stats
    const perRoleStats: RoleStats[] = distribution.map((d) => {
      const roleData = roleCounts.get(d.role)!;
      const avgKda = roleData.games > 0 ? roleData.totalKda / roleData.games : 0;
      const avgGpm = roleData.games > 0 ? Math.round(roleData.totalGpm / roleData.games) : 0;
      
      // Impact score: combination of KDA and GPM normalized
      const impactScore = Math.round(
        (Math.min(avgKda / 5, 1) * 50 + Math.min(avgGpm / 600, 1) * 50) * 100
      ) / 100;

      return {
        role: d.role,
        roleName: d.roleName,
        games: d.games,
        wins: d.wins,
        winrate: d.games > 0 ? Math.round((d.wins / d.games) * 1000) / 10 : 0,
        avgKda: Math.round(avgKda * 100) / 100,
        avgGpm,
        impactScore,
      };
    });

    // Calculate best role
    const roleStatsForRec = perRoleStats.map((rs) => ({
      role: rs.role,
      games: rs.games,
      wins: rs.wins,
      avgKda: rs.avgKda,
      avgGpm: rs.avgGpm,
    }));
    
    const bestRoleRec = getRoleRecommendation(roleStatsForRec);
    const bestRole: BestRole | null = bestRoleRec
      ? {
          role: bestRoleRec.role,
          roleName: getRoleNameFromLaneRole(bestRoleRec.role),
          winrate: Math.round(bestRoleRec.winrate * 1000) / 10,
          games: bestRoleRec.games,
        }
      : null;

    // Calculate versatility score
    const distributionForEntropy = distribution.map((d) => ({
      role: d.role,
      games: d.games,
    }));
    const versatilityScore = calculateVersatilityScore(distributionForEntropy);

    // Build note about unknown matches
    const knownGames = matches.length - unknownCount;
    const unknownNote = unknownCount > 0
      ? `${unknownCount} matches couldn't be analyzed (unparsed matches - lane data unavailable)`
      : knownGames > 0 
        ? `Role data based on ${parsedWithRole} parsed matches`
        : "";

    const response: RolesResponse = {
      distribution,
      perRoleStats,
      bestRole,
      versatilityScore,
      unknownCount,
      unknownNote,
      parsedCount: parsedWithRole,
      totalCount: matches.length,
    };

    // Cache the result
    await cacheSet(cacheKey, response, CACHE_TTL.PEERS);

    return NextResponse.json({
      success: true,
      data: response,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching player roles:", error);

    const { steamId } = await params;
    const cacheKey = `player:roles:${steamId}`;
    const cached = await cacheGet<RolesResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        warning: "Using cached data due to API error",
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch player roles" },
      { status: 500 }
    );
  }
}
