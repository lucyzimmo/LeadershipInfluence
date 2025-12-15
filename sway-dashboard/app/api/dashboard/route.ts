import { NextResponse } from 'next/server';
import { loadSwayData } from '@/lib/data-loader';
import { computeVerifiedVoters } from '@/lib/metrics/verified-voters';
import { computeJurisdictionConcentration } from '@/lib/metrics/jurisdictions';
import { computeBallotExposure } from '@/lib/metrics/ballot-exposure';
import { computeNetworkExpansion } from '@/lib/metrics/network-expansion';
import { deriveActions } from '@/lib/metrics/actions';
import {
  fetchCivicEngineData,
  findAdjacentLeaders,
  fetchBenchmarkGroups,
  fetchUpcomingElections,
} from '@/lib/sway-api';
import { analyzeElectoralLandscape } from '@/lib/api-enhanced/electoral-landscape';
import { findCoalitionOpportunities } from '@/lib/api-enhanced/coalition-finder';
import { calculateMovementVelocity } from '@/lib/api-enhanced/velocity';
import type { DashboardModel } from '@/lib/types';

// Disable static generation - this is a dynamic API route
export const dynamic = 'force-dynamic';

/**
 * Main dashboard API endpoint
 * Returns complete dashboard model with all metrics
 */
export async function GET() {
  try {
    // 1. Load static data
    console.time('Load static data');
    const staticData = await loadSwayData();
    console.timeEnd('Load static data');

    // 2. Compute core metrics
    console.time('Compute core metrics');
    const verifiedVoters = computeVerifiedVoters(staticData);
    const jurisdictions = computeJurisdictionConcentration(staticData);
    const networkExpansion = computeNetworkExpansion(staticData);
    console.timeEnd('Compute core metrics');

    // 3. Optionally fetch API enhancements (non-blocking)
    console.time('Fetch API enhancements');
    let apiEnhancements: Partial<DashboardModel> = {};

    try {
      // Extract context for API queries
      const geoIds = jurisdictions.topJurisdictions
        .map((j) => {
          const jurisdiction = staticData.jurisdictions.find(
            (jur) => jur.id === j.id
          );
          return jurisdiction?.geo_id;
        })
        .filter((id): id is string => id !== undefined);

      const jurisdictionIds = jurisdictions.topJurisdictions.map((j) => j.id);

      // Fetch API data in parallel
      const [civicData, adjacentLeaders, benchmarkGroups, upcomingElections] = await Promise.all([
        fetchCivicEngineData(geoIds),
        findAdjacentLeaders(jurisdictionIds),
        fetchBenchmarkGroups(verifiedVoters.current),
        fetchUpcomingElections(geoIds),
      ]);

      // Log API elections if received
      if (upcomingElections && upcomingElections.length > 0) {
        console.log(`Fetched ${upcomingElections.length} upcoming elections from Sway API`);
      }

      // Process API-enhanced features
      // Note: electoralLandscape will use ballotExposure computed later

      if (adjacentLeaders || staticData.viewpointGroups.length > 1) {
        apiEnhancements.coalitionOpportunities = findCoalitionOpportunities(
          staticData,
          adjacentLeaders
        );
      }

      if (benchmarkGroups || verifiedVoters.growthTrend.length > 0) {
        apiEnhancements.velocity = calculateMovementVelocity(
          verifiedVoters.growthTrend,
          benchmarkGroups
        );
      }

      // Store upcoming elections for ballot exposure computation
      if (upcomingElections) {
        apiEnhancements.upcomingElections = upcomingElections;
      }
    } catch (apiError) {
      console.warn('API enhancement failed, using static data only:', apiError);
    }
    console.timeEnd('Fetch API enhancements');

    // 3.5. Compute ballot exposure with API-enhanced elections data
    const ballotExposure = computeBallotExposure(staticData, apiEnhancements.upcomingElections);

    // 3.6. Compute electoral landscape if civic data available
    if (apiEnhancements.upcomingElections) {
      try {
        apiEnhancements.electoralLandscape = analyzeElectoralLandscape(
          { positions: { nodes: [] } }, // Pass empty civic data structure
          ballotExposure
        );
      } catch (err) {
        console.warn('Electoral landscape analysis failed:', err);
      }
    }

    // 4. Derive intelligent actions
    console.time('Derive actions');
    const focusThisWeek = deriveActions({
      verifiedVoters,
      jurisdictions,
      ballotExposure,
      networkExpansion,
    });
    console.timeEnd('Derive actions');

    // 5. Build complete dashboard model
    const dashboardModel: DashboardModel = {
      summary: {
        verifiedVoters: verifiedVoters.current,
        verificationRate: verifiedVoters.verificationRate,
        derivativeLeaders: networkExpansion.derivativeLeaders,
        lastUpdated: new Date().toISOString(),
      },
      focusThisWeek,
      verifiedVoters,
      jurisdictions,
      ballotExposure,
      networkExpansion,
      ...apiEnhancements,
    };

    return NextResponse.json(dashboardModel);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to compute metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
