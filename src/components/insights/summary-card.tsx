import type { InsightsSummary } from "@/lib/insight-generator";

interface SummaryCardProps {
  summary: InsightsSummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  const ratingColor =
    summary.overallRating >= 70
      ? "text-green-400"
      : summary.overallRating >= 50
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Your Profile Summary</h2>
        <div className="text-center">
          <div className={`text-4xl font-bold ${ratingColor}`}>
            {summary.overallRating}
          </div>
          <div className="text-xs text-gray-500">Performance Score</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-900/20 rounded-lg p-3 border border-green-900/50">
          <div className="text-xs text-green-400 mb-1">Main Strength</div>
          <div className="font-medium">{summary.mainStrength}</div>
        </div>
        <div className="bg-red-900/20 rounded-lg p-3 border border-red-900/50">
          <div className="text-xs text-red-400 mb-1">Area to Improve</div>
          <div className="font-medium">{summary.mainWeakness}</div>
        </div>
      </div>

      <div className="mt-4 bg-blue-900/20 rounded-lg p-3 border border-blue-900/50">
        <div className="text-xs text-blue-400 mb-1">Quick Tip</div>
        <div className="font-medium">{summary.quickTip}</div>
      </div>
    </div>
  );
}
