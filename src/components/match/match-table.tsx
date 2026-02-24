"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MatchCache, Hero } from "@/types";
import { formatDuration, formatKDA, formatNumber, calculateWinRate } from "@/lib/utils";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface MatchTableProps {
  matches: Array<MatchCache & { hero?: Hero }>;
  isLoading?: boolean;
  onSelectMatch?: (matchId: bigint) => void;
  selectedMatches?: bigint[];
}

type SortKey = "playedAt" | "heroId" | "duration" | "kills" | "deaths" | "assists" | "gpm" | "xpm" | "netWorth";
type SortDirection = "asc" | "desc";

interface FilterState {
  heroId?: number;
  result?: "win" | "lose";
  role?: string;
  lobbyType?: number;
  minDuration?: number;
  dateRange?: { start: Date; end: Date };
}

interface BulkStats {
  count: number;
  wins: number;
  losses: number;
  winrate: number;
  avgKDA: string;
  avgGPM: number;
  avgXPM: number;
  avgDuration: number;
  avgNetWorth: number;
}

export function MatchTable({
  matches,
  isLoading,
  onSelectMatch,
  selectedMatches: externalSelectedMatches,
}: MatchTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("playedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filters, setFilters] = useState<FilterState>({});
  
  // FIX 4: Add internal state for bulk selection if not provided externally
  const [internalSelected, setInternalSelected] = useState<string[]>([]);
  const [showBulkAnalysis, setShowBulkAnalysis] = useState(false);
  
  // Use external state if provided, otherwise use internal
  const selectedMatches = externalSelectedMatches 
    ? externalSelectedMatches.map(String) 
    : internalSelected;
    
  const setSelectedMatches = (fn: (prev: string[]) => string[]) => {
    if (!externalSelectedMatches) {
      setInternalSelected(fn);
    }
  };

  const sortedAndFilteredMatches = useMemo(() => {
    let result = [...matches];

    // Apply filters
    if (filters.heroId) {
      result = result.filter((m) => m.heroId === filters.heroId);
    }
    if (filters.result) {
      result = result.filter((m) => m.result === filters.result);
    }
    if (filters.role) {
      result = result.filter((m) => m.role === filters.role);
    }
    if (filters.minDuration) {
      result = result.filter((m) => m.duration >= filters.minDuration!);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const direction = sortDirection === "asc" ? 1 : -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * direction;
      }
      return 0;
    });

    return result;
  }, [matches, sortKey, sortDirection, filters]);

  // FIX 4: Calculate bulk stats
  const bulkStats: BulkStats | null = useMemo(() => {
    const selected = sortedAndFilteredMatches.filter(m => 
      selectedMatches.includes(m.matchId.toString())
    );
    
    if (selected.length === 0) return null;
    
    const wins = selected.filter(m => m.result === "win").length;
    const totalKills = selected.reduce((sum, m) => sum + m.kills, 0);
    const totalDeaths = selected.reduce((sum, m) => sum + m.deaths, 0);
    const totalAssists = selected.reduce((sum, m) => sum + m.assists, 0);
    const totalGPM = selected.reduce((sum, m) => sum + m.gpm, 0);
    const totalXPM = selected.reduce((sum, m) => sum + m.xpm, 0);
    const totalDuration = selected.reduce((sum, m) => sum + m.duration, 0);
    const totalNetWorth = selected.reduce((sum, m) => sum + m.netWorth, 0);
    
    return {
      count: selected.length,
      wins,
      losses: selected.length - wins,
      winrate: (wins / selected.length) * 100,
      avgKDA: ((totalKills + totalAssists) / Math.max(1, totalDeaths)).toFixed(2),
      avgGPM: Math.round(totalGPM / selected.length),
      avgXPM: Math.round(totalXPM / selected.length),
      avgDuration: Math.round(totalDuration / selected.length),
      avgNetWorth: Math.round(totalNetWorth / selected.length),
    };
  }, [sortedAndFilteredMatches, selectedMatches]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // FIX 4: Handle checkbox toggle
  const handleCheckboxChange = (matchId: string, checked: boolean) => {
    setSelectedMatches(prev => 
      checked 
        ? [...prev, matchId] 
        : prev.filter(id => id !== matchId)
    );
  };

  // FIX 4: Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMatches(() => sortedAndFilteredMatches.map(m => m.matchId.toString()));
    } else {
      setSelectedMatches(() => []);
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null;
    return (
      <span className="ml-1">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Hero</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Result</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">KDA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">GPM/XPM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Lane</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Net Worth</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={9} className="px-4 py-4">
                    <div className="h-6 bg-background-tertiary rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-card-border flex flex-wrap gap-3">
          <select
            className="px-3 py-2 bg-background-tertiary border border-card-border rounded-lg text-sm text-foreground"
            value={filters.result || ""}
            onChange={(e) => setFilters({ ...filters, result: e.target.value as "win" | "lose" | undefined })}
          >
            <option value="">All Results</option>
            <option value="win">Wins</option>
            <option value="lose">Losses</option>
          </select>

          <select
            className="px-3 py-2 bg-background-tertiary border border-card-border rounded-lg text-sm text-foreground"
            value={filters.role || ""}
            onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined })}
          >
            <option value="">All Roles</option>
            <option value="carry">Carry</option>
            <option value="mid">Mid</option>
            <option value="offlane">Offlane</option>
            <option value="soft_support">Soft Support</option>
            <option value="hard_support">Hard Support</option>
          </select>

          <select
            className="px-3 py-2 bg-background-tertiary border border-card-border rounded-lg text-sm text-foreground"
            value={filters.lobbyType?.toString() || ""}
            onChange={(e) => setFilters({ ...filters, lobbyType: e.target.value ? parseInt(e.target.value) : undefined })}
          >
            <option value="">All Lobbies</option>
            <option value="7">Ranked</option>
            <option value="0">Unranked</option>
            <option value="23">Turbo</option>
          </select>

          <select
            className="px-3 py-2 bg-background-tertiary border border-card-border rounded-lg text-sm text-foreground"
            value={filters.minDuration?.toString() || ""}
            onChange={(e) => setFilters({ ...filters, minDuration: e.target.value ? parseInt(e.target.value) : undefined })}
          >
            <option value="">Any Duration</option>
            <option value="900">15+ min</option>
            <option value="1200">20+ min</option>
            <option value="1800">30+ min</option>
          </select>

          {selectedMatches.length > 0 && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-foreground-muted">
                {selectedMatches.length} selected
              </span>
              <button 
                onClick={() => setShowBulkAnalysis(!showBulkAnalysis)}
                className="px-3 py-2 bg-accent text-background rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                {showBulkAnalysis ? "Hide" : "Analyze"} ({selectedMatches.length})
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-2 py-3 w-8">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedMatches.length === sortedAndFilteredMatches.length && sortedAndFilteredMatches.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("heroId")}
                >
                  Hero <SortIcon column="heroId" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Result
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("kills")}
                >
                  KDA <SortIcon column="kills" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("gpm")}
                >
                  GPM/XPM <SortIcon column="gpm" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("duration")}
                >
                  Duration <SortIcon column="duration" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider">
                  Lane
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("netWorth")}
                >
                  Net Worth <SortIcon column="netWorth" />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-foreground-muted uppercase tracking-wider cursor-pointer hover:text-foreground"
                  onClick={() => handleSort("playedAt")}
                >
                  Date <SortIcon column="playedAt" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {sortedAndFilteredMatches.map((match) => {
                const isWin = match.result === "win";
                const isSelected = selectedMatches.includes(match.matchId.toString());

                return (
                  <motion.tr
                    key={match.matchId.toString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-background-secondary/50 cursor-pointer ${
                      isSelected ? "bg-accent/10" : ""
                    }`}
                    onClick={() => onSelectMatch?.(match.matchId)}
                  >
                    <td className="px-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleCheckboxChange(match.matchId.toString(), e.target.checked)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/matches/${match.matchId}`}
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-8 h-8 rounded bg-background-tertiary overflow-hidden">
                          {match.hero && (
                            <img
                              src={`https://cdn.cloudflare.steamstatic.com${match.hero.img}`}
                              alt={match.hero.localizedName}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <span className="text-sm text-foreground">
                          {match.hero?.localizedName || "Unknown"}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-sm font-medium ${
                          isWin ? "text-health" : "text-danger"
                        }`}
                      >
                        {isWin ? "Win" : "Loss"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">
                        {formatKDA(match.kills, match.deaths, match.assists)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">
                        {match.gpm}/{match.xpm}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">
                        {formatDuration(match.duration)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground-muted">
                        {match.role || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground-muted">
                        {match.laneOutcome || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-accent">
                        {formatNumber(match.netWorth)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground-muted">
                        {new Date(match.playedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedAndFilteredMatches.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-foreground-muted">No matches found</p>
          </div>
        )}
      </div>

      {/* FIX 4: Bulk Analysis Card */}
      {showBulkAnalysis && bulkStats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="bg-card border-card-border">
            <CardHeader>
              <CardTitle>Bulk Analysis ({bulkStats.count} matches)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-foreground-muted">Win Rate</p>
                  <p className={`text-2xl font-bold ${
                    bulkStats.winrate >= 50 ? "text-health" : "text-danger"
                  }`}>
                    {bulkStats.winrate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {bulkStats.wins}W / {bulkStats.losses}L
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Avg KDA</p>
                  <p className="text-2xl font-bold text-foreground">
                    {bulkStats.avgKDA}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Avg GPM/XPM</p>
                  <p className="text-2xl font-bold text-foreground">
                    {bulkStats.avgGPM}/{bulkStats.avgXPM}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted">Avg Duration</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatDuration(bulkStats.avgDuration)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
