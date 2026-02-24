"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Partner {
  accountId: number;
  personaname: string;
  avatar: string;
  gamesTogether: number;
  winsTogether: number;
  winrateTogether: number;
  synergyScore: number;
}

interface PartnerCardProps {
  partners: Partner[];
  type: "best" | "worst";
}

export function PartnerCard({ partners, type }: PartnerCardProps) {
  const isBest = type === "best";
  const title = isBest ? "Best Partners" : "Worst Partners";
  const colorClass = isBest ? "text-green-400" : "text-red-400";
  const synergyPrefix = isBest ? "+" : "";

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className={`text-lg ${colorClass}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {partners.length > 0 ? (
          partners.map((partner) => (
            <div 
              key={partner.accountId}
              className="flex items-center justify-between p-2 rounded hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                  {partner.avatar && (
                    <img 
                      src={partner.avatar}
                      alt={partner.personaname}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {partner.personaname}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {partner.gamesTogether} games
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${colorClass}`}>
                  {synergyPrefix}{partner.synergyScore}%
                </p>
                <p className="text-gray-500 text-xs">
                  {partner.winrateTogether}% WR
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">
            No partner data available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
