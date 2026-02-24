// Insight types
export type InsightCategory = "strength" | "weakness" | "tip" | "warning";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface PlayerInsight {
  category: InsightCategory;
  title: string;
  description: string;
  metric?: string;
  action?: string;
  confidence: ConfidenceLevel;
  dataPoints: string[];
}

export interface InsightsSummary {
  overallRating: number;
  mainStrength: string;
  mainWeakness: string;
  quickTip: string;
}

export interface InsightsResponse {
  generatedAt: string;
  insights: PlayerInsight[];
  summary: InsightsSummary;
}

// Aggregated player data for insight generation
export interface AggregatedHeroData {
  id: number;
  name: string;
  games: number;
  wins: number;
  winrate: number;
}

export interface AggregatedRoleData {
  name: string;
  games: number;
  wins: number;
  winrate: number;
}

export interface AggregatedPeerData {
  steamId: string;
  name: string;
  avatar: string;
  gamesTogether: number;
  winsTogether: number;
  winrateTogether: number;
  synergyScore: number;
}

export interface TimeSlotData {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  games: number;
  wins: number;
  winrate: number;
}

export interface TrendData {
  currentWinStreak: number;
  currentLossStreak: number;
  last20Winrate: number;
  last50Winrate: number;
}

export interface AggregatedPlayerData {
  steamId: string;
  winrate: number;
  totalGames: number;
  heroes: AggregatedHeroData[];
  roles: AggregatedRoleData[];
  peers: AggregatedPeerData[];
  heatmap: TimeSlotData[];
  trends: TrendData;
}

// Configuration thresholds
export const INSIGHT_CONFIG = {
  MIN_GAMES_FOR_HERO_STATS: 5,
  MIN_GAMES_FOR_ROLE_STATS: 10,
  MIN_GAMES_WITH_PEER: 10,
  MIN_GAMES_FOR_HEATMAP: 5,
  ONETRICK_GAMES_THRESHOLD: 50,
  ONETRICK_WINRATE_THRESHOLD: 55,
  COMFORT_BUT_LOSING_GAMES: 20,
  COMFORT_BUT_LOSING_WINRATE: 45,
  ROLE_WINRATE_VARIANCE_THRESHOLD: 15,
  SYNERGY_SCORE_THRESHOLD: 10,
  WIN_STREAK_THRESHOLD: 5,
  LOSS_STREAK_THRESHOLD: 3,
  RECENT_VS_OVERALL_THRESHOLD: 5,
  RECENT_SLUMP_THRESHOLD: 10,
  BEST_TIME_GAMES_THRESHOLD: 10,
  BEST_TIME_WINRATE_BONUS: 5,
} as const;

// Insight Generation Functions

