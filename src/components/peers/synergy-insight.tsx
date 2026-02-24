"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SynergyInsightProps {
  bestPartners: Array<{
    personaname: string;
    gamesTogether: number;
    synergyScore: number;
  }>;
  worstPartners: Array<{
    personaname: string;
    gamesTogether: number;
    synergyScore: number;
  }>;
  soloWinrate: number;
  totalPartners: number;
}

export function SynergyInsight({ 
  bestPartners, 
  worstPartners, 
  soloWinrate,
  totalPartners 
}: SynergyInsightProps) {
  // Generate insight text
  let insightText = "";
  
  if (bestPartners.length > 0 && bestPartners[0].synergyScore > 5) {
    const best = bestPartners[0];
    insightText = `Your best synergy is with ${best.personaname}, where you win ${best.synergyScore}% more games than your solo queue winrate. You've played ${best.gamesTogether} games together.`;
  } else if (worstPartners.length > 0 && worstPartners[0].synergyScore < -5) {
    const worst = worstPartners[0];
    insightText = `You tend to struggle when queuing with ${worst.personaname}, winning ${Math.abs(worst.synergyScore)}% fewer games. Consider playing solo or with different partners.`;
  } else if (totalPartners > 10) {
    insightText = `You have a diverse party history with ${totalPartners} different players. Your performance is relatively consistent regardless of who you queue with.`;
  } else {
    insightText = `Play more games with friends to discover your best party compositions!`;
  }

  // Calculate average synergy
  const allSynergies = [...bestPartners, ...worstPartners];
  const avgSynergy = allSynergies.length > 0
    ? allSynergies.reduce((sum, p) => sum + p.synergyScore, 0) / allSynergies.length
    : 0;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Party Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-700/50 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{totalPartners}</p>
            <p className="text-sm text-gray-400">Total Partners</p>
          </div>
          <div className="p-3 bg-slate-700/50 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{soloWinrate}%</p>
            <p className="text-sm text-gray-400">Solo Winrate</p>
          </div>
        </div>
        
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-300 text-sm">
            <span className="font-medium">Insight:</span> {insightText}
          </p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Avg Party Synergy</span>
          <span className={avgSynergy > 0 ? "text-green-500" : "text-red-500"}>
            {avgSynergy > 0 ? "+" : ""}{avgSynergy.toFixed(1)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
