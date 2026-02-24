"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LiveStatus, LiveStatusType } from "@/types";

interface LiveStatusProps {
  steamId: string;
  compact?: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: LiveStatus;
  error?: string;
  cached?: boolean;
}

// Status configuration
const statusConfig: Record<LiveStatusType, { color: string; label: string; pulse: boolean }> = {
  in_game: { color: "bg-green-500", label: "In Game", pulse: true },
  in_queue: { color: "bg-yellow-500", label: "In Queue", pulse: true },
  online: { color: "bg-green-500", label: "Online", pulse: false },
  offline: { color: "bg-gray-500", label: "Offline", pulse: false },
  unknown: { color: "bg-gray-500", label: "Unknown", pulse: false },
};

// Format duration from seconds to mm:ss
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Format time since last match
function formatTimeSince(minutes: number): string {
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}h ${mins}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Compact status indicator component
function CompactStatus({ status }: { status: LiveStatusType }) {
  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "relative flex h-2.5 w-2.5",
          config.pulse && "animate-pulse"
        )}
      >
        <span
          className={cn(
            "absolute inline-flex h-full w-full rounded-full opacity-75",
            config.color,
            config.pulse && "animate-ping"
          )}
        />
        <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", config.color)} />
      </span>
      <span className="text-sm text-[var(--color-foreground-muted)]">{config.label}</span>
    </div>
  );
}

// Loading skeleton for compact mode
function CompactSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-card-border)] animate-pulse" />
      <span className="h-4 w-16 bg-[var(--color-card-border)] rounded animate-pulse" />
    </div>
  );
}

// Loading skeleton for full mode
function FullSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[var(--color-card-border)] animate-pulse" />
          <span className="h-5 w-20 bg-[var(--color-card-border)] rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 w-32 bg-[var(--color-card-border)] rounded animate-pulse" />
          <div className="h-4 w-24 bg-[var(--color-card-border)] rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

// Error display component
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
      <span className="text-sm text-[var(--color-danger)]">{message}</span>
      <button
        onClick={onRetry}
        className="text-xs text-[var(--color-accent)] hover:underline"
      >
        Retry
      </button>
    </div>
  );
}

// Full mode card component
function FullStatusCard({ status }: { status: LiveStatus }) {
  const config = statusConfig[status.status];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "relative flex h-3 w-3",
                config.pulse && "animate-pulse"
              )}
            >
              {config.pulse && (
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full rounded-full opacity-75",
                    config.color,
                    "animate-ping"
                  )}
                />
              )}
              <span className={cn("relative inline-flex h-3 w-3 rounded-full", config.color)} />
            </span>
            <CardTitle className="text-lg">{config.label}</CardTitle>
          </div>
          {status.isLive ? (
            <Badge variant="success">LIVE</Badge>
          ) : status.status === "online" ? (
            <Badge variant="secondary">Active</Badge>
          ) : (
            <Badge variant="outline">Offline</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Current match info if live */}
          {status.currentMatch && status.isLive && (
            <div className="rounded-lg bg-[var(--color-background-tertiary)] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Match</span>
                <span className="text-xs text-[var(--color-foreground-muted)]">
                  {formatDuration(status.currentMatch.duration)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-foreground-muted)]">
                <span>{status.currentMatch.gameMode}</span>
                <span>•</span>
                <span>Match #{status.currentMatch.matchId}</span>
              </div>
              {status.currentMatch.heroId && (
                <div className="text-xs text-[var(--color-foreground-muted)]">
                  Hero ID: {status.currentMatch.heroId}
                </div>
              )}
            </div>
          )}

          {/* Last match info */}
          {status.minutesSinceLastMatch !== undefined && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-foreground-muted)]">Last Activity</span>
              <span>{formatTimeSince(status.minutesSinceLastMatch)}</span>
            </div>
          )}

          {/* Status details */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--color-foreground-muted)]">Status</span>
            <div className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full", config.color)} />
              <span>{config.label}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LiveStatus({ steamId, compact = false }: LiveStatusProps) {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/player/${steamId}/live`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setStatus(data.data);
      } else {
        setError(data.error || "Failed to fetch status");
      }
    } catch (err) {
      setError("Network error");
      console.error("Error fetching live status:", err);
    } finally {
      setLoading(false);
    }
  }, [steamId]);

  useEffect(() => {
    // Initial fetch
    fetchStatus();

    // Poll every 60 seconds
    const interval = setInterval(() => {
      fetchStatus();
    }, 60000);

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Loading state
  if (loading) {
    return compact ? <CompactSkeleton /> : <FullSkeleton />;
  }

  // Error state
  if (error || !status) {
    return compact ? (
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-500" />
        <span className="text-sm text-[var(--color-foreground-muted)]">Unavailable</span>
      </div>
    ) : (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <span className="text-sm text-[var(--color-danger)]">{error || "Failed to load status"}</span>
            <button
              onClick={fetchStatus}
              className="text-xs text-[var(--color-accent)] hover:underline"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render based on compact mode
  if (compact) {
    return <CompactStatus status={status.status} />;
  }

  return <FullStatusCard status={status} />;
}

export default LiveStatus;
