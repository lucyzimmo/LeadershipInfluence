"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardModel } from "@/lib/types";

interface OverviewCardsProps {
  summary: DashboardModel["summary"];
}

export function OverviewCards({ summary }: OverviewCardsProps) {
  const cards = [
    {
      title: "Verified Voters",
      value: summary.verifiedVoters.toLocaleString(),
      subtitle: `${Math.round(summary.verificationRate)}% verification rate`,
      trend: summary.verificationRate > 80 ? "positive" : "neutral",
    },
    {
      title: "Verification Rate",
      value: `${Math.round(summary.verificationRate)}%`,
      subtitle: "of supporters verified",
      trend: summary.verificationRate > 85 ? "positive" : "neutral",
    },
    {
      title: "Derivative Leaders",
      value: summary.derivativeLeaders.toString(),
      subtitle: "supporters who became leaders",
      trend: summary.derivativeLeaders > 0 ? "positive" : "neutral",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{card.value}</div>
            <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
