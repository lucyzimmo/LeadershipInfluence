import type { SwayStaticData } from '../types';
import { MAIN_GROUP_ID } from '../data-loader';
import { parseISO, subDays } from 'date-fns';

export interface SupporterEngagement {
  totalSupporters: number;
  recentJoiners30d: number; // Joined in last 30 days
  recentJoiners90d: number; // Joined in last 90 days
  recentVerificationRate: number; // % of recent joiners who verified
  profileCompleteness: number; // % with bio or display name
  engagementScore: number; // 0-100 composite score
}

/**
 * Compute supporter engagement metrics
 * Measures quality and activity level of supporter base
 */
export function computeSupporterEngagement(
  data: SwayStaticData
): SupporterEngagement {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const ninetyDaysAgo = subDays(now, 90);

  // Get all supporters in the main group
  const supporterRels = data.profileViewpointGroupRels.filter(
    (rel) => rel.viewpoint_group_id === MAIN_GROUP_ID && rel.type === 'supporter'
  );

  const totalSupporters = supporterRels.length;

  // Get profiles for supporters
  const supporterProfileIds = new Set(supporterRels.map((rel) => rel.profile_id));
  const supporterProfiles = data.profiles.filter((p) => supporterProfileIds.has(p.id));

  // Get person IDs for verification checks
  const supporterPersonIds = new Set(supporterProfiles.map((p) => p.person_id));

  // Get verified supporters
  const verifiedPersonIds = new Set(
    data.voterVerifications
      .filter((v) => v.is_fully_verified && supporterPersonIds.has(v.person_id))
      .map((v) => v.person_id)
  );

  // Recent joiners (using created_at from relationship)
  const recentJoiners30d = supporterRels.filter((rel) => {
    if (!rel.created_at) return false;
    const joinDate = parseISO(rel.created_at);
    return joinDate >= thirtyDaysAgo;
  });

  const recentJoiners90d = supporterRels.filter((rel) => {
    if (!rel.created_at) return false;
    const joinDate = parseISO(rel.created_at);
    return joinDate >= ninetyDaysAgo;
  });

  // Verification rate for recent joiners
  const recentJoinerProfileIds = new Set(recentJoiners30d.map((rel) => rel.profile_id));
  const recentJoinerPersonIds = supporterProfiles
    .filter((p) => recentJoinerProfileIds.has(p.id))
    .map((p) => p.person_id);

  const recentVerifiedCount = recentJoinerPersonIds.filter((personId) =>
    verifiedPersonIds.has(personId)
  ).length;

  const recentVerificationRate =
    recentJoiners30d.length > 0 ? recentVerifiedCount / recentJoiners30d.length : 0;

  // Engagement score (0-100 composite)
  // Only calculate if we have recent joiners to measure verification against
  let engagementScore: number | null;

  if (recentJoiners30d.length > 0) {
    // Both metrics available - weighted composite
    const growthScore = Math.min((recentJoiners90d.length / totalSupporters) * 100, 100);
    const verificationScore = recentVerificationRate * 100;
    engagementScore = Math.round(growthScore * 0.6 + verificationScore * 0.4);
  } else {
    // No recent joiners - can't measure engagement meaningfully
    engagementScore = null;
  }

  return {
    totalSupporters,
    recentJoiners30d: recentJoiners30d.length,
    recentJoiners90d: recentJoiners90d.length,
    recentVerificationRate,
    engagementScore,
  };
}
