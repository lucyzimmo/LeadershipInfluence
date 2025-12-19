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
 * Aligned with product brief: transforms data into prescriptive strategy
 * 
 * Priority order per product brief:
 * 1. High-urgency, high-exposure ballot items → voter guide + mobilization
 * 2. Strong jurisdictions with low verification rate → targeted verification push
 * 3. High concentration risk → expand into adjacent jurisdictions
 * 4. Low network expansion → recruit chapter leaders
 */
export function deriveActions(context: MetricsContext): ActionableInsight[] {
  const insights: ActionableInsight[] = [];

  // Sort ballot exposures by leverage score (urgency-weighted influence)
  const sortedExposures = [...context.ballotExposure].sort(
    (a, b) => b.leverageScore - a.leverageScore
  );

  // Deduplicate ballot items by title to avoid showing the same election twice
  const seenTitles = new Set<string>();
  const uniqueExposures = sortedExposures.filter((exposure) => {
    const title = exposure.ballotItem.title;
    if (seenTitles.has(title)) {
      return false;
    }
    seenTitles.add(title);
    return true;
  });

  // 1. HIGH-URGENCY, HIGH-EXPOSURE BALLOT ITEMS
  // Product brief: "Publish a voter guide + mobilize supporters here"
  // Prioritize by leverage score (which already weights urgency + verified supporters)
  const highImpactBallotItems = uniqueExposures.filter(
    (exposure) => {
      const daysUntil = Math.floor(
        (new Date(exposure.ballotItem.electionDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      // High urgency (< 30 days) OR significant leverage with decent supporter count
      // Lowered thresholds to ensure we surface actions
      return (
        (exposure.urgency === 'high' && exposure.verifiedSupporters >= 10) ||
        ((exposure.leverageLevel === 'kingmaker' || exposure.leverageLevel === 'significant') &&
         exposure.verifiedSupporters >= 20 &&
         daysUntil <= 90) ||
        // Fallback: any upcoming election with verified supporters
        (exposure.verifiedSupporters >= 10 && daysUntil > 0 && daysUntil <= 180)
      );
    }
  );

  // Take top 2 highest leverage items, or top item if only one exists
  const itemsToShow = Math.min(2, highImpactBallotItems.length);
  for (const exposure of highImpactBallotItems.slice(0, itemsToShow)) {
    const daysUntil = Math.floor(
      (new Date(exposure.ballotItem.electionDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    const isUrgent = daysUntil < 30;
    const leverageDescription = exposure.leverageLevel === 'kingmaker' 
      ? 'Kingmaker leverage'
      : exposure.leverageLevel === 'significant'
      ? 'Significant leverage'
      : '';

    insights.push({
      priority: insights.length + 1,
      title: `Focus on ${exposure.ballotItem.title}`,
      description: isUrgent
        ? `Election in ${daysUntil} days • ${exposure.verifiedSupporters} verified supporters`
        : `${exposure.verifiedSupporters} verified supporters • ${leverageDescription}`,
      metric: `Leverage Score: ${Math.round(exposure.leverageScore)} • ${exposure.ballotItem.officeLevel || 'local'} level`,
      action: 'Publish a voter guide + mobilize supporters here',
      impact: isUrgent ? 'high' : 'medium',
    });
  }

  // 2. STRONG JURISDICTIONS WITH LOW VERIFICATION RATE
  // Product brief: "Run a targeted verification push"
  // Find jurisdictions with high concentration but low verification rate
  const topJurisdictions = context.jurisdictions.topJurisdictions.slice(0, 5);
  for (const jurisdiction of topJurisdictions) {
    // High concentration (top 3) AND low verification rate in that jurisdiction
    const jurisdictionVerificationRate = jurisdiction.supporterCount > 0
      ? (jurisdiction.verifiedCount / jurisdiction.supporterCount) * 100
      : 0;

    // Only flag if verification rate is below 80% AND it's a top jurisdiction
    // Lowered thresholds to ensure we surface actions
    if (
      jurisdictionVerificationRate < 80 &&
      jurisdiction.verifiedCount >= 5 && // Minimum threshold to be actionable
      jurisdiction.percentage >= 5 // At least 5% of total verified voters
    ) {
      const unverifiedCount = jurisdiction.supporterCount - jurisdiction.verifiedCount;
      
      insights.push({
        priority: insights.length + 1,
        title: `Increase verification in ${jurisdiction.name}`,
        description: `${Math.round(jurisdictionVerificationRate)}% verified • ${unverifiedCount} unverified supporters in high-concentration area`,
        metric: `${jurisdiction.verifiedCount} verified • ${Math.round(jurisdiction.percentage)}% of your network`,
        action: 'Run a targeted verification push',
        impact: jurisdictionVerificationRate < 60 ? 'high' : 'medium',
      });
      
      // Only surface the top jurisdiction with this issue
      break;
    }
  }

  // 3. HIGH CONCENTRATION RISK
  // Product brief: "Expand into adjacent jurisdictions before you're fragile"
  // Flag when concentration is high (>50% HHI) AND total jurisdictions is low (<5)
  if (
    context.jurisdictions.concentrationIndex > 0.5 &&
    context.jurisdictions.totalJurisdictions < 5 &&
    context.verifiedVoters.current >= 10 // Lowered threshold
  ) {
    const topJurisdiction = context.jurisdictions.topJurisdictions[0];
    const concentrationPercent = Math.round(context.jurisdictions.concentrationIndex * 100);
    
    insights.push({
      priority: insights.length + 1,
      title: 'Expand geographic reach before you\'re fragile',
      description: `${concentrationPercent}% concentration in ${context.jurisdictions.totalJurisdictions} jurisdictions • ${topJurisdiction?.name || 'Primary location'} has ${Math.round(topJurisdiction?.percentage || 0)}%`,
      metric: `Concentration Index: ${concentrationPercent}% • ${context.jurisdictions.totalJurisdictions} active jurisdictions`,
      action: 'Expand into adjacent jurisdictions before you\'re fragile',
      impact: context.jurisdictions.concentrationIndex > 0.7 ? 'high' : 'medium',
    });
  }

  // 4. LOW NETWORK EXPANSION
  // Product brief: "Recruit chapter leaders from engaged supporters"
  // Flag when network expansion is low relative to potential
  if (
    context.networkExpansion.connectedLeaders < 5 &&
    context.networkExpansion.potentialLeaders &&
    context.networkExpansion.potentialLeaders >= 10 &&
    context.verifiedVoters.current >= 20 // Lowered threshold
  ) {
    const expansionRatio = context.networkExpansion.connectedLeaders > 0
      ? context.networkExpansion.potentialLeaders / context.networkExpansion.connectedLeaders
      : Infinity;

    insights.push({
      priority: insights.length + 1,
      title: 'Grow your network of allied organizers',
      description: `${context.networkExpansion.potentialLeaders} verified supporters could start their own groups • Only ${context.networkExpansion.connectedLeaders} currently organizing`,
      metric: `${context.networkExpansion.newJurisdictions} new jurisdictions reached via connected leaders`,
      action: 'Recruit chapter leaders from engaged supporters',
      impact: expansionRatio > 5 ? 'high' : 'medium',
    });
  }

  // 5. MEDIUM-URGENCY RACES WITH SIGNIFICANT LEVERAGE
  // Fill remaining slots with upcoming opportunities
  if (insights.length < 5) {
    // Get titles we've already used to avoid duplicates
    const usedTitles = new Set(insights.map(i => {
      // Extract title from "Focus on {title}" format
      return i.title.replace(/^Focus on /, '');
    }));
    
    const mediumUrgencyRaces = uniqueExposures.filter(
      (exposure) => {
        const daysUntil = Math.floor(
          (new Date(exposure.ballotItem.electionDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        );
        // Skip if we've already used this title
        if (usedTitles.has(exposure.ballotItem.title)) {
          return false;
        }
        return (
          (exposure.urgency === 'medium' || exposure.urgency === 'low') &&
          (exposure.leverageLevel === 'significant' || exposure.leverageLevel === 'marginal') &&
          exposure.verifiedSupporters >= 5 &&
          daysUntil <= 180 &&
          daysUntil > 0 &&
          !highImpactBallotItems.includes(exposure)
        );
      }
    );

    for (const race of mediumUrgencyRaces.slice(0, 5 - insights.length)) {
      const daysUntil = Math.floor(
        (new Date(race.ballotItem.electionDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      insights.push({
        priority: insights.length + 1,
        title: `Prepare for ${race.ballotItem.title}`,
        description: `Election in ${daysUntil} days • ${race.verifiedSupporters} verified supporters`,
        metric: `Leverage: ${race.leverageLevel} • ${race.ballotItem.officeLevel || 'local'} level`,
        action: 'Research candidates and start building endorsement case',
        impact: 'medium',
      });
    }
  }

  // Fallback: If no insights generated, create at least one generic action
  if (insights.length === 0 && uniqueExposures.length > 0) {
    const topExposure = uniqueExposures[0];
    const daysUntil = Math.floor(
      (new Date(topExposure.ballotItem.electionDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
    
    insights.push({
      priority: 1,
      title: `Focus on ${topExposure.ballotItem.title}`,
      description: daysUntil > 0 
        ? `Election in ${daysUntil} days • ${topExposure.verifiedSupporters} verified supporters`
        : `${topExposure.verifiedSupporters} verified supporters`,
      metric: `Leverage Score: ${Math.round(topExposure.leverageScore)}`,
      action: 'Publish a voter guide + mobilize supporters here',
      impact: topExposure.urgency === 'high' ? 'high' : 'medium',
    });
  }

  // Sort by priority and limit to top 5
  // Priority is already set correctly (1-5), so just ensure proper ordering
  return insights
    .sort((a, b) => {
      // First by priority
      if (a.priority !== b.priority) return a.priority - b.priority;
      // Then by impact (high > medium > low)
      const impactOrder: Record<ImpactLevel, number> = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    })
    .slice(0, 5)
    .map((insight, index) => ({
      ...insight,
      priority: (index + 1) as 1 | 2 | 3,
    }));
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
