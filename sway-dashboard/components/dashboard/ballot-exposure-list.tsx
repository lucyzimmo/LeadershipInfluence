"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, Calendar, MapPin, Zap, Crown, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
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

type SortOption = 'leverage' | 'date' | 'location';
type LeverageFilter = 'all' | 'high' | 'medium' | 'low';

export function BallotExposureList({ exposures }: BallotExposureListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('leverage');
  const [leverageFilter, setLeverageFilter] = useState<LeverageFilter>('all');

  if (exposures.length === 0) {
    return null;
  }

  // Map leverage levels for filtering
  const getLeverageCategory = (level?: string): 'high' | 'medium' | 'low' => {
    if (level === 'kingmaker' || level === 'significant') return 'high';
    if (level === 'marginal') return 'low';
    return 'medium';
  };

  // Filter by leverage
  let filteredExposures = exposures;
  if (leverageFilter !== 'all') {
    filteredExposures = exposures.filter(exp =>
      getLeverageCategory(exp.leverageLevel) === leverageFilter
    );
  }

  // Sort exposures
  const sortedExposures = [...filteredExposures].sort((a, b) => {
    if (sortBy === 'leverage') {
      return b.leverageScore - a.leverageScore;
    } else if (sortBy === 'date') {
      return new Date(a.ballotItem.electionDate).getTime() - new Date(b.ballotItem.electionDate).getTime();
    } else if (sortBy === 'location') {
      const locA = a.jurisdiction || '';
      const locB = b.jurisdiction || '';
      return locA.localeCompare(locB);
    }
    return 0;
  });

  const displayCount = isExpanded ? sortedExposures.length : 10;

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-1">
          <div className="text-sm font-medium text-zinc-900">Upcoming elections</div>
          <div className="text-sm text-zinc-500">
            {sortedExposures.length} {leverageFilter !== 'all' ? `${leverageFilter} leverage ` : ''}opportunities
          </div>
        </div>

        {/* Filter and Sort Controls */}
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600">Sort by:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setSortBy('leverage')}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  sortBy === 'leverage'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Leverage
              </button>
              <button
                onClick={() => setSortBy('date')}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  sortBy === 'date'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setSortBy('location')}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  sortBy === 'location'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Location
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-600">Leverage:</span>
            <div className="flex gap-1">
              <button
                onClick={() => setLeverageFilter('all')}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  leverageFilter === 'all'
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLeverageFilter('high')}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  leverageFilter === 'high'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                High leverage
              </button>
              <button
                onClick={() => setLeverageFilter('medium')}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  leverageFilter === 'medium'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Medium leverage
              </button>
              <button
                onClick={() => setLeverageFilter('low')}
                className={`text-xs px-3 py-1 rounded-md transition-colors ${
                  leverageFilter === 'low'
                    ? 'bg-zinc-600 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                Low leverage
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
          {sortedExposures.slice(0, displayCount).map((exposure) => {
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
                </div>
              </div>
            );
          })}
        </div>

        {sortedExposures.length > 10 && (
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
                Show {sortedExposures.length - 10} more ballot items
              </>
            )}
          </button>
        )}

        {sortedExposures.length === 0 && (
          <div className="mt-4 text-center text-sm text-zinc-500 py-8">
            No elections match the selected filter
          </div>
        )}
      </CardContent>
    </Card>
  );
}
