"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, TrendingUp } from "lucide-react";
import type { BallotItemInfluence } from "@/lib/types";
import { differenceInDays, parseISO } from "date-fns";

interface InfluenceOpportunitiesProps {
  items: BallotItemInfluence[];
}

const urgencyWeights = {
  high: 1,
  medium: 0.7,
  low: 0.4,
};

export function InfluenceOpportunities({ items }: InfluenceOpportunitiesProps) {
  const grouped = new Map<string, BallotItemInfluence>();
  for (const item of items) {
    if (item.supporters <= 0) continue;
    const key = `${item.title}|${item.jurisdiction}|${item.electionDate}|${item.type}`;
    const existing = grouped.get(key);
    if (!existing || item.supporters > existing.supporters) {
      grouped.set(key, item);
    }
  }

  const scored = Array.from(grouped.values())
    .map((item) => ({
      item,
      score: item.supporters * urgencyWeights[item.urgency] + item.verifiedSupporters * 1.5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (scored.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl border-zinc-200 shadow-sm">
      <CardContent className="p-7">
        <div className="mb-5">
          <div className="pt-5 text-lg font-bold text-zinc-900">
            Top influence opportunities
          </div>
          <div className="text-base text-zinc-600 mt-1">
            Where your supporter footprint can move outcomes soon
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scored.map(({ item }) => {
            const daysUntil = differenceInDays(parseISO(item.electionDate), new Date());
            return (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {item.type === "measure" ? "Measure" : "Race"}
                    </div>
                    <div className="text-sm font-semibold text-zinc-900 mt-1">
                      {item.title}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Supporters</div>
                    <div className="text-lg font-semibold text-zinc-900">
                      {item.supporters.toLocaleString()}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {item.verifiedSupporters.toLocaleString()} verified
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {daysUntil} days
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {item.jurisdiction}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" />
                    {item.urgency === "high" ? "High urgency" : item.urgency === "medium" ? "Medium urgency" : "Low urgency"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
