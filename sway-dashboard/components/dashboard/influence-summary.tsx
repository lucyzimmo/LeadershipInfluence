"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, XCircle, Clock, Users, Target } from "lucide-react";
import type { BallotExposure } from "@/lib/types";

interface InfluenceSummaryProps {
  ballotExposures: BallotExposure[];
}

export function InfluenceSummary({ ballotExposures }: InfluenceSummaryProps) {
  const verifiedExposures = ballotExposures.filter(
    (exposure) => exposure.verifiedSupporters > 0
  );

  // Categorize ballot items by winnability
  const winnable = verifiedExposures.filter(
    b => b.leverageLevel === 'kingmaker' || b.leverageLevel === 'significant'
  );

  const close = verifiedExposures.filter(
    b => b.leverageLevel === 'marginal' && b.urgency === 'high'
  );

  const lowLeverage = verifiedExposures.filter(
    b => !winnable.includes(b) && !close.includes(b)
  );

  const getDaysUntil = (electionDate: string): number => {
    const now = new Date();
    const election = new Date(electionDate);
    const diffTime = election.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRecommendation = (item: BallotExposure): { why: string; action: string } => {
    const days = getDaysUntil(item.ballotItem.electionDate);
    const voters = item.verifiedSupporters;
    const candidates = item.ballotItem.candidateCount || 2;

    if (item.leverageLevel === 'kingmaker') {
      return {
        why: `${voters} verified voters in a ${candidates}-way race`,
        action: days < 30
          ? "Immediate turnout mobilization — decisive margin"
          : "Schedule voter contact campaign and track turnout"
      };
    }

    if (item.leverageLevel === 'significant') {
      return {
        why: `${voters} verified voters, competitive race`,
        action: days < 30
          ? "Focus on high-engagement messaging and turnout"
          : "Build awareness, ensure voter registration is current"
      };
    }

    if (item.leverageLevel === 'marginal' && item.urgency === 'high') {
      return {
        why: `${voters} voters but election in ${days} days`,
        action: "Recruit more supporters or coalition-build with aligned leaders"
      };
    }

    return {
      why: `Low concentration or distant timeline`,
      action: "Deprioritize — focus on higher-leverage opportunities"
    };
  };

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="pt-5 text-sm font-medium text-zinc-900">Influence Summary (Next 60 Days)</div>
          <div className="text-sm text-zinc-500">
            Where you can decisively influence ballot outcomes
          </div>
        </div>

        <div className="space-y-4">
          {/* Winnable */}
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <div className="text-sm font-semibold text-emerald-900">
                {winnable.length} ballot item{winnable.length !== 1 ? 's' : ''} winnable
              </div>
            </div>

            {winnable.length > 0 ? (
              <div className="space-y-3">
                {winnable.slice(0, 3).map((item, idx) => {
                  const rec = getRecommendation(item);
                  const days = getDaysUntil(item.ballotItem.electionDate);

                  return (
                    <div key={item.ballotItem.id} className="pl-7 space-y-1">
                      <div className="text-sm font-medium text-emerald-900">
                        {item.ballotItem.title || item.ballotItem.officeName}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-emerald-700">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {days} days
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {item.verifiedSupporters} voters
                        </span>
                        {item.jurisdiction && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {item.jurisdiction}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-emerald-700">
                        <strong>Why:</strong> {rec.why}
                      </div>
                      <div className="text-xs text-emerald-800 bg-emerald-100 px-2 py-1 rounded inline-block">
                        <strong>Action:</strong> {rec.action}
                      </div>
                    </div>
                  );
                })}
                {winnable.length > 3 && (
                  <div className="pl-7 text-xs text-emerald-700">
                    + {winnable.length - 3} more winnable race{winnable.length - 3 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ) : (
              <div className="pl-7 text-xs text-emerald-700">
                No highly winnable races in the next 60 days. Focus on building verified voter base.
              </div>
            )}
          </div>

          {/* Close but needs work */}
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div className="text-sm font-semibold text-amber-900">
                {close.length} close but need{close.length !== 1 ? '' : 's'} outreach
              </div>
            </div>

            {close.length > 0 ? (
              <div className="space-y-3">
                {close.slice(0, 2).map((item, idx) => {
                  const rec = getRecommendation(item);
                  const days = getDaysUntil(item.ballotItem.electionDate);

                  return (
                    <div key={item.ballotItem.id} className="pl-7 space-y-1">
                      <div className="text-sm font-medium text-amber-900">
                        {item.ballotItem.title || item.ballotItem.officeName}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-amber-700">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {days} days
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {item.verifiedSupporters} voters
                        </span>
                      </div>
                      <div className="text-xs text-amber-700">
                        <strong>Why:</strong> {rec.why}
                      </div>
                      <div className="text-xs text-amber-800 bg-amber-100 px-2 py-1 rounded inline-block">
                        <strong>Action:</strong> {rec.action}
                      </div>
                    </div>
                  );
                })}
                {close.length > 2 && (
                  <div className="pl-7 text-xs text-amber-700">
                    + {close.length - 2} more close race{close.length - 2 !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ) : (
              <div className="pl-7 text-xs text-amber-700">
                No close races requiring immediate outreach.
              </div>
            )}
          </div>

          {/* Low leverage */}
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="flex items-center gap-2 mb-3">
              <XCircle className="h-5 w-5 text-zinc-500" />
              <div className="text-sm font-semibold text-zinc-700">
                {lowLeverage.length} low-leverage (don't spend time here)
              </div>
            </div>

            {lowLeverage.length > 0 ? (
              <div className="pl-7 text-xs text-zinc-600">
                Focus your energy on the opportunities above. These races have low verified voter concentration or are too far out to prioritize now.
              </div>
            ) : (
              <div className="pl-7 text-xs text-zinc-600">
                All races have actionable leverage.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
