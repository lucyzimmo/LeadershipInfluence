import { differenceInDays, parseISO } from 'date-fns';
import type {
  BallotItemInfluence,
  OfficeLevel,
  SwayStaticData,
  UrgencyLevel,
} from '../types';
import { MAIN_GROUP_ID } from '../data-loader';

function calculateUrgency(electionDate: Date): UrgencyLevel {
  const days = differenceInDays(electionDate, new Date());
  if (days < 30) return 'high';
  if (days < 90) return 'medium';
  return 'low';
}

function mapOfficeLevel(level?: string | null): OfficeLevel | undefined {
  if (!level) return undefined;
  const normalized = level.toLowerCase();
  if (normalized.includes('federal')) return 'federal';
  if (normalized.includes('state')) return 'state';
  return 'local';
}

function getJurisdictionLabel(jurisdiction?: {
  estimated_name?: string | null;
  name?: string | null;
  state?: string | null;
  geoid?: string | null;
  id?: string | null;
}): string | undefined {
  if (!jurisdiction) return undefined;
  return (
    jurisdiction.estimated_name ||
    jurisdiction.name ||
    (jurisdiction.state && jurisdiction.geoid
      ? `${jurisdiction.state} ${jurisdiction.geoid}`
      : jurisdiction.state) ||
    jurisdiction.geoid ||
    jurisdiction.id ||
    undefined
  );
}

function inferLevelFromJurisdiction(jurisdiction?: {
  estimated_name?: string | null;
  name?: string | null;
  state?: string | null;
  geoid?: string | null;
  ocdid?: string | null;
}): OfficeLevel {
  if (!jurisdiction) return 'local';
  const name = `${jurisdiction.estimated_name || ''} ${jurisdiction.name || ''}`.toLowerCase();
  const ocdid = jurisdiction.ocdid?.toLowerCase() || '';
  const geoid = jurisdiction.geoid || '';

  if (name.includes('congressional') || ocdid.includes('/cd:')) {
    return 'federal';
  }
  if (geoid.length === 2 || ocdid.includes('/state:')) {
    return 'state';
  }
  return 'local';
}

