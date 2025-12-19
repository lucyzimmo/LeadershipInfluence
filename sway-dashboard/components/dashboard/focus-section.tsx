"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";
import type { ActionableInsight } from "@/lib/types";

interface FocusSectionProps {
  insights: ActionableInsight[];
}

export function FocusSection({ insights }: FocusSectionProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl border-zinc-200 shadow-sm">
      <CardContent className="p-7">
        <div className="mb-5">
          <div className="pt-5 text-lg font-bold text-zinc-900">This week's focus</div>
          <div className="text-base text-zinc-600 mt-1">Top actions to grow deployable influence</div>
        </div>

        <div className="space-y-3">
          {insights.slice(0, 3).map((insight, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-white border border-blue-200 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Priority Number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold text-zinc-900 mb-1">
                    {insight.title}
                  </div>
                  <div className="text-sm text-zinc-600 mb-3">
                    {insight.description}
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <div className="text-sm font-medium text-blue-900">
                      {insight.action}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    {insight.metric}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
