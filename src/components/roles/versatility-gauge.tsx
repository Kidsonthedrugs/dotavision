"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VersatilityGaugeProps {
  score: number;
}

function getVersatilityLabel(score: number): string {
  if (score >= 80) return "Highly Versatile";
  if (score >= 60) return "Versatile";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Specialist";
  return "One-Trick";
}

function getVersatilityColor(score: number): string {
  if (score >= 80) return "#22C55E"; // Green
  if (score >= 60) return "#3B82F6"; // Blue
  if (score >= 40) return "#F59E0B"; // Orange
  if (score >= 20) return "#EF4444"; // Red
  return "#6B7280"; // Gray
}

export function VersatilityGauge({ score }: VersatilityGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  const color = getVersatilityColor(animatedScore);
  const label = getVersatilityLabel(animatedScore);

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white">Versatility Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-16 overflow-hidden">
            {/* Background arc */}
            <div 
              className="absolute w-32 h-32 rounded-full border-8 border-slate-700"
              style={{ 
                borderRadius: "50%",
                borderBottomColor: "transparent",
                borderLeftColor: "transparent",
                transform: "rotate(225deg)",
              }}
            />
            {/* Progress arc */}
            <div 
              className="absolute w-32 h-32 rounded-full border-8"
              style={{ 
                borderRadius: "50%",
                borderBottomColor: "transparent",
                borderLeftColor: "transparent",
                borderTopColor: color,
                borderRightColor: color,
                transform: `rotate(225deg)`,
                transition: "transform 1s ease-out",
                clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)",
              }}
            />
            {/* Score display */}
            <div className="absolute inset-0 flex items-end justify-center pb-2">
              <span className="text-3xl font-bold" style={{ color }}>
                {Math.round(animatedScore)}
              </span>
            </div>
          </div>
          <p className="text-gray-400 mt-2">{label}</p>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Based on Shannon entropy of role distribution
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
