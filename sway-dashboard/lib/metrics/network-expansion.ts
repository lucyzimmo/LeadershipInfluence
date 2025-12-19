import type {
  SwayStaticData,
  NetworkExpansion,
  TimeSeriesPoint,
} from '../types';
import { MAIN_GROUP_ID } from '../data-loader';

/**
 * Compute network expansion metrics
 * Tracks supporters who become leaders and expand the network
 */
export function computeNetworkExpansion(
  data: SwayStaticData
): NetworkExpansion {
  // 1. Get supporters in the main group
  const mainGroupSupporters = new Set(
    data.profileViewpointGroupRels
      .filter(
        (rel) =>
          rel.viewpoint_group_id === MAIN_GROUP_ID && rel.type === 'supporter'
      )
      .map((rel) => rel.profile_id)
  );

  // 2. Find supporters who are also leaders in OTHER groups
  const connectedLeaderProfiles = new Set<string>();
  const connectedLeaderGroups = new Set<string>();

  for (const rel of data.profileViewpointGroupRels) {
    if (
      rel.type === 'leader' &&
      rel.viewpoint_group_id !== MAIN_GROUP_ID &&
      mainGroupSupporters.has(rel.profile_id)
    ) {
      connectedLeaderProfiles.add(rel.profile_id);
      connectedLeaderGroups.add(rel.viewpoint_group_id);
    }
  }

  const connectedLeaders = connectedLeaderProfiles.size;

  // 3. Count new jurisdictions reached through connected leaders
  // Get jurisdictions covered by main group
  const mainGroupJurisdictions = getGroupJurisdictions(
    data,
    MAIN_GROUP_ID
  );

  // Get jurisdictions covered by connected leader groups
  const newJurisdictions = new Set<string>();
  for (const groupId of connectedLeaderGroups) {
    const groupJurisdictions = getGroupJurisdictions(data, groupId);
    for (const jurisdictionId of groupJurisdictions) {
      if (!mainGroupJurisdictions.has(jurisdictionId)) {
        newJurisdictions.add(jurisdictionId);
      }
    }
  }

  // 4. Compute trend over time (if timestamps available)
  const trend: TimeSeriesPoint[] = [];
  // For now, return empty trend - would need creation dates of connected leader groups

  // 5. Calculate potential leaders (supporters who could become leaders)
  // Heuristic: verified supporters who are not yet leaders
  const verifiedSupporters = getVerifiedSupporters(data, MAIN_GROUP_ID);
  const potentialLeaders = verifiedSupporters.size - connectedLeaders;

  return {
    connectedLeaders,
    newJurisdictions: newJurisdictions.size,
    trend,
    potentialLeaders: Math.max(0, potentialLeaders),
  };
}

/**
 * Get all jurisdictions covered by a viewpoint group's verified voters
 */
function getGroupJurisdictions(
  data: SwayStaticData,
  groupId: string
): Set<string> {
  const jurisdictions = new Set<string>();

  // Get group members
  const memberProfileIds = data.profileViewpointGroupRels
    .filter((rel) => rel.viewpoint_group_id === groupId)
    .map((rel) => rel.profile_id);

  const memberPersonIds = new Set(
    data.profiles
      .filter((p) => memberProfileIds.includes(p.id))
      .map((p) => p.person_id)
  );

  // Get verified voters
  const verifiedVoterIds = new Set(
    data.voterVerifications
      .filter((v) => v.is_fully_verified && memberPersonIds.has(v.person_id))
      .map((v) => v.id)
  );

  // Get their jurisdictions
  for (const rel of data.voterVerificationJurisdictionRels) {
    if (verifiedVoterIds.has(rel.voter_verification_id)) {
      jurisdictions.add(rel.jurisdiction_id);
    }
  }

  return jurisdictions;
}

/**
 * Get verified supporters for a group
 */
function getVerifiedSupporters(
  data: SwayStaticData,
  groupId: string
): Set<string> {
  const supporterProfileIds = data.profileViewpointGroupRels
    .filter((rel) => rel.viewpoint_group_id === groupId)
    .map((rel) => rel.profile_id);

  const supporterPersonIds = new Set(
    data.profiles
      .filter((p) => supporterProfileIds.includes(p.id))
      .map((p) => p.person_id)
  );

  return new Set(
    data.voterVerifications
      .filter((v) => v.is_fully_verified && supporterPersonIds.has(v.person_id))
      .map((v) => v.person_id)
  );
}
