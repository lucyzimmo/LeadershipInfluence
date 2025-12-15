import type {
  ActionableInsight,
  BallotExposure,
  JurisdictionConcentration,
  VerifiedVoterMetrics,
  NetworkExpansion,
  ImpactLevel,
} from '../types';

interface MetricsContext {
  verifiedVoters: VerifiedVoterMetrics;
  jurisdictions: JurisdictionConcentration;
  ballotExposure: BallotExposure[];
  networkExpansion: NetworkExpansion;
}

/**
 * Derive intelligent, actionable insights from metrics
 * This is the "killer feature" - transforms data into strategy
 */
export function deriveActions(context: MetricsContext): ActionableInsight[] {
  const insights: ActionableInsight[] = [];

  // 1. High-urgency + high-leverage races
  const urgentRaces = context.ballotExposure.filter(
    (exposure) => exposure.urgency === 'high' && exposure.verifiedSupporters >= 100
  );

  for (const race of urgentRaces.slice(0, 2)) {
    // Top 2
    const daysUntil = Math.floor(
      (new Date(race.ballotItem.electionDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    insights.push({
      priority: 1,
      title: `Focus on ${race.ballotItem.title}`,
      description: `Election in ${daysUntil} days • ${race.verifiedSupporters} verified supporters`,
      metric: `Leverage Score: ${Math.round(race.leverageScore)}`,
      action: 'Create targeted voter guide and mobilization plan',
      impact: 'high',
    });
  }

  // 2. Low verification in high-concentration jurisdictions
  if (context.verifiedVoters.verificationRate < 85) {
    const topJurisdiction = context.jurisdictions.topJurisdictions[0];
    if (topJurisdiction) {
      const unverifiedPercent = Math.round(
        100 - context.verifiedVoters.verificationRate
      );

      insights.push({
        priority: insights.length === 0 ? 1 : 2,
        title: `Increase verification in ${topJurisdiction.name}`,
        description: `${unverifiedPercent}% unverified • High concentration area`,
        metric: `Current rate: ${Math.round(context.verifiedVoters.verificationRate)}%`,
        action: 'Run voter verification drive',
        impact: 'high',
      });
    }
  }

  // 3. Network expansion opportunity
  if (
    context.networkExpansion.derivativeLeaders < 3 &&
    context.networkExpansion.potentialLeaders &&
    context.networkExpansion.potentialLeaders > 10
  ) {
    insights.push({
      priority: insights.length < 2 ? 2 : 3,
      title: 'Recruit chapter leaders',
      description: `${context.networkExpansion.potentialLeaders} potential leaders identified`,
      metric: `Current derivative leaders: ${context.networkExpansion.derivativeLeaders}`,
      action: 'Reach out to top supporters about starting chapters',
      impact: 'medium',
    });
  }

  // 4. Medium-urgency races with significant leverage
  const mediumUrgencyRaces = context.ballotExposure.filter(
    (exposure) =>
      exposure.urgency === 'medium' &&
      exposure.leverageLevel === 'significant' &&
      !urgentRaces.includes(exposure)
  );

  if (mediumUrgencyRaces.length > 0 && insights.length < 3) {
    const race = mediumUrgencyRaces[0];
    insights.push({
      priority: 3,
      title: `Prepare for ${race.ballotItem.title}`,
      description: `${race.verifiedSupporters} verified supporters • ${race.ballotItem.candidateCount || 'Multiple'} candidates`,
      metric: `Leverage: ${race.leverageLevel}`,
      action: 'Research candidates and start building endorsement case',
      impact: 'medium',
    });
  }

  // 5. Growth momentum
  if (
    context.verifiedVoters.weeklyGrowthRate &&
    context.verifiedVoters.weeklyGrowthRate > 5
  ) {
    insights.push({
      priority: 3,
      title: 'Capitalize on growth momentum',
      description: `${Math.round(context.verifiedVoters.weeklyGrowthRate)}% weekly growth`,
      metric: `Trending: Accelerating`,
      action: 'Double down on current recruitment strategies',
      impact: 'medium',
    });
  }

  // 6. Geographic expansion opportunity
  if (
    context.jurisdictions.concentrationIndex > 0.5 &&
    context.jurisdictions.totalJurisdictions < 5
  ) {
    insights.push({
      priority: 3,
      title: 'Expand geographic reach',
      description: `High concentration (${Math.round(context.jurisdictions.concentrationIndex * 100)}%) in few jurisdictions`,
      metric: `Active in ${context.jurisdictions.totalJurisdictions} jurisdictions`,
      action: 'Target adjacent communities for expansion',
      impact: 'low',
    });
  }

  // Sort by priority and limit to top 5
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

/**
 * Generate a single high-priority action if needed
 */
export function generatePriorityAction(
  ballotExposures: BallotExposure[]
): ActionableInsight | null {
  const highestLeverage = ballotExposures[0];
  if (!highestLeverage) return null;

  const daysUntil = Math.floor(
    (new Date(highestLeverage.ballotItem.electionDate).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  return {
    priority: 1,
    title: `Focus on ${highestLeverage.ballotItem.title}`,
    description: `Election in ${daysUntil} days`,
    metric: `${highestLeverage.verifiedSupporters} verified supporters`,
    action: 'Create voter mobilization plan',
    impact: 'high',
  };
}
