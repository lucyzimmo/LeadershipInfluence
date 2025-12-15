"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, Calendar, MapPin, Zap, Crown, TrendingUp } from "lucide-react";
import type { BallotExposure } from "@/lib/types";
import { differenceInDays, parseISO } from "date-fns";

interface BallotExposureListProps {
  exposures: BallotExposure[];
}

const urgencyConfig = {
  high: {
    bgColor: "bg-white",
    borderColor: "border-red-200",
    textColor: "text-zinc-900",
    badgeBg: "bg-red-50 text-red-700 border-red-200",
    icon: Zap,
  },
  medium: {
    bgColor: "bg-white",
    borderColor: "border-amber-200",
    textColor: "text-zinc-900",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Calendar,
  },
  low: {
    bgColor: "bg-white",
    borderColor: "border-zinc-200",
    textColor: "text-zinc-900",
    badgeBg: "bg-zinc-100 text-zinc-700 border-zinc-200",
    icon: Calendar,
  },
};

const leverageConfig = {
  kingmaker: {
    bgColor: "bg-purple-50",
    textColor: "text-purple-700",
    borderColor: "border-purple-200",
    icon: Crown,
    label: "Potential swing influence",
  },
  significant: {
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
    borderColor: "border-emerald-200",
    icon: TrendingUp,
    label: "High leverage",
  },
  marginal: {
    bgColor: "bg-zinc-50",
    textColor: "text-zinc-700",
    borderColor: "border-zinc-200",
    icon: Vote,
    label: "Meaningful leverage",
  },
};

export function BallotExposureList({ exposures }: BallotExposureListProps) {
  if (exposures.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-5">
        <div>
          <div className="text-sm font-medium text-zinc-900">Upcoming elections</div>
          <div className="text-sm text-zinc-500">Top {Math.min(exposures.length, 10)} opportunities by leverage</div>
        </div>

        <div className="mt-4 space-y-3">
          {exposures.slice(0, 10).map((exposure) => {
            const daysUntil = differenceInDays(
              parseISO(exposure.ballotItem.electionDate),
              new Date()
            );
            const urgency = urgencyConfig[exposure.urgency];
            const leverage = exposure.leverageLevel
              ? leverageConfig[exposure.leverageLevel]
              : null;

            return (
              <div
                key={exposure.ballotItem.id}
                className={`p-4 rounded-lg border ${urgency.borderColor} ${urgency.bgColor}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-zinc-900">
                        {exposure.ballotItem.title ||
                         (exposure.ballotItem.officeName ||
                          `${exposure.ballotItem.type === 'race' ? 'Race' : 'Measure'} in ${exposure.jurisdiction || 'Unknown'}`)}
                      </h3>
                      {leverage && (
                        <span className={`text-xs px-2 py-0.5 rounded border ${leverage.bgColor} ${leverage.textColor} ${leverage.borderColor}`}>
                          {leverage.label}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-sm text-zinc-600 flex-wrap">
                      <span className="font-medium text-emerald-700">
                        {exposure.verifiedSupporters} verified voters
                      </span>
                      <span>{daysUntil} days until election</span>
                      {exposure.jurisdiction && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {exposure.jurisdiction}
                        </span>
                      )}
                    </div>
                  </div>

                  <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded border ${urgency.badgeBg}`}>
                    {exposure.urgency.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {exposures.length > 10 && (
          <div className="mt-4 text-center text-sm text-zinc-500">
            + {exposures.length - 10} more ballot items
          </div>
        )}
      </CardContent>
    </Card>
  );
}
