"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ChevronDown, ChevronUp, Search, X } from "lucide-react";
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
  },
  medium: {
    bgColor: "bg-white",
    borderColor: "border-amber-200",
    textColor: "text-zinc-900",
  },
  low: {
    bgColor: "bg-white",
    borderColor: "border-zinc-200",
    textColor: "text-zinc-900",
  },
};

type SortOption = 'leverage' | 'date';

export function BallotExposureList({ exposures }: BallotExposureListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('leverage');
  const [locationSearch, setLocationSearch] = useState('');

  if (exposures.length === 0) {
    return null;
  }

  // Filter by location search
  const filteredExposures = exposures.filter((exposure) => {
    if (!locationSearch) return true;
    const searchLower = locationSearch.toLowerCase();
    const jurisdiction = (exposure.jurisdiction || '').toLowerCase();
    const title = (exposure.ballotItem.title || '').toLowerCase();
    return jurisdiction.includes(searchLower) || title.includes(searchLower);
  });

  // Sort exposures
  const sortedExposures = [...filteredExposures].sort((a, b) => {
    if (sortBy === 'leverage') {
      return b.leverageScore - a.leverageScore;
    } else if (sortBy === 'date') {
      return new Date(a.ballotItem.electionDate).getTime() - new Date(b.ballotItem.electionDate).getTime();
    }
    return 0;
  });

  const displayCount = isExpanded ? sortedExposures.length : 10;

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-1">
          <div className="pt-5 text-sm font-medium text-zinc-900">Upcoming elections</div>
          <div className="text-sm text-zinc-500">
            {sortedExposures.length} {locationSearch ? `of ${exposures.length}` : ''} opportunities to influence
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="mt-4 space-y-3">
          {/* Location Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by location or election name..."
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-sm border border-zinc-200 rounded-md bg-white text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
            />
            {locationSearch && (
              <button
                onClick={() => setLocationSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Controls */}
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
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
          {sortedExposures.length === 0 ? (
            <div className="p-6 rounded-lg bg-zinc-50 border border-zinc-200 text-center">
              <div className="text-sm text-zinc-600">
                No elections found matching "{locationSearch}"
              </div>
              <button
                onClick={() => setLocationSearch('')}
                className="mt-2 text-xs text-zinc-700 hover:text-zinc-900 underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            sortedExposures.slice(0, displayCount).map((exposure) => {
              const daysUntil = differenceInDays(
                parseISO(exposure.ballotItem.electionDate),
                new Date()
              );
              const urgency = urgencyConfig[exposure.urgency];

              return (
                <div
                  key={exposure.ballotItem.id}
                  className={`p-4 rounded-lg border ${urgency.borderColor} ${urgency.bgColor}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-zinc-900">
                        {exposure.ballotItem.title ||
                         (exposure.ballotItem.officeName ||
                          `${exposure.ballotItem.type === 'race' ? 'Race' : 'Measure'} in ${exposure.jurisdiction || 'Unknown'}`)}
                      </h3>

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
            })
          )}
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
      </CardContent>
    </Card>
  );
}
