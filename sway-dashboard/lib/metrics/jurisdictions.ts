import type {
  SwayStaticData,
  JurisdictionConcentration,
} from '../types';
import { MAIN_GROUP_ID } from '../data-loader';

/**
 * Compute jurisdiction concentration metrics
 * Shows where the leader's verified voters are geographically concentrated
 */
export function computeJurisdictionConcentration(
  data: SwayStaticData
): JurisdictionConcentration {
  // 1. Get verified supporters in the main group
  const supporterProfileIds = data.profileViewpointGroupRels
    .filter((rel) => rel.viewpoint_group_id === MAIN_GROUP_ID)
    .map((rel) => rel.profile_id);

  const supporterPersonIds = new Set(
    data.profiles
      .filter((p) => supporterProfileIds.includes(p.id))
      .map((p) => p.person_id)
  );

  const verifiedVoterIds = new Set(
    data.voterVerifications
      .filter((v) => v.is_fully_verified && supporterPersonIds.has(v.person_id))
      .map((v) => v.id)
  );

  // 2. Count verified voters by jurisdiction
  const jurisdictionCounts = new Map<string, number>();

  for (const rel of data.voterVerificationJurisdictionRels) {
    if (verifiedVoterIds.has(rel.voter_verification_id)) {
      const count = jurisdictionCounts.get(rel.jurisdiction_id) || 0;
      jurisdictionCounts.set(rel.jurisdiction_id, count + 1);
    }
  }

  const totalVoters = verifiedVoterIds.size;

  // 3. Get jurisdiction details and compute percentages
  const jurisdictionData = Array.from(jurisdictionCounts.entries())
    .map(([jurisdictionId, count]) => {
      const jurisdiction = data.jurisdictions.find((j) => j.id === jurisdictionId);

      // Determine type based on geoid pattern and name
      let type = 'unknown';
      const name = jurisdiction?.estimated_name || jurisdiction?.name || 'Unknown';
      const geoid = jurisdiction?.geoid;

      // States have 2-digit FIPS codes (geoid)
      if (geoid && geoid.length === 2) {
        type = 'state';
      } else if (name.toLowerCase().includes('county')) {
        type = 'county';
      } else if (name.toLowerCase().includes('city')) {
        type = 'city';
      } else if (name.toLowerCase().includes('district')) {
        type = 'district';
      } else if (jurisdiction?.state) {
        type = 'district'; // Default for state-level codes
      }

      return {
        id: jurisdictionId,
        name,
        type,
        geoid,
        verifiedCount: count,
        percentage: totalVoters > 0 ? (count / totalVoters) * 100 : 0,
      };
    })
    .sort((a, b) => b.verifiedCount - a.verifiedCount);

  // 4. Compute Herfindahl-Hirschman Index (HHI)
  // HHI = sum of squared market shares
  // Range: 0 (perfectly distributed) to 1 (all in one jurisdiction)
  let hhi = 0;
  if (totalVoters > 0) {
    for (const [, count] of jurisdictionCounts) {
      const share = count / totalVoters;
      hhi += share * share;
    }
  }

  return {
    topJurisdictions: jurisdictionData.slice(0, 10), // Top 10
    concentrationIndex: hhi,
    totalJurisdictions: jurisdictionCounts.size,
  };
}

/**
 * Helper to interpret HHI
 */
export function interpretConcentration(hhi: number): string {
  if (hhi > 0.5) return 'Very High';
  if (hhi > 0.25) return 'High';
  if (hhi > 0.15) return 'Medium';
  return 'Low';
}
