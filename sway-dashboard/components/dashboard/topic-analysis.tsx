"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Users, TrendingUp, AlertCircle } from "lucide-react";

interface TopicAnalysisProps {
  topics: string[];
  topicSupporterCounts: Record<string, number>;
  topicVerifiedVoterCounts: Record<string, number>;
}

export function TopicAnalysis({ topics, topicSupporterCounts, topicVerifiedVoterCounts }: TopicAnalysisProps) {
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);

  if (!topics || topics.length === 0) {
    return null;
  }

  const currentTopic = topics[currentTopicIndex];
  const supporterCount = topicSupporterCounts[currentTopic] || 0;
  const verifiedVoterCount = topicVerifiedVoterCounts[currentTopic] || 0;

  // Calculate support level
  const getSupportLevel = (count: number): { level: string; color: string; message: string } => {
    if (count === 0) {
      return {
        level: "Critical",
        color: "text-red-600",
        message: "No supporters yet - high priority for outreach"
      };
    } else if (count < 50) {
      return {
        level: "Needs Support",
        color: "text-orange-600",
        message: "Growing but needs more engagement"
      };
    } else if (count < 200) {
      return {
        level: "Developing",
        color: "text-yellow-600",
        message: "Good momentum, keep building"
      };
    } else {
      return {
        level: "Strong",
        color: "text-emerald-600",
        message: "Well-established supporter base"
      };
    }
  };

  const supportLevel = getSupportLevel(supporterCount);

  // Calculate actual verified percentage
  const verifiedPercentage = supporterCount > 0
    ? Math.round((verifiedVoterCount / supporterCount) * 100)
    : 0;

  const handlePrevious = () => {
    setCurrentTopicIndex((prev) => (prev - 1 + topics.length) % topics.length);
  };

  const handleNext = () => {
    setCurrentTopicIndex((prev) => (prev + 1) % topics.length);
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
              <div className="text-lg font-semibold text-zinc-900">{currentTopic}</div>
              <div className="text-xs text-zinc-500 mt-1">
                Topic {currentTopicIndex + 1} of {topics.length}
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
                  {supporterCount === 0 && "No supporters yet - consider promoting this viewpoint"}
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

            {/* Engagement Metrics */}
            <div className="mt-6 pt-6 border-t border-zinc-200">
              <div className="text-sm font-medium text-zinc-900 mb-3">Engagement insights</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    This topic has no supporters yet. Consider sharing your viewpoint to attract initial followers.
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
