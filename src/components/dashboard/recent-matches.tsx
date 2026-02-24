"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { MatchCache, Hero } from "@/types";
import { formatDuration, formatKDA, calculateWinRate } from "@/lib/utils";

interface RecentMatchesProps {
  matches: Array<MatchCache & { hero?: Hero }>;
  isLoading?: boolean;
}

export function RecentMatches({ matches, isLoading }: RecentMatchesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="min-w-[260px] h-[140px] bg-card border border-card-border rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6">
        <p className="text-foreground-muted">No recent matches found</p>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Navigation buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-card border border-card-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -ml-2 hover:bg-accent hover:text-background"
      >
        ←
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-card border border-card-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -mr-2 hover:bg-accent hover:text-background"
      >
        →
      </button>

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {matches.map((match, index) => {
          const isWin = match.result === "win";
          const timeAgo = getTimeAgo(match.playedAt);

          return (
            <motion.div
              key={match.matchId.toString()}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              className="min-w-[260px] bg-card border border-card-border rounded-xl p-4 cursor-pointer hover:border-accent/50 transition-colors"
            >
              {/* Hero and Result */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-background-tertiary flex items-center justify-center overflow-hidden">
                    {match.hero ? (
                      <img
                        src={`https://cdn.cloudflare.steamstatic.com${match.hero.img}`}
                        alt={match.hero.localizedName}
                        className="w-10 h-10 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-background-tertiary rounded" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {match.hero?.localizedName || "Unknown Hero"}
                    </p>
                    <p className="text-xs text-foreground-muted">{match.role || "Unknown"}</p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    isWin
                      ? "bg-health/20 text-health"
                      : "bg-danger/20 text-danger"
                  }`}
                >
                  {isWin ? "WIN" : "LOSS"}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-foreground-muted">KDA</span>
                  <p className="font-medium text-foreground">
                    {formatKDA(match.kills, match.deaths, match.assists)}
                  </p>
                </div>
                <div>
                  <span className="text-foreground-muted">Duration</span>
                  <p className="font-medium text-foreground">
                    {formatDuration(match.duration)}
                  </p>
                </div>
                <div>
                  <span className="text-foreground-muted">Net Worth</span>
                  <p className="font-medium text-accent">
                    {(match.netWorth ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Time ago */}
              <div className="mt-3 pt-3 border-t border-card-border">
                <p className="text-xs text-foreground-muted">{timeAgo}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
