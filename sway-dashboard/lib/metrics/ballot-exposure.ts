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
  const measuresByBallotItemId = new Map(
    data.measures.map((measure) => [measure.ballot_item_id, measure])
  );
  const influenceTargetsById = new Map(
    data.influenceTargets.map((target) => [target.id, target])
  );

  const supporterProfileIds = data.profileViewpointGroupRels
    .filter((rel) => rel.viewpoint_group_id === MAIN_GROUP_ID)
    .map((rel) => rel.profile_id);

  const supporterPersonIds = new Set(
    data.profiles
      .filter((p) => supporterProfileIds.includes(p.id))
      .map((p) => p.person_id)
  );

  const supporterVoterVerifications = data.voterVerifications.filter(
    (verification) => supporterPersonIds.has(verification.person_id)
  );
  const supporterVoterVerificationIds = new Set(
    supporterVoterVerifications.map((verification) => verification.id)
  );
  const verifiedVoterVerificationIds = new Set(
    supporterVoterVerifications
      .filter((verification) => verification.is_fully_verified)
      .map((verification) => verification.id)
  );

  const supporterCountsByJurisdiction = new Map<string, number>();
  const verifiedCountsByJurisdiction = new Map<string, number>();

  for (const rel of data.voterVerificationJurisdictionRels) {
    if (!supporterVoterVerificationIds.has(rel.voter_verification_id)) continue;

    supporterCountsByJurisdiction.set(
      rel.jurisdiction_id,
      (supporterCountsByJurisdiction.get(rel.jurisdiction_id) || 0) + 1
    );

    if (verifiedVoterVerificationIds.has(rel.voter_verification_id)) {
      verifiedCountsByJurisdiction.set(
        rel.jurisdiction_id,
        (verifiedCountsByJurisdiction.get(rel.jurisdiction_id) || 0) + 1
      );
    }
  }

  const getJurisdictionLabel = (jurisdiction?: { estimated_name?: string | null; name?: string | null; state?: string | null; geoid?: string | null; id?: string | null }): string | undefined => {
    if (!jurisdiction) return undefined;
    return (
      jurisdiction.estimated_name ||
      jurisdiction.name ||
      (jurisdiction.state && jurisdiction.geoid ? `${jurisdiction.state} ${jurisdiction.geoid}` : undefined) ||
      jurisdiction.state ||
      jurisdiction.geoid ||
      jurisdiction.id ||
      undefined
    );
  };

  // 1. Get verified supporters and their jurisdictions
  const verifiedVoters = supporterVoterVerifications.filter(
    (v) => v.is_fully_verified
  );

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

      const urgency = calculateUrgency(electionDate);
      const officeLevel = (apiElection.office?.level?.toLowerCase() as OfficeLevel) || 'local';
      const candidateCount = apiElection.candidateCount || 0;

      // Estimate verified supporters based on jurisdiction match
      // (simplified - in production you'd match by exact jurisdiction)
      const estimatedSupporters = Math.floor(verifiedVoters.length * 0.1);

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
        potentialSupporters: estimatedSupporters,
        urgency,
        leverageScore,
        leverageLevel,
        jurisdiction: 'From Sway API', // Would need proper jurisdiction mapping
      });
    }
  }

  for (const ballotItem of data.ballotItems) {
    if (!ballotItem.jurisdiction_id) continue;

    // Get election date
    const election = data.elections.find((e) => e.id === ballotItem.election_id);
    if (!election) continue;

    const electionDate = parseISO(election.poll_date);
    const electionYear = electionDate.getFullYear();

    // Skip past elections (only show upcoming)
    const daysUntil = differenceInDays(electionDate, new Date());
    if (daysUntil < 0) continue;

    const urgency = calculateUrgency(electionDate);

    const potentialSupporters = supporterCountsByJurisdiction.get(ballotItem.jurisdiction_id) || 0;
    const verifiedSupporters = verifiedCountsByJurisdiction.get(ballotItem.jurisdiction_id) || 0;

    // Skip ballot items that are outside the supporter footprint
    if (potentialSupporters === 0) continue;

    // Get ballot options to find race/office information
    let officeLevel: OfficeLevel | undefined;
    let officeName: string | undefined;
    let ballotTitle: string | undefined;
    let candidateCount = 0;
    const measure = measuresByBallotItemId.get(ballotItem.id);
    const influenceTarget = measure?.influence_target_id
      ? influenceTargetsById.get(measure.influence_target_id)
      : undefined;

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
    const jurisdiction = getJurisdictionLabel(jurisdictionObj);
    const jurisdictionId = jurisdictionObj?.id;

    // Build a title with jurisdiction and year
    const currentYear = new Date().getFullYear();
    const jurisdictionName = jurisdiction;

    if (officeName) {
      ballotTitle = electionYear !== currentYear
        ? `${officeName} (${electionYear})`
        : officeName;
    } else {
      if (measure) {
        ballotTitle =
          measure.title ||
          measure.name ||
          influenceTarget?.description ||
          ballotTitle;
      }
      // Use jurisdiction + election type for title
      if (!ballotTitle && jurisdictionName && !jurisdictionName.toLowerCase().includes('unknown')) {
        // Extract "Primary Election" from election name, or use full name
        const electionType = election.name.includes('Primary') ? 'Primary Election' : election.name;
        ballotTitle = electionYear !== currentYear
          ? `${jurisdictionName} ${electionType} (${electionYear})`
          : `${jurisdictionName} ${electionType}`;
      } else if (!ballotTitle) {
        const measureLabel = measure ? 'Measure' : 'Ballot item';
        ballotTitle = electionYear !== currentYear
          ? `${measureLabel} in ${election.name} (${electionYear})`
          : `${measureLabel} in ${election.name}`;
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
      : `ballot-${ballotItem.id}`;

    // Skip if we've already seen this combination
    if (seenBallotItems.has(uniqueKey)) continue;
    seenBallotItems.add(uniqueKey);

    ballotExposures.push({
      ballotItem: {
        id: ballotItem.id,
        title: ballotTitle,
        type: measure ? 'measure' : candidateCount > 0 ? 'race' : 'measure',
        electionDate: election.poll_date,
        officeLevel: level,
        officeName,
        candidateCount,
      },
      verifiedSupporters,
      potentialSupporters,
      urgency,
      leverageScore,
      leverageLevel,
      jurisdiction,
      jurisdictionId,
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
