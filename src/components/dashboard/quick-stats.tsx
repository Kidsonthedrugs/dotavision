"use client";

import { motion } from "framer-motion";
import { Hero, PlayerQuickStats } from "@/types";
import { getMMRColor, getMMRTier, calculateWinRate, formatNumber } from "@/lib/utils";

interface QuickStatsProps {
  stats: PlayerQuickStats | null;
  isLoading?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: string;
  icon?: React.ReactNode;
}

function StatCard({
  label,
  value,
  subValue,
  trend,
  trendValue,
  color,
  icon,
}: StatCardProps) {
  const trendColors = {
    up: "text-health",
    down: "text-danger",
    neutral: "text-foreground-muted",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className="bg-card border border-card-border rounded-xl p-4 transition-all hover:border-accent/50"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-foreground-muted mb-1">{label}</p>
          <p className="text-2xl font-bold" style={{ color }}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-foreground-muted mt-1">{subValue}</p>
          )}
        </div>
        {icon && <div className="text-accent opacity-50">{icon}</div>}
      </div>
      {trend && trendValue && (
        <div className={`text-xs mt-2 ${trendColors[trend]}`}>
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
        </div>
      )}
    </motion.div>
  );
}

export function QuickStats({ stats, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-card border border-card-border rounded-xl p-4 animate-pulse"
          >
            <div className="h-4 w-20 bg-background-tertiary rounded mb-2" />
            <div className="h-8 w-24 bg-background-tertiary rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Current MMR" value="--" subValue="No data" />
        <StatCard label="Overall Winrate" value="--" subValue="No matches" />
        <StatCard label="Best Hero" value="--" subValue="Play more games" />
        <StatCard label="Avg KDA" value="--" subValue="No data" />
      </div>
    );
  }

  const winRate = calculateWinRate(stats.wins, stats.totalGames);

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Current MMR */}
      <StatCard
        label="Current MMR"
        value={(stats.mmr ?? 0).toLocaleString()}
        subValue={getMMRTier(stats.mmr)}
        color={getMMRColor(stats.mmr)}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path
              fillRule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
              clipRule="evenodd"
            />
          </svg>
        }
      />

      {/* Overall Winrate */}
      <StatCard
        label="Overall Winrate"
        value={`${winRate}%`}
        subValue={`${stats.wins}W / ${stats.losses}L`}
        color={winRate >= 50 ? "var(--health)" : "var(--danger)"}
        trend={stats.currentStreak > 0 ? "up" : stats.currentStreak < 0 ? "down" : "neutral"}
        trendValue={
          stats.currentStreak > 0
            ? `${stats.currentStreak} win streak`
            : stats.currentStreak < 0
              ? `${Math.abs(stats.currentStreak)} loss streak`
              : undefined
        }
      />

      {/* Best Hero */}
      <StatCard
        label="Best Hero"
        value={stats.bestHero?.localizedName || "N/A"}
        subValue={
          stats.bestHero
            ? `${stats.wins} games min.`
            : "Min. 10 games"
        }
        color="var(--accent)"
      />

      {/* Avg KDA */}
      <StatCard
        label="Avg KDA"
        value={stats.avgKDA.toFixed(1)}
        subValue={`${stats.avgGPM} GPM | ${stats.avgXPM} XPM`}
        color="var(--mana)"
      />
    </div>
  );
}
