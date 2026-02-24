"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { MmrHistory } from "@/types";
import { getMMRColor, getMMRTier } from "@/lib/utils";

interface MMRGraphProps {
  data: MmrHistory[];
  timeRange: "30" | "90" | "365";
  onTimeRangeChange: (range: "30" | "90" | "365") => void;
  isLoading?: boolean;
}

export function MMRGraph({
  data,
  timeRange,
  onTimeRangeChange,
  isLoading,
}: MMRGraphProps) {
  const { processedData, peakMMR, lowestMMR, currentMMR, trend } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        processedData: [],
        peakMMR: 0,
        lowestMMR: 0,
        currentMMR: 0,
        trend: "stable" as const,
      };
    }

    const now = Date.now();
    const days = parseInt(timeRange);
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    const filtered = data
      .filter((d) => d.timestamp >= cutoff)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Add current point if needed
    const mmrs = filtered.map((d) => d.mmr);
    const peak = Math.max(...mmrs);
    const lowest = Math.min(...mmrs);
    const current = mmrs[mmrs.length - 1];
    const first = mmrs[0];

    // Determine trend
    let trendValue: "up" | "down" | "stable" = "stable";
    if (current > first + 50) trendValue = "up";
    else if (current < first - 50) trendValue = "down";

    // Format data for chart
    const chartData = filtered.map((d) => ({
      date: new Date(d.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      mmr: d.mmr,
      change: d.change,
    }));

    return {
      processedData: chartData,
      peakMMR: peak,
      lowestMMR: lowest,
      currentMMR: current,
      trend: trendValue,
    };
  }, [data, timeRange]);

  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendColor =
    trend === "up"
      ? "text-health"
      : trend === "down"
        ? "text-danger"
        : "text-foreground-muted";

  if (isLoading) {
    return (
      <div className="w-full h-[300px] bg-background-secondary rounded-lg animate-pulse" />
    );
  }

  return (
    <div className="w-full">
      {/* Header Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-foreground-muted">Current MMR</p>
            <p className="text-2xl font-bold" style={{ color: getMMRColor(currentMMR) }}>
              {currentMMR.toLocaleString()}
              <span className={`ml-2 text-sm ${trendColor}`}>{trendIcon}</span>
            </p>
            <p className="text-xs text-foreground-muted">{getMMRTier(currentMMR)}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">Peak (Last {timeRange}d)</p>
            <p className="text-lg font-semibold text-accent">{peakMMR.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-foreground-muted">Lowest</p>
            <p className="text-lg font-semibold text-foreground-muted">{lowestMMR.toLocaleString()}</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 bg-background-tertiary rounded-lg p-1">
          {(["30", "90", "365"] as const).map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                timeRange === range
                  ? "bg-accent text-background font-medium"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {range}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
            <XAxis
              dataKey="date"
              stroke="#8b949e"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#8b949e"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={["dataMin - 200", "dataMax + 200"]}
              tickFormatter={(value: number) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "8px",
                color: "#e6edf3",
              }}
              formatter={(value) => [value ? Number(value).toLocaleString() : "0", "MMR"]}
              labelStyle={{ color: "#8b949e" }}
            />
            <Line
              type="monotone"
              dataKey="mmr"
              stroke="#c8aa6e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: "#c8aa6e" }}
            />
            <ReferenceLine y={currentMMR} stroke="#63f263" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