export function generateInsights(playerData: AggregatedPlayerData): PlayerInsight[] {
  const insights: PlayerInsight[] = [];

  // === HERO INSIGHTS ===

  // Rule 1: Hero Pool Depth
  const heroesWithGames = playerData.heroes.filter(
    (h) => h.games >= INSIGHT_CONFIG.MIN_GAMES_FOR_HERO_STATS
  );
  if (heroesWithGames.length < 5) {
    insights.push({
      category: "warning",
      title: "Limited Hero Pool",
      description: `You only have ${heroesWithGames.length} heroes with ${INSIGHT_CONFIG.MIN_GAMES_FOR_HERO_STATS}+ games. Consider expanding your pool to avoid being countered in draft.`,
      action: "Try 2-3 new heroes in unranked this week",
      confidence: "high",
      dataPoints: [`${heroesWithGames.length} heroes with ${INSIGHT_CONFIG.MIN_GAMES_FOR_HERO_STATS}+ games`],
    });
  }

  // Rule 2: One-Trick Potential
  const topHero = playerData.heroes[0];
  if (
    topHero &&
    topHero.games > INSIGHT_CONFIG.ONETRICK_GAMES_THRESHOLD &&
    topHero.winrate > INSIGHT_CONFIG.ONETRICK_WINRATE_THRESHOLD
  ) {
    insights.push({
      category: "strength",
      title: `${topHero.name} Specialist`,
      description: `You have exceptional performance on ${topHero.name}. This is a reliable pick for climbing.`,
      metric: `${topHero.winrate.toFixed(1)}% winrate over ${topHero.games} games`,
      confidence: "high",
      dataPoints: [`${topHero.games} games`, `${topHero.winrate}% WR`],
    });
  }

  // Rule 3: Underperforming Comfort Pick
  const comfortButLosing = playerData.heroes.find(
    (h) =>
      h.games >= INSIGHT_CONFIG.COMFORT_BUT_LOSING_GAMES &&
      h.winrate < INSIGHT_CONFIG.COMFORT_BUT_LOSING_WINRATE
  );
  if (comfortButLosing) {
    insights.push({
      category: "weakness",
      title: `${comfortButLosing.name} Needs Work`,
      description: `You play ${comfortButLosing.name} frequently but your winrate is below average. Consider reviewing replays or taking a break from this hero.`,
      metric: `${comfortButLosing.winrate.toFixed(1)}% winrate`,
      action: `Watch a pro player's ${comfortButLosing.name} VOD`,
      confidence: "high",
      dataPoints: [`${comfortButLosing.games} games`, `${comfortButLosing.winrate}% WR`],
    });
  }

  // === ROLE INSIGHTS ===

  // Rule 4: Role Winrate Variance
  if (playerData.roles.length > 0) {
    const roleWinrates = playerData.roles.map((r) => r.winrate);
    const bestRole = playerData.roles.reduce((a, b) => (a.winrate > b.winrate ? a : b));
    const worstRole = playerData.roles.reduce((a, b) => (a.winrate < b.winrate ? a : b));

    if (
      bestRole.winrate - worstRole.winrate > INSIGHT_CONFIG.ROLE_WINRATE_VARIANCE_THRESHOLD &&
      worstRole.games >= INSIGHT_CONFIG.MIN_GAMES_FOR_ROLE_STATS
    ) {
      insights.push({
        category: "tip",
        title: "Role Specialization Opportunity",
        description: `Your ${bestRole.name} winrate is ${(bestRole.winrate - worstRole.winrate).toFixed(
          0
        )}% higher than ${worstRole.name}. Focusing on your best role could accelerate climbing.`,
        metric: `${bestRole.winrate.toFixed(1)}% vs ${worstRole.winrate.toFixed(1)}%`,
        action: `Queue ${bestRole.name} for your next 10 ranked games`,
        confidence: "medium",
        dataPoints: [
          `Best: ${bestRole.name} (${bestRole.winrate}%)`,
          `Worst: ${worstRole.name} (${worstRole.winrate}%)`,
        ],
      });
    }
  }

  // === PEER INSIGHTS ===

  // Rule 5: Toxic Duo Queue
  const badPartner = playerData.peers.find(
    (p) =>
      p.gamesTogether >= INSIGHT_CONFIG.MIN_GAMES_WITH_PEER &&
      p.synergyScore < -INSIGHT_CONFIG.SYNERGY_SCORE_THRESHOLD
  );
  if (badPartner) {
    insights.push({
      category: "warning",
      title: "Party Synergy Issue",
      description: `Your winrate drops significantly when playing with ${badPartner.name}. This might be due to playstyle mismatch or role conflicts.`,
      metric: `${badPartner.synergyScore.toFixed(1)}% synergy`,
      action: "Consider solo queue or finding a different duo partner",
      confidence: "high",
      dataPoints: [
        `${badPartner.gamesTogether} games together`,
        `${badPartner.winrateTogether}% WR together`,
      ],
    });
  }

  // Rule 6: Power Duo
  const greatPartner = playerData.peers.find(
    (p) =>
      p.gamesTogether >= INSIGHT_CONFIG.MIN_GAMES_WITH_PEER &&
      p.synergyScore > INSIGHT_CONFIG.SYNERGY_SCORE_THRESHOLD
  );
  if (greatPartner) {
    insights.push({
      category: "strength",
      title: "Strong Duo Partner",
      description: `You perform exceptionally well with ${greatPartner.name}. Prioritize queuing together for ranked games.`,
      metric: `+${greatPartner.synergyScore.toFixed(1)}% synergy`,
      confidence: "high",
      dataPoints: [`${greatPartner.gamesTogether} games`, `${greatPartner.winrateTogether}% WR`],
    });
  }

  // === TREND INSIGHTS ===

  // Rule 7: Hot Streak
  if (playerData.trends.currentWinStreak >= INSIGHT_CONFIG.WIN_STREAK_THRESHOLD) {
    insights.push({
      category: "tip",
      title: "You're on Fire!",
      description: `${playerData.trends.currentWinStreak} wins in a row! Your current form is excellent. Consider playing ranked while momentum is high.`,
      metric: `${playerData.trends.currentWinStreak} win streak`,
      confidence: "medium",
      dataPoints: [`Current streak: ${playerData.trends.currentWinStreak}W`],
    });
  }

  // Rule 8: Tilt Warning
  if (playerData.trends.currentLossStreak >= INSIGHT_CONFIG.LOSS_STREAK_THRESHOLD) {
    insights.push({
      category: "warning",
      title: "Tilt Risk Detected",
      description: `You've lost ${playerData.trends.currentLossStreak} games in a row. Taking a break can help reset your mental state and prevent further losses.`,
      action: "Take a 30-minute break before your next game",
      confidence: "high",
      dataPoints: [`Current streak: ${playerData.trends.currentLossStreak}L`],
    });
  }

  // Rule 9: Improving Trend
  const recentWR = playerData.trends.last20Winrate;
  const overallWR = playerData.winrate;
  if (recentWR > overallWR + INSIGHT_CONFIG.RECENT_VS_OVERALL_THRESHOLD) {
    insights.push({
      category: "strength",
      title: "Performance Uptrend",
      description: `Your recent winrate (${recentWR.toFixed(1)}%) is higher than your average (${overallWR.toFixed(
        1
      )}%). You're improving!`,
      metric: `+${(recentWR - overallWR).toFixed(1)}% vs average`,
      confidence: "medium",
      dataPoints: [`Recent: ${recentWR}%`, `Overall: ${overallWR}%`],
    });
  }

  // Rule 10: Declining Trend
  if (recentWR < overallWR - INSIGHT_CONFIG.RECENT_SLUMP_THRESHOLD) {
    insights.push({
      category: "weakness",
      title: "Recent Slump",
      description: `Your recent performance is below your usual level. This could be due to tilt, meta changes, or bad luck.`,
      metric: `${(recentWR - overallWR).toFixed(1)}% vs average`,
      action: "Review your last 5 losses to identify patterns",
      confidence: "medium",
      dataPoints: [`Recent: ${recentWR}%`, `Overall: ${overallWR}%`],
    });
  }

  // === PLAYTIME INSIGHTS ===

  // Rule 11: Best Time to Play
  if (playerData.heatmap.length > 0) {
    const bestTimeSlot = playerData.heatmap.reduce((a, b) =>
      b.games >= INSIGHT_CONFIG.MIN_GAMES_FOR_HEATMAP && b.winrate > a.winrate ? b : a
    );
    if (
      bestTimeSlot.games >= INSIGHT_CONFIG.BEST_TIME_GAMES_THRESHOLD &&
      bestTimeSlot.winrate > overallWR + INSIGHT_CONFIG.BEST_TIME_WINRATE_BONUS
    ) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      insights.push({
        category: "tip",
        title: "Optimal Play Time",
        description: `You perform best on ${dayNames[bestTimeSlot.day]}s around ${bestTimeSlot.hour}:00. Schedule your ranked games accordingly.`,
        metric: `${bestTimeSlot.winrate.toFixed(1)}% winrate`,
        confidence: "medium",
        dataPoints: [`${bestTimeSlot.games} games at this time`, `${bestTimeSlot.winrate}% WR`],
      });
    }
  }

  return insights;
}

