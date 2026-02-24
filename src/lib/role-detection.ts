import type { MatchPlayer } from "./opendota";

/**
 * Dota 2 lane roles:
 * 1 = Safe Lane (Pos 1 - Carry)
 * 2 = Mid Lane (Pos 2 - Mid)
 * 3 = Off Lane (Pos 3 - Offlane)
 * 4 = Soft Support (Pos 4 - Roaming/Jungle)
 * 5 = Hard Support (Pos 5 - Support)
 */

/**
 * Map lane_role to position number
 */
export function getPositionFromLaneRole(laneRole: number | null): number | null {
  if (laneRole === null) return null;
  
  switch (laneRole) {
    case 1: return 1; // Safe Lane -> Pos 1
    case 2: return 2; // Mid Lane -> Pos 2
    case 3: return 3; // Off Lane -> Pos 3
    case 4: return 4; // Soft Support -> Pos 4
    case 5: return 5; // Hard Support -> Pos 5
    default: return null;
  }
}

/**
 * Map lane_role to role name
 */
export function getRoleNameFromLaneRole(laneRole: number | null): string {
  if (laneRole === null) return "Unknown";
  
  switch (laneRole) {
    case 1: return "Safe Lane";
    case 2: return "Mid Lane";
    case 3: return "Off Lane";
    case 4: return "Soft Support";
    case 5: return "Hard Support";
    default: return "Unknown";
  }
}

/**
 * Detect role from match data
 * Uses lane_role and net_worth rank to distinguish positions
 */
export function detectRole(match: MatchPlayer): number {
  const laneRole = match.lane_role;
  
  if (laneRole === null) {
    // Fallback based on lane
    if (match.lane === 1) return 1;
    if (match.lane === 2) return 2;
    if (match.lane === 3) return 3;
    return 0; // Unknown
  }

  // Use lane_role directly for core roles
  if (laneRole >= 1 && laneRole <= 3) {
    return laneRole;
  }

  // For supports (4, 5), use net_worth to distinguish
  if (laneRole === 4 || laneRole === 5) {
    // This is a simplified approach - in a real implementation,
    // you'd compare net_worth across all players in the match
    return laneRole;
  }

  return 0;
}

/**
 * Calculate role distribution from matches
 */
export function calculateRoleDistribution(
  matches: MatchPlayer[]
): Array<{ role: number; games: number; wins: number }> {
  const distribution = new Map<number, { games: number; wins: number }>();

  for (const match of matches) {
    const role = detectRole(match);
    
    if (!distribution.has(role)) {
      distribution.set(role, { games: 0, wins: 0 });
    }
    
    const stats = distribution.get(role)!;
    stats.games++;
    
    // Determine win - need to check radiant_win and player_slot
    const isRadiant = match.player_slot < 128;
    const radiantWin = true; // We'd need the match data for this
    
    // Skip win calculation here since we don't have match info
    // Will be calculated separately
  }

  return Array.from(distribution.entries()).map(([role, stats]) => ({
    role,
    games: stats.games,
    wins: 0, // Will be calculated with match data
  }));
}

/**
 * Calculate role stats from matches with win info
 */
export function calculateRoleStats(
  matches: MatchPlayer[],
  isRadiantWin: boolean
): Array<{ role: number; games: number; wins: number; avgKda: number; avgGpm: number }> {
  const roleStats = new Map<
    number,
    { games: number; wins: number; totalKda: number; totalGpm: number }
  >();

  for (const match of matches) {
    const role = detectRole(match);
    const isRadiant = match.player_slot < 128;
    const won = isRadiant === isRadiantWin;

    if (!roleStats.has(role)) {
      roleStats.set(role, { games: 0, wins: 0, totalKda: 0, totalGpm: 0 });
    }

    const stats = roleStats.get(role)!;
    stats.games++;
    if (won) stats.wins++;
    
    const kda = (match.kills + match.assists) / Math.max(match.deaths, 1);
    stats.totalKda += kda;
    stats.totalGpm += match.gold_per_min;
  }

  return Array.from(roleStats.entries()).map(([role, stats]) => ({
    role,
    games: stats.games,
    wins: stats.wins,
    avgKda: stats.games > 0 ? stats.totalKda / stats.games : 0,
    avgGpm: stats.games > 0 ? Math.round(stats.totalGpm / stats.games) : 0,
  }));
}

/**
 * Calculate versatility score using Shannon entropy
 * Higher entropy = more versatile
 */
export function calculateVersatilityScore(
  distribution: Array<{ role: number; games: number }>
): number {
  const totalGames = distribution.reduce((sum, d) => sum + d.games, 0);
  
  if (totalGames === 0) return 0;

  // Calculate entropy
  let entropy = 0;
  for (const d of distribution) {
    if (d.games > 0) {
      const probability = d.games / totalGames;
      entropy -= probability * Math.log2(probability);
    }
  }

  // Normalize to 0-100 scale
  // Max entropy for 5 roles = log2(5) ≈ 2.32
  const maxEntropy = Math.log2(5);
  const normalizedEntropy = entropy / maxEntropy;

  return Math.round(normalizedEntropy * 100);
}

/**
 * Get role recommendation based on stats
 */
export function getRoleRecommendation(
  roleStats: Array<{ role: number; games: number; wins: number; avgKda: number; avgGpm: number }>
): { role: number; winrate: number; games: number } | null {
  if (roleStats.length === 0) return null;

  // Score each role based on games, winrate, and KDA
  const scoredRoles = roleStats.map(rs => {
    const winrate = rs.games > 0 ? rs.wins / rs.games : 0;
    // Weighted score: 50% games, 30% winrate, 20% KDA
    const gamesScore = Math.min(rs.games / 100, 1); // Normalize to 100 games
    const score = gamesScore * 0.5 + winrate * 0.3 + (rs.avgKda / 10) * 0.2;
    
    return {
      role: rs.role,
      winrate,
      games: rs.games,
      score,
    };
  });

  // Sort by score and return best
  scoredRoles.sort((a, b) => b.score - a.score);
  
  const best = scoredRoles[0];
  return {
    role: best.role,
    winrate: best.winrate,
    games: best.games,
  };
}

/**
 * Get role color for charts
 */
export function getRoleColor(role: number): string {
  switch (role) {
    case 1: return "#22C55E"; // Green - Safe Lane Carry
    case 2: return "#3B82F6"; // Blue - Mid
    case 3: return "#F59E0B"; // Orange - Off Lane
    case 4: return "#8B5CF6"; // Purple - Soft Support
    case 5: return "#EC4899"; // Pink - Hard Support
    default: return "#6B7280"; // Gray - Unknown
  }
}

/**
 * Get role icon label
 */
export function getRoleLabel(role: number): string {
  switch (role) {
    case 1: return "Pos 1";
    case 2: return "Pos 2";
    case 3: return "Pos 3";
    case 4: return "Pos 4";
    case 5: return "Pos 5";
    default: return "Unknown";
  }
}
