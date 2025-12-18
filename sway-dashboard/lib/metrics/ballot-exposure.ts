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
 * @param data Static data from JSON files
 * @param apiElections Optional upcoming elections from Sway API
 */
export function computeBallotExposure(
  data: SwayStaticData,
  apiElections?: any[] | null
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

  // Track unique ballot items to avoid duplicates (by election + office)
  const seenBallotItems = new Set<string>();

  // Add API elections as pseudo-ballot items
  if (apiElections && apiElections.length > 0) {
    for (const apiElection of apiElections) {
      const electionDate = parseISO(apiElection.electionDay);
      const electionYear = electionDate.getFullYear();

      // Create unique key including year to avoid duplicates across different election cycles
      const uniqueKey = `api-${apiElection.office?.name || apiElection.id}-${electionYear}`;
      if (seenBallotItems.has(uniqueKey)) continue;
      seenBallotItems.add(uniqueKey);

      const daysUntil = differenceInDays(electionDate, new Date());
      if (daysUntil < 0) continue;

      // Only include primary elections
      const electionType = apiElection.type?.toLowerCase() || '';
      const isPrimary = electionType.includes('primary');
      if (!isPrimary) continue;

      const urgency = calculateUrgency(electionDate);
      const officeLevel = (apiElection.office?.level?.toLowerCase() as OfficeLevel) || 'local';
      const candidateCount = apiElection.candidateCount || 0;

      // Estimate verified supporters based on jurisdiction match
      // (simplified - in production you'd match by exact jurisdiction)
      const estimatedSupporters = Math.floor(verifiedVoters.length * 0.1);
      if (estimatedSupporters === 0) continue;

      const leverageScore =
        estimatedSupporters *
        leverageMultipliers[officeLevel] *
        urgencyWeights[urgency];

      const leverageLevel = calculateLeverageLevel(
        estimatedSupporters,
        candidateCount
      );

      // Build title with year if different from current year
      const currentYear = new Date().getFullYear();
      const officeName = apiElection.office?.name || 'Election';
      const titleWithYear = electionYear !== currentYear
        ? `${officeName} (${electionYear})`
        : officeName;

      ballotExposures.push({
        ballotItem: {
          id: apiElection.id,
          title: titleWithYear,
          type: apiElection.type === 'measure' ? 'measure' : 'race',
          electionDate: apiElection.electionDay,
          officeLevel,
          officeName: titleWithYear,
          candidateCount,
        },
        verifiedSupporters: estimatedSupporters,
        urgency,
        leverageScore,
        leverageLevel,
        jurisdiction: 'From Sway API', // Would need proper jurisdiction mapping
      });
    }
  }

  for (const ballotItem of data.ballotItems) {
    // Get election date
    const election = data.elections.find((e) => e.id === ballotItem.election_id);
    if (!election) continue;

    const electionDate = parseISO(election.poll_date);
    const electionYear = electionDate.getFullYear();

    // Skip past elections (only show upcoming)
    const daysUntil = differenceInDays(electionDate, new Date());
    if (daysUntil < 0) continue;

    // Only include primary elections
    const electionName = election.name?.toLowerCase() || '';
    const isPrimary = electionName.includes('primary');
    if (!isPrimary) continue;

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

    // Get ballot options to find race/office information
    let officeLevel: OfficeLevel | undefined;
    let officeName: string | undefined;
    let ballotTitle: string | undefined;
    let candidateCount = 0;

    const ballotOptions = data.ballotItemOptions.filter(
      (opt) => opt.ballot_item_id === ballotItem.id
    );

    // Try to find office information through candidacies
    if (ballotOptions.length > 0) {
      for (const option of ballotOptions) {
        if (option.candidacy_id) {
          const candidacy = data.candidacies.find(
            (c) => c.id === option.candidacy_id
          );
          if (candidacy) {
            candidateCount++;

            if (!officeName) {
              const race = data.races.find((r) => r.id === candidacy.race_id);
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
              }
            }
          }
        }
      }
    }

    // Get jurisdiction info first
    const jurisdictionObj = ballotItem.jurisdiction_id
      ? data.jurisdictions.find((j) => j.id === ballotItem.jurisdiction_id)
      : undefined;
    const jurisdiction = jurisdictionObj?.estimated_name || jurisdictionObj?.name;

    // Build a title with jurisdiction and year
    const currentYear = new Date().getFullYear();
    const jurisdictionName = jurisdiction;

    if (officeName) {
      ballotTitle = electionYear !== currentYear
        ? `${officeName} (${electionYear})`
        : officeName;
    } else {
      // Use jurisdiction + election type for title
      if (jurisdictionName && !jurisdictionName.toLowerCase().includes('unknown')) {
        // Extract "Primary Election" from election name, or use full name
        const electionType = election.name.includes('Primary') ? 'Primary Election' : election.name;
        ballotTitle = electionYear !== currentYear
          ? `${jurisdictionName} ${electionType} (${electionYear})`
          : `${jurisdictionName} ${electionType}`;
      } else {
        ballotTitle = electionYear !== currentYear
          ? `${election.name} (${electionYear})`
          : election.name;
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

    // Create unique key including year to avoid duplicates across different election cycles
    const uniqueKey = officeName
      ? `${officeName}-${electionYear}`
      : `${election.id}-${ballotItem.jurisdiction_id}-${electionYear}`;

    // Skip if we've already seen this combination
    if (seenBallotItems.has(uniqueKey)) continue;
    seenBallotItems.add(uniqueKey);

    ballotExposures.push({
      ballotItem: {
        id: ballotItem.id,
        title: ballotTitle,
        type: candidateCount > 0 ? 'race' : 'measure',
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

  // Sort by election date (ascending - sooner first), then by leverage score (descending)
  return ballotExposures.sort((a, b) => {
    const dateA = parseISO(a.ballotItem.electionDate);
    const dateB = parseISO(b.ballotItem.electionDate);

    // First, sort by date (closer elections first)
    const dateDiff = dateA.getTime() - dateB.getTime();
    if (dateDiff !== 0) return dateDiff;

    // If dates are the same, sort by leverage score (higher first)
    return b.leverageScore - a.leverageScore;
  });
}
