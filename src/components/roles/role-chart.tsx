"use client";

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from "recharts";
import { getRoleColor, getRoleLabel } from "@/lib/role-detection";

interface RoleDistribution {
  role: number;
  roleName: string;
  games: number;
  wins: number;
}

interface RoleChartProps {
  distribution: RoleDistribution[];
}

export function RoleChart({ distribution }: RoleChartProps) {
  const data = distribution.map(d => ({
    name: getRoleLabel(d.role),
    value: d.games,
    color: getRoleColor(d.role),
  }));

  return (
    <div className="h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            labelLine={true}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ 
              backgroundColor: "#1E293B", 
              border: "1px solid #334155",
              borderRadius: "8px"
            }}
            itemStyle={{ color: "#F8FAFC" }}
            formatter={(value) => [`${value} games`, "Games"]}
          />
          <Legend 
            formatter={(value) => <span className="text-gray-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
