"use client";

import { useEffect, useState } from "react";
import type { DashboardModel } from "@/lib/types";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { FocusSection } from "@/components/dashboard/focus-section";
import { GrowthChart } from "@/components/dashboard/growth-chart";
import { JurisdictionTable } from "@/components/dashboard/jurisdiction-table";
import { BallotExposureList } from "@/components/dashboard/ballot-exposure-list";

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Leader Influence Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Transform political support data into actionable strategic intelligence
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              Last updated:{" "}
              {new Date(dashboard.summary.lastUpdated).toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* This Week's Focus */}
          {dashboard.focusThisWeek.length > 0 && (
            <FocusSection insights={dashboard.focusThisWeek} />
          )}

          {/* Overview Cards */}
          <OverviewCards summary={dashboard.summary} />

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
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Network Expansion</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">
                    {dashboard.networkExpansion.derivativeLeaders}
                  </div>
                  <div className="text-sm text-gray-600">Derivative Leaders</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Supporters who became leaders
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">
                    {dashboard.networkExpansion.newJurisdictions}
                  </div>
                  <div className="text-sm text-gray-600">New Jurisdictions</div>
                  <p className="text-xs text-gray-500 mt-1">
                    Unlocked through derivative leaders
                  </p>
                </div>
                {dashboard.networkExpansion.potentialLeaders !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold">
                      {dashboard.networkExpansion.potentialLeaders}
                    </div>
                    <div className="text-sm text-gray-600">Potential Leaders</div>
                    <p className="text-xs text-gray-500 mt-1">
                      Verified supporters who could lead
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* API-Enhanced Features */}
          {dashboard.coalitionOpportunities &&
            dashboard.coalitionOpportunities.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold mb-4">
                  Coalition Opportunities
                </h2>
                <div className="space-y-3">
                  {dashboard.coalitionOpportunities.map((coalition, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="font-semibold">{coalition.leaderName}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {coalition.supporterCount} supporters •{" "}
                        {coalition.sharedJurisdictions.length} shared
                        jurisdictions • {coalition.sharedBallotItems} shared
                        ballot items
                      </div>
                      <div className="text-sm text-gray-600">
                        Synergy Score:{" "}
                        {(coalition.synergyScore * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Movement Velocity */}
          {dashboard.velocity && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">Movement Velocity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">
                    {dashboard.velocity.yourGrowthRate.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Supporters per week
                  </div>
                  <div className="text-sm text-gray-500 mt-1 capitalize">
                    Trend: {dashboard.velocity.trendDirection}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold">
                    +{dashboard.velocity.projection.in30Days} / +
                    {dashboard.velocity.projection.in90Days}
                  </div>
                  <div className="text-sm text-gray-600">
                    Projected growth (30/90 days)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Sway Leader Influence Dashboard • Built for strategic political organizing
          </p>
        </div>
      </footer>
    </div>
  );
}
