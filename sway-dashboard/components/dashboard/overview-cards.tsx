"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Users } from "lucide-react";
import type { DashboardModel } from "@/lib/types";

interface OverviewCardsProps {
  summary: DashboardModel["summary"];
}

export function OverviewCards({ summary }: OverviewCardsProps) {
  // Calculate total supporters across all topics
  const totalSupporters = summary.topicSupporterCounts
    ? Object.values(summary.topicSupporterCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  const cards = [
    {
      title: "Verified voters",
      value: summary.verifiedVoters.toLocaleString(),
      subtitle: `${Math.round(summary.verificationRate)}% of supporters`,
      delta: null,
      icon: CheckCircle2,
    },
    {
      title: "Total supporters",
      value: totalSupporters.toLocaleString(),
      subtitle: "Across all topics (unverified)",
      delta: null,
      icon: Users,
    },
    {
      title: "Verification rate",
      value: `${Math.round(summary.verificationRate)}%`,
      subtitle: "Credibility foundation",
      delta: summary.verificationRate > 10 ? "+2%" : null,
      icon: TrendingUp,
    },
    {
      title: "Connected leaders",
      value: summary.connectedLeaders.toString(),
      subtitle: "Allied organizers",
      delta: null,
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="rounded-xl border-zinc-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-8 pb-6 px-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{card.title}</div>
                <Icon className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold tracking-tight text-zinc-900">
                  {card.value}
                </div>
                {card.delta && (
                  <div className="text-sm text-emerald-600 font-semibold">
                    {card.delta}
                  </div>
                )}
              </div>
              <div className="mt-3 text-sm font-medium text-zinc-600">{card.subtitle}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
