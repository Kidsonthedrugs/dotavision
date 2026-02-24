import { NextRequest, NextResponse } from "next/server";
import { getPlayerHeroes, getPlayerMatches, getHeroes, type HeroStats, type MatchPlayer } from "@/lib/opendota";
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

export interface HeroesResponse {
  heroes: HeroWithStats[];
  mostPlayed: HeroWithStats | null;
  bestWinrate: HeroWithStats | null;
  mostComfortable: HeroWithStats | null;
}

// Cache key for heroes data
const HEROES_DATA_KEY = "heroes:data:all";

async function getHeroesData() {
  // Try cache first
  const cached = await cacheGet<Array<{
    id: number;
    name: string;
    localized_name: string;
    icon: string;
  }>>(HEROES_DATA_KEY);
  
  if (cached) {
    return cached;
  }

  // Fetch from OpenDota
  const heroes = await getHeroes();
  
  const heroesWithIcons = heroes.map(h => ({
    id: h.id,
    name: h.name,
    localized_name: h.localized_name,
    icon: `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${h.name}.png`,
  }));

  // Cache for 24 hours
  await cacheSet(HEROES_DATA_KEY, heroesWithIcons, CACHE_TTL.HEROES_DATA);
  
  return heroesWithIcons;
}

function getHeroName(heroId: number, heroesData: Array<{ id: number; name: string; localized_name: string; icon: string }>): { name: string; icon: string } {
  const hero = heroesData.find(h => h.id === heroId);
  if (hero) {
    return {
      name: hero.localized_name,
      icon: hero.icon,
    };
  }
  return {
    name: `Hero ${heroId}`,
    icon: "",
  };
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
    const cacheKey = `player:heroes:${steamId}`;
    const cached = await cacheGet<HeroesResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch hero stats and matches in parallel
    const [heroStats, matches, heroesData] = await Promise.all([
      getPlayerHeroes(steamId),
      getPlayerMatches(steamId, { limit: 500 }), // Get recent matches for calculations
      getHeroesData(),
    ]);

    if (!heroStats || heroStats.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          heroes: [],
          mostPlayed: null,
          bestWinrate: null,
          mostComfortable: null,
        },
        cached: false,
      });
    }

    // Transform hero stats with all calculations
    const heroes: HeroWithStats[] = heroStats.map((hs: HeroStats) => {
      const heroInfo = getHeroName(hs.hero_id, heroesData);
      const comfortScore = calculateComfortScore(hs, matches);
      const avgKda = calculateAvgKDA(hs, matches);
      const avgGpm = calculateAvgGPM(hs, matches);

      return {
        heroId: hs.hero_id,
        heroName: heroInfo.name,
        heroIcon: heroInfo.icon,
        games: hs.games,
        wins: hs.win,
        losses: hs.games - hs.win,
        winrate: hs.games > 0 ? Math.round((hs.win / hs.games) * 1000) / 10 : 0,
        avgKda: Math.round(avgKda * 100) / 100,
        avgGpm,
        comfortScore,
        lastPlayed: hs.last_played,
      };
    });

    // Sort by games played
    heroes.sort((a, b) => b.games - a.games);

    // Find most played
    const mostPlayed = heroes.length > 0 ? heroes[0] : null;

    // Find best winrate (min 5 games)
    const withEnoughGames = heroes.filter(h => h.games >= 5);
    const bestWinrate = withEnoughGames.length > 0
      ? withEnoughGames.reduce((best, current) => 
          current.winrate > best.winrate ? current : best
        )
      : null;

    // Find most comfortable
    const mostComfortable = heroes.length > 0
      ? heroes.reduce((best, current) => 
          current.comfortScore > best.comfortScore ? current : best
        )
      : null;

    const response: HeroesResponse = {
      heroes,
      mostPlayed,
      bestWinrate,
      mostComfortable,
    };

    // Cache the result
    await cacheSet(cacheKey, response, CACHE_TTL.HEROES);

    return NextResponse.json({
      success: true,
      data: response,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching player heroes:", error);

    const { steamId } = await params;
    const cacheKey = `player:heroes:${steamId}`;
    const cached = await cacheGet<HeroesResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        warning: "Using cached data due to API error",
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch player heroes" },
      { status: 500 }
    );
  }
}