export function computeBallotItemInfluence(
  data: SwayStaticData
): BallotItemInfluence[] {
  const supporterProfileIds = data.profileViewpointGroupRels
    .filter((rel) => rel.viewpoint_group_id === MAIN_GROUP_ID)
    .map((rel) => rel.profile_id);

  const supporterPersonIds = new Set(
    data.profiles
      .filter((profile) => supporterProfileIds.includes(profile.id))
      .map((profile) => profile.person_id)
  );

  const supporterVerifications = data.voterVerifications.filter((verification) =>
    supporterPersonIds.has(verification.person_id)
  );

  const supporterVerificationIds = new Set(
    supporterVerifications.map((verification) => verification.id)
  );

  const verifiedVerificationIds = new Set(
    supporterVerifications
      .filter((verification) => verification.is_fully_verified)
      .map((verification) => verification.id)
  );

  const supporterCountsByJurisdiction = new Map<string, number>();
  const verifiedCountsByJurisdiction = new Map<string, number>();

  for (const rel of data.voterVerificationJurisdictionRels) {
    if (!supporterVerificationIds.has(rel.voter_verification_id)) continue;
    supporterCountsByJurisdiction.set(
      rel.jurisdiction_id,
      (supporterCountsByJurisdiction.get(rel.jurisdiction_id) || 0) + 1
    );
    if (verifiedVerificationIds.has(rel.voter_verification_id)) {
      verifiedCountsByJurisdiction.set(
        rel.jurisdiction_id,
        (verifiedCountsByJurisdiction.get(rel.jurisdiction_id) || 0) + 1
      );
    }
  }

  // Create maps for measure lookup - measures can be linked via ballot_item_id OR ballotItem.measure_id
  const measuresByBallotItemId = new Map<string, typeof data.measures[0]>();
  const measuresById = new Map<string, typeof data.measures[0]>();
  
  for (const measure of data.measures) {
    if (measure.ballot_item_id) {
      measuresByBallotItemId.set(measure.ballot_item_id, measure);
    }
    measuresById.set(measure.id, measure);
  }
  
  const influenceTargetsById = new Map(
    data.influenceTargets.map((target) => [target.id, target])
  );
  const candidaciesById = new Map(data.candidacies.map((c) => [c.id, c]));
  const racesById = new Map(data.races.map((r) => [r.id, r]));
  
  // Create map of races by ballot_item_id (races link TO ballot items, not the other way)
  const racesByBallotItemId = new Map<string, typeof data.races[0]>();
  for (const race of data.races) {
    if (race.ballot_item_id) {
      racesByBallotItemId.set(race.ballot_item_id, race);
    }
  }
  const officeTermsById = new Map(data.officeTerms.map((t) => [t.id, t]));
  const officesById = new Map(data.offices.map((o) => [o.id, o]));
  const personsById = new Map(data.persons.map((p) => [p.id, p]));
  const partiesById = new Map(data.parties.map((p) => [p.id, p]));

  const optionsByBallotItemId = new Map<string, typeof data.ballotItemOptions>();
  for (const option of data.ballotItemOptions) {
    const list = optionsByBallotItemId.get(option.ballot_item_id) || [];
    list.push(option);
    optionsByBallotItemId.set(option.ballot_item_id, list);
  }

  const items: BallotItemInfluence[] = [];

  for (const ballotItem of data.ballotItems) {
    if (!ballotItem.jurisdiction_id) continue;
    const election = data.elections.find((e) => e.id === ballotItem.election_id);
    if (!election) continue;

    const electionDate = parseISO(election.poll_date);
    if (differenceInDays(electionDate, new Date()) < 0) continue;

    const supporters =
      supporterCountsByJurisdiction.get(ballotItem.jurisdiction_id) || 0;
    if (supporters === 0) continue;

    const verifiedSupporters =
      verifiedCountsByJurisdiction.get(ballotItem.jurisdiction_id) || 0;

    // Look up measure: first by ballot_item_id, then by ballotItem.measure_id
    let measure = measuresByBallotItemId.get(ballotItem.id);
    if (!measure && ballotItem.measure_id) {
      measure = measuresById.get(ballotItem.measure_id);
    }
    
    // Look up race by ballot_item_id (races link TO ballot items)
    const race = racesByBallotItemId.get(ballotItem.id);
    
    const influenceTarget = measure?.influence_target_id
      ? influenceTargetsById.get(measure.influence_target_id)
      : undefined;
    const ballotOptions = optionsByBallotItemId.get(ballotItem.id) || [];

    let officeName: string | undefined;
    let officeLevel: OfficeLevel | undefined;
    let candidateCount = 0;
    const candidates: Array<{ name: string; party?: string }> = [];

    // If we have a race, get office info from it
    if (race) {
      const officeTerm = officeTermsById.get(race.office_term_id);
      const office = officeTerm ? officesById.get(officeTerm.office_id) : undefined;
      if (office) {
        officeName = office.name;
        officeLevel = mapOfficeLevel(office.level);
      }
      
      // Get candidates from candidacies linked to this race
      const raceCandidacies = data.candidacies.filter((c) => c.race_id === race.id);
      candidateCount = raceCandidacies.length;
      
      for (const candidacy of raceCandidacies) {
        const person = personsById.get(candidacy.person_id);
        const party = candidacy.party_id ? partiesById.get(candidacy.party_id) : undefined;
        const partyLabel = party?.abbreviation || party?.name;
        const name = person
          ? `${person.first_name} ${person.last_name}`.trim()
          : 'Candidate';
        if (!candidates.find((c) => c.name === name && c.party === partyLabel)) {
          candidates.push({ name, party: partyLabel || undefined });
        }
      }
    } else {
      // Fallback: try to get candidates from ballot options
      for (const option of ballotOptions) {
        if (!option.candidacy_id) continue;
        const candidacy = candidaciesById.get(option.candidacy_id);
        if (!candidacy) continue;
        candidateCount += 1;

        if (!officeName && candidacy.race_id) {
          const raceFromCandidacy = racesById.get(candidacy.race_id);
          const officeTerm = raceFromCandidacy ? officeTermsById.get(raceFromCandidacy.office_term_id) : undefined;
          const office = officeTerm ? officesById.get(officeTerm.office_id) : undefined;
          if (office) {
            officeName = office.name;
            officeLevel = mapOfficeLevel(office.level);
          }
        }

        const person = personsById.get(candidacy.person_id);
        const party = candidacy.party_id ? partiesById.get(candidacy.party_id) : undefined;
        const partyLabel = party?.abbreviation || party?.name;
        const name = person
          ? `${person.first_name} ${person.last_name}`.trim()
          : (option as any).text || option.title || 'Candidate';
        if (!candidates.find((c) => c.name === name && c.party === partyLabel)) {
          candidates.push({ name, party: partyLabel || undefined });
        }
      }
    }

    const jurisdictionObj = data.jurisdictions.find(
      (jur) => jur.id === ballotItem.jurisdiction_id
    );
    const jurisdictionLabel =
      getJurisdictionLabel(jurisdictionObj) || 'Unknown';
    const inferredLevel = inferLevelFromJurisdiction(jurisdictionObj);

    // Determine if this is a measure: has measure record OR no race and no candidates
    const isMeasure = Boolean(measure) || (!race && candidateCount === 0);
    const title = isMeasure
      ? measure?.title ||
        ballotItem.title ||
        influenceTarget?.description ||
        influenceTarget?.name ||
        (measure?.id ? `Measure ${measure.id.slice(0, 8)}` : `Measure in ${jurisdictionLabel}`)
      : officeName || ballotItem.title || election.name || `Ballot item in ${jurisdictionLabel}`;

    items.push({
      id: ballotItem.id,
      title,
      type: isMeasure ? 'measure' : 'race',
      electionId: election.id,
      electionName: election.name,
      electionDate: election.poll_date,
      jurisdiction: jurisdictionLabel,
      jurisdictionId: jurisdictionObj?.id,
      state: jurisdictionObj?.state || undefined,
      supporters,
      verifiedSupporters,
      urgency: calculateUrgency(electionDate),
      officeLevel: officeLevel || inferredLevel,
      officeName,
      candidateCount,
      candidates: candidates.length > 0 ? candidates : undefined,
      measureSummary: measure?.summary || measure?.description || undefined,
      measureProSnippet: measure?.pro_snippet || undefined,
      measureConSnippet: measure?.con_snippet || undefined,
      numWinners: ballotItem.num_winners,
      numSelectionsMax: ballotItem.num_selections_max,
      isRankedChoice: ballotItem.is_ranked_choice || false,
      isPrimary: race?.is_primary || false,
      isRunoff: race?.is_runoff || false,
      isRecall: race?.is_recall || false,
    });
  }

  return items.sort((a, b) => {
    const dateDiff =
      new Date(a.electionDate).getTime() - new Date(b.electionDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    if (b.supporters !== a.supporters) return b.supporters - a.supporters;
    return b.verifiedSupporters - a.verifiedSupporters;
  });
}
