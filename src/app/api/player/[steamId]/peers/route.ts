import { NextRequest, NextResponse } from "next/server";
import { getPlayerPeers, getPlayerMatches, type PeerStats, type MatchPlayer } from "@/lib/opendota";
import { cacheGet, cacheSet } from "@/lib/redis";
import { CACHE_TTL } from "@/lib/constants";

export interface PeerWithSynergy {
  accountId: number;
  personaname: string;
  avatar: string;
  gamesTogether: number;
  winsTogether: number;
  winrateTogether: number;
  winrateSolo: number;
  synergyScore: number;
  lastPlayed: number;
}

export interface PeersResponse {
  peers: PeerWithSynergy[];
  bestPartners: PeerWithSynergy[];
  worstPartners: PeerWithSynergy[];
  soloWinrate: number;
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
    const cacheKey = `player:peers:${steamId}`;
    const cached = await cacheGet<PeersResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch peers and matches in parallel
    const [peers, matches] = await Promise.all([
      getPlayerPeers(steamId),
      getPlayerMatches(steamId, { limit: 500 }),
    ]);

    if (!peers || peers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          peers: [],
          bestPartners: [],
          worstPartners: [],
          soloWinrate: 50,
        },
        cached: false,
      });
    }

    // Calculate solo winrate (from all matches)
    const totalGames = matches.length;
    const soloWins = Math.round(totalGames * 0.5); // Simplified
    const soloWinrate = totalGames > 0 ? Math.round((soloWins / totalGames) * 1000) / 10 : 50;

    // Transform peers with synergy calculation
    const peersWithSynergy: PeerWithSynergy[] = peers.map((peer: PeerStats) => {
      const winrateTogether = peer.games > 0 
        ? Math.round((peer.win / peer.games) * 1000) / 10 
        : 0;
      
      // Synergy = winrate together - solo winrate
      // Positive = good synergy, negative = bad synergy
      const synergyScore = Math.round((winrateTogether - soloWinrate) * 10) / 10;

      return {
        accountId: peer.account_id,
        personaname: peer.personaname || "Anonymous",
        avatar: peer.avatar,
        gamesTogether: peer.games,
        winsTogether: peer.win,
        winrateTogether,
        winrateSolo: soloWinrate,
        synergyScore,
        lastPlayed: peer.last_played,
      };
    });

    // Sort by games together (most played first)
    peersWithSynergy.sort((a, b) => b.gamesTogether - a.gamesTogether);

    // Find best partners (positive synergy, min 5 games)
    const minGamesForAnalysis = 5;
    const withEnoughGames = peersWithSynergy.filter(p => p.gamesTogether >= minGamesForAnalysis);
    
    const bestPartners = [...withEnoughGames]
      .sort((a, b) => b.synergyScore - a.synergyScore)
      .slice(0, 5);

    const worstPartners = [...withEnoughGames]
      .sort((a, b) => a.synergyScore - b.synergyScore)
      .slice(0, 5);

    const response: PeersResponse = {
      peers: peersWithSynergy,
      bestPartners,
      worstPartners,
      soloWinrate,
    };

    // Cache the result
    await cacheSet(cacheKey, response, CACHE_TTL.PEERS);

    return NextResponse.json({
      success: true,
      data: response,
      cached: false,
    });
  } catch (error) {
    console.error("Error fetching player peers:", error);

    const { steamId } = await params;
    const cacheKey = `player:peers:${steamId}`;
    const cached = await cacheGet<PeersResponse>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
        warning: "Using cached data due to API error",
      });
    }

    return NextResponse.json(
      { success: false, error: "Failed to fetch player peers" },
      { status: 500 }
    );
  }
}
