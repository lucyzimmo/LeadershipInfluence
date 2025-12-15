import { differenceInDays, parseISO } from 'date-fns';
import type {
  SwayStaticData,
  BallotExposure,
  UrgencyLevel,
  LeverageLevel,
  OfficeLevel,
} from '../types';
import { MAIN_GROUP_ID } from '../data-loader';

/**
 * Calculate urgency based on days until election
 */
function calculateUrgency(electionDate: Date): UrgencyLevel {
  const days = differenceInDays(electionDate, new Date());
  if (days < 30) return 'high';
  if (days < 90) return 'medium';
  return 'low';
}

/**
 * Leverage multipliers based on office level
 * Local elections have higher per-voter impact due to lower turnout
 */
const leverageMultipliers: Record<OfficeLevel, number> = {
  local: 3.0,
  state: 2.0,
  federal: 1.0,
};

/**
 * Urgency weight multipliers
 */
const urgencyWeights: Record<UrgencyLevel, number> = {
  high: 1.0,
  medium: 0.7,
  low: 0.4,
};

/**
 * Determine leverage level based on verified supporters and competitiveness
 */
function calculateLeverageLevel(
  verifiedSupporters: number,
  candidateCount: number
): LeverageLevel {
  const isTossup = candidateCount >= 4;
  const isCompetitive = candidateCount >= 2;

  if (isTossup && verifiedSupporters >= 500) return 'kingmaker';
  if (isCompetitive && verifiedSupporters >= 200) return 'significant';
  if (verifiedSupporters >= 100) return 'significant';
  return 'marginal';
}

/**
 * Compute ballot exposure metrics
 * Shows which ballot items the leader's verified voters can vote on
 */
export function computeBallotExposure(
  data: SwayStaticData
): BallotExposure[] {
  // 1. Get verified supporters and their jurisdictions
  const supporterProfileIds = data.profileViewpointGroupRels
    .filter((rel) => rel.viewpoint_group_id === MAIN_GROUP_ID)
    .map((rel) => rel.profile_id);

  const supporterPersonIds = new Set(
    data.profiles
      .filter((p) => supporterProfileIds.includes(p.id))
      .map((p) => p.person_id)
  );

  const verifiedVoters = data.voterVerifications.filter(
    (v) => v.is_fully_verified && supporterPersonIds.has(v.person_id)
  );

  // Map: voter_verification_id -> jurisdiction_ids
  const voterJurisdictions = new Map<string, Set<string>>();
  for (const rel of data.voterVerificationJurisdictionRels) {
    if (!voterJurisdictions.has(rel.voter_verification_id)) {
      voterJurisdictions.set(rel.voter_verification_id, new Set());
    }
    voterJurisdictions.get(rel.voter_verification_id)!.add(rel.jurisdiction_id);
  }

  // 2. For each ballot item, count how many verified voters can vote on it
  const ballotExposures: BallotExposure[] = [];

  for (const ballotItem of data.ballotItems) {
    // Get election date
    const election = data.elections.find((e) => e.id === ballotItem.election_id);
    if (!election) continue;

    const electionDate = parseISO(election.poll_date);
    const urgency = calculateUrgency(electionDate);

    // Count verified voters who can vote on this ballot item
    // (their jurisdictions include the ballot item's jurisdiction)
    let verifiedSupporters = 0;
    for (const voter of verifiedVoters) {
      const jurisdictions = voterJurisdictions.get(voter.id);
      if (
        jurisdictions &&
        ballotItem.jurisdiction_id &&
        jurisdictions.has(ballotItem.jurisdiction_id)
      ) {
        verifiedSupporters++;
      }
    }

    // Skip ballot items with no supporters
    if (verifiedSupporters === 0) continue;

    // Get office level and details if it's a race
    let officeLevel: OfficeLevel | undefined;
    let officeName: string | undefined;
    let candidateCount = 0;

    if (ballotItem.type === 'race' && ballotItem.race_id) {
      const race = data.races.find((r) => r.id === ballotItem.race_id);
      if (race) {
        const officeTerm = data.officeTerms.find(
          (ot) => ot.id === race.office_term_id
        );
        if (officeTerm) {
          const office = data.offices.find((o) => o.id === officeTerm.office_id);
          if (office) {
            officeLevel = office.level;
            officeName = office.name;
          }
        }

        // Count candidates
        candidateCount = data.candidacies.filter(
          (c) => c.race_id === race.id
        ).length;
      }
    }

    // Default to local if not specified
    const level = officeLevel || 'local';

    // Calculate leverage score
    const leverageScore =
      verifiedSupporters *
      leverageMultipliers[level] *
      urgencyWeights[urgency];

    const leverageLevel = calculateLeverageLevel(
      verifiedSupporters,
      candidateCount
    );

    const jurisdiction = ballotItem.jurisdiction_id
      ? data.jurisdictions.find((j) => j.id === ballotItem.jurisdiction_id)
          ?.name
      : undefined;

    ballotExposures.push({
      ballotItem: {
        id: ballotItem.id,
        title: ballotItem.title,
        type: ballotItem.type,
        electionDate: election.poll_date,
        officeLevel: level,
        officeName,
        candidateCount,
      },
      verifiedSupporters,
      urgency,
      leverageScore,
      leverageLevel,
      jurisdiction,
    });
  }

  // Sort by leverage score (descending)
  return ballotExposures.sort((a, b) => b.leverageScore - a.leverageScore);
}
