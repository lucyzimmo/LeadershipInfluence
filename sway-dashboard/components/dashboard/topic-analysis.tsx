"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Users, TrendingUp, AlertCircle, MapPin, Crown, Calendar } from "lucide-react";
import type { TopicMetrics } from "@/lib/types";

interface TopicAnalysisProps {
  topics: string[];
  topicSupporterCounts: Record<string, number>;
  topicVerifiedVoterCounts: Record<string, number>;
  topicMetrics?: Record<string, TopicMetrics>;
}

export function TopicAnalysis({ topics, topicSupporterCounts, topicVerifiedVoterCounts, topicMetrics }: TopicAnalysisProps) {
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

  // Validate props
  if (!topics || topics.length === 0) {
    return null;
  }

  // Ensure index stays within bounds if topics array changes
  useEffect(() => {
    if (currentTopicIndex >= topics.length) {
      setCurrentTopicIndex(Math.max(0, topics.length - 1));
    }
  }, [topics.length, currentTopicIndex]);

  // Ensure index is within bounds
  const safeIndex = Math.max(0, Math.min(currentTopicIndex, topics.length - 1));
  const currentTopic = topics[safeIndex];
  
  // Safely get counts with validation
  const supporterCount = (topicSupporterCounts && typeof topicSupporterCounts[currentTopic] === 'number')
    ? topicSupporterCounts[currentTopic]
    : 0;
  const verifiedVoterCount = (topicVerifiedVoterCounts && typeof topicVerifiedVoterCounts[currentTopic] === 'number')
    ? topicVerifiedVoterCounts[currentTopic]
    : 0;
  
  // Get comprehensive metrics if available
  const metrics = topicMetrics?.[currentTopic];
  const leaderCount = metrics?.leaderCount ?? 0;
  const recentJoiners30d = metrics?.recentJoiners30d ?? 0;
  const recentJoiners90d = metrics?.recentJoiners90d ?? 0;
  const topJurisdictions = metrics?.topJurisdictions ?? [];
  const createdDate = metrics?.createdDate ? new Date(metrics.createdDate) : null;
  
  // Calculate topic age
  const topicAge = createdDate ? Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
  // Calculate benchmark metrics safely
  const allSupporterCounts = topicSupporterCounts
    ? Object.values(topicSupporterCounts)
        .filter((count): count is number => typeof count === 'number' && count > 0)
        .sort((a, b) => a - b)
    : [];
  const topCounts = allSupporterCounts.slice(-3);
  const benchmarkMin = topCounts.length > 0 ? Math.min(...topCounts) : null;
  const benchmarkMax = topCounts.length > 0 ? Math.max(...topCounts) : null;

  // Calculate support level
  const getSupportLevel = (count: number): { level: string; color: string; message: string } => {
    if (count === 0) {
      return {
        level: "Critical",
        color: "text-red-600",
        message: "High priority — no supporter base yet"
      };
    } else if (count < 50) {
      return {
        level: "Needs Support",
        color: "text-orange-600",
        message: "Priority — early base, high growth leverage"
      };
    } else if (count < 200) {
      return {
        level: "Developing",
        color: "text-yellow-600",
        message: "Strategic — momentum building"
      };
    } else {
      return {
        level: "Strong",
        color: "text-emerald-600",
        message: "Stable — well-established base"
      };
    }
  };

  const supportLevel = getSupportLevel(supporterCount);

  // Calculate actual verified percentage
  const verifiedPercentage = supporterCount > 0
    ? Math.round((verifiedVoterCount / supporterCount) * 100)
    : 0;

  const handlePrevious = () => {
    setCurrentTopicIndex((prev) => {
      const newIndex = prev - 1;
      return newIndex < 0 ? topics.length - 1 : newIndex;
    });
  };

  const handleNext = () => {
    setCurrentTopicIndex((prev) => {
      const newIndex = prev + 1;
      return newIndex >= topics.length ? 0 : newIndex;
    });
  };

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-1">
          <div className="pt-5 text-sm font-medium text-zinc-900">Topic analysis</div>
          <div className="text-sm text-zinc-500">
            Support levels and growth metrics per topic
          </div>
        </div>

        {/* Topic Slider */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevious}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50"
              disabled={topics.length <= 1}
            >
              <ChevronLeft className="h-5 w-5 text-zinc-600" />
            </button>

            <div className="flex-1 mx-4 text-center">
              <div className="text-lg font-semibold text-zinc-900">{currentTopic || 'Unknown Topic'}</div>
              <div className="text-xs text-zinc-500 mt-1">
                Topic {safeIndex + 1} of {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50"
              disabled={topics.length <= 1}
            >
              <ChevronRight className="h-5 w-5 text-zinc-600" />
            </button>
          </div>

          {/* Topic Breakdown */}
          <div className="mt-4 p-6 rounded-lg bg-white border border-zinc-200/70">
            <div className="text-sm font-medium text-zinc-900 mb-4">Viewpoint breakdown</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Supporter Count */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-zinc-500" />
                  <div className="text-xs text-zinc-500">Total supporters</div>
                </div>
                <div className="text-3xl font-semibold tracking-tight text-zinc-900">
                  {supporterCount.toLocaleString()}
                </div>
                <div className="text-sm text-zinc-600 mt-1">
                  Following this viewpoint
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  {supporterCount === 0 && "No supporters yet — seed this topic with targeted invites"}
                  {supporterCount > 0 && supporterCount < 50 && "Early stage - focus on growth"}
                  {supporterCount >= 50 && supporterCount < 200 && "Building momentum"}
                  {supporterCount >= 200 && "Strong base established"}
                </div>
              </div>

              {/* Support Level */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-zinc-500" />
                  <div className="text-xs text-zinc-500">Support status</div>
                </div>
                <div className={`text-3xl font-semibold tracking-tight ${supportLevel.color}`}>
                  {supportLevel.level}
                </div>
                <div className="text-sm text-zinc-600 mt-1">
                  Priority level
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  {supportLevel.message}
                </div>
              </div>

              {/* Verified Voters */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-zinc-500" />
                  <div className="text-xs text-zinc-500">Verified voters</div>
                </div>
                <div className="text-3xl font-semibold tracking-tight text-zinc-900">
                  {verifiedVoterCount.toLocaleString()}
                </div>
                <div className="text-sm text-zinc-600 mt-1">
                  {supporterCount > 0 ? `${verifiedPercentage}% of supporters` : 'No supporters yet'}
                </div>
                <div className="mt-3 text-xs text-zinc-500">
                  {verifiedVoterCount > 0 ? 'Voter registration verified' : 'No verified voters for this topic'}
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            {metrics && (
              <div className="mt-6 pt-6 border-t border-zinc-200">
                <div className="text-sm font-medium text-zinc-900 mb-3">Additional insights</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Leader Count */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                    <Crown className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-500">Leaders</div>
                      <div className="text-sm font-medium text-zinc-900 mt-1">
                        {leaderCount}
                      </div>
                    </div>
                  </div>

                  {/* Recent Growth 30d */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                    <TrendingUp className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-500">New (30 days)</div>
                      <div className="text-sm font-medium text-zinc-900 mt-1">
                        {recentJoiners30d}
                      </div>
                    </div>
                  </div>

                  {/* Recent Growth 90d */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                    <TrendingUp className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-zinc-500">New (90 days)</div>
                      <div className="text-sm font-medium text-zinc-900 mt-1">
                        {recentJoiners90d}
                      </div>
                    </div>
                  </div>

                  {/* Topic Age */}
                  {topicAge !== null && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                      <Calendar className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-500">Topic age</div>
                        <div className="text-sm font-medium text-zinc-900 mt-1">
                          {topicAge === 0 ? "Today" : topicAge === 1 ? "1 day" : `${topicAge} days`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top Jurisdictions */}
                {topJurisdictions.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Top jurisdictions (verified voters)
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topJurisdictions.map((jurisdiction) => (
                        <div
                          key={jurisdiction.id}
                          className="px-2 py-1 rounded bg-white border border-zinc-200 text-xs"
                        >
                          <span className="font-medium text-zinc-900">{jurisdiction.name}</span>
                          <span className="text-zinc-500 ml-1">({jurisdiction.verifiedCount})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Engagement Metrics */}
            <div className="mt-6 pt-6 border-t border-zinc-200">
              <div className="text-sm font-medium text-zinc-900 mb-3">Engagement insights</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                  <div className="flex-1">
                    <div className="text-xs text-zinc-500">Supporter to verified ratio</div>
                    <div className="text-sm font-medium text-zinc-900 mt-1">
                      {verifiedVoterCount > 0 ? `${(supporterCount / verifiedVoterCount).toFixed(1)}:1` : "N/A"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                  <div className="flex-1">
                    <div className="text-xs text-zinc-500">Growth potential</div>
                    <div className="text-sm font-medium text-zinc-900 mt-1">
                      {supporterCount < 100 ? "High - early stage" : supporterCount < 500 ? "Medium - scaling" : "Mature base"}
                    </div>
                  </div>
                </div>
                {benchmarkMin !== null && benchmarkMax !== null && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50">
                    <div className="flex-1">
                      <div className="text-xs text-zinc-500">Group benchmark</div>
                      <div className="text-sm font-medium text-zinc-900 mt-1">
                        Most active topics: {benchmarkMin.toLocaleString()}–{benchmarkMax.toLocaleString()} supporters
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Priority Indicator */}
          {supporterCount === 0 && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-red-900">
                    High priority: Build initial supporter base
                  </div>
                  <div className="text-sm text-red-700 mt-1">
                    This topic has no supporters yet. Start by inviting a few trusted contacts to seed it.
                  </div>
                </div>
              </div>
            </div>
          )}

          {supporterCount > 0 && supporterCount < 50 && (
            <div className="mt-4 p-4 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-orange-900">
                    Growing: Focus on engagement
                  </div>
                  <div className="text-sm text-orange-700 mt-1">
                    You have {supporterCount} supporters. Continue engaging and sharing content to grow your base.
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
