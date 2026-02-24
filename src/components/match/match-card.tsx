"use client";

import { motion } from "framer-motion";
import { MatchCache, Hero } from "@/types";
import { formatDuration, formatKDA, formatNumber } from "@/lib/utils";
import Link from "next/link";

interface MatchCardProps {
  match: MatchCache & { hero?: Hero };
  compact?: boolean;
}

export function MatchCard({ match, compact = false }: MatchCardProps) {
  const isWin = match.result === "win";

  if (compact) {
    return (
      <Link href={`/matches/${match.matchId}`}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
            isWin
              ? "bg-health/5 border-health/20 hover:border-health/40"
              : "bg-danger/5 border-danger/20 hover:border-danger/40"
          }`}
        >
          <div className="w-10 h-10 rounded bg-background-tertiary overflow-hidden">
            {match.hero && (
              <img
                src={`https://cdn.cloudflare.steamstatic.com${match.hero.img}`}
                alt={match.hero.localizedName}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {match.hero?.localizedName || "Unknown"}
            </p>
            <p className="text-xs text-foreground-muted">
              {formatKDA(match.kills, match.deaths, match.assists)}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${
              isWin ? "text-health" : "text-danger"
            }`}
          >
            {isWin ? "W" : "L"}
          </span>
        </motion.div>
      </Link>
    );
  }

  return (
    <Link href={`/matches/${match.matchId}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className={`bg-card border rounded-xl p-4 cursor-pointer hover:border-accent/50 transition-all ${
          isWin ? "border-health/20" : "border-danger/20"
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Hero */}
          <div className="w-16 h-16 rounded-lg bg-background-tertiary overflow-hidden shrink-0">
            {match.hero && (
              <img
                src={`https://cdn.cloudflare.steamstatic.com${match.hero.img}`}
                alt={match.hero.localizedName}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {match.hero?.localizedName || "Unknown Hero"}
                </p>
                <p className="text-sm text-foreground-muted">
                  {match.role || "Unknown Role"} • {match.laneOutcome || "Unknown Lane"}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                    isWin
                      ? "bg-health/20 text-health"
                      : "bg-danger/20 text-danger"
                  }`}
                >
                  {isWin ? "VICTORY" : "DEFEAT"}
                </span>
                <p className="text-xs text-foreground-muted mt-1">
                  {formatDuration(match.duration)}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-xs text-foreground-muted">KDA</p>
                <p className="font-medium text-foreground">
                  {formatKDA(match.kills, match.deaths, match.assists)}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">GPM/XPM</p>
                <p className="font-medium text-foreground">
                  {match.gpm}/{match.xpm}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Net Worth</p>
                <p className="font-medium text-accent">
                  {formatNumber(match.netWorth)}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Hero Dmg</p>
                <p className="font-medium text-foreground">
                  {formatNumber(match.heroDamage)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
