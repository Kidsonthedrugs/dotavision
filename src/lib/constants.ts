// OpenDota API Configuration
export const OPEN_DOTA_API_BASE_URL = "https://api.opendota.com/api";

// Rate limiting: 60 requests per minute for free tier
export const OPEN_DOTA_RATE_LIMIT = 60;
export const OPEN_DOTA_RATE_WINDOW = 60000; // 1 minute in ms

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  PLAYER: 300, // 5 minutes
  MATCHES: 120, // 2 minutes
  HEROES: 600, // 10 minutes
  PEERS: 300, // 5 minutes
  PROS: 3600, // 1 hour
  HEROES_DATA: 86400, // 24 hours
} as const;

// Redis key prefixes
export const REDIS_KEYS = {
  PLAYER: "player:",
  PLAYER_MATCHES: "player:matches:",
  PLAYER_HEROES: "player:heroes:",
  PLAYER_PEERS: "player:peers:",
  HEROES_DATA: "heroes:data:",
  PROS: "pros:",
  SEARCH: "search:",
} as const;

// Dota 2 roles
export const DOTA_ROLES = [
  { id: 1, name: "Safe Lane Carry" },
  { id: 2, name: "Mid Lane" },
  { id: 3, name: "Off Lane" },
  { id: 4, name: "Soft Support" },
  { id: 5, name: "Hard Support" },
] as const;

// Lane outcomes
export const LANE_OUTCOMES = [
  { id: "win", name: "Won Lane" },
  { id: "lose", name: "Lost Lane" },
  { id: "draw", name: "Drawn Lane" },
] as const;

// Match game modes
export const GAME_MODES = [
  { id: 1, name: "All Pick" },
  { id: 2, name: "Captains Mode" },
  { id: 3, name: "Random Draft" },
  { id: 4, name: "Single Draft" },
  { id: 5, name: "All Random" },
  { id: 12, name: "Captains Draft" },
  { id: 22, name: "Ranked All Pick" },
] as const;

// API endpoints
export const API_ENDPOINTS = {
  PLAYER: "/api/player",
  PLAYER_MATCHES: "/api/player/matches",
  PLAYER_HEROES: "/api/player/heroes",
  PLAYER_PEERS: "/api/player/peers",
  AUTH_STEAM: "/api/auth/steam",
  AUTH_LOGOUT: "/api/auth/logout",
} as const;

// Navigation items
export const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { id: "insights", label: "Insights", href: "/insights", icon: "Lightbulb" },
  { id: "matches", label: "Matches", href: "/matches", icon: "Gamepad2" },
  { id: "heroes", label: "Heroes", href: "/heroes", icon: "Shield" },
  { id: "roles", label: "Roles", href: "/roles", icon: "Target" },
  { id: "peers", label: "Peers", href: "/peers", icon: "Users" },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: "BarChart3" },
] as const;

// Hero attributes
export const ATTRIBUTE_COLORS = {
  str: "#f24c4c",
  agi: "#63f263",
  int: "#5b9bf5",
} as const;

// Steam OpenID configuration
export const STEAM_OPENID = {
  URL: "https://steamcommunity.com/openid/login",
  REALM: process.env.STEAM_OPENID_REalm || "http://localhost:3000",
  RETURN_URL: process.env.STEAM_RETURN_URL || "http://localhost:3000/api/auth/steam",
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// UI Constants
export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
