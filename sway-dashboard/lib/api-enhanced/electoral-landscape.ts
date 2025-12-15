import type {
  SwayStaticData,
  BallotExposure,
  ElectoralLandscape,
  Competitiveness,
  LeverageLevel,
  CivicEngineData,
} from '../types';

/**
 * Analyze CivicEngine data and combine with ballot exposure
 * to create electoral landscape insights
 */
export function analyzeElectoralLandscape(
  civicData: CivicEngineData | null,
  ballotExposures: BallotExposure[]
): ElectoralLandscape[] {
  if (!civicData) {
    // Fallback: use static data only
    return ballotExposures.map((exposure) => ({
      ballotItem: exposure.ballotItem,
      competitiveness: determineCompetitiveness(
        exposure.ballotItem.candidateCount || 0
      ),
      candidateCount: exposure.ballotItem.candidateCount || 0,
      yourLeverage: exposure.leverageLevel || 'marginal',
      verifiedSupporters: exposure.verifiedSupporters,
    }));
  }

  // Enhanced: combine with CivicEngine data
  const landscapes: ElectoralLandscape[] = [];

  for (const exposure of ballotExposures) {
    // Try to match with CivicEngine position
    const matchingPosition = civicData.positions.nodes.find((pos) =>
      pos.name.toLowerCase().includes(exposure.ballotItem.title.toLowerCase())
    );

    let candidateCount = exposure.ballotItem.candidateCount || 0;

    if (matchingPosition?.races?.[0]) {
      const race = matchingPosition.races[0];
      candidateCount = race.candidacies?.length || candidateCount;
    }

    landscapes.push({
      ballotItem: {
        ...exposure.ballotItem,
        candidateCount,
      },
      competitiveness: determineCompetitiveness(candidateCount),
      candidateCount,
      yourLeverage: exposure.leverageLevel || 'marginal',
      verifiedSupporters: exposure.verifiedSupporters,
    });
  }

  return landscapes;
}

/**
 * Determine race competitiveness based on candidate count and party
 */
function determineCompetitiveness(candidateCount: number): Competitiveness {
  if (candidateCount >= 4) return 'tossup';
  if (candidateCount >= 2) return 'lean';
  return 'safe';
}
