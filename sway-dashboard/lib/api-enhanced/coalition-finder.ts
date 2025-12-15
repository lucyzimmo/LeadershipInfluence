import type {
  SwayStaticData,
  CoalitionOpportunity,
} from '../types';
import { MAIN_GROUP_ID } from '../data-loader';

/**
 * Find potential coalition opportunities with other leaders
 * Based on shared jurisdictions and ballot items
 */
export function findCoalitionOpportunities(
  data: SwayStaticData,
  apiLeaders: any[] | null
): CoalitionOpportunity[] {
  // For now, use static data to demonstrate the concept
  // In production, this would query the Sway API for adjacent leaders

  const opportunities: CoalitionOpportunity[] = [];

  // Get main group's jurisdictions
  const mainJurisdictions = getGroupJurisdictions(data, MAIN_GROUP_ID);

  // Find other groups with overlapping jurisdictions
  const otherGroups = data.viewpointGroups.filter(
    (g) => g.id !== MAIN_GROUP_ID
  );

  for (const group of otherGroups) {
    const groupJurisdictions = getGroupJurisdictions(data, group.id);
    const sharedJurisdictions = Array.from(mainJurisdictions).filter((j) =>
      groupJurisdictions.has(j)
    );

    if (sharedJurisdictions.length === 0) continue;

    // Count supporters in this group
    const supporterCount = data.profileViewpointGroupRels.filter(
      (rel) => rel.viewpoint_group_id === group.id
    ).length;

    // Calculate shared ballot items
    const sharedBallotItems = calculateSharedBallotItems(
      data,
      mainJurisdictions,
      groupJurisdictions
    );

    // Calculate synergy score
    // 50% jurisdiction overlap + 30% ballot overlap + 20% size balance
    const jurisdictionOverlap =
      sharedJurisdictions.length / Math.max(mainJurisdictions.size, 1);
    const ballotOverlap = sharedBallotItems / Math.max(data.ballotItems.length, 1);
    const sizeBalance = Math.min(supporterCount, 100) / 100; // Normalize to 100

    const synergyScore =
      jurisdictionOverlap * 0.5 + ballotOverlap * 0.3 + sizeBalance * 0.2;

    opportunities.push({
      leaderName: group.name,
      groupId: group.id,
      supporterCount,
      sharedJurisdictions: sharedJurisdictions.map((jId) => {
        const j = data.jurisdictions.find((jurisdiction) => jurisdiction.id === jId);
        return j?.name || jId;
      }),
      sharedBallotItems,
      synergyScore,
    });
  }

  // Sort by synergy score
  return opportunities.sort((a, b) => b.synergyScore - a.synergyScore).slice(0, 5);
}

/**
 * Get jurisdictions for a group
 */
function getGroupJurisdictions(
  data: SwayStaticData,
  groupId: string
): Set<string> {
  const jurisdictions = new Set<string>();

  const memberProfileIds = data.profileViewpointGroupRels
    .filter((rel) => rel.viewpoint_group_id === groupId)
    .map((rel) => rel.profile_id);

  const memberPersonIds = new Set(
    data.profiles
      .filter((p) => memberProfileIds.includes(p.id))
      .map((p) => p.person_id)
  );

  const verifiedVoterIds = new Set(
    data.voterVerifications
      .filter((v) => v.is_fully_verified && memberPersonIds.has(v.person_id))
      .map((v) => v.id)
  );

  for (const rel of data.voterVerificationJurisdictionRels) {
    if (verifiedVoterIds.has(rel.voter_verification_id)) {
      jurisdictions.add(rel.jurisdiction_id);
    }
  }

  return jurisdictions;
}

/**
 * Calculate shared ballot items between two groups
 */
function calculateSharedBallotItems(
  data: SwayStaticData,
  jurisdictions1: Set<string>,
  jurisdictions2: Set<string>
): number {
  return data.ballotItems.filter(
    (item) =>
      item.jurisdiction_id &&
      jurisdictions1.has(item.jurisdiction_id) &&
      jurisdictions2.has(item.jurisdiction_id)
  ).length;
}
