"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, UserCheck } from "lucide-react";
import type { SupporterEngagement } from "@/lib/types";

interface SupporterEngagementProps {
  engagement: SupporterEngagement;
}

export function SupporterEngagementCard({ engagement }: SupporterEngagementProps) {
  return (
    <Card className="rounded-xl border-zinc-200 shadow-sm">
      <CardContent className="p-7">
        <div className="mb-5">
          <div className="pt-5 text-lg font-bold text-zinc-900">Supporter activity</div>
          <div className="text-base text-zinc-600 mt-1">Recent growth and verification trends</div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent Growth */}
          <div className="p-4 rounded-lg bg-white border-2 border-zinc-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Recent growth
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900">
              {engagement.recentJoiners30d}
            </div>
            <div className="text-sm text-zinc-600 mt-2">
              New supporters (30 days)
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              {engagement.recentJoiners90d} in last 90 days
            </div>
          </div>

          {/* Verification Momentum */}
          <div className="p-4 rounded-lg bg-white border-2 border-zinc-200">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Verification rate
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-zinc-900">
              {Math.round(engagement.recentVerificationRate * 100)}%
            </div>
            <div className="text-sm text-zinc-600 mt-2">
              Of recent joiners verified
            </div>
            <div className={`text-xs font-medium mt-1 ${
              engagement.recentVerificationRate > 0.5 ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {engagement.recentVerificationRate > 0.5 ? 'Strong momentum' : 'Needs improvement'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
