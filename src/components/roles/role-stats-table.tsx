"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoleColor, getRoleLabel } from "@/lib/role-detection";

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

interface RoleStatsTableProps {
  stats: RoleStats[];
}

export function RoleStatsTable({ stats }: RoleStatsTableProps) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Per-Role Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-2 px-2 text-gray-400 font-medium text-sm">Role</th>
              <th className="text-right py-2 px-2 text-gray-400 font-medium text-sm">Games</th>
              <th className="text-right py-2 px-2 text-gray-400 font-medium text-sm">Winrate</th>
              <th className="text-right py-2 px-2 text-gray-400 font-medium text-sm">Avg KDA</th>
              <th className="text-right py-2 px-2 text-gray-400 font-medium text-sm">Avg GPM</th>
              <th className="text-right py-2 px-2 text-gray-400 font-medium text-sm">Impact</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => {
              const winrateColor = stat.winrate >= 55 ? "text-green-500" : 
                                 stat.winrate >= 45 ? "text-yellow-500" : 
                                 "text-red-500";
              
              return (
                <tr 
                  key={stat.role} 
                  className="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getRoleColor(stat.role) }}
                      />
                      <span className="text-white font-medium">
                        {getRoleLabel(stat.role)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-white">
                    {stat.games}
                  </td>
                  <td className={`text-right py-3 px-2 font-medium ${winrateColor}`}>
                    {stat.winrate}%
                  </td>
                  <td className="text-right py-3 px-2 text-white">
                    {stat.avgKda.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-2 text-white">
                    {stat.avgGpm}
                  </td>
                  <td className="text-right py-3 px-2">
                    <span className="text-blue-400 font-medium">
                      {stat.impactScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {stats.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No role data available yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
