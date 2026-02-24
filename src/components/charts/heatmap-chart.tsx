"use client";

import { useMemo } from "react";

interface HeatmapData {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  winRate: number;
  games: number;
}

interface PerformanceHeatmapProps {
  data: HeatmapData[];
  isLoading?: boolean;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Color scale based on winrate
function getWinRateColor(winRate: number): string {
  if (winRate >= 70) return "bg-health";
  if (winRate >= 60) return "bg-health/80";
  if (winRate >= 55) return "bg-health/60";
  if (winRate >= 50) return "bg-health/40";
  if (winRate >= 45) return "bg-danger/40";
  if (winRate >= 40) return "bg-danger/60";
  if (winRate >= 30) return "bg-danger/80";
  return "bg-danger";
}

export function PerformanceHeatmap({ data, isLoading }: PerformanceHeatmapProps) {
  const safeData = Array.isArray(data) ? data : [];

  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapData>();
    safeData.forEach((d) => {
      map.set(`${d.day}-${d.hour}`, d);
    });
    return map;
  }, [safeData]);

  const tooltipContent = useMemo(() => {
    const tooltip: Record<string, { wins: number; total: number }> = {};
    safeData.forEach((d) => {
      const key = `${d.day}-${d.hour}`;
      if (!tooltip[key]) {
        tooltip[key] = { wins: 0, total: 0 };
      }
      tooltip[key].wins += Math.round((d.winRate / 100) * d.games);
      tooltip[key].total += d.games;
    });
    return tooltip;
  }, [safeData]);

  if (isLoading) {
    return (
      <div className="w-full h-[200px] bg-background-secondary rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex ml-10 mb-1">
          {HOURS.filter((_, i) => i % 3 === 0).map((hour) => (
            <div
              key={hour}
              className="text-xs text-foreground-muted"
              style={{ width: `${100 / 8}%` }}
            >
              {hour}:00
            </div>
          ))}
        </div>

        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col gap-[2px] pr-2">
            {DAYS.map((day, idx) => (
              <div
                key={day}
                className="text-xs text-foreground-muted h-[18px] flex items-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex-1 flex flex-col gap-[2px]">
            {DAYS.map((_, dayIdx) => (
              <div key={dayIdx} className="flex gap-[2px]">
                {HOURS.map((hour) => {
                  const cellData = dataMap.get(`${dayIdx}-${hour}`);
                  const winRate = cellData?.winRate ?? 0;
                  const games = cellData?.games ?? 0;
                  const tooltip = tooltipContent[`${dayIdx}-${hour}`];

                  return (
                    <div
                      key={`${dayIdx}-${hour}`}
                      className={`flex-1 h-[18px] rounded-sm ${getWinRateColor(
                        winRate
                      )} transition-all hover:ring-1 hover:ring-accent cursor-pointer ${
                        games === 0 ? "opacity-30" : ""
                      }`}
                      title={
                        games > 0
                          ? `${DAYS[dayIdx]} ${hour}:00 - ${winRate.toFixed(1)}% Win Rate (${games} games)`
                          : "No data"
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end mt-3 gap-2">
          <span className="text-xs text-foreground-muted">Win Rate:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-danger rounded-sm" />
            <span className="text-xs text-foreground-muted">{"<"}40%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-danger/50 rounded-sm" />
            <span className="text-xs text-foreground-muted">45%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-foreground-muted/30 rounded-sm" />
            <span className="text-xs text-foreground-muted">50%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-health/50 rounded-sm" />
            <span className="text-xs text-foreground-muted">55%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-health rounded-sm" />
            <span className="text-xs text-foreground-muted">{">"}60%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
