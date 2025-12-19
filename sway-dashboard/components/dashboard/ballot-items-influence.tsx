"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Users } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import type { BallotItemInfluence } from "@/lib/types";

interface BallotItemsInfluenceProps {
  items: BallotItemInfluence[];
}

type ItemFilter = "all" | "race" | "measure";
type LevelFilter = "all" | "local" | "state" | "federal";

export function BallotItemsInfluence({ items }: BallotItemsInfluenceProps) {
  const [filter, setFilter] = useState<ItemFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false);

  const states = useMemo(() => {
    const uniqueStates = Array.from(
      new Set(items.map((item) => item.state).filter(Boolean))
    ) as string[];
    return uniqueStates.sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filter !== "all" && item.type !== filter) return false;
      if (levelFilter !== "all" && item.officeLevel !== levelFilter) return false;
      if (stateFilter !== "all" && item.state !== stateFilter) return false;
      return true;
    });
  }, [filter, items, levelFilter, stateFilter]);

  const displayCount = isExpanded ? filteredItems.length : 12;

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl border-zinc-200 shadow-sm">
      <CardContent className="p-7">
        <div className="mb-5">
          <div className="pt-5 text-lg font-bold text-zinc-900">
            All ballot items in your supporter footprint
          </div>
          <div className="text-base text-zinc-600 mt-1">
            {filteredItems.length} items with supporters in the jurisdiction
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["all", "race", "measure"] as ItemFilter[]).map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                filter === value
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {value === "all" ? "All" : value === "race" ? "Races" : "Measures"}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          {(["all", "local", "state", "federal"] as LevelFilter[]).map((value) => (
            <button
              key={value}
              onClick={() => setLevelFilter(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                levelFilter === value
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {value === "all" ? "All levels" : `${value[0].toUpperCase()}${value.slice(1)} level`}
            </button>
          ))}
          {states.length > 0 && (
            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              className="text-xs font-medium border border-zinc-200 rounded-md px-3 py-1.5 text-zinc-700 bg-white"
            >
              <option value="all">All states</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mt-5 space-y-3 max-h-[640px] overflow-y-auto">
          {filteredItems.slice(0, displayCount).map((item) => {
            const daysUntil = differenceInDays(parseISO(item.electionDate), new Date());
            const candidates = item.candidates?.slice(0, 3) || [];

            return (
              <div
                key={item.id}
                className="rounded-lg border border-zinc-200 bg-white p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {item.type === "measure" ? "Measure" : "Race"}
                    </div>
                    <div className="text-base font-semibold text-zinc-900 mt-1">
                      {item.title}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-600">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {daysUntil} days
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {item.jurisdiction}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">Supporter footprint</div>
                    <div className="text-lg font-semibold text-zinc-900">
                      {item.supporters.toLocaleString()}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {item.verifiedSupporters.toLocaleString()} verified
                    </div>
                  </div>
                </div>

                {item.type === "race" && (
                  <div className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      <Users className="h-4 w-4" />
                      {item.candidateCount || candidates.length} candidates
                    </div>
                    {candidates.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-zinc-700">
                        {candidates.map((candidate) => (
                          <span
                            key={`${candidate.name}-${candidate.party || "none"}`}
                            className="rounded-full bg-white px-2 py-1 text-xs font-medium text-zinc-700 border border-zinc-200"
                          >
                            {candidate.name}
                            {candidate.party ? ` (${candidate.party})` : ""}
                          </span>
                        ))}
                        {item.candidateCount && item.candidateCount > candidates.length && (
                          <span className="text-xs text-zinc-500">
                            +{item.candidateCount - candidates.length} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {item.type === "measure" && item.measureSummary && (
                  <div className="mt-4 rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                    {item.measureSummary.length > 200
                      ? `${item.measureSummary.slice(0, 200)}...`
                      : item.measureSummary}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredItems.length > 12 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 w-full text-sm text-zinc-600 hover:text-zinc-900 transition-colors py-2 px-4 rounded-lg hover:bg-zinc-50"
          >
            {isExpanded ? "Show fewer items" : `Show ${filteredItems.length - 12} more`}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