// Generate summary from insights
export function generateSummary(
  insights: PlayerInsight[],
  playerData: AggregatedPlayerData
): InsightsSummary {
  const strengths = insights.filter((i) => i.category === "strength");
  const weaknesses = insights.filter((i) => i.category === "weakness");
  const warnings = insights.filter((i) => i.category === "warning");
  const tips = insights.filter((i) => i.category === "tip");

  // Calculate overall rating (simplified)
  let rating = 50; // baseline
  rating += (playerData.winrate - 50) * 1.5; // winrate impact
  rating += strengths.length * 5; // bonus for strengths
  rating -= weaknesses.length * 5; // penalty for weaknesses
  rating -= warnings.length * 3; // penalty for warnings
  rating = Math.max(0, Math.min(100, rating));

  return {
    overallRating: Math.round(rating),
    mainStrength: strengths[0]?.title || "Consistent player",
    mainWeakness:
      weaknesses[0]?.title || warnings[0]?.title || "No major issues detected",
    quickTip: tips[0]?.action || (playerData.totalGames > 0 ? "Keep playing and improving!" : "Play more matches to get insights"),
  };
}

// Group insights by category for display
export function groupInsightsByCategory(
  insights: PlayerInsight[]
): Record<InsightCategory, PlayerInsight[]> {
  return {
    strength: insights.filter((i) => i.category === "strength"),
    weakness: insights.filter((i) => i.category === "weakness"),
    tip: insights.filter((i) => i.category === "tip"),
    warning: insights.filter((i) => i.category === "warning"),
  };
}
