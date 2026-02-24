import type { InsightCategory, ConfidenceLevel } from "@/lib/insight-generator";

interface Insight {
  category: InsightCategory;
  title: string;
  description: string;
  metric?: string;
  action?: string;
  confidence: ConfidenceLevel;
  dataPoints: string[];
}

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  const categoryStyles: Record<
    InsightCategory,
    {
      bg: string;
      border: string;
      icon: string;
      iconColor: string;
    }
  > = {
    strength: {
      bg: "bg-green-900/30",
      border: "border-green-500/50",
      icon: "💪",
      iconColor: "text-green-400",
    },
    weakness: {
      bg: "bg-red-900/30",
      border: "border-red-500/50",
      icon: "⚠️",
      iconColor: "text-red-400",
    },
    tip: {
      bg: "bg-blue-900/30",
      border: "border-blue-500/50",
      icon: "💡",
      iconColor: "text-blue-400",
    },
    warning: {
      bg: "bg-yellow-900/30",
      border: "border-yellow-500/50",
      icon: "🚨",
      iconColor: "text-yellow-400",
    },
  };

  const confidenceColors: Record<ConfidenceLevel, string> = {
    high: "bg-green-500/20 text-green-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-gray-500/20 text-gray-400",
  };

  const style = categoryStyles[insight.category];

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{style.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">{insight.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded ${confidenceColors[insight.confidence]}`}
            >
              {insight.confidence}
            </span>
          </div>
          {insight.metric && (
            <span className="text-sm font-mono bg-gray-800 px-2 py-1 rounded inline-block mt-2">
              {insight.metric}
            </span>
          )}
          <p className="text-gray-300 mt-2">{insight.description}</p>
          {insight.action && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-500">Action:</span>
              <span className={style.iconColor}>{insight.action}</span>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {insight.dataPoints.map((point, i) => (
              <span
                key={i}
                className="text-xs bg-gray-800/50 px-2 py-1 rounded text-gray-400"
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
