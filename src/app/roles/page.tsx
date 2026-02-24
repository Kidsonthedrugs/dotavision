"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleChart } from "@/components/roles/role-chart";
import { RoleStatsTable } from "@/components/roles/role-stats-table";
import { RoleRecommendation } from "@/components/roles/role-recommendation";
import { VersatilityGauge } from "@/components/roles/versatility-gauge";

interface RoleDistribution {
  role: number;
  roleName: string;
  games: number;
  wins: number;
}

interface RoleStats {
  role: number;
  roleName: string;
  games: number;
  wins: number;
  winrate: number;
  avgKda: number;
  avgGpm: number;
  impactScore: number;
}

interface BestRole {
  role: number;
  roleName: string;
  winrate: number;
  games: number;
}

interface RolesResponse {
  distribution: RoleDistribution[];
  perRoleStats: RoleStats[];
  bestRole: BestRole | null;
  versatilityScore: number;
  unknownCount: number;
  parsedCount: number;
  totalCount: number;
  unknownNote: string;
}

function RolesContent() {
  const searchParams = useSearchParams();
  const steamId = searchParams.get("id") || "86745912";
  
  const [data, setData] = useState<RolesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      try {
        setLoading(true);
        const response = await fetch(`/api/player/${steamId}/roles`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to fetch roles");
        }
      } catch (err) {
        setError("Failed to fetch roles");
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [steamId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="h-64 bg-slate-700 rounded animate-pulse" />
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="h-64 bg-slate-700 rounded animate-pulse" />
            </CardContent>
          </Card>
        </div>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="h-48 bg-slate-700 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <p className="text-red-400">{error}</p>
          <p className="text-gray-400 mt-2">Try again later or check the Steam ID.</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.distribution.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">No role data available</p>
          <p className="text-gray-500 text-sm mt-2">Play more matches to see role statistics</p>
        </CardContent>
      </Card>
    );
  }

  const totalGames = data.distribution.reduce((sum, d) => sum + d.games, 0);
  const displayTotal = data.parsedCount > 0 ? data.parsedCount : totalGames;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Roles & Positioning</h1>

      {/* Data Limitation Notice */}
      {data.unknownCount > 0 && (
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-blue-200 font-medium">
                Role analysis based on {data.parsedCount} parsed matches out of {data.totalCount} total
              </p>
              <p className="text-blue-300/70 text-sm mt-1">
                {data.unknownCount} matches couldn't be analyzed because they lack detailed lane data. 
                Only ~10% of matches are fully parsed by OpenDota.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Row: Chart & Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-white">
              Role Distribution ({displayTotal} analyzed games)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RoleChart distribution={data.distribution} />
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <RoleRecommendation bestRole={data.bestRole} />
          <VersatilityGauge score={data.versatilityScore} />
        </div>
      </div>

      {/* Stats Table */}
      <RoleStatsTable stats={data.perRoleStats} />
    </div>
  );
}

export default function RolesPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <RolesContent />
      </Suspense>
    </div>
  );
}
