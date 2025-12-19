import { NextResponse } from 'next/server';
import { loadSwayData } from '@/lib/data-loader';
import { computeVerifiedVoters } from '@/lib/metrics/verified-voters';
import { computeJurisdictionConcentration } from '@/lib/metrics/jurisdictions';
import { computeBallotExposure } from '@/lib/metrics/ballot-exposure';
import { computeBallotItemInfluence } from '@/lib/metrics/ballot-items';
import { fetchBallotItemMeasureDetails } from '@/lib/sway-api';
import { computeNetworkExpansion } from '@/lib/metrics/network-expansion';
import { computeSupporterEngagement } from '@/lib/metrics/supporter-engagement';
import { enrichLeaderMetrics } from '@/lib/metrics/leader-enrichment';
import { deriveActions } from '@/lib/metrics/actions';
import {
  fetchCivicEngineData,
  findAdjacentLeaders,
  fetchBenchmarkGroups,
  fetchUpcomingElections,
  fetchTopLeaders,
} from '@/lib/sway-api';
import { analyzeElectoralLandscape } from '@/lib/api-enhanced/electoral-landscape';
import { findCoalitionOpportunities } from '@/lib/api-enhanced/coalition-finder';
import { calculateMovementVelocity } from '@/lib/api-enhanced/velocity';
import type { DashboardModel, TopicMetrics } from '@/lib/types';
import { parseISO, subDays } from 'date-fns';

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
    const supporterEngagement = computeSupporterEngagement(staticData);
    console.timeEnd('Compute core metrics');

    // 3. Optionally fetch API enhancements (non-blocking)
    console.time('Fetch API enhancements');
    let apiEnhancements: Partial<DashboardModel> & { upcomingElections?: any[] } = {};

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
      const [civicData, adjacentLeaders, benchmarkGroups, upcomingElections, topLeaders] = await Promise.all([
        fetchCivicEngineData(geoIds),
        findAdjacentLeaders(jurisdictionIds),
        fetchBenchmarkGroups(verifiedVoters.current),
        fetchUpcomingElections(geoIds),
        fetchTopLeaders(50),
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

      // Store leader comparison data and enrich with verification metrics from static data
      if (topLeaders && topLeaders.length > 0) {
        apiEnhancements.leaderComparison = enrichLeaderMetrics(topLeaders, staticData);
        console.log(`Fetched ${topLeaders.length} leaders for comparison`);
      }
    } catch (apiError) {
      console.warn('API enhancement failed, using static data only:', apiError);
    }
    console.timeEnd('Fetch API enhancements');

    // 3.5. Compute ballot exposure with API-enhanced elections data
    const ballotExposure = computeBallotExposure(staticData, apiEnhancements.upcomingElections);
    let ballotItemsInfluence = computeBallotItemInfluence(staticData);

    // Enrich measure titles/summaries from API when available
    try {
      const missingTitleIds = ballotItemsInfluence
        .filter((item) => item.type === 'measure' && item.title.startsWith('Measure in '))
        .map((item) => item.id);
      if (missingTitleIds.length > 0) {
        const measureDetails = await fetchBallotItemMeasureDetails(missingTitleIds);
        ballotItemsInfluence = ballotItemsInfluence.map((item) => {
          const detail = measureDetails[item.id];
          if (!detail) return item;
          const enrichedTitle =
            detail.influenceTarget?.description ||
            detail.title ||
            detail.name ||
            item.title;
          const enrichedSummary = detail.summary || item.measureSummary;
          return {
            ...item,
            title: enrichedTitle,
            measureSummary: enrichedSummary,
          };
        });
      }
    } catch (error) {
      console.warn('Ballot item enrichment failed:', error);
    }

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
    // Count viewpoints (only count those with titles)
    const yourTopics = staticData.viewpointGroups.map(g => g.title).filter((t): t is string => !!t);
    const yourViewpoints = yourTopics.length;

    // Calculate comprehensive topic metrics
    const topicSupporterCounts: Record<string, number> = {};
    const topicVerifiedVoterCounts: Record<string, number> = {};
    const topicMetrics: Record<string, TopicMetrics> = {};

    // Build lookup maps for efficiency
    const verifiedPersonIds = new Set(
      staticData.voterVerifications
        .filter(v => v.is_fully_verified)
        .map(v => v.person_id)
    );

    const profileToPersonId = new Map(
      staticData.profiles.map(p => [p.id, p.person_id])
    );

    // Build jurisdiction lookup map
    const jurisdictionMap = new Map(
      staticData.jurisdictions.map(j => [j.id, j])
    );

    // Date calculations for growth metrics
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const ninetyDaysAgo = subDays(now, 90);

    staticData.viewpointGroups.forEach(group => {
      if (group.title) {
        // Get all relationships for this topic
        const allRels = staticData.profileViewpointGroupRels.filter(
          rel => rel.viewpoint_group_id === group.id
        );
        
        const supporterRels = allRels.filter(rel => rel.type === 'supporter');
        const leaderRels = allRels.filter(rel => rel.type === 'leader');

        // Calculate supporter counts
        const supporterCount = supporterRels.length;
        topicSupporterCounts[group.title] = supporterCount;

        // Calculate verified voters
        let verifiedCount = 0;
        const verifiedProfileIds = new Set<string>();
        for (const rel of supporterRels) {
          const personId = profileToPersonId.get(rel.profile_id);
          if (personId && verifiedPersonIds.has(personId)) {
            verifiedCount++;
            verifiedProfileIds.add(rel.profile_id);
          }
        }
        topicVerifiedVoterCounts[group.title] = verifiedCount;

        // Calculate recent joiners (30d and 90d)
        const recentJoiners30d = supporterRels.filter(rel => {
          if (!rel.created_at) return false;
          const joinDate = parseISO(rel.created_at);
          return joinDate >= thirtyDaysAgo;
        }).length;

        const recentJoiners90d = supporterRels.filter(rel => {
          if (!rel.created_at) return false;
          const joinDate = parseISO(rel.created_at);
          return joinDate >= ninetyDaysAgo;
        }).length;

        // Calculate jurisdictions for this topic's verified voters
        const topicVerifiedVoterIds = new Set(
          staticData.voterVerifications
            .filter(v => {
              const personId = v.person_id;
              const profile = staticData.profiles.find(p => p.person_id === personId);
              return profile && verifiedProfileIds.has(profile.id) && v.is_fully_verified;
            })
            .map(v => v.id)
        );

        const jurisdictionCounts = new Map<string, number>();
        for (const rel of staticData.voterVerificationJurisdictionRels) {
          if (topicVerifiedVoterIds.has(rel.voter_verification_id)) {
            const count = jurisdictionCounts.get(rel.jurisdiction_id) || 0;
            jurisdictionCounts.set(rel.jurisdiction_id, count + 1);
          }
        }

        // Helper function to format jurisdiction name properly
        // Filters out raw IDs, geocodes, and ensures proper formatting
        const formatJurisdictionName = (jurisdiction: typeof staticData.jurisdictions[0] | undefined): string | null => {
          if (!jurisdiction) return null;
          
          // Prefer estimated_name or name if they exist and are meaningful
          const name = jurisdiction.estimated_name || jurisdiction.name;
          
          // Helper to check if name already contains state (handles both full name and abbreviations)
          const nameContainsState = (nameStr: string, state: string): boolean => {
            const lowerName = nameStr.toLowerCase();
            const lowerState = state.toLowerCase();
            // Check for full state name
            if (lowerName.includes(lowerState)) {
              return true;
            }
            // Check for common state abbreviations
            const stateAbbrevs: Record<string, string> = {
              'california': 'ca',
              'texas': 'tx',
              'new york': 'ny',
              'florida': 'fl',
              // Add more as needed
            };
            const abbrev = stateAbbrevs[lowerState];
            return abbrev ? lowerName.includes(abbrev) : false;
          };
          
          // If name exists, check if it's meaningful (not just a numeric geocode)
          if (name && name.trim()) {
            const trimmedName = name.trim();
            // Skip if it's just a numeric string (like "0600002" or "0600007") - these are geocodes
            if (/^\d+$/.test(trimmedName)) {
              // This is a geocode, not a proper name - don't use it
              // Fall through to check for state info
            } else {
              // Valid name - check if we need to add state
              if (jurisdiction.state && !nameContainsState(trimmedName, jurisdiction.state)) {
                // Add state if it's not already in the name (avoid "Texas, TX" redundancy)
                return `${trimmedName}, ${jurisdiction.state}`;
              }
              // Return name as-is if it already contains state info or doesn't need it
              return trimmedName;
            }
          }
          
          // If we have state info, use that
          if (jurisdiction.state) {
            // For states (2-digit geoid), just return state name
            if (jurisdiction.type === 'state' || (jurisdiction.geoid && jurisdiction.geoid.length === 2)) {
              return jurisdiction.state;
            }
            // For other types, we need a name - don't return just state for districts/counties
            return null;
          }
          
          // Don't return raw IDs, geocodes, or empty values
          return null;
        };

        const topJurisdictions = Array.from(jurisdictionCounts.entries())
          .map(([jurisdictionId, count]) => {
            const jurisdiction = jurisdictionMap.get(jurisdictionId);
            const formattedName = formatJurisdictionName(jurisdiction);
            
            // Skip if we couldn't format a proper name (i.e., it's just an ID)
            if (!formattedName) return null;
            
            return {
              id: jurisdictionId,
              name: formattedName,
              verifiedCount: count,
            };
          })
          .filter((j): j is NonNullable<typeof j> => j !== null) // Remove nulls
          .sort((a, b) => b.verifiedCount - a.verifiedCount)
          .slice(0, 5); // Top 5 jurisdictions

        // Store comprehensive metrics
        topicMetrics[group.title] = {
          supporterCount,
          verifiedVoterCount: verifiedCount,
          leaderCount: leaderRels.length,
          recentJoiners30d,
          recentJoiners90d,
          topJurisdictions,
          createdDate: group.created_at,
          updatedDate: group.updated_at,
        };

        // Debug logging
        if (process.env.NODE_ENV === 'development') {
          console.log(`Topic "${group.title}": ${supporterCount} supporters, ${verifiedCount} verified, ${leaderRels.length} leaders, ${recentJoiners30d} new (30d)`);
        }
      }
    });

    // Calculate your growth rate and reach
    const yourGrowthRate = verifiedVoters.weeklyGrowthRate || 0;
    const yourReach = jurisdictions.topJurisdictions.length;
    const yourJurisdictions = jurisdictions.topJurisdictions.map(j => {
      const jurisdiction = staticData.jurisdictions.find(jur => jur.id === j.id);
      return jurisdiction?.name || '';
    }).filter(name => name);

    const dashboardModel: DashboardModel = {
      summary: {
        verifiedVoters: verifiedVoters.current,
        verificationRate: verifiedVoters.verificationRate,
        connectedLeaders: networkExpansion.connectedLeaders,
        viewpoints: yourViewpoints,
        topics: yourTopics,
        topicSupporterCounts,
        topicVerifiedVoterCounts,
        topicMetrics,
        growthRate: yourGrowthRate,
        reach: yourReach,
        jurisdictions: yourJurisdictions,
        lastUpdated: new Date().toISOString(),
      },
      focusThisWeek,
      verifiedVoters,
      jurisdictions,
      ballotExposure,
      ballotItemsInfluence,
      networkExpansion,
      supporterEngagement,
      viewpointGroups: staticData.viewpointGroups.filter(g => g.title),
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
