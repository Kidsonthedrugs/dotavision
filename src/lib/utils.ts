import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatKDA(kills: number, deaths: number, assists: number): string {
  return `${kills}/${deaths}/${assists}`;
}

export function calculateKDA(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) return (kills + assists) / 1;
  return Number(((kills + assists) / deaths).toFixed(2));
}

export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return Number(((wins / total) * 100).toFixed(1));
}

export function getTrendColor(current: number, previous: number): "trend-up" | "trend-down" | "trend-neutral" {
  if (current > previous) return "trend-up";
  if (current < previous) return "trend-down";
  return "trend-neutral";
}

export function getTrendArrow(current: number, previous: number): string {
  if (current > previous) return "↑";
  if (current < previous) return "↓";
  return "→";
}

export function getTrendPercentage(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

export function getMMRColor(mmr: number): string {
  if (mmr >= 8000) return "#ff4d4d"; // Immortal
  if (mmr >= 6000) return "#ff6d00"; // Divine
  if (mmr >= 5000) return "#9c27b0"; // Ancient
  if (mmr >= 4000) return "#3f51b5"; // Legend
  if (mmr >= 3000) return "#009688"; // Archon
  if (mmr >= 2000) return "#4caf50"; // Crusader
  if (mmr >= 1000) return "#8bc34a"; // Hero
  return "#795548"; // Herald
}

export function getMMRTier(mmr: number): string {
  if (mmr >= 8000) return "Immortal";
  if (mmr >= 6000) return "Divine";
  if (mmr >= 5000) return "Ancient";
  if (mmr >= 4000) return "Legend";
  if (mmr >= 3000) return "Archon";
  if (mmr >= 2000) return "Crusader";
  if (mmr >= 1000) return "Hero";
  return "Herald";
}

// ===========================================
// Steam ID Conversion Functions
// Using BigInt to avoid precision loss
// Steam64 IDs exceed JavaScript Number precision (53 bits)
// ===========================================

const STEAM_ID_OFFSET = BigInt("76561197960265728");

/**
 * Convert Steam64 (64-bit) to SteamID32 (32-bit)
 * @param steamId64 - The 64-bit Steam ID (e.g., "76561198002496134")
 * @returns The 32-bit Account ID (e.g., "12345678")
 */
export function steamId64To32(steamId64: string | number): number {
  const id = typeof steamId64 === "string" ? BigInt(steamId64) : BigInt(steamId64);
  return Number(id - STEAM_ID_OFFSET);
}

/**
 * Convert SteamID32 (32-bit) to Steam64 (64-bit)
 * @param accountId - The 32-bit Account ID (e.g., "12345678")
 * @returns The 64-bit Steam ID
 */
export function steamId32To64(accountId: string | number): string {
  const id = typeof accountId === "string" ? BigInt(accountId) : BigInt(accountId);
  return (id + STEAM_ID_OFFSET).toString();
}

/**
 * Validate if a string is a valid Steam64 ID
 * @param steamId - The Steam ID to validate
 * @returns true if valid Steam64 format
 */
export function isValidSteam64(steamId: string): boolean {
  const regex = /^7656119[0-9]{10}$/;
  return regex.test(steamId);
}

/**
 * Validate if a string is a valid SteamID32 (Account ID)
 * @param accountId - The Account ID to validate
 * @returns true if valid Account ID format
 */
export function isValidAccountId(accountId: string): boolean {
  const regex = /^[0-9]{1,10}$/;
  return regex.test(accountId);
}

/**
 * Normalize any Steam ID format to 32-bit Account ID
 * Handles both Steam64 and SteamID32 inputs
 * @param steamId - The Steam ID in any format
 * @returns The 32-bit Account ID
 */
export function normalizeToAccountId(steamId: string): number {
  // If it's already a valid 32-bit Account ID
  if (isValidAccountId(steamId)) {
    return parseInt(steamId, 10);
  }
  
  // If it's a Steam64 ID
  if (isValidSteam64(steamId)) {
    return steamId64To32(steamId);
  }
  
  throw new Error(`Invalid Steam ID format: ${steamId}`);
}
