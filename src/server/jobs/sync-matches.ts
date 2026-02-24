// Background sync job implementation for DotaVision
// This module provides job queue functionality for syncing matches and computing stats

import { getPlayerMatches, getPlayerProfile, getMatch } from "@/lib/opendota";

// Queue names
export const QUEUE_NAMES = {
  SYNC_MATCHES: "sync-matches",
  COMPUTE_STATS: "compute-stats",
} as const;

// Job data types
export interface SyncMatchesJobData {
  steamId: string;
  lastSynced?: number;
}

export interface ComputeStatsJobData {
  steamId: string;
  matchIds: number[];
}

// Process functions for sync matches job
export async function processSyncMatchesJob(data: SyncMatchesJobData): Promise<{
  newMatches: number;
  processedMatchIds: number[];
}> {
  const { steamId, lastSynced } = data;
  console.log(`[SyncMatchesJob] Processing sync for ${steamId}`);

  const processedMatchIds: number[] = [];
  let newMatches = 0;

  try {
    // Get player profile to verify account exists
    const profile = await getPlayerProfile(steamId);
    if (!profile) {
      throw new Error(`Player ${steamId} not found`);
    }

    // Get matches since last sync
    const limit = 100;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const matches = await getPlayerMatches(steamId, { limit, offset });

      if (matches.length === 0) {
        hasMore = false;
        break;
      }

      for (const match of matches) {
        // Skip if match is older than last sync
        if (lastSynced && match.start_time < lastSynced) {
          hasMore = false;
          break;
        }

        // Fetch full match details for parsing
        const fullMatch = await getMatch(match.match_id.toString());

        // Parse and store match data
        // In production, save to database using Prisma:
        // await prisma.matchCache.create({
        //   data: {
        //     matchId: BigInt(match.match_id),
        //     steamId: steamId,
        //     heroId: match.hero_id,
        //     result: determineResult(match, profile.account_id),
        //     duration: fullMatch.duration,
        //     kills: match.kills,
        //     deaths: match.deaths,
        //     assists: match.assists,
        //     gpm: match.gold_per_min,
        //     xpm: match.xp_per_min,
        //     netWorth: match.net_worth,
        //     role: determineRole(match),
        //     laneOutcome: determineLaneOutcome(match),
        //     playedAt: new Date(match.start_time * 1000),
        //   },
        // });

        processedMatchIds.push(match.match_id);
        newMatches++;

        // Rate limit - be respectful to OpenDota API
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      offset += limit;

      // Stop if we got fewer results than requested (no more pages)
      if (matches.length < limit) {
        hasMore = false;
      }
    }

    // If we have new matches, trigger stats computation
    // In production, this would be done via a separate queue job
    if (newMatches > 0) {
      console.log(`[SyncMatchesJob] Triggering stats computation for ${newMatches} matches`);
      // await computeStats({ steamId, matchIds: processedMatchIds });
    }

    console.log(`[SyncMatchesJob] Completed. New matches: ${newMatches}`);

    return { newMatches, processedMatchIds };
  } catch (error) {
    console.error(`[SyncMatchesJob] Error:`, error);
    throw error;
  }
}

// Process function for compute stats job
export async function processComputeStatsJob(data: ComputeStatsJobData): Promise<void> {
  const { steamId, matchIds } = data;
  console.log(`[ComputeStatsJob] Computing stats for ${steamId}, ${matchIds.length} matches`);

  try {
    // For each hero the player has played
    // Calculate aggregated statistics:
    // - Total games, wins, losses
    // - Average KDA, GPM, XPM
    // - Win streaks, lose streaks
    // - Comfort score (based on recent performance)
    
    // In production:
    // const heroStats = await prisma.heroStat.findMany({
    //   where: { steamId },
    // });
    //
    // for each match, update hero stats...
    // await prisma.heroStat.upsert({
    //   where: { steamId_heroId: { steamId, heroId } },
    //   update: { ... },
    //   create: { ... },
    // });

    console.log(`[ComputeStatsJob] Stats computation completed`);
  } catch (error) {
    console.error(`[ComputeStatsJob] Error:`, error);
    throw error;
  }
}

// Helper to trigger sync job
export async function triggerSync(steamId: string, lastSynced?: number): Promise<void> {
  console.log(`[Sync] Triggering sync for ${steamId}`);
  
  // In production with BullMQ:
  // const queue = new Queue(QUEUE_NAMES.SYNC_MATCHES, { connection });
  // await queue.add('sync-matches', { steamId, lastSynced });
  
  // For now, just run synchronously
  await processSyncMatchesJob({ steamId, lastSynced });
}
