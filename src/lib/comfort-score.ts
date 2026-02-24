import type { HeroStats, MatchPlayer } from "./opendota";

/**
 * Calculate comfort score for a hero based on multiple factors
 * 
 * Algorithm:
 * - Games: 30% weight (normalize to 100 games max)
 * - Winrate: 35% weight  
 * - Recency: 15% weight (0 days = 100, 30+ days = 0)
 * - Consistency: 20% weight (lower KDA stddev = higher)
 */
export function calculateComfortScore(
  heroStats: HeroStats,
  matches: MatchPlayer[]
): number {
  // Filter matches for this hero
  const heroMatches = matches.filter(m => m.hero_id === heroStats.hero_id);
  
  if (heroMatches.length === 0 || heroStats.games === 0) {
    return 0;
  }

  // 1. Games Score (30% weight)
  // Normalize to 100 games max
  const gamesScore = Math.min(heroStats.games / 100, 1) * 100;

  // 2. Winrate Score (35% weight)
  const winrate = heroStats.win / heroStats.games;
  const winrateScore = winrate * 100;

  // 3. Recency Score (15% weight)
  // 0 days = 100, 30+ days = 0
  const daysSinceLastPlayed = (Date.now() / 1000 - heroStats.last_played) / 86400;
  const recencyScore = Math.max(0, 100 - daysSinceLastPlayed * (100 / 30));

  // 4. Consistency Score (20% weight)
  // Calculate KDA stddev from matches
  const kdas = heroMatches.map(m => {
    const kda = (m.kills + m.assists) / Math.max(m.deaths, 1);
    return kda;
  });
  
  const avgKda = kdas.reduce((a, b) => a + b, 0) / kdas.length;
  const variance = kdas.reduce((sum, kda) => sum + Math.pow(kda - avgKda, 2), 0) / kdas.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower stdDev = higher consistency (inverse relationship)
  // stdDev of 0 = 100, stdDev of 5+ = 0
  const consistencyScore = Math.max(0, 100 - stdDev * 20);

  // Calculate weighted total
  const comfortScore = Math.round(
    gamesScore * 0.30 +
    winrateScore * 0.35 +
    recencyScore * 0.15 +
    consistencyScore * 0.20
  );

  return Math.min(100, Math.max(0, comfortScore));
}

/**
 * Get comfort score color based on value
 */
export function getComfortScoreColor(score: number): string {
  if (score >= 80) return "#FFD700"; // Gold
  if (score >= 60) return "#22C55E"; // Green
  if (score >= 40) return "#3B82F6"; // Blue
  return "#6B7280"; // Gray
}

/**
 * Get comfort score label based on value
 */
export function getComfortScoreLabel(score: number): string {
  if (score >= 80) return "Master";
  if (score >= 60) return "Comfort";
  if (score >= 40) return "Practice";
  return "Learning";
}

/**
 * Calculate average KDA from hero stats
 */
export function calculateAvgKDA(heroStats: HeroStats, matches: MatchPlayer[]): number {
  const heroMatches = matches.filter(m => m.hero_id === heroStats.hero_id);
  
  if (heroMatches.length === 0) {
    return 0;
  }

  const totalKda = heroMatches.reduce((sum, m) => {
    return sum + (m.kills + m.assists) / Math.max(m.deaths, 1);
  }, 0);

  return totalKda / heroMatches.length;
}

/**
 * Calculate average GPM from hero stats
 */
export function calculateAvgGPM(heroStats: HeroStats, matches: MatchPlayer[]): number {
  const heroMatches = matches.filter(m => m.hero_id === heroStats.hero_id);
  
  if (heroMatches.length === 0) {
    return 0;
  }

  const totalGpm = heroMatches.reduce((sum, m) => sum + m.gold_per_min, 0);
  return Math.round(totalGpm / heroMatches.length);
}
