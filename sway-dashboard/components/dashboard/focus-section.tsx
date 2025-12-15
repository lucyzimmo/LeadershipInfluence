"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionableInsight } from "@/lib/types";

interface FocusSectionProps {
  insights: ActionableInsight[];
}

const priorityColors = {
  1: "border-l-4 border-l-red-500 bg-red-50",
  2: "border-l-4 border-l-orange-500 bg-orange-50",
  3: "border-l-4 border-l-blue-500 bg-blue-50",
};

const impactBadgeColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-orange-100 text-orange-800",
  low: "bg-blue-100 text-blue-800",
};

export function FocusSection({ insights }: FocusSectionProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">🎯 This Week's Focus</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg ${priorityColors[insight.priority]}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">
                    {insight.priority}. {insight.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      impactBadgeColors[insight.impact]
                    }`}
                  >
                    {insight.impact} impact
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {insight.description}
                </p>
                <p className="text-sm text-gray-600 mt-1">{insight.metric}</p>
                <div className="mt-2 text-sm font-medium text-gray-900">
                  → {insight.action}
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
