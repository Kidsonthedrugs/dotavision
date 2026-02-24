"use client";

import { motion } from "framer-motion";
import { SessionSummary } from "@/types";
import { formatDuration, calculateWinRate } from "@/lib/utils";

interface SessionCardProps {
  session: SessionSummary | null;
  isLoading?: boolean;
}

export function SessionCard({ session, isLoading }: SessionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6 animate-pulse">
        <div className="h-6 w-32 bg-background-tertiary rounded mb-4" />
        <div className="flex gap-8">
          <div className="h-16 w-24 bg-background-tertiary rounded" />
          <div className="h-16 w-24 bg-background-tertiary rounded" />
          <div className="h-16 w-24 bg-background-tertiary rounded" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Today's Session</h3>
        <p className="text-foreground-muted">No matches played today</p>
      </div>
    );
  }

  const winRate = calculateWinRate(session.wins, session.totalMatches);
  const isWinning = session.netMMR > 0;
  const isLosing = session.netMMR < 0;
  const isTilted = session.tiltScore >= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-xl p-6 border transition-all hover:scale-[1.01] ${
        isWinning
          ? "bg-gradient-to-br from-health/10 to-card border-health/30"
          : isLosing
            ? "bg-gradient-to-br from-danger/10 to-card border-danger/30"
            : "bg-card border-card-border"
      }`}
    >
      {/* Background glow effect */}
      {(isWinning || isLosing) && (
        <div
          className={`absolute inset-0 opacity-5 ${
            isWinning ? "bg-health" : "bg-danger"
          }`}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Today's Session</h3>
          {isTilted && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 text-xs font-medium bg-danger/20 text-danger rounded-full flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3 h-3"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z"
                  clipRule="evenodd"
                />
              </svg>
              Tilt Warning
            </motion.span>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4">
          {/* Games Played */}
          <div>
            <p className="text-sm text-foreground-muted">Games</p>
            <p className="text-2xl font-bold text-foreground">{session.totalMatches}</p>
          </div>

          {/* Win/Loss */}
          <div>
            <p className="text-sm text-foreground-muted">W / L</p>
            <p className="text-2xl font-bold">
              <span className="text-health">{session.wins}</span>
              <span className="text-foreground-muted mx-1">/</span>
              <span className="text-danger">{session.losses}</span>
            </p>
          </div>

          {/* Win Rate */}
          <div>
            <p className="text-sm text-foreground-muted">Win Rate</p>
            <p
              className={`text-2xl font-bold ${
                winRate >= 50 ? "text-health" : "text-danger"
              }`}
            >
              {winRate}%
            </p>
          </div>

          {/* Net MMR */}
          <div>
            <p className="text-sm text-foreground-muted">Net MMR</p>
            <motion.p
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`text-2xl font-bold ${
                isWinning
                  ? "text-health"
                  : isLosing
                    ? "text-danger"
                    : "text-foreground-muted"
              }`}
            >
              {session.netMMR > 0 ? "+" : ""}
              {session.netMMR}
            </motion.p>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-4 pt-4 border-t border-card-border flex items-center justify-between text-sm">
          <span className="text-foreground-muted">
            Avg Duration: {formatDuration(session.avgMatchDuration)}
          </span>
          <span className="text-foreground-muted">
            Peak Hour: {session.peakHour}:00
          </span>
        </div>
      </div>
    </motion.div>
  );
}
