import { differenceInWeeks, parseISO, startOfWeek, format } from 'date-fns';
import type {
  SwayStaticData,
  VerifiedVoterMetrics,
  TimeSeriesPoint,
} from '../types';
import { MAIN_GROUP_ID } from '../data-loader';

interface VerifiedVoter {
  personId: string;
  verificationDate: Date;
}

/**
 * Compute verified voter metrics for the main viewpoint group
 */
export function computeVerifiedVoters(
  data: SwayStaticData
): VerifiedVoterMetrics {
  // 1. Get all supporters in the main group
  const supporterProfileIds = data.profileViewpointGroupRels
    .filter((rel) => rel.viewpoint_group_id === MAIN_GROUP_ID)
    .map((rel) => rel.profile_id);

  const totalSupporters = supporterProfileIds.length;

  // 2. Get person IDs for these profiles (assuming 1:1 mapping)
  const supporterPersonIds = new Set(
    data.profiles
      .filter((p) => supporterProfileIds.includes(p.id))
      .map((p) => p.person_id)
  );

  // 3. Find verified voters among supporters
  const verifiedVoters: VerifiedVoter[] = [];
  for (const verification of data.voterVerifications) {
    if (
      verification.is_fully_verified &&
      supporterPersonIds.has(verification.person_id)
    ) {
      verifiedVoters.push({
        personId: verification.person_id,
        verificationDate: verification.created_at
          ? parseISO(verification.created_at)
          : new Date(),
      });
    }
  }

  const current = verifiedVoters.length;
  const verificationRate =
    totalSupporters > 0 ? (current / totalSupporters) * 100 : 0;

  // 4. Compute growth trend (weekly aggregation)
  const growthTrend = computeGrowthTrend(verifiedVoters);

  // 5. Compute weekly growth rate
  const weeklyGrowthRate = computeWeeklyGrowthRate(growthTrend);

  return {
    current,
    verificationRate,
    growthTrend,
    weeklyGrowthRate,
  };
}

/**
 * Compute weekly growth trend
 */
function computeGrowthTrend(
  verifiedVoters: VerifiedVoter[]
): TimeSeriesPoint[] {
  if (verifiedVoters.length === 0) {
    return [];
  }

  // Sort by verification date
  const sorted = [...verifiedVoters].sort(
    (a, b) => a.verificationDate.getTime() - b.verificationDate.getTime()
  );

  // Group by week
  const weeklyData = new Map<string, number>();
  let cumulativeCount = 0;

  for (const voter of sorted) {
    const weekStart = startOfWeek(voter.verificationDate);
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    cumulativeCount++;
    weeklyData.set(weekKey, cumulativeCount);
  }

  // Convert to array
  return Array.from(weeklyData.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compute weekly growth rate (average over last 4 weeks)
 */
function computeWeeklyGrowthRate(trend: TimeSeriesPoint[]): number {
  if (trend.length < 2) {
    return 0;
  }

  // Get last 4 weeks if available
  const recentWeeks = trend.slice(-5); // Need 5 points to compute 4 week-over-week changes
  if (recentWeeks.length < 2) {
    return 0;
  }

  const growthRates: number[] = [];
  for (let i = 1; i < recentWeeks.length; i++) {
    const prev = recentWeeks[i - 1].value;
    const curr = recentWeeks[i].value;
    if (prev > 0) {
      const rate = ((curr - prev) / prev) * 100;
      growthRates.push(rate);
    }
  }

  if (growthRates.length === 0) {
    return 0;
  }

  return growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
}
