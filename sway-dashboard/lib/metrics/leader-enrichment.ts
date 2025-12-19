import type { SwayStaticData } from '../types';
import { parseISO, subDays } from 'date-fns';

/**
 * Enrich leader data with verification metrics from static data
 * Takes basic leader structure from API and adds metrics computed from local data
 */
export function enrichLeaderMetrics(
  leaders: any[],
  staticData: SwayStaticData
): any[] {
  // Build lookup maps for performance
  const profilesByPersonId = new Map<string, string>();
  staticData.profiles.forEach(p => {
    profilesByPersonId.set(p.person_id, p.id);
  });

  const verifiedPersonIds = new Set(
    staticData.voterVerifications
      .filter(v => v.is_fully_verified)
      .map(v => v.person_id)
  );

  const verificationsByPersonId = new Map<string, any>();
  staticData.voterVerifications.forEach(v => {
    verificationsByPersonId.set(v.person_id, v);
  });

  const jurisdictionsByVerificationId = new Map<string, Set<string>>();
  staticData.voterVerificationJurisdictionRels.forEach(rel => {
    if (!jurisdictionsByVerificationId.has(rel.voter_verification_id)) {
      jurisdictionsByVerificationId.set(rel.voter_verification_id, new Set());
    }
    jurisdictionsByVerificationId.get(rel.voter_verification_id)!.add(rel.jurisdiction_id);
  });

  const jurisdictionsById = new Map(
    staticData.jurisdictions.map(j => [j.id, j])
  );

  const thirtyDaysAgo = subDays(new Date(), 30);

  return leaders.map(leader => {
    // Get verification data for this leader's groups (from static data)
    const verifiedSupporterPersonIds = new Set<string>();
    const supporterJurisdictionIds = new Set<string>();
    const jurisdictionNames: string[] = [];

    // Find this leader's groups in static data
    const leaderGroupIds = leader.groups?.map((g: any) => g.id) || [];

    staticData.profileViewpointGroupRels.forEach(rel => {
      if (leaderGroupIds.includes(rel.viewpoint_group_id)) {
        const profile = staticData.profiles.find(p => p.id === rel.profile_id);
        if (profile) {
          // Check if verified
          if (verifiedPersonIds.has(profile.person_id)) {
            verifiedSupporterPersonIds.add(profile.person_id);

            // Get jurisdictions for this verified person
            const verification = verificationsByPersonId.get(profile.person_id);
            if (verification) {
              const verificationJurisdictions = jurisdictionsByVerificationId.get(verification.id);
              if (verificationJurisdictions) {
                verificationJurisdictions.forEach(jId => {
                  supporterJurisdictionIds.add(jId);
                  const jurisdiction = jurisdictionsById.get(jId);
                  if (jurisdiction && !jurisdictionNames.includes(jurisdiction.name)) {
                    jurisdictionNames.push(jurisdiction.name);
                  }
                });
              }
            }
          }
        }
      }
    });

    const verifiedVoters = verifiedSupporterPersonIds.size;
    // Note: verification rate should be calculated against API's totalSupporters
    const verificationRate = leader.totalSupporters > 0 ? verifiedVoters / leader.totalSupporters : 0;

    // Calculate growth rate (30-day trend)
    let recentVerifications = 0;
    Array.from(verifiedSupporterPersonIds).forEach(personId => {
      const verification = verificationsByPersonId.get(personId);
      if (verification?.created_at) {
        const createdDate = parseISO(verification.created_at);
        if (createdDate >= thirtyDaysAgo) {
          recentVerifications++;
        }
      }
    });

    const growthRate = (recentVerifications / 30) * 7; // Weekly growth rate
    const reach = supporterJurisdictionIds.size;

    // Only enrich with verification metrics, keep API's supporter count
    return {
      ...leader,
      // Don't overwrite totalSupporters - keep the accurate count from API
      verifiedVoters,
      verificationRate,
      growthRate,
      reach,
      jurisdictions: jurisdictionNames,
    };
  });
}
