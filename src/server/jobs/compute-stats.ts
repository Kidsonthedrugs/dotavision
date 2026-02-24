// Compute stats job implementation for DotaVision
// This module handles the computation of player statistics after matches are synced

import type { MatchCache, HeroStat } from "@/types";

// Process function for computing hero stats
export async function computeHeroStats(
  steamId: string,
  matches: MatchCache[]
): Promise<HeroStat[]> {
  console.log(`[ComputeHeroStats] Computing stats for ${steamId}`);

  // Group matches by hero
  const heroMatches = new Map<number, MatchCache[]>();
  
  for (const match of matches) {
    const existing = heroMatches.get(match.heroId) || [];
    existing.push(match);
    heroMatches.set(match.heroId, existing);
  }

  const heroStats: HeroStat[] = [];

  // Calculate stats for each hero
  for (const [heroId, heroMatchList] of heroMatches) {
    const gamesPlayed = heroMatchList.length;
    const wins = heroMatchList.filter((m) => m.result === "win").length;
    const losses = gamesPlayed - wins;

    // Calculate averages
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalGPM = 0;
    let totalXPM = 0;
    let totalDuration = 0;

    for (const match of heroMatchList) {
      totalKills += match.kills;
      totalDeaths += match.deaths;
      totalAssists += match.assists;
      totalGPM += match.gpm;
      totalXPM += match.xpm;
      totalDuration += match.duration;
    }

    const avgKDA = totalDeaths > 0 
      ? (totalKills + totalAssists) / totalDeaths 
      : totalKills + totalAssists;
    const avgGPM = Math.round(totalGPM / gamesPlayed);
    const avgXPM = Math.round(totalXPM / gamesPlayed);
    const avgDuration = Math.round(totalDuration / gamesPlayed);

    // Calculate streaks
    let winStreak = 0;
    let loseStreak = 0;
    let currentStreak = 0;
    let currentStreakType: "win" | "lose" | null = null;

    // Sort by date
    const sortedMatches = [...heroMatchList].sort(
      (a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime()
    );

    for (const match of sortedMatches) {
      const isWin = match.result === "win";
      
      if (currentStreakType === null) {
        currentStreak = 1;
        currentStreakType = isWin ? "win" : "lose";
      } else if (
        (isWin && currentStreakType === "win") ||
        (!isWin && currentStreakType === "lose")
      ) {
        currentStreak++;
      } else {
        if (currentStreakType === "win") {
          winStreak = Math.max(winStreak, currentStreak);
        } else {
          loseStreak = Math.max(loseStreak, currentStreak);
        }
        currentStreak = 1;
        currentStreakType = isWin ? "win" : "lose";
      }
    }

    // Final streak check
    if (currentStreakType === "win") {
      winStreak = Math.max(winStreak, currentStreak);
    } else if (currentStreakType === "lose") {
      loseStreak = Math.max(loseStreak, currentStreak);
    }

    // Calculate comfort score (0-100)
    // Based on recent performance and consistency
    const recentMatches = sortedMatches.slice(-10);
    const recentWins = recentMatches.filter((m) => m.result === "win").length;
    const recentWinRate = (recentWins / recentMatches.length) * 100;
    const streakBonus = Math.max(winStreak, loseStreak) * 2;
    const comfortScore = Math.min(100, recentWinRate + streakBonus);

    const stat: HeroStat = {
      id: `${steamId}-${heroId}`,
      steamId,
      heroId,
      gamesPlayed,
      wins,
      losses,
      avgKDA: Number(avgKDA.toFixed(2)),
      avgGPM,
      avgXPM,
      avgDuration,
      winStreak,
      loseStreak,
      comfortScore: Number(comfortScore.toFixed(1)),
      lastPlayed: new Date(),
    };

    heroStats.push(stat);

    // In production, save to database:
    // await prisma.heroStat.upsert({
    //   where: { steamId_heroId: { steamId, heroId } },
    //   update: stat,
    //   create: stat,
    // });
  }

  console.log(`[ComputeHeroStats] Computed stats for ${heroStats.length} heroes`);
  return heroStats;
}

// Compute session statistics
export interface SessionStats {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  netMMR: number;
  avgMatchDuration: number;
  tiltScore: number;
  peakHour: number;
}

export function computeSessionStats(
  matches: MatchCache[],
  mmrChanges: number[]
): SessionStats {
  const totalMatches = matches.length;
  const wins = matches.filter((m) => m.result === "win").length;
  const losses = totalMatches - wins;
  const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
  const netMMR = mmrChanges.reduce((sum, change) => sum + change, 0);

  // Calculate average match duration
  const totalDuration = matches.reduce((sum, m) => sum + m.duration, 0);
  const avgMatchDuration = totalMatches > 0 ? totalDuration / totalMatches : 0;

  // Calculate tilt score (consecutive losses)
  let tiltScore = 0;
  let currentLossStreak = 0;
  
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
  );

  for (const match of sortedMatches) {
    if (match.result === "lose") {
      currentLossStreak++;
      tiltScore = Math.max(tiltScore, currentLossStreak);
    } else {
      currentLossStreak = 0;
    }
  }

  // Calculate peak hour (most games played during this hour)
  const hourCounts = new Map<number, number>();
  for (const match of matches) {
    const hour = new Date(match.playedAt).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }

  let peakHour = 0;
  let maxCount = 0;
  for (const [hour, count] of hourCounts) {
    if (count > maxCount) {
      maxCount = count;
      peakHour = hour;
    }
  }

  return {
    totalMatches,
    wins,
    losses,
    winRate: Number(winRate.toFixed(1)),
    netMMR,
    avgMatchDuration: Math.round(avgMatchDuration),
    tiltScore,
    peakHour,
  };
}

// Compute heatmap data (win rate by day/hour)
export interface HeatmapCell {
  day: number;
  hour: number;
  winRate: number;
  games: number;
}

export function computeHeatmap(matches: MatchCache[]): HeatmapCell[] {
  const cellMap = new Map<string, { wins: number; total: number }>();

  for (const match of matches) {
    const date = new Date(match.playedAt);
    const day = date.getDay();
    const hour = date.getHours();
    const key = `${day}-${hour}`;

    const cell = cellMap.get(key) || { wins: 0, total: 0 };
    cell.total++;
    if (match.result === "win") {
      cell.wins++;
    }
    cellMap.set(key, cell);
  }

  const heatmap: HeatmapCell[] = [];
  
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      const cell = cellMap.get(key);
      
      heatmap.push({
        day,
        hour,
        winRate: cell ? (cell.wins / cell.total) * 100 : 0,
        games: cell?.total || 0,
      });
    }
  }

  return heatmap;
}
