"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ChevronDown, ChevronUp, MapPin, Search, X } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import type { BallotItemInfluence, UrgencyLevel } from "@/lib/types";

interface ElectionInfluenceListProps {
  items: BallotItemInfluence[];
}

type ItemFilter = "all" | "race" | "measure";
type LevelFilter = "all" | "local" | "state" | "federal";
type UrgencyFilter = "all" | UrgencyLevel;

export function ElectionInfluenceList({ items }: ElectionInfluenceListProps) {
  const [typeFilter, setTypeFilter] = useState<ItemFilter>("all");
  const [levelFilter, setLevelFilter] = useState<LevelFilter>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");
  const [stateSearch, setStateSearch] = useState("");
  const [electionSearch, setElectionSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);

  // Extract unique values for search suggestions
  const states = useMemo(() => {
    const uniqueStates = Array.from(
      new Set(items.map((item) => item.state).filter(Boolean))
    ) as string[];
    return uniqueStates.sort((a, b) => a.localeCompare(b));
  }, [items]);

  const elections = useMemo(() => {
    const electionMap = new Map<string, { id: string; name: string; date: string }>();
    items.forEach((item) => {
      if (!electionMap.has(item.electionId)) {
        electionMap.set(item.electionId, {
          id: item.electionId,
          name: item.electionName,
          date: item.electionDate,
        });
      }
    });
    return Array.from(electionMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== "all" && item.type !== typeFilter) return false;
      if (levelFilter !== "all" && item.officeLevel !== levelFilter) return false;
      if (urgencyFilter !== "all" && item.urgency !== urgencyFilter) return false;
      
      // State search (case-insensitive)
      if (stateSearch.trim() && item.state) {
        if (!item.state.toLowerCase().includes(stateSearch.toLowerCase().trim())) {
          return false;
        }
      }
      
      // Election search (case-insensitive, matches name or date)
      if (electionSearch.trim()) {
        const election = elections.find((e) => e.id === item.electionId);
        if (election) {
          const searchLower = electionSearch.toLowerCase().trim();
          const nameMatch = election.name.toLowerCase().includes(searchLower);
          const dateMatch = format(parseISO(election.date), "MMM d, yyyy")
            .toLowerCase()
            .includes(searchLower);
          if (!nameMatch && !dateMatch) {
            return false;
          }
        } else {
          return false;
        }
      }
      
      return true;
    });
  }, [items, typeFilter, levelFilter, urgencyFilter, stateSearch, electionSearch, elections]);

  // Group by election for table view, deduplicating measures with same title
  const groupedByElection = useMemo(() => {
    const groups = new Map<string, BallotItemInfluence[]>();
    filteredItems.forEach((item) => {
      const existing = groups.get(item.electionId) || [];
      existing.push(item);
      groups.set(item.electionId, existing);
    });
    return Array.from(groups.entries())
      .map(([electionId, items]) => {
        const election = elections.find((e) => e.id === electionId);
        
        // Deduplicate measures: if multiple items have same title and are measures, keep the one with most supporters
        const deduplicatedItems = new Map<string, BallotItemInfluence>();
        items.forEach((item) => {
          const key = item.type === "measure" 
            ? `${item.type}-${item.title}-${item.jurisdictionId || item.jurisdiction}`
            : item.id; // Races are unique by ID
          
          const existing = deduplicatedItems.get(key);
          if (!existing || item.supporters > existing.supporters) {
            deduplicatedItems.set(key, item);
          }
        });
        
        return {
          electionId,
          electionName: election?.name || "Unknown Election",
          electionDate: election?.date || items[0]?.electionDate || "",
          items: Array.from(deduplicatedItems.values()).sort((a, b) => {
            // Sort by type (measures first), then by supporters
            if (a.type !== b.type) {
              return a.type === "measure" ? -1 : 1;
            }
            return b.supporters - a.supporters;
          }),
        };
      })
      .sort((a, b) => {
        return new Date(a.electionDate).getTime() - new Date(b.electionDate).getTime();
      });
  }, [filteredItems, elections]);

  const toggleRow = (electionId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(electionId)) {
        next.delete(electionId);
      } else {
        next.add(electionId);
      }
      return next;
    });
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="pt-5 text-lg font-bold text-zinc-900">
            Ballot Items You Can Influence
          </div>
          <div className="text-sm text-zinc-600 mt-1">
            {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} across{" "}
            {groupedByElection.length} election{groupedByElection.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-4 space-y-3 pb-4 border-b border-zinc-200">
            {/* Consolidated filter buttons with color coding */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Type:</span>
                {(["all", "race", "measure"] as ItemFilter[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setTypeFilter(value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      typeFilter === value
                        ? value === "race"
                          ? "bg-blue-500 text-white border-blue-500"
                          : value === "measure"
                          ? "bg-purple-500 text-white border-purple-500"
                          : "bg-zinc-800 text-white border-zinc-800"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {value === "all" ? "All" : value === "race" ? "Races" : "Measures"}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Level:</span>
                {(["all", "local", "state", "federal"] as LevelFilter[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setLevelFilter(value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      levelFilter === value
                        ? value === "local"
                          ? "bg-teal-500 text-white border-teal-500"
                          : value === "state"
                          ? "bg-indigo-500 text-white border-indigo-500"
                          : value === "federal"
                          ? "bg-slate-600 text-white border-slate-600"
                          : "bg-zinc-800 text-white border-zinc-800"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500">Urgency:</span>
                {(["all", "high", "medium", "low"] as UrgencyFilter[]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setUrgencyFilter(value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      urgencyFilter === value
                        ? value === "high"
                          ? "bg-rose-500 text-white border-rose-500"
                          : value === "medium"
                          ? "bg-amber-500 text-white border-amber-500"
                          : value === "low"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-zinc-800 text-white border-zinc-800"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Search inputs */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by state..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                  {stateSearch && (
                    <button
                      onClick={() => setStateSearch("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search by election name or date..."
                    value={electionSearch}
                    onChange={(e) => setElectionSearch(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
                  />
                  {electionSearch && (
                    <button
                      onClick={() => setElectionSearch("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toggle filters button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="mb-4 text-xs text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
        >
          {showFilters ? "Hide filters" : "Show filters"}
        </button>

        {/* Table */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Election
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Item
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Location
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Supporters
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide w-12">
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {groupedByElection.map(({ electionId, electionName, electionDate, items: electionItems }) => {
                  const isExpanded = expandedRows.has(electionId);
                  const daysUntil = differenceInDays(parseISO(electionDate), new Date());
                  const totalSupporters = Math.max(...electionItems.map((i) => i.supporters));
                  const totalVerified = Math.max(...electionItems.map((i) => i.verifiedSupporters));
                  const jurisdictions = Array.from(
                    new Set(electionItems.map((i) => i.jurisdiction).filter(Boolean))
                  );

                  return (
                    <React.Fragment key={electionId}>
                      {/* Election summary row */}
                      <tr
                        className="bg-white hover:bg-zinc-50 cursor-pointer transition-colors"
                        onClick={() => toggleRow(electionId)}
                      >
                        <td className="p-3">
                          <div className="font-medium text-sm text-zinc-900">{electionName}</div>
                          <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {daysUntil} days • {electionItems.length} item{electionItems.length !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs text-zinc-500">
                            {electionItems.filter((i) => i.type === "measure").length} measure
                            {electionItems.filter((i) => i.type === "measure").length !== 1 ? "s" : ""},{" "}
                            {electionItems.filter((i) => i.type === "race").length} race
                            {electionItems.filter((i) => i.type === "race").length !== 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-xs text-zinc-600">
                            {jurisdictions.slice(0, 2).join(", ")}
                            {jurisdictions.length > 2 && ` +${jurisdictions.length - 2}`}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="text-sm font-semibold text-zinc-900">
                            {totalSupporters.toLocaleString()}
                          </div>
                          <div className="text-xs text-zinc-500">{totalVerified.toLocaleString()} verified</div>
                        </td>
                        <td className="p-3 text-center">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-zinc-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-zinc-500" />
                          )}
                        </td>
                      </tr>

                      {/* Expanded items */}
                      {isExpanded &&
                        electionItems.map((item) => {
                          const itemDaysUntil = differenceInDays(parseISO(item.electionDate), new Date());
                          const urgencyColor = {
                            high: "text-red-600 bg-red-50",
                            medium: "text-orange-600 bg-orange-50",
                            low: "text-green-600 bg-green-50",
                          }[item.urgency];

                          return (
                            <tr key={item.id} className="bg-zinc-50 hover:bg-zinc-100">
                              <td className="p-3 pl-8">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                                      item.type === "measure" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                                    }`}
                                  >
                                    {item.type === "measure" ? "Measure" : "Race"}
                                  </span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${urgencyColor}`}>
                                    {item.urgency}
                                  </span>
                                  {item.isPrimary && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-orange-100 text-orange-700">
                                      Primary
                                    </span>
                                  )}
                                  {item.isRunoff && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                                      Runoff
                                    </span>
                                  )}
                                  {item.isRecall && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700">
                                      Recall
                                    </span>
                                  )}
                                  {item.isRankedChoice && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                      Ranked Choice
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="text-sm font-medium text-zinc-900">{item.title}</div>
                                {item.type === "race" && item.officeName && (
                                  <div className="text-xs text-zinc-500 mt-0.5">{item.officeName}</div>
                                )}
                                {item.type === "race" && (item.numWinners || item.numSelectionsMax) && (
                                  <div className="text-xs text-zinc-500 mt-0.5">
                                    {item.numWinners && `Elect ${item.numWinners}${item.numWinners > 1 ? " candidates" : " candidate"}`}
                                    {item.numWinners && item.numSelectionsMax && item.numSelectionsMax > item.numWinners && ` • `}
                                    {item.numSelectionsMax && item.numSelectionsMax > (item.numWinners || 1) && `Select up to ${item.numSelectionsMax}`}
                                  </div>
                                )}
                                {item.type === "measure" && item.measureSummary && (
                                  <div className="text-xs text-zinc-600 mt-1 line-clamp-2">
                                    {item.measureSummary.length > 120
                                      ? `${item.measureSummary.slice(0, 120)}...`
                                      : item.measureSummary}
                                  </div>
                                )}
                                {item.type === "measure" && (item.measureProSnippet || item.measureConSnippet) && (
                                  <div className="mt-2 space-y-1">
                                    {item.measureProSnippet && (
                                      <div className="text-xs">
                                        <span className="font-medium text-green-700">Pro: </span>
                                        <span className="text-zinc-600">
                                          {item.measureProSnippet.length > 80
                                            ? `${item.measureProSnippet.slice(0, 80)}...`
                                            : item.measureProSnippet}
                                        </span>
                                      </div>
                                    )}
                                    {item.measureConSnippet && (
                                      <div className="text-xs">
                                        <span className="font-medium text-red-700">Con: </span>
                                        <span className="text-zinc-600">
                                          {item.measureConSnippet.length > 80
                                            ? `${item.measureConSnippet.slice(0, 80)}...`
                                            : item.measureConSnippet}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {item.type === "race" && item.candidates && item.candidates.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {item.candidates.slice(0, 3).map((candidate, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700"
                                      >
                                        {candidate.name}
                                        {candidate.party && ` (${candidate.party})`}
                                      </span>
                                    ))}
                                    {item.candidateCount && item.candidateCount > item.candidates.length && (
                                      <span className="text-xs text-zinc-500">
                                        +{item.candidateCount - item.candidates.length} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="text-xs text-zinc-600 flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.jurisdiction}
                                </div>
                                {item.state && (
                                  <div className="text-xs text-zinc-500 mt-0.5">{item.state}</div>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <div className="text-sm font-semibold text-zinc-900">
                                  {item.supporters.toLocaleString()}
                                </div>
                                <div className="text-xs text-zinc-500">
                                  {item.verifiedSupporters.toLocaleString()} verified
                                </div>
                              </td>
                              <td className="p-3"></td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-sm text-zinc-500">
            No items match the selected filters
          </div>
        )}
      </CardContent>
    </Card>
  );
}
