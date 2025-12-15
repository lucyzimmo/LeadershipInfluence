"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { JurisdictionConcentration } from "@/lib/types";

interface JurisdictionTableProps {
  data: JurisdictionConcentration;
}

export function JurisdictionTable({ data }: JurisdictionTableProps) {
  const interpretConcentration = (hhi: number): string => {
    if (hhi > 0.5) return "Very High";
    if (hhi > 0.25) return "High";
    if (hhi > 0.15) return "Medium";
    return "Low";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Where Your Influence Lives</CardTitle>
        <CardDescription>
          Concentration: {interpretConcentration(data.concentrationIndex)} (HHI:{" "}
          {data.concentrationIndex.toFixed(2)})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.topJurisdictions.slice(0, 5).map((jurisdiction) => (
            <div
              key={jurisdiction.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="font-medium">{jurisdiction.name}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {jurisdiction.type}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {jurisdiction.verifiedCount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">
                  {jurisdiction.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
