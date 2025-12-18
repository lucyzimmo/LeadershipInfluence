"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Users2, Gauge, ChevronDown, ChevronUp } from "lucide-react";
import type { JurisdictionConcentration } from "@/lib/types";

interface JurisdictionTableProps {
  data: JurisdictionConcentration;
}

export function JurisdictionTable({ data }: JurisdictionTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayCount = isExpanded ? data.topJurisdictions.length : 5;
  const interpretConcentration = (hhi: number): {
    label: string;
    color: string;
    opinion: string;
    recommendation: string;
  } => {
    if (hhi > 0.5) return {
      label: "Very High",
      color: "text-red-600",
      opinion: "Dangerously concentrated — high impact but fragile",
      recommendation: "Diversify now before a single jurisdiction determines your entire influence. Expand to adjacent areas while leveraging your strong base for coalition-building."
    };
    if (hhi > 0.25) return {
      label: "High",
      color: "text-orange-600",
      opinion: "Highly focused — strong leverage in key areas",
      recommendation: "Excellent concentration for local impact. Double down on top jurisdictions for immediate wins, while seeding growth in 2-3 new areas for long-term resilience."
    };
    if (hhi > 0.15) return {
      label: "Medium",
      color: "text-blue-600",
      opinion: "Balanced distribution — stable but may lack decisive power",
      recommendation: "You have breadth but may lack the concentration needed to swing close races. Identify your top 2-3 jurisdictions and focus recruitment there until you achieve critical mass."
    };
    return {
      label: "Low",
      color: "text-gray-600",
      opinion: "Too scattered — large base but low electoral leverage",
      recommendation: "Your supporters are spread too thin to influence any single election decisively. Pause broad growth and focus intensely on one high-opportunity jurisdiction until you achieve 20%+ concentration there."
    };
  };

  const concentration = interpretConcentration(data.concentrationIndex);

  return (
    <Card className="pt-5 rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="">
        <div className="mb-4">
          <div className="pt-5 text-sm font-medium text-zinc-900">Geographic concentration</div>
          <div className="text-sm text-zinc-500 mb-2">
            {concentration.label} concentration (HHI: {data.concentrationIndex.toFixed(2)})
          </div>
          <div className="text-sm font-medium text-zinc-700 italic mb-2">
            {concentration.opinion}
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-xs font-medium text-blue-900 mb-1">Recommendation</div>
            <div className="text-sm text-blue-800">
              {concentration.recommendation}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto">
          {data.topJurisdictions.slice(0, displayCount).map((jurisdiction, index) => (
            <div
              key={jurisdiction.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-white border border-zinc-200/70"
            >
              <div className="text-sm font-medium text-zinc-500 w-5">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-900 truncate">
                  {jurisdiction.name}
                </div>
                {jurisdiction.type !== 'unknown' && (
                  <div className="text-xs text-zinc-500 capitalize">
                    {jurisdiction.type}
                  </div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-semibold text-zinc-900">
                  {jurisdiction.verifiedCount.toLocaleString()}
                </div>
                <div className="text-xs text-zinc-500">
                  {jurisdiction.percentage.toFixed(1)}%
                </div>
              </div>
              <div className="w-20 flex-shrink-0">
                <div className="w-full bg-zinc-100 rounded-full h-1.5">
                  <div
                    className="bg-zinc-900 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(jurisdiction.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.topJurisdictions.length > 5 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 transition-colors py-2 px-4 rounded-lg hover:bg-zinc-50"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show {data.topJurisdictions.length - 5} more jurisdictions
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
