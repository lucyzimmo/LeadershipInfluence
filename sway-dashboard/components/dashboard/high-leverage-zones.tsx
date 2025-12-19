"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowRight, AlertTriangle, XCircle } from "lucide-react";
import type { JurisdictionConcentration, BallotExposure } from "@/lib/types";

interface HighLeverageZonesProps {
  jurisdictions: JurisdictionConcentration;
  ballotExposures: BallotExposure[];
  totalVerifiedVoters: number;
}

interface LeverageZone {
  name: string;
  verifiedVoters: number;
  concentration: number;
  ballotItems: number;
  type: 'immediate' | 'persuasion' | 'deprioritize';
  reason: string;
  action: string;
}

export function HighLeverageZones({
  jurisdictions,
  ballotExposures,
  totalVerifiedVoters,
}: HighLeverageZonesProps) {
  // Build high-leverage zones from jurisdiction data
  const zones: LeverageZone[] = [];

  for (const jur of jurisdictions.topJurisdictions.slice(0, 10)) {
    const concentration = jur.verifiedVoters / totalVerifiedVoters;

    // Find ballot items in this jurisdiction
    const ballotItemsInJurisdiction = ballotExposures.filter(
      b => (b.jurisdictionId && b.jurisdictionId === jur.id) || b.jurisdiction === jur.name
    );

    // Count high-urgency, high-leverage ballot items
    const urgentBallots = ballotItemsInJurisdiction.filter(
      b => b.urgency === 'high' && (b.leverageLevel === 'kingmaker' || b.leverageLevel === 'significant')
    );

    const competitiveBallots = ballotItemsInJurisdiction.filter(
      b => b.leverageLevel === 'significant' || b.leverageLevel === 'kingmaker'
    );

    // Determine zone type based on concentration and ballot opportunities
    let type: 'immediate' | 'persuasion' | 'deprioritize';
    let reason: string;
    let action: string;

    if (urgentBallots.length > 0 && concentration > 0.1) {
      type = 'immediate';
      reason = `${jur.verifiedVoters} verified voters (${(concentration * 100).toFixed(0)}% of your base) + ${urgentBallots.length} urgent ballot${urgentBallots.length !== 1 ? 's' : ''}`;
      action = 'Immediate turnout mobilization — decisive margin possible';
    } else if (competitiveBallots.length > 0 && concentration > 0.05) {
      type = 'immediate';
      reason = `High concentration (${(concentration * 100).toFixed(0)}%) with ${competitiveBallots.length} winnable race${competitiveBallots.length !== 1 ? 's' : ''}`;
      action = 'Focus resources here — strong leverage opportunity';
    } else if (ballotItemsInJurisdiction.length > 0 && jur.verifiedVoters >= 10) {
      type = 'persuasion';
      reason = `${jur.verifiedVoters} voters but lower concentration (${(concentration * 100).toFixed(0)}%)`;
      action = 'Expand verified voter base or build coalitions with local leaders';
    } else {
      type = 'deprioritize';
      reason = `Low concentration (${(concentration * 100).toFixed(0)}%) or distant elections`;
      action = 'Focus energy on higher-leverage zones above';
    }

    zones.push({
      name: jur.name,
      verifiedVoters: jur.verifiedVoters,
      concentration,
      ballotItems: ballotItemsInJurisdiction.length,
      type,
      reason,
      action,
    });
  }

  // Sort: immediate first, then persuasion, then deprioritize
  // Within each type, sort by concentration descending
  const typeOrder = { immediate: 0, persuasion: 1, deprioritize: 2 };
  zones.sort((a, b) => {
    if (a.type !== b.type) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    return b.concentration - a.concentration;
  });

  const immediateZones = zones.filter(z => z.type === 'immediate');
  const persuasionZones = zones.filter(z => z.type === 'persuasion');
  const deprioritizeZones = zones.filter(z => z.type === 'deprioritize');

  return (
    <Card className="rounded-xl border-zinc-200/70 shadow-sm">
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="pt-5 text-sm font-medium text-zinc-900">High-Leverage Zones</div>
          <div className="text-sm text-zinc-500">
            Where to invest your time, ranked by strategic impact
          </div>
        </div>

        <div className="space-y-3">
          {/* Immediate zones */}
          {immediateZones.map((zone, idx) => (
            <div
              key={zone.name}
              className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <div className="font-medium text-emerald-900">{zone.name}</div>
                </div>
                <div className="text-xs font-semibold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded">
                  PRIORITY
                </div>
              </div>

              <div className="text-sm text-emerald-800 mb-2">
                {zone.reason}
              </div>

              <div className="flex items-start gap-2 text-sm text-emerald-900 bg-white px-3 py-2 rounded border border-emerald-200">
                <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div><strong>Action:</strong> {zone.action}</div>
              </div>
            </div>
          ))}

          {/* Persuasion zones */}
          {persuasionZones.slice(0, 2).map((zone, idx) => (
            <div
              key={zone.name}
              className="p-4 rounded-lg bg-amber-50 border border-amber-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <div className="font-medium text-amber-900">{zone.name}</div>
                </div>
                <div className="text-xs font-semibold text-amber-700 px-2 py-0.5 bg-amber-100 rounded">
                  BUILD
                </div>
              </div>

              <div className="text-sm text-amber-800 mb-2">
                {zone.reason}
              </div>

              <div className="flex items-start gap-2 text-sm text-amber-900 bg-white px-3 py-2 rounded border border-amber-200">
                <ArrowRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div><strong>Action:</strong> {zone.action}</div>
              </div>
            </div>
          ))}

          {/* Deprioritize zones */}
          {deprioritizeZones.length > 0 && (
            <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-zinc-500" />
                <div className="font-medium text-zinc-700">
                  {deprioritizeZones.length} zone{deprioritizeZones.length !== 1 ? 's' : ''} to deprioritize
                </div>
              </div>

              <div className="text-sm text-zinc-600">
                <strong className="text-zinc-700">These areas have low concentration or distant elections.</strong> Focus your energy on the high-priority zones above for maximum impact. Return to these zones after establishing dominance in priority areas.
              </div>

              {deprioritizeZones.length <= 3 && (
                <div className="mt-2 text-xs text-zinc-500">
                  {deprioritizeZones.map(z => z.name).join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
