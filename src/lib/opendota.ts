import { OPEN_DOTA_API_BASE_URL, OPEN_DOTA_RATE_LIMIT, OPEN_DOTA_RATE_WINDOW } from "./constants";

// Rate limiter state
let requestCount = 0;
let windowStart = Date.now();

// Type definitions
export interface PlayerProfile {
  account_id: number;
  personaname: string;
  name: string;
  plus: boolean;
  cheese: number;
  steamid: string;
  avatar: string;
  avatarfull: string;
  profileurl: string;
  last_login: string;
  loccountrycode: string;
  status: string;
  mmr_estimate: {
    estimate: number;
    stdDev: number;
    n: number;
  };
  leaderboard_rank: number | null;
}

export interface MatchPlayer {
  match_id: number;
  player_slot: number;
  account_id: number | null;
  hero_id: number;
  gold_per_min: number;
  xp_per_min: number;
  kills: number;
  deaths: number;
  assists: number;
  hero_damage: number;
  tower_damage: number;
  hero_healing: number;
  last_hits: number;
  denies: number;
  lane: number | null;
  lane_role: number | null;
  is_roaming: boolean | null;
  role: number | null;
  net_worth: number;
  game_mode: number;
  duration: number;
  start_time: number;
  radiant_win: boolean;
}

export interface Match {
  match_id: number;
  players: MatchPlayer[];
  radiant_win: boolean;
  duration: number;
  start_time: number;
  game_mode: number;
  lobby_type: number;
}

export interface HeroStats {
  hero_id: number;
  last_played: number;
  games: number;
  win: number;
  with_games: number;
  with_win: number;
  against_games: number;
  against_win: number;
}

export interface PeerStats {
  account_id: number;
  personaname: string;
  avatar: string;
  last_played: number;
  games: number;
  win: number;
}

export interface ProPlayer {
  account_id: number;
  personaname: string;
  avatar: string;
  profileurl: string;
  country_code: string;
  fantasy_role: number;
  team_name: string;
  team_tag: string;
  is_pro: boolean;
}

// Rate limiter function
async function rateLimit() {
  const now = Date.now();
  if (now - windowStart > OPEN_DOTA_RATE_WINDOW) {
    requestCount = 0;
    windowStart = now;
  }

  if (requestCount >= OPEN_DOTA_RATE_LIMIT) {
    const waitTime = OPEN_DOTA_RATE_WINDOW - (now - windowStart);
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      requestCount = 0;
      windowStart = Date.now();
    }
  }

  requestCount++;
}

// Generic fetch function with rate limiting
async function fetchWithRateLimit<T>(endpoint: string): Promise<T> {
  await rateLimit();

  const url = `${OPEN_DOTA_API_BASE_URL}${endpoint}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenDota API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Player API
export async function getPlayerProfile(steamId: string): Promise<PlayerProfile> {
  return fetchWithRateLimit<PlayerProfile>(`/players/${steamId}`);
}

export async function getPlayerMatches(
  steamId: string,
  options?: {
    limit?: number;
    offset?: number;
    heroId?: number;
    project?: string[]; // Fields to include in response
  }
): Promise<MatchPlayer[]> {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", options.limit.toString());
  if (options?.offset) params.set("offset", options.offset.toString());
  if (options?.heroId) params.set("hero_id", options.heroId.toString());
  if (options?.project && options.project.length > 0) {
    params.set("project", options.project.join(","));
  }

  const queryString = params.toString();
  const endpoint = `/players/${steamId}/matches${queryString ? `?${queryString}` : ""}`;

  return fetchWithRateLimit<MatchPlayer[]>(endpoint);
}

export async function getPlayerHeroes(steamId: string): Promise<HeroStats[]> {
  return fetchWithRateLimit<HeroStats[]>(`/players/${steamId}/heroes`);
}

export async function getPlayerPeers(steamId: string): Promise<PeerStats[]> {
  return fetchWithRateLimit<PeerStats[]>(`/players/${steamId}/peers`);
}

export async function getPlayerWordCloud(steamId: string): Promise<{
  my_word_counts: Array<{ word: string; count: number }>;
  all_word_counts: Array<{ word: string; count: number }>;
}> {
  return fetchWithRateLimit(`/players/${steamId}/wordcloud`);
}

export async function getPlayerRecentMatches(steamId: string): Promise<MatchPlayer[]> {
  return fetchWithRateLimit<MatchPlayer[]>(`/players/${steamId}/recentMatches`);
}

// Live games API for pro players
export interface LiveGame {
  players: Array<{
    account_id: number;
    player_slot: number;
    hero_id: number;
    team?: number;
  }>;
  radiant_team?: {
    team_name: string;
    team_tag: string;
  };
  dire_team?: {
    team_name: string;
    team_tag: string;
  };
  leagueid: number;
  league_name: string;
  start_time: number;
  radiant_score: number;
  dire_score: number;
  game_mode: number;
  average_rank: number;
  lobby_type: number;
}

export async function getLiveGames(): Promise<LiveGame[]> {
  return fetchWithRateLimit<LiveGame[]>("/live");
}

export async function isProPlayer(steamId: string): Promise<boolean> {
  try {
    const proPlayers = await getProPlayers();
    return proPlayers.some(p => p.account_id === Number(steamId));
  } catch {
    return false;
  }
}

// Match API
export async function getMatch(matchId: string): Promise<Match> {
  return fetchWithRateLimit<Match>(`/matches/${matchId}`);
}

// Heroes API
export async function getHeroes(): Promise<
  Array<{
    id: number;
    name: string;
    localized_name: string;
    attack_type: string;
    primary_attr: string;
    roles: string[];
    legs: number;
  }>
> {
  return fetchWithRateLimit("/heroes");
}

export async function getHeroStats(): Promise<
  Array<{
    id: number;
    name: string;
    localized_name: string;
    primary_attr: string;
    attack_type: string;
    roles: string[];
    img: string;
    icon: string;
    base_health: number;
    base_mana: number;
    base_armor: number;
    base_attack_min: number;
    base_attack_max: number;
    base_str: number;
    base_agi: number;
    base_int: number;
    str_gain: number;
    agi_gain: number;
    int_gain: number;
    move_rate: number;
    turn_rate: number;
    cm_enabled: number;
    legs: number;
  }>
> {
  return fetchWithRateLimit("/heroStats");
}

// Pro players API
export async function getProPlayers(): Promise<ProPlayer[]> {
  return fetchWithRateLimit<ProPlayer[]>("/proPlayers");
}

// Search API
export async function searchPlayers(searchTerm: string): Promise<
  Array<{
    account_id: number;
    personaname: string;
    avatarfull: string;
    last_login: string;
    loccountrycode: string;
  }>
> {
  return fetchWithRateLimit(`/search?term=${encodeURIComponent(searchTerm)}`);
}
