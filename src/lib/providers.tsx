"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime)
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Query keys for consistent cache management
export const queryKeys = {
  // Player queries
  player: (steamId: string) => ["player", steamId] as const,
  playerMatches: (steamId: string, page?: number) =>
    ["player", "matches", steamId, page] as const,
  playerHeroes: (steamId: string) => ["player", "heroes", steamId] as const,
  playerPeers: (steamId: string) => ["player", "peers", steamId] as const,
  playerRecent: (steamId: string) => ["player", "recent", steamId] as const,
  playerWordCloud: (steamId: string) =>
    ["player", "wordcloud", steamId] as const,

  // Match queries
  match: (matchId: string) => ["match", matchId] as const,

  // Heroes queries
  heroes: () => ["heroes"] as const,
  heroStats: (heroId: number) => ["hero", "stats", heroId] as const,

  // Pro queries
  proPlayers: () => ["pro", "players"] as const,

  // Search queries
  search: (term: string) => ["search", term] as const,

  // Session queries
  sessions: (steamId: string) => ["sessions", steamId] as const,

  // Friendship queries
  friendships: (steamId: string) => ["friendships", steamId] as const,
} as const;

// Prefetch helpers
export const prefetchQueries = {
  player: async (queryClient: QueryClient, steamId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.player(steamId),
      queryFn: async () => {
        const response = await fetch(`/api/player/${steamId}`);
        if (!response.ok) throw new Error("Failed to fetch player");
        return response.json();
      },
    });
  },
};
