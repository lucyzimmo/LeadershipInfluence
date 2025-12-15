"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { ActionableInsight } from "@/lib/types";

interface FocusSectionProps {
  insights: ActionableInsight[];
}

const impactBadgeColors = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function FocusSection({ insights }: FocusSectionProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-sm font-medium text-zinc-900">This week's focus</div>
            <div className="text-sm text-zinc-500">Top actions to grow deployable influence</div>
          </div>
        </div>

        <div className="mt-4 divide-y divide-zinc-100">
          {insights.slice(0, 3).map((insight, index) => (
            <div key={index} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-zinc-900">{insight.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded border ${impactBadgeColors[insight.impact]}`}>
                    {insight.impact === 'high' ? 'HIGH LEVERAGE' : insight.impact === 'medium' ? 'MEANINGFUL' : 'LOW'}
                  </span>
                </div>
                <div className="mt-1 text-sm text-zinc-600 line-clamp-1">
                  {insight.description} • {insight.metric}
                </div>
              </div>

              <button className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">
                {insight.action.split(' ').slice(0, 2).join(' ')}
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
