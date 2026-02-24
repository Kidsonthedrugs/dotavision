import { NextRequest, NextResponse } from "next/server";
import { getPlayerHeroes, getPlayerMatches, getHeroes, getMatch, type MatchPlayer } from "@/lib/opendota";
import { cacheGet, cacheSet } from "@/lib/redis";
import { CACHE_TTL } from "@/lib/constants";
import { calculateComfortScore, calculateAvgKDA, calculateAvgGPM } from "@/lib/comfort-score";

export interface HeroWithStats {
  heroId: number;
  heroName: string;
  heroIcon: string;
  games: number;
  wins: number;
  losses: number;
  winrate: number;
  avgKda: number;
  avgGpm: number;
  comfortScore: number;
  lastPlayed: number;
}

export interface RecentMatch {
  matchId: number;
  heroId: number;
  result: "win" | "lose";
  duration: number;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
  kda: number;
  startTime: number;
  laneRole: number | null;
}

export interface Item {
  id: number;
  name: string;
  count: number;
}

export interface ItemBuilds {
  startingItems: Item[];
  coreItems: Item[];
  situationalItems: Item[];
}

export interface MatchupHero {
  heroId: number;
  heroName: string;
  heroIcon: string;
  games: number;
  wins: number;
  winrate: number;
  winrateDelta: number;
}

export interface HeroDetailResponse {
  hero: HeroWithStats;
  recentMatches: RecentMatch[];
  itemBuilds: ItemBuilds;
  matchups: {
    bestAllies: MatchupHero[];
    worstEnemies: MatchupHero[];
  };
  trends: {
    kdaOverTime: number[];
    winDurations: number[];
    lossDurations: number[];
  };
}

async function getHeroesData() {
  const cacheKey = "heroes:data:all";
  const cached = await cacheGet<Array<{ id: number; name: string; localized_name: string }>>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const heroes = await getHeroes();
  await cacheSet(cacheKey, heroes, CACHE_TTL.HEROES_DATA);
  return heroes;
}

function getHeroName(heroId: number, heroesData: Array<{ id: number; name: string; localized_name: string }>): string {
  const hero = heroesData.find(h => h.id === heroId);
  return hero?.localized_name || `Hero ${heroId}`;
}

function analyzeItemBuilds(): ItemBuilds {
  // Simplified item builds - in production, you'd analyze actual purchase data
  return {
    startingItems: [
      { id: 84, name: "iron_branch", count: 2 },
      { id: 23, name: "tango", count: 1 },
    ],
    coreItems: [
      { id: 63, name: "ultimate_orb", count: 1 },
      { id: 111, name: "arcane_boots", count: 1 },
    ],
    situationalItems: [
      { id: 112, name: "force_staff", count: 1 },
      { id: 98, name: "glimmer_cape", count: 1 },
    ],
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ steamId: string; heroId: string }> }
) {
  try {
    const { steamId, heroId } = await params;

    // Validate params
    if (!steamId || isNaN(Number(steamId))) {
      return NextResponse.json(
        { success: false, error: "Invalid Steam ID" },
        { status: 400 }
      );
    }

    if (!heroId || isNaN(Number(heroId))) {
      return NextResponse.json(
        { success: false, error: "Invalid Hero ID" },
        { status: 400 }
      );
    }

    const heroIdNum = Number(heroId);

    // Check cache
    const cacheKey = `player:hero:${steamId}:${heroId}`;
    const cached = await cacheGet<HeroDetailResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch data in parallel
    const [heroStats, matches, heroesData] = await Promise.all([
      getPlayerHeroes(steamId),
      getPlayerMatches(steamId, { limit: 100, heroId: heroIdNum }),
      getHeroesData(),
    ]);

    // Find this hero's stats
    const heroStat = heroStats.find((h: { hero_id: number }) => h.hero_id === heroIdNum);
    
    if (!heroStat) {
      return NextResponse.json({
        success: true,
        data: null,
        error: "No matches found for this hero",
      });
    }

    // Get hero name
    const heroName = getHeroName(heroIdNum, heroesData);
    const heroNameShort = heroesData.find(h => h.id === heroIdNum)?.name || "";

    // Calculate stats
    const comfortScore = calculateComfortScore(heroStat, matches);
    const avgKda = calculateAvgKDA(heroStat, matches);
    const avgGpm = calculateAvgGPM(heroStat, matches);

    // Transform recent matches - we need actual win/lose from match data
    // For now, we'll mark all as unknown and fetch individual matches if needed
    const recentMatches: RecentMatch[] = matches.slice(0, 20).map((m: MatchPlayer) => {
      return {
        matchId: m.match_id,
        heroId: m.hero_id,
        result: "win" as const, // Placeholder - would need match data
        duration: m.duration,
        kills: m.kills,
        deaths: m.deaths,
        assists: m.assists,
        gpm: m.gold_per_min,
        xpm: m.xp_per_min,
        kda: (m.kills + m.assists) / Math.max(m.deaths, 1),
        startTime: m.start_time,
        laneRole: m.lane_role,
      };
    });

    // Analyze trends
    const kdaOverTime = recentMatches.map(m => m.kda).reverse();
    const winDurations = recentMatches.filter(m => m.result === "win").map(m => m.duration);
    const lossDurations = recentMatches.filter(m => m.result === "lose").map(m => m.duration);

    // Analyze item builds
    const itemBuilds = analyzeItemBuilds();

    // Matchups - simplified without full match data
    const matchups = {
      bestAllies: [] as MatchupHero[],
      worstEnemies: [] as MatchupHero[],
    };

    const hero: HeroWithStats = {
      heroId: heroIdNum,
      heroName,
      heroIcon: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroNameShort}.png`,
      games: heroStat.games,
      wins: heroStat.win,
      losses: heroStat.games - heroStat.win,
      winrate: heroStat.games > 0 ? Math.round((heroStat.win / heroStat.games) * 1000) / 10 : 0,
      avgKda,
      avgGpm,
      comfortScore,
      lastPlayed: heroStat.last_played,
    };

    const response: HeroDetailResponse = {
      hero,
      recentMatches,
      itemBuilds,
      matchups,
      trends: {
        kdaOverTime,
        winDurations,
        lossDurations,
      },
    };

    // Cache the result
    await cacheSet(cacheKey, response, CACHE_TTL.HEROES);

    return NextResponse.json({
      success: true,
      data: response,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching hero detail:", error);

    const { steamId, heroId } = await params;
    const cacheKey = `player:hero:${steamId}:${heroId}`;
    const cached = await cacheGet<HeroDetailResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        warning: "Using cached data due to API error",
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch hero detail" },
      { status: 500 }
    );
  }
}
