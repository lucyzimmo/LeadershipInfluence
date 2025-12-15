"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Users2, Gauge } from "lucide-react";
import type { JurisdictionConcentration } from "@/lib/types";

interface JurisdictionTableProps {
  data: JurisdictionConcentration;
}

export function JurisdictionTable({ data }: JurisdictionTableProps) {
  const interpretConcentration = (hhi: number): { label: string; color: string } => {
    if (hhi > 0.5) return { label: "Very High", color: "text-red-600" };
    if (hhi > 0.25) return { label: "High", color: "text-orange-600" };
    if (hhi > 0.15) return { label: "Medium", color: "text-blue-600" };
    return { label: "Low", color: "text-gray-600" };
  };

  const concentration = interpretConcentration(data.concentrationIndex);

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-5">
        <div>
          <div className="text-sm font-medium text-zinc-900">Geographic concentration</div>
          <div className="text-sm text-zinc-500">
            {concentration.label} concentration (HHI: {data.concentrationIndex.toFixed(2)})
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {data.topJurisdictions.slice(0, 5).map((jurisdiction, index) => (
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
          <div className="mt-4 text-center text-sm text-zinc-500">
            + {data.totalJurisdictions - 5} more jurisdictions
          </div>
        )}
      </CardContent>
    </Card>
  );
}
