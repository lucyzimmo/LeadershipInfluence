"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BallotExposure } from "@/lib/types";
import { differenceInDays, parseISO } from "date-fns";

interface BallotExposureListProps {
  exposures: BallotExposure[];
}

const urgencyColors = {
  high: "bg-red-100 border-red-300 text-red-900",
  medium: "bg-orange-100 border-orange-300 text-orange-900",
  low: "bg-blue-100 border-blue-300 text-blue-900",
};

const leverageColors = {
  kingmaker: "bg-purple-100 text-purple-800",
  significant: "bg-green-100 text-green-800",
  marginal: "bg-gray-100 text-gray-800",
};

export function BallotExposureList({ exposures }: BallotExposureListProps) {
  if (exposures.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Upcoming Elections You Can Influence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {exposures.slice(0, 10).map((exposure) => {
          const daysUntil = differenceInDays(
            parseISO(exposure.ballotItem.electionDate),
            new Date()
          );

          return (
            <div
              key={exposure.ballotItem.id}
              className={`p-4 rounded-lg border-2 ${
                urgencyColors[exposure.urgency]
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {exposure.ballotItem.title}
                    </h3>
                    {exposure.leverageLevel && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          leverageColors[exposure.leverageLevel]
                        }`}
                      >
                        {exposure.leverageLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-1 space-y-1">
                    <p>
                      <span className="font-medium">
                        {exposure.verifiedSupporters}
                      </span>{" "}
                      verified supporters • {daysUntil} days until election
                    </p>
                    {exposure.ballotItem.officeName && (
                      <p className="text-gray-700">
                        {exposure.ballotItem.officeName} •{" "}
                        <span className="capitalize">
                          {exposure.ballotItem.officeLevel}
                        </span>{" "}
                        level
                      </p>
                    )}
                    {exposure.jurisdiction && (
                      <p className="text-gray-600">{exposure.jurisdiction}</p>
                    )}
                    <p className="text-gray-600">
                      Leverage Score:{" "}
                      <span className="font-medium">
                        {Math.round(exposure.leverageScore)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
