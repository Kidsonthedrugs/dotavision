"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleColor, getRoleLabel } from "@/lib/role-detection";

interface BestRole {
  role: number;
  roleName: string;
  winrate: number;
  games: number;
}

interface RoleRecommendationProps {
  bestRole: BestRole | null;
}

export function RoleRecommendation({ bestRole }: RoleRecommendationProps) {
  if (!bestRole) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white">Role Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400 text-center py-4">
            Not enough data to provide a recommendation
          </p>
        </CardContent>
      </Card>
    );
  }

  const roleColor = getRoleColor(bestRole.role);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Recommended Role</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${roleColor}20`, border: `2px solid ${roleColor}` }}
          >
            <span className="text-2xl font-bold" style={{ color: roleColor }}>
              {getRoleLabel(bestRole.role)}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {bestRole.roleName}
            </h3>
            <p className="text-gray-400">
              {bestRole.games} games played
            </p>
            <p className="text-green-500 font-medium">
              {bestRole.winrate}% winrate
            </p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
          <p className="text-sm text-gray-300">
            Based on your performance, <strong>{bestRole.roleName}</strong> appears to be 
            your strongest role with a <strong>{bestRole.winrate}%</strong> winrate 
            across <strong>{bestRole.games}</strong> games.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
