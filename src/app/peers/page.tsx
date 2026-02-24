"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PeersTable } from "@/components/peers/peers-table";
import { PartnerCard } from "@/components/peers/partner-card";
import { SynergyInsight } from "@/components/peers/synergy-insight";

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

interface PeersResponse {
  peers: Peer[];
  bestPartners: Peer[];
  worstPartners: Peer[];
  soloWinrate: number;
}

function PeersContent() {
  const searchParams = useSearchParams();
  const steamId = searchParams.get("id") || "86745912";
  
  const [data, setData] = useState<PeersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [minGames, setMinGames] = useState(3);

  useEffect(() => {
    async function fetchPeers() {
      try {
        setLoading(true);
        const response = await fetch(`/api/player/${steamId}/peers`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Failed to fetch peers");
        }
      } catch (err) {
        setError("Failed to fetch peers");
      } finally {
        setLoading(false);
      }
    }

    fetchPeers();
  }, [steamId]);

  const filteredPeers = data?.peers.filter(peer => {
    const matchesSearch = peer.personaname.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGames = peer.gamesTogether >= minGames;
    return matchesSearch && matchesGames;
  }) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="h-32 bg-slate-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="h-64 bg-slate-700 rounded animate-pulse" />
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

  if (!data || data.peers.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">No party data available</p>
          <p className="text-gray-500 text-sm mt-2">Play with friends to see party statistics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Peers & Party</h1>

      {/* Top Row: Partner Cards & Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PartnerCard partners={data.bestPartners} type="best" />
        <PartnerCard partners={data.worstPartners} type="worst" />
        <SynergyInsight 
          bestPartners={data.bestPartners}
          worstPartners={data.worstPartners}
          soloWinrate={data.soloWinrate}
          totalPartners={data.peers.length}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Input
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white w-full sm:w-64"
        />
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Min Games:</span>
          <Input
            type="number"
            min={1}
            max={100}
            value={minGames}
            onChange={(e) => setMinGames(parseInt(e.target.value) || 1)}
            className="bg-slate-800 border-slate-700 text-white w-20"
          />
        </div>
        <span className="text-gray-400 text-sm ml-auto">
          {filteredPeers.length} players found
        </span>
      </div>

      {/* Peers Table */}
      {filteredPeers.length > 0 ? (
        <PeersTable peers={filteredPeers} />
      ) : (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">No players match your filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function PeersPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <PeersContent />
      </Suspense>
    </div>
  );
}
