"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, TrendingUp, Users } from "lucide-react";
import type { DashboardModel } from "@/lib/types";

interface OverviewCardsProps {
  summary: DashboardModel["summary"];
}

export function OverviewCards({ summary }: OverviewCardsProps) {
  const cards = [
    {
      title: "Verified voters",
      value: summary.verifiedVoters.toLocaleString(),
      subtitle: `${Math.round(summary.verificationRate)}% of supporters`,
      delta: null,
      icon: CheckCircle2,
    },
    {
      title: "Verification rate",
      value: `${Math.round(summary.verificationRate)}%`,
      subtitle: "Credibility foundation",
      delta: summary.verificationRate > 10 ? "+2%" : null,
      icon: TrendingUp,
    },
    {
      title: "Derivative leaders",
      value: summary.derivativeLeaders.toString(),
      subtitle: "Network multipliers",
      delta: null,
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="rounded-xl border-zinc-200/70 shadow-sm">
            <CardContent className="p-6">
              <div className="pt-5 text-xs text-zinc-500">{card.title}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-2xl font-semibold tracking-tight text-zinc-900">
                  {card.value}
                </div>
                {card.delta && (
                  <div className="text-sm text-emerald-600 font-medium">
                    {card.delta}
                  </div>
                )}
              </div>
              <div className="mt-2 text-sm text-zinc-600">{card.subtitle}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
