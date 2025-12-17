"use client";

import { useEffect, useState } from "react";
import type { DashboardModel } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { FocusSection } from "@/components/dashboard/focus-section";
import { GrowthChart } from "@/components/dashboard/growth-chart";
import { JurisdictionTable } from "@/components/dashboard/jurisdiction-table";
import { BallotExposureList } from "@/components/dashboard/ballot-exposure-list";
import { LeaderComparison } from "@/components/dashboard/leader-comparison";
import { TopicAnalysis } from "@/components/dashboard/topic-analysis";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const data = await response.json();
        setDashboard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error || "Failed to load dashboard"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Leader Influence
            </h1>
            <p className="text-sm text-zinc-500">
              Deployable voting power, grounded in verified voters and upcoming ballots
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-500">Last updated</div>
            <div className="text-sm font-medium text-zinc-900">
              {new Date(dashboard.summary.lastUpdated).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* This Week's Focus */}
          {dashboard.focusThisWeek.length > 0 && (
            <FocusSection insights={dashboard.focusThisWeek} />
          )}

          {/* Leader Comparison */}
          {dashboard.leaderComparison && dashboard.leaderComparison.length > 0 && (
            <LeaderComparison
              leaders={dashboard.leaderComparison}
              yourStats={{
                supporters: dashboard.summary.verifiedVoters,
                viewpoints: dashboard.summary.viewpoints,
              }}
              yourTopics={dashboard.summary.topics}
              topicSupporterCounts={dashboard.summary.topicSupporterCounts}
            />
          )}

          {/* Overview Cards */}
          <OverviewCards summary={dashboard.summary} />

          {/* Topic Analysis */}
          {dashboard.summary.topics && dashboard.summary.topics.length > 0 && (
            <TopicAnalysis
              topics={dashboard.summary.topics}
              topicSupporterCounts={dashboard.summary.topicSupporterCounts || {}}
              topicVerifiedVoterCounts={dashboard.summary.topicVerifiedVoterCounts || {}}
            />
          )}

          {/* Growth Chart */}
          {dashboard.verifiedVoters.growthTrend.length > 0 && (
            <GrowthChart
              data={dashboard.verifiedVoters.growthTrend}
              weeklyGrowthRate={dashboard.verifiedVoters.weeklyGrowthRate}
            />
          )}

          {/* Jurisdiction Concentration */}
          <JurisdictionTable data={dashboard.jurisdictions} />

          {/* Ballot Exposure */}
          {dashboard.ballotExposure.length > 0 && (
            <BallotExposureList exposures={dashboard.ballotExposure} />
          )}

          {/* Network Expansion */}
          {dashboard.networkExpansion && (
            <Card className="rounded-xl border-zinc-200/70 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-1">
                  <div className="pt-5 text-sm font-medium text-zinc-900">Network expansion</div>
                  <div className="text-sm text-zinc-500">Leadership development & reach</div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-white border border-zinc-200/70">
                    <div className="text-xs text-zinc-500">Derivative leaders</div>
                    <div className="text-2xl font-semibold tracking-tight text-zinc-900 mt-1">
                      {dashboard.networkExpansion.derivativeLeaders}
                    </div>
                    <div className="text-sm text-zinc-600 mt-2">
                      Supporters who became leaders
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-zinc-200/70">
                    <div className="text-xs text-zinc-500">New jurisdictions</div>
                    <div className="text-2xl font-semibold tracking-tight text-zinc-900 mt-1">
                      {dashboard.networkExpansion.newJurisdictions}
                    </div>
                    <div className="text-sm text-zinc-600 mt-2">
                      Unlocked through derivative leaders
                    </div>
                  </div>
                  {dashboard.networkExpansion.potentialLeaders !== undefined && (
                    <div className="p-4 rounded-lg bg-white border border-zinc-200/70">
                      <div className="text-xs text-zinc-500">Potential leaders</div>
                      <div className="text-2xl font-semibold tracking-tight text-zinc-900 mt-1">
                        {dashboard.networkExpansion.potentialLeaders}
                      </div>
                      <div className="text-sm text-zinc-600 mt-2">
                        Verified supporters who could lead
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* API-Enhanced Features */}
          {dashboard.coalitionOpportunities &&
            dashboard.coalitionOpportunities.length > 0 && (
              <Card className="rounded-xl border-zinc-200/70 shadow-sm">
                <CardContent className="p-6">
                  <div className="mb-1">
                    <div className="pt-5 text-sm font-medium text-zinc-900">Coalition opportunities</div>
                    <div className="text-sm text-zinc-500">Potential partnerships with aligned leaders</div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {dashboard.coalitionOpportunities.map((coalition, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-white border border-zinc-200/70"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-zinc-900">
                              {coalition.leaderName}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-zinc-600 mt-2 flex-wrap">
                              <span>{coalition.supporterCount} supporters</span>
                              <span>{coalition.sharedJurisdictions.length} shared jurisdictions</span>
                              <span>{coalition.sharedBallotItems} shared ballot items</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="text-xs px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
                              {(coalition.synergyScore * 100).toFixed(0)}% synergy
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Movement Velocity */}
          {dashboard.velocity && (
            <Card className="rounded-xl border-zinc-200/70 shadow-sm">
              <CardContent className="p-6">
                <div className="mb-1">
                  <div className="pt-5 text-sm font-medium text-zinc-900">Movement velocity</div>
                  <div className="text-sm text-zinc-500">Growth momentum and projections</div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-white border border-zinc-200/70">
                    <div className="text-xs text-zinc-500">Growth rate</div>
                    <div className="text-2xl font-semibold tracking-tight text-zinc-900 mt-1">
                      {dashboard.velocity.yourGrowthRate.toFixed(1)}
                    </div>
                    <div className="text-sm text-zinc-600 mt-2">
                      Supporters per week
                    </div>
                    <span className="mt-2 inline-block text-xs px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 capitalize">
                      {dashboard.velocity.trendDirection}
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-zinc-200/70">
                    <div className="text-xs text-zinc-500">Projections</div>
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="text-2xl font-semibold tracking-tight text-zinc-900">
                          +{dashboard.velocity.projection.in30Days}
                        </div>
                        <div className="text-sm text-zinc-600">in 30 days</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold tracking-tight text-zinc-900">
                          +{dashboard.velocity.projection.in90Days}
                        </div>
                        <div className="text-sm text-zinc-600">in 90 days</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
