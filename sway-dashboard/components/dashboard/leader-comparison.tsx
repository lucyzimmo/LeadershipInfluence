"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Award, MessageSquare, Filter } from "lucide-react";

interface LeaderData {
  id: string;
  name: string;
  slug: string;
  totalSupporters: number;
  totalViewpoints: number;
  groupCount: number;
  groups?: Array<{
    id: string;
    title: string;
    supporterCount: number;
  }>;
}

interface LeaderComparisonProps {
  leaders: LeaderData[];
  yourStats: {
    supporters: number;
    viewpoints?: number;
  };
  yourTopics?: string[];
  topicSupporterCounts?: Record<string, number>;
}

type ComparisonMetric = 'supporters' | 'viewpoints';

export function LeaderComparison({ leaders, yourStats, yourTopics = [], topicSupporterCounts = {} }: LeaderComparisonProps) {
  const [metric, setMetric] = useState<ComparisonMetric>('supporters');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [topicSearch, setTopicSearch] = useState<string>('');
  const [showTopicDropdown, setShowTopicDropdown] = useState<boolean>(false);

  if (!leaders || leaders.length === 0) {
    return null;
  }

  const yourViewpoints = yourStats.viewpoints ?? 0;

  // Extract all unique topics from leaders AND include your topics
  const allTopics = useMemo(() => {
    const topicSet = new Set<string>();

    // Add your topics first
    yourTopics.forEach(topic => {
      if (topic) topicSet.add(topic);
    });

    // Add topics from all leaders
    leaders.forEach(leader => {
      leader.groups?.forEach(group => {
        if (group.title) topicSet.add(group.title);
      });
    });

    return Array.from(topicSet).sort();
  }, [leaders, yourTopics]);

  // Filter topics based on search
  const filteredTopicOptions = useMemo(() => {
    if (!topicSearch) return allTopics;
    const searchLower = topicSearch.toLowerCase();
    return allTopics.filter(topic =>
      topic.toLowerCase().includes(searchLower)
    );
  }, [allTopics, topicSearch]);

  // Get display name for current filter
  const getFilterDisplayName = (filter: string) => {
    if (filter === 'all') return 'All topics';
    if (filter === 'myTopics') return 'My topics';
    return filter.length > 35 ? filter.substring(0, 35) + '...' : filter;
  };

  // Filter leaders by topic
  const filteredLeaders = useMemo(() => {
    if (topicFilter === 'all') return leaders;
    if (topicFilter === 'myTopics') {
      // Filter leaders who share topics with you
      return leaders.filter(leader =>
        leader.groups?.some(group => yourTopics.includes(group.title))
      );
    }
    // Filter by specific topic
    return leaders.filter(leader =>
      leader.groups?.some(group => group.title === topicFilter)
    );
  }, [leaders, topicFilter, yourTopics]);

  // Sort filtered leaders by selected metric
  const sortedLeaders = [...filteredLeaders].sort((a, b) =>
    metric === 'supporters'
      ? b.totalSupporters - a.totalSupporters
      : b.totalViewpoints - a.totalViewpoints
  );

  // Calculate yourValue based on metric and topic filter
  const yourValue = useMemo(() => {
    if (metric === 'supporters') {
      // If filtering by a specific topic, use per-topic supporter count
      if (topicFilter !== 'all' && topicFilter !== 'myTopics' && topicSupporterCounts[topicFilter] !== undefined) {
        return topicSupporterCounts[topicFilter];
      }
      // Otherwise use total verified voters
      return yourStats.supporters;
    }
    return yourViewpoints;
  }, [metric, topicFilter, topicSupporterCounts, yourStats.supporters, yourViewpoints]);

  // Determine if we're showing verified voters vs total supporters
  const isShowingVerifiedVoters = metric === 'supporters' && (topicFilter === 'all' || topicFilter === 'myTopics');
  const metricLabel = metric === 'supporters'
    ? (isShowingVerifiedVoters ? 'verified voters' : 'supporters')
    : 'viewpoints';

  // Calculate total supporters across all topics
  const totalSupportersAllTopics = useMemo(() => {
    return Object.values(topicSupporterCounts).reduce((sum, count) => sum + count, 0);
  }, [topicSupporterCounts]);

  // Check if you should be shown in this filtered view
  const shouldShowYou =
    topicFilter === 'all' ||
    topicFilter === 'myTopics' ||
    yourTopics.includes(topicFilter);

  // Find your rank (only if you should be shown)
  const yourRank = shouldShowYou
    ? sortedLeaders.findIndex(l => {
        const leaderValue = metric === 'supporters' ? l.totalSupporters : l.totalViewpoints;
        return leaderValue <= yourValue;
      }) + 1
    : 0;

  const totalLeaders = sortedLeaders.length;
  const percentile = yourRank > 0 && totalLeaders > 0 ? Math.round((1 - yourRank / totalLeaders) * 100) : 0;

  // Get top 10 leaders for display
  const topLeaders = sortedLeaders.slice(0, 10);
  const maxValue = topLeaders.length > 0
    ? Math.max(
        ...topLeaders.map(l => metric === 'supporters' ? l.totalSupporters : l.totalViewpoints),
        yourValue
      )
    : yourValue;

  // Calculate stats (handle empty case)
  const avgValue = totalLeaders > 0
    ? Math.round(
        sortedLeaders.reduce((sum, l) =>
          sum + (metric === 'supporters' ? l.totalSupporters : l.totalViewpoints), 0
        ) / sortedLeaders.length
      )
    : 0;

  // Check if this is a topic only you have
  const onlyYouOnTopic = shouldShowYou && totalLeaders === 0;

  const secondaryLabel = metric === 'supporters' ? 'viewpoints' : (isShowingVerifiedVoters ? 'verified voters' : 'supporters');
  const metricIcon = metric === 'supporters' ? Users : MessageSquare;
  const MetricIcon = metricIcon;

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-1">
          <div className="pt-5 text-sm font-medium text-zinc-900">Leader comparison</div>
          <div className="text-sm text-zinc-500">
            Your influence vs {totalLeaders} other leaders on Sway
          </div>
        </div>

        {/* Controls Row */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Metric Toggle */}
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1">
            <button
              onClick={() => setMetric('supporters')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                metric === 'supporters'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <Users className="h-3.5 w-3.5 inline mr-1.5" />
              Supporters
            </button>
            <button
              onClick={() => setMetric('viewpoints')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                metric === 'viewpoints'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 inline mr-1.5" />
              Viewpoints
            </button>
          </div>

          {/* Topic Filter */}
          {allTopics.length > 0 && (
            <div className="relative flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-500" />
              <div className="relative">
                <input
                  type="text"
                  placeholder={getFilterDisplayName(topicFilter)}
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                  onFocus={() => setShowTopicDropdown(true)}
                  onBlur={() => setTimeout(() => setShowTopicDropdown(false), 200)}
                  className="px-3 py-1.5 text-xs font-medium border border-zinc-200 rounded-md bg-white text-zinc-700 placeholder:text-zinc-500 hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 w-64"
                />
                {showTopicDropdown && (
                  <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto bg-white border border-zinc-200 rounded-md shadow-lg">
                    <button
                      onClick={() => {
                        setTopicFilter('all');
                        setTopicSearch('');
                        setShowTopicDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-zinc-50 border-b border-zinc-100"
                    >
                      <span className="font-medium">All topics</span>
                      <span className="text-zinc-500 ml-1">({leaders.length})</span>
                    </button>
                    {yourTopics.length > 0 && (
                      <button
                        onClick={() => {
                          setTopicFilter('myTopics');
                          setTopicSearch('');
                          setShowTopicDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-zinc-50 border-b border-zinc-100"
                      >
                        <span className="font-medium">My topics</span>
                        <span className="text-zinc-500 ml-1">
                          ({leaders.filter(l => l.groups?.some(g => yourTopics.includes(g.title))).length})
                        </span>
                      </button>
                    )}
                    {filteredTopicOptions.length > 0 ? (
                      <>
                        <div className="px-3 py-1.5 text-xs font-medium text-zinc-500 bg-zinc-50 border-b border-zinc-100">
                          Filter by topic
                        </div>
                        {filteredTopicOptions.map(topic => {
                          const count = leaders.filter(l => l.groups?.some(g => g.title === topic)).length;
                          return (
                            <button
                              key={topic}
                              onClick={() => {
                                setTopicFilter(topic);
                                setTopicSearch('');
                                setShowTopicDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left text-xs hover:bg-zinc-50 border-b border-zinc-100 last:border-b-0"
                            >
                              <span className="text-zinc-900">{topic}</span>
                              <span className="text-zinc-500 ml-1">({count})</span>
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <div className="px-3 py-2 text-xs text-zinc-500">
                        No topics match "{topicSearch}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white border border-zinc-200/70">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-zinc-500" />
              <div className="text-xs text-zinc-500">Your ranking</div>
            </div>
            {shouldShowYou ? (
              onlyYouOnTopic ? (
                <>
                  <div className="text-2xl font-semibold tracking-tight text-zinc-900">
                    #1
                  </div>
                  <div className="text-sm text-zinc-600 mt-1">
                    Only leader on this topic
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-semibold tracking-tight text-zinc-900">
                    {yourRank > 0 ? `#${yourRank}` : 'Top tier'}
                  </div>
                  <div className="text-sm text-zinc-600 mt-1">
                    Top {percentile}% of leaders
                  </div>
                </>
              )
            ) : (
              <>
                <div className="text-2xl font-semibold tracking-tight text-zinc-500">
                  —
                </div>
                <div className="text-sm text-zinc-500 mt-1">
                  Not in this topic
                </div>
              </>
            )}
          </div>

          <div className="p-4 rounded-lg bg-white border border-zinc-200/70">
            <div className="flex items-center gap-2 mb-2">
              <MetricIcon className="h-4 w-4 text-zinc-500" />
              <div className="text-xs text-zinc-500">Average {metricLabel}</div>
            </div>
            {onlyYouOnTopic ? (
              <>
                <div className="text-2xl font-semibold tracking-tight text-zinc-500">
                  —
                </div>
                <div className="text-sm text-zinc-500 mt-1">
                  No other leaders
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-semibold tracking-tight text-zinc-900">
                  {avgValue.toLocaleString()}
                </div>
                {shouldShowYou && (
                  <div className="text-sm text-zinc-600 mt-1">
                    You have {yourValue.toLocaleString()} {metricLabel}
                    {isShowingVerifiedVoters && totalSupportersAllTopics > 0 && (
                      <div className="text-xs text-zinc-500 mt-0.5">
                        ({totalSupportersAllTopics.toLocaleString()} supporters across all topics)
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Top Leaders Bar Chart */}
        <div className="mt-6">
          <div className="text-xs font-medium text-zinc-700 mb-3">
            Top 10 leaders by {metricLabel}
          </div>

          {onlyYouOnTopic ? (
            <div className="p-6 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-sm font-medium text-emerald-900 mb-1">
                You're the only leader on this topic!
              </div>
              <div className="text-xs text-emerald-700">
                {yourValue.toLocaleString()} {metricLabel} on "{topicFilter}"
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {topLeaders.map((leader, index) => {
              const leaderValue = metric === 'supporters' ? leader.totalSupporters : leader.totalViewpoints;
              const secondaryValue = metric === 'supporters' ? leader.totalViewpoints : leader.totalSupporters;

              // Determine if "You" should be shown before this leader
              let showYouBefore = false;
              if (shouldShowYou && yourRank <= 10) {
                if (index === 0) {
                  // Show before first leader if you're ranked #1 or higher
                  showYouBefore = yourValue >= leaderValue;
                } else {
                  // Show before this leader if your value is between previous and current leader
                  const prevLeaderValue = metric === 'supporters'
                    ? topLeaders[index - 1].totalSupporters
                    : topLeaders[index - 1].totalViewpoints;
                  showYouBefore = yourValue < prevLeaderValue && yourValue >= leaderValue;
                }
              }
              const barWidth = (leaderValue / maxValue) * 100;

              return (
                <div key={leader.id}>
                  {/* Show "You" marker if this is where you'd rank */}
                  {showYouBefore && (
                    <div className="mb-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-xs font-medium text-emerald-900">
                            #{yourRank} You
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-emerald-700">
                            {metric === 'supporters' ? yourViewpoints : yourStats.supporters} {secondaryLabel}
                          </div>
                          <div className="text-sm font-semibold text-emerald-900">
                            {yourValue.toLocaleString()} {metricLabel}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-emerald-100 rounded-full h-2">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all"
                          style={{ width: `${(yourValue / maxValue) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="text-xs font-medium text-zinc-500 w-6">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium text-zinc-900 truncate">
                          {leader.name}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-zinc-500">
                            {secondaryValue.toLocaleString()} {secondaryLabel}
                          </div>
                          <div className="text-sm font-semibold text-zinc-700">
                            {leaderValue.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-1.5">
                        <div
                          className="bg-zinc-900 h-1.5 rounded-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Show "You" after the last leader if ranked exactly at position 10 or lower within top 10 */}
            {shouldShowYou && yourRank === 10 && topLeaders.length === 10 && (
              <div className="mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-emerald-900">
                      #{yourRank} You
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-emerald-700">
                      {metric === 'supporters' ? yourViewpoints : yourStats.supporters} {secondaryLabel}
                    </div>
                    <div className="text-sm font-semibold text-emerald-900">
                      {yourValue.toLocaleString()} {metricLabel}
                    </div>
                  </div>
                </div>
                <div className="mt-2 w-full bg-emerald-100 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all"
                    style={{ width: `${(yourValue / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          )}

          {!onlyYouOnTopic && shouldShowYou && yourRank > 10 && (
            <div className="mt-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-zinc-700">
                  #{yourRank} You
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-zinc-600">
                    {metric === 'supporters' ? yourViewpoints : yourStats.supporters} {secondaryLabel}
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {yourValue.toLocaleString()} {metricLabel}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
