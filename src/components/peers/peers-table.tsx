"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Peer {
  accountId: number;
  personaname: string;
  avatar: string;
  gamesTogether: number;
  winsTogether: number;
  winrateTogether: number;
  winrateSolo: number;
  synergyScore: number;
  lastPlayed: number;
}

interface PeersTableProps {
  peers: Peer[];
}

type SortField = "gamesTogether" | "winrateTogether" | "synergyScore";
type SortOrder = "asc" | "desc";

export function PeersTable({ peers }: PeersTableProps) {
  const [sortField, setSortField] = useState<SortField>("gamesTogether");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedPeers = [...peers].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    const order = sortOrder === "asc" ? 1 : -1;
    return (aVal - bVal) * order;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span className="ml-1">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Party Analysis</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-2 text-gray-400 font-medium text-sm">Player</th>
              <th 
                className="text-right py-3 px-2 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                onClick={() => handleSort("gamesTogether")}
              >
                Games <SortIcon field="gamesTogether" />
              </th>
              <th 
                className="text-right py-3 px-2 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                onClick={() => handleSort("winrateTogether")}
              >
                Party WR <SortIcon field="winrateTogether" />
              </th>
              <th 
                className="text-right py-3 px-2 text-gray-400 font-medium text-sm cursor-pointer hover:text-white"
                onClick={() => handleSort("synergyScore")}
              >
                Synergy <SortIcon field="synergyScore" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPeers.slice(0, 20).map((peer) => {
              const synergyColor = peer.synergyScore > 5 ? "text-green-500" :
                                 peer.synergyScore > 0 ? "text-yellow-500" :
                                 "text-red-500";
              
              return (
                <tr 
                  key={peer.accountId} 
                  className="border-b border-slate-700/50 hover:bg-slate-700/30"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                        {peer.avatar && (
                          <img 
                            src={peer.avatar}
                            alt={peer.personaname}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <span className="text-white text-sm font-medium">
                        {peer.personaname}
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-white">
                    {peer.gamesTogether}
                  </td>
                  <td className={`text-right py-3 px-2 font-medium`}>
                    {peer.winrateTogether}%
                  </td>
                  <td className={`text-right py-3 px-2 font-medium ${synergyColor}`}>
                    {peer.synergyScore > 0 ? "+" : ""}{peer.synergyScore}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {peers.length === 0 && (
          <p className="text-center text-gray-500 py-4">
            No party data available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
