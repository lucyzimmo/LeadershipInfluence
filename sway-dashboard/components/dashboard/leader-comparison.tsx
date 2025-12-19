"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Award, MessageSquare, Filter } from "lucide-react";

interface LeaderData {
  id: string;
  name: string;
  slug: string;
  totalSupporters: number;
  verifiedVoters: number;
  verificationRate: number;
  growthRate: number;
  reach: number;
  totalViewpoints: number;
  groupCount: number;
  groups?: Array<{
    id: string;
    title: string;
    supporterCount: number;
  }>;
  jurisdictions?: string[];
}

interface LeaderComparisonProps {
  leaders: LeaderData[];
  yourStats: {
    supporters: number;
    viewpoints?: number;
    verificationRate?: number;
    growthRate?: number;
    reach?: number;
  };
  yourTopics?: string[];
  yourJurisdictions?: string[];
  topicSupporterCounts?: Record<string, number>;
}

type ComparisonMetric = 'supporters' | 'viewpoints' | 'verifiedVoters' | 'verificationRate' | 'growthRate' | 'reach';
type LeaderFilter = 'all' | 'myTopics' | 'myStates' | 'similarSize';

export function LeaderComparison({ leaders, yourStats, yourTopics = [], yourJurisdictions = [], topicSupporterCounts = {} }: LeaderComparisonProps) {
  // Check if we have valid verification data for leaders
  const hasVerificationData = useMemo(() => {
    return leaders.some(l => l.verifiedVoters > 0 || l.verificationRate > 0 || l.growthRate > 0 || l.reach > 0);
  }, [leaders]);

  const [metric, setMetric] = useState<ComparisonMetric>(hasVerificationData ? 'verifiedVoters' : 'supporters');
  const [leaderFilter, setLeaderFilter] = useState<LeaderFilter>('all');

  if (!leaders || leaders.length === 0) {
    return null;
  }

  const yourViewpoints = yourStats.viewpoints ?? 0;
  const yourVerificationRate = yourStats.verificationRate ?? 0;
  const yourGrowthRate = yourStats.growthRate ?? 0;
  const yourReach = yourStats.reach ?? 0;

  const filterCounts = useMemo(() => {
    const byTopics = leaders.filter(leader =>
      leader.groups?.some(group => group.title && yourTopics.includes(group.title))
    ).length;
    const byStates = leaders.filter(leader => {
      if (!leader.jurisdictions || leader.jurisdictions.length === 0) return false;
      return leader.jurisdictions.some(j => yourJurisdictions.includes(j));
    }).length;
    const lowerBound = yourStats.supporters * 0.5;
    const upperBound = yourStats.supporters * 1.5;
    const bySize = leaders.filter(leader =>
      leader.verifiedVoters >= lowerBound && leader.verifiedVoters <= upperBound
    ).length;

    return {
      myTopics: byTopics,
      myStates: byStates,
      similarSize: bySize,
    };
  }, [leaders, yourTopics, yourJurisdictions, yourStats.supporters]);

  const hasFilterOptions = filterCounts.myTopics > 0 || filterCounts.myStates > 0 || filterCounts.similarSize > 0;

  useEffect(() => {
    if (leaderFilter === 'myTopics' && filterCounts.myTopics === 0) {
      setLeaderFilter('all');
    }
    if (leaderFilter === 'myStates' && filterCounts.myStates === 0) {
      setLeaderFilter('all');
    }
    if (leaderFilter === 'similarSize' && filterCounts.similarSize === 0) {
      setLeaderFilter('all');
    }
  }, [filterCounts.myStates, filterCounts.myTopics, filterCounts.similarSize, leaderFilter]);

  // Filter leaders based on "Leaders Like You" filter
  const filteredLeaders = useMemo(() => {
    if (leaderFilter === 'all') return leaders;

    if (leaderFilter === 'myTopics') {
      // Filter leaders who share topics with you
      return leaders.filter(leader =>
        leader.groups?.some(group => group.title && yourTopics.includes(group.title))
      );
    }

    if (leaderFilter === 'myStates') {
      // Filter leaders who operate in the same jurisdictions
      return leaders.filter(leader => {
        if (!leader.jurisdictions || leader.jurisdictions.length === 0) return false;
        return leader.jurisdictions.some(j => yourJurisdictions.includes(j));
      });
    }

    if (leaderFilter === 'similarSize') {
      // Filter leaders with similar verified voter count (±50%)
      const lowerBound = yourStats.supporters * 0.5;
      const upperBound = yourStats.supporters * 1.5;
      return leaders.filter(leader =>
        leader.verifiedVoters >= lowerBound && leader.verifiedVoters <= upperBound
      );
    }

    return leaders;
  }, [leaders, leaderFilter, yourTopics, yourJurisdictions, yourStats.supporters]);

  // Sort filtered leaders by selected metric
  const sortedLeaders = [...filteredLeaders].sort((a, b) => {
    switch (metric) {
      case 'verifiedVoters':
        return b.verifiedVoters - a.verifiedVoters;
      case 'verificationRate':
        return b.verificationRate - a.verificationRate;
      case 'growthRate':
        return b.growthRate - a.growthRate;
      case 'reach':
        return b.reach - a.reach;
      default:
        return 0;
    }
  });

  // Calculate yourValue based on metric
  const yourValue = useMemo(() => {
    switch (metric) {
      case 'supporters':
        // For supporters, sum all supporters across all topics
        return Object.values(topicSupporterCounts).reduce((sum, count) => sum + count, 0) || yourStats.supporters;
      case 'viewpoints':
        return yourViewpoints;
      case 'verifiedVoters':
        return yourStats.supporters;
      case 'verificationRate':
        return yourVerificationRate;
      case 'growthRate':
        return yourGrowthRate;
      case 'reach':
        return yourReach;
      default:
        return 0;
    }
  }, [metric, yourStats.supporters, yourVerificationRate, yourGrowthRate, yourReach, yourViewpoints, topicSupporterCounts]);

  // Get metric label and formatting
  const getMetricLabel = (metric: ComparisonMetric): string => {
    switch (metric) {
      case 'supporters':
        return 'supporters';
      case 'viewpoints':
        return 'viewpoints';
      case 'verifiedVoters':
        return 'verified voters';
      case 'verificationRate':
        return 'verification rate';
      case 'growthRate':
        return 'weekly growth';
      case 'reach':
        return 'jurisdictions';
      default:
        return '';
    }
  };

  const formatMetricValue = (value: number, metric: ComparisonMetric): string => {
    switch (metric) {
      case 'supporters':
      case 'viewpoints':
      case 'verifiedVoters':
      case 'reach':
        return value.toLocaleString();
      case 'verificationRate':
        return `${(value * 100).toFixed(1)}%`;
      case 'growthRate':
        return value.toFixed(1);
      default:
        return value.toString();
    }
  };

  const metricLabel = getMetricLabel(metric);

  // Get leader value for a specific metric
  const getLeaderValue = (leader: LeaderData, metric: ComparisonMetric): number => {
    switch (metric) {
      case 'supporters':
        return leader.totalSupporters;
      case 'viewpoints':
        return leader.totalViewpoints;
      case 'verifiedVoters':
        return leader.verifiedVoters;
      case 'verificationRate':
        return leader.verificationRate;
      case 'growthRate':
        return leader.growthRate;
      case 'reach':
        return leader.reach;
      default:
        return 0;
    }
  };

  // Find your rank
  const yourRank = sortedLeaders.findIndex(l => {
    const leaderValue = getLeaderValue(l, metric);
    return leaderValue < yourValue;
  }) + 1;

  const totalLeaders = sortedLeaders.length;
  const percentile = yourRank > 0 && totalLeaders > 0 ? Math.round((1 - yourRank / totalLeaders) * 100) : 0;

  // Get top 10 leaders for display
  const topLeaders = sortedLeaders.slice(0, 10);
  const maxValue = topLeaders.length > 0
    ? Math.max(
        ...topLeaders.map(l => getLeaderValue(l, metric)),
        yourValue
      )
    : yourValue;

  // Calculate average value for the metric
  const avgValue = totalLeaders > 0
    ? sortedLeaders.reduce((sum, l) => sum + getLeaderValue(l, metric), 0) / sortedLeaders.length
    : 0;

  return (
    <Card className="rounded-xl border-zinc-200 shadow-sm">
      <CardContent className="p-7">
        <div className="mb-5">
          <div className="pt-5 text-lg font-bold text-zinc-900">Leader comparison</div>
          <div className="text-base text-zinc-600 mt-1">
            Your influence vs {totalLeaders} other leaders on Sway
          </div>
        </div>

        {/* Controls Row */}
        <div className="mt-4 space-y-3">
          {/* Multi-Dimensional Ranking Toggle */}
          <div>
            <div className="text-xs text-zinc-500 mb-2">Rank by</div>
            <div className="inline-flex flex-wrap gap-2">
              <button
                onClick={() => setMetric('supporters')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  metric === 'supporters'
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                Supporters
              </button>
              <button
                onClick={() => setMetric('viewpoints')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  metric === 'viewpoints'
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                Viewpoints
              </button>
              {hasVerificationData && (
                <>
                  <button
                    onClick={() => setMetric('verifiedVoters')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      metric === 'verifiedVoters'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    Verified Voters
                  </button>
                  <button
                    onClick={() => setMetric('verificationRate')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      metric === 'verificationRate'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    Verification Rate
                  </button>
                  <button
                    onClick={() => setMetric('growthRate')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      metric === 'growthRate'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    Growth
                  </button>
                  <button
                    onClick={() => setMetric('reach')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      metric === 'reach'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    Reach
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Leaders Like You Filter */}
          {hasFilterOptions && (
            <div>
              <div className="text-xs text-zinc-500 mb-2">Show</div>
              <div className="inline-flex flex-wrap gap-2">
                <button
                  onClick={() => setLeaderFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    leaderFilter === 'all'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                  }`}
                >
                  All Leaders
                </button>
                {filterCounts.myTopics > 0 && (
                  <button
                    onClick={() => setLeaderFilter('myTopics')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      leaderFilter === 'myTopics'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    In Your Topics
                  </button>
                )}
                {filterCounts.myStates > 0 && (
                  <button
                    onClick={() => setLeaderFilter('myStates')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      leaderFilter === 'myStates'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    In Your States
                  </button>
                )}
                {filterCounts.similarSize > 0 && (
                  <button
                    onClick={() => setLeaderFilter('similarSize')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      leaderFilter === 'similarSize'
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    Similar Size
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-blue-600" />
              <div className="text-xs font-semibold text-blue-900 uppercase tracking-wider">Your ranking</div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-blue-900">
              {yourRank > 0 ? `#${yourRank}` : `#${totalLeaders + 1}`}
            </div>
            <div className="text-sm font-medium text-blue-700 mt-2">
              {percentile > 0 ? `Top ${percentile}% of leaders` : 'Below top 10'}
            </div>
          </div>

          <div className="p-5 rounded-lg bg-white border border-zinc-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-zinc-500" />
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Average {metricLabel}</div>
            </div>
            {totalLeaders > 0 ? (
              <>
                <div className="text-3xl font-bold tracking-tight text-zinc-900">
                  {formatMetricValue(avgValue, metric)}
                </div>
                <div className="text-sm font-medium text-zinc-600 mt-2">
                  You have {formatMetricValue(yourValue, metric)}
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl font-bold tracking-tight text-zinc-400">
                  —
                </div>
                <div className="text-sm font-medium text-zinc-500 mt-2">
                  No leaders in this filter
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Leaders Bar Chart */}
        <div className="mt-8">
          <div className="text-sm font-bold text-zinc-900 mb-4">
            Top 10 leaders by {metricLabel}
          </div>

          {totalLeaders === 0 ? (
            <div className="p-6 rounded-lg bg-zinc-50 border border-zinc-200 text-center">
              <div className="text-sm font-medium text-zinc-700 mb-1">
                No leaders match this filter
              </div>
              <div className="text-xs text-zinc-500">
                Try a different filter option
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {topLeaders.map((leader, index) => {
              const leaderValue = getLeaderValue(leader, metric);

              // Determine if "You" should be shown before this leader
              let showYouBefore = false;
              if (yourRank <= 10) {
                if (index === 0) {
                  // Show before first leader if you're ranked #1 or higher
                  showYouBefore = yourValue >= leaderValue;
                } else {
                  // Show before this leader if your value is between previous and current leader
                  const prevLeaderValue = getLeaderValue(topLeaders[index - 1], metric);
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
                          <div className="text-sm font-semibold text-emerald-900">
                            {formatMetricValue(yourValue, metric)}
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
                        <div className="text-sm font-semibold text-zinc-700">
                          {formatMetricValue(leaderValue, metric)}
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

            {/* Show "You" after the last leader if ranked exactly at position 10 */}
            {yourRank === 10 && topLeaders.length === 10 && (
              <div className="mt-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-medium text-emerald-900">
                      #{yourRank} You
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-emerald-900">
                      {formatMetricValue(yourValue, metric)}
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

          {yourRank > 10 && (
            <div className="mt-4 p-3 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-zinc-700">
                  #{yourRank} You
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold text-zinc-900">
                    {formatMetricValue(yourValue, metric)}
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
