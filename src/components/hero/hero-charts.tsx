"use client";

import { 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

interface HeroChartsProps {
  hero: {
    heroId: number;
    heroName: string;
    heroIcon: string;
    games: number;
    wins: number;
    losses: number;
    winrate: number;
  };
  recentMatches: Array<{
    matchId: number;
    result: "win" | "lose";
    duration: number;
    kills: number;
    deaths: number;
    assists: number;
    kda: number;
  }>;
  trends: {
    kdaOverTime: number[];
    winDurations: number[];
    lossDurations: number[];
  };
}

const COLORS = ["#22C55E", "#EF4444"];

export function HeroWinChart({ hero }: { hero: HeroChartsProps["hero"] }) {
  const data = [
    { name: "Wins", value: hero.wins },
    { name: "Losses", value: hero.losses },
  ];

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ 
              backgroundColor: "#1E293B", 
              border: "1px solid #334155",
              borderRadius: "8px"
            }}
            itemStyle={{ color: "#F8FAFC" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HeroKdaTrendChart({ kdaOverTime }: { kdaOverTime: number[] }) {
  const data = kdaOverTime.map((kda, index) => ({
    game: index + 1,
    kda,
  }));

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="game" 
            stroke="#94A3B8"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#94A3B8"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: "#1E293B", 
              border: "1px solid #334155",
              borderRadius: "8px"
            }}
            itemStyle={{ color: "#F8FAFC" }}
          />
          <Line 
            type="monotone" 
            dataKey="kda" 
            stroke="#3B82F6" 
            strokeWidth={2}
            dot={{ fill: "#3B82F6", strokeWidth: 0, r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HeroDurationChart({ winDurations, lossDurations }: { 
  winDurations: number[]; 
  lossDurations: number[] 
}) {
  // Create duration buckets (in minutes)
  const buckets = [20, 25, 30, 35, 40, 45, 50, 55, 60];
  
  const winData = buckets.map((max, i) => {
    const min = i === 0 ? 0 : buckets[i - 1];
    const count = winDurations.filter(d => d >= min && d < max).length;
    return { range: `${min}-${max}`, count, type: "Win" };
  });
  
  const lossData = buckets.map((max, i) => {
    const min = i === 0 ? 0 : buckets[i - 1];
    const count = lossDurations.filter(d => d >= min && d < max).length;
    return { range: `${min}-${max}`, count, type: "Loss" };
  });

  const data = buckets.map((_, i) => ({
    range: winData[i].range,
    wins: winData[i].count,
    losses: lossData[i].count,
  }));

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="range" 
            stroke="#94A3B8"
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            stroke="#94A3B8"
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: "#1E293B", 
              border: "1px solid #334155",
              borderRadius: "8px"
            }}
            itemStyle={{ color: "#F8FAFC" }}
          />
          <Bar dataKey="wins" fill="#22C55E" name="Wins" />
          <Bar dataKey="losses" fill="#EF4444" name="Losses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
