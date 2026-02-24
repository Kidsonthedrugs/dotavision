import type { MatchPlayer } from "@/lib/opendota";

// User types
export interface User {
  id: string;
  steamId: string;
  personaName: string;
  avatar: string | null;
  mmrHistory: MmrHistory[] | null;
  settings: UserSettings | null;
  lastSynced: Date | null;
  createdAt: Date;
}

export interface MmrHistory {
  timestamp: number;
  mmr: number;
  change: number;
  matchId: number;
}

export interface UserSettings {
  theme: "dark" | "light";
  notifications: boolean;
  favoriteHeroes: number[];
  trackedPlayers: string[];
}

// Match types
export interface MatchCache {
  id: string;
  matchId: bigint;
  steamId: string;
  heroId: number;
  result: "win" | "lose";
  duration: number;
  kills: number;
  deaths: number;
  assists: number;
  gpm: number;
  xpm: number;
  role: string | null;
  laneOutcome: string | null;
  netWorth: number;
  heroDamage: number;
  towerDamage: number;
  healing: number;
  wardsPlaced: number;
  wardsDenied: number;
  lastHits10: number;
  parsedData: Record<string, unknown> | null;
  playedAt: Date;
  createdAt: Date;
}

export interface MatchWithDetails extends MatchCache {
  hero: Hero;
  opponent: MatchPlayer[];
  teammates: MatchPlayer[];
}

// Hero types
export interface Hero {
  id: number;
  name: string;
  localizedName: string;
  attackType: "melee" | "ranged";
  primaryAttr: "str" | "agi" | "int";
  roles: string[];
  icon: string;
  img: string;
}

export interface HeroStat {
  id: string;
  steamId: string;
  heroId: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  avgKDA: number;
  avgGPM: number;
  avgXPM: number;
  avgDuration: number;
  winStreak: number;
  loseStreak: number;
  comfortScore: number;
  lastPlayed: Date;
}

export interface HeroPerformance {
  hero: Hero;
  stats: HeroStat;
  winRate: number;
  kda: number;
  trend: "up" | "down" | "stable";
  recentMatches: MatchCache[];
}

// Session types
export interface Session {
  id: string;
  steamId: string;
  date: Date;
  matchIds: number[];
  mmrStart: number | null;
  mmrEnd: number | null;
  netMMR: number;
  winCount: number;
  lossCount: number;
  tiltScore: number;
  peakHour: number;
}

export interface SessionSummary {
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  netMMR: number;
  avgMatchDuration: number;
  tiltScore: number;
  peakHour: number;
  bestHero: Hero | null;
  worstHero: Hero | null;
}

// Peer types
export interface Friendship {
  id: string;
  steamId: string;
  friendSteamId: string;
  gamesTogether: number;
  winsTogether: number;
  lossesTogether: number;
  synergyScore: number;
}

export interface Peer {
  steamId: string;
  personaName: string;
  avatar: string;
  gamesTogether: number;
  winsTogether: number;
  lossesTogether: number;
  synergyScore: number;
  lastPlayed: Date;
  commonHeroes: Hero[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Player API types
export interface PlayerProfile {
  accountId: number;
  personaName: string;
  avatar: string;
  avatarFull: string;
  profileUrl: string;
  countryCode: string;
  mmrEstimate: number;
  leaderboardRank: number | null;
  isPlus: boolean;
}

export interface PlayerQuickStats {
  accountId: number;
  mmr: number;
  winRate: number;
  totalGames: number;
  wins: number;
  losses: number;
  avgKDA: number;
  avgGPM: number;
  avgXPM: number;
  currentStreak: number;
  mostPlayedHero: Hero | null;
  bestHero: Hero | null;
  worstHero: Hero | null;
}

// Search types
export interface SearchResult {
  accountId: number;
  personaName: string;
  avatarFull: string;
  lastLogin: Date | null;
  countryCode: string;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: number | string;
}

// Live Status types
export type LiveStatusType = 'in_game' | 'in_queue' | 'online' | 'offline' | 'unknown';

export interface CurrentMatch {
  matchId: string;
  gameMode: string;
  duration: number;
  heroId?: number;
}

export interface LiveStatus {
  isLive: boolean;
  status: LiveStatusType;
  lastMatchEnd?: number;
  minutesSinceLastMatch?: number;
  currentMatch?: CurrentMatch | null;
}
