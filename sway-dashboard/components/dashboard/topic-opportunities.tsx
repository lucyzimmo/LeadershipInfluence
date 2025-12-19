"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, TrendingUp, Target } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import type { BallotItemInfluence, ViewpointGroup } from "@/lib/types";
import { findTopicOpportunities, type TopicOpportunity } from "@/lib/metrics/topic-matching";

interface TopicOpportunitiesProps {
  topics: ViewpointGroup[];
  ballotItems: BallotItemInfluence[];
}

export function TopicOpportunities({ topics, ballotItems }: TopicOpportunitiesProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | "all">("all");
  const [sortBy, setSortBy] = useState<"relevance" | "opportunity" | "supporters">("opportunity");

  // Calculate opportunities
  const allOpportunities = useMemo(() => {
    return findTopicOpportunities(topics, ballotItems);
  }, [topics, ballotItems]);

  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    let filtered = selectedTopic === "all"
      ? allOpportunities
      : allOpportunities.filter(opp => opp.topicId === selectedTopic);

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "relevance") {
        return b.relevanceScore - a.relevanceScore;
      } else if (sortBy === "supporters") {
        return b.ballotItem.verifiedSupporters - a.ballotItem.verifiedSupporters;
      } else {
        return b.opportunityScore - a.opportunityScore;
      }
    });

    return filtered.slice(0, 20); // Top 20
  }, [allOpportunities, selectedTopic, sortBy]);

  // Group by topic for summary
  const opportunitiesByTopic = useMemo(() => {
    const groups = new Map<string, TopicOpportunity[]>();
    for (const opp of allOpportunities) {
      const existing = groups.get(opp.topic) || [];
      existing.push(opp);
      groups.set(opp.topic, existing);
    }
    return groups;
  }, [allOpportunities]);

  if (!topics || topics.length === 0 || !ballotItems || ballotItems.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="pt-5 text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Top Opportunities by Topic
          </div>
          <div className="text-sm text-zinc-600 mt-1">
            Ballot items most relevant to your topics, ranked by opportunity score
          </div>
        </div>

        {/* Topic Filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTopic("all")}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
              selectedTopic === "all"
                ? "bg-zinc-800 text-white border-zinc-800"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            All Topics
          </button>
          {topics.map((topic) => {
            if (!topic.title) return null;
            const count = opportunitiesByTopic.get(topic.title)?.length || 0;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  selectedTopic === topic.id
                    ? "bg-zinc-800 text-white border-zinc-800"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {topic.title} ({count})
              </button>
            );
          })}
        </div>

        {/* Sort Options */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-500">Sort by:</span>
          {(["opportunity", "relevance", "supporters"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setSortBy(value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                sortBy === value
                  ? "bg-zinc-800 text-white border-zinc-800"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {value === "opportunity" ? "Opportunity" : value === "relevance" ? "Relevance" : "Supporters"}
            </button>
          ))}
        </div>

        {/* Opportunities Table */}
        <div className="border border-zinc-200 rounded-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Topic
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Ballot Item
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Location
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Supporters
                  </th>
                  <th className="text-right p-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-zinc-500">
                      No opportunities found for selected topic
                    </td>
                  </tr>
                ) : (
                  filteredOpportunities.map((opp, idx) => {
                    const item = opp.ballotItem;
                    const daysUntil = differenceInDays(parseISO(item.electionDate), new Date());
                    const urgencyColor = {
                      high: "text-rose-600 bg-rose-50",
                      medium: "text-amber-600 bg-amber-50",
                      low: "text-emerald-600 bg-emerald-50",
                    }[item.urgency];

                    return (
                      <tr key={`${opp.topicId}-${item.id}-${idx}`} className="bg-white hover:bg-zinc-50">
                        <td className="p-3">
                          <div className="text-sm font-medium text-zinc-900">{opp.topic}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {(opp.relevanceScore * 100).toFixed(0)}% match
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 mb-1">
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
                          </div>
                          <div className="text-sm font-medium text-zinc-900">{item.title}</div>
                          {item.type === "race" && item.officeName && (
                            <div className="text-xs text-zinc-500 mt-0.5">{item.officeName}</div>
                          )}
                          {item.type === "measure" && item.measureSummary && (
                            <div className="text-xs text-zinc-600 mt-1 line-clamp-1">
                              {item.measureSummary.slice(0, 80)}...
                            </div>
                          )}
                          <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {daysUntil} days • {item.electionName}
                          </div>
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
                            {item.verifiedSupporters.toLocaleString()}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {item.supporters.toLocaleString()} total
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="h-4 w-4 text-zinc-400" />
                            <div className="text-sm font-semibold text-zinc-900">
                              {(opp.opportunityScore * 100).toFixed(0)}
                            </div>
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {(opp.relevanceScore * 100).toFixed(0)}% relevant
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOpportunities.length > 0 && (
          <div className="mt-4 text-xs text-zinc-500 text-center">
            Showing top {filteredOpportunities.length} of {allOpportunities.length} opportunities
          </div>
        )}
      </CardContent>
    </Card>
  );
}

