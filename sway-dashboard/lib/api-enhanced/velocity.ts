import type {
  MovementVelocity,
  TrendDirection,
  TimeSeriesPoint,
} from '../types';

/**
 * Calculate movement velocity and compare to benchmarks
 */
export function calculateMovementVelocity(
  growthTrend: TimeSeriesPoint[],
  benchmarkData: any[] | null
): MovementVelocity {
  // Calculate current growth rate (supporters per week)
  const yourGrowthRate = calculateGrowthRate(growthTrend);

  // Determine trend direction
  const trendDirection = determineTrendDirection(growthTrend);

  // Project future growth
  const projection = {
    in30Days: projectGrowth(yourGrowthRate, 30),
    in90Days: projectGrowth(yourGrowthRate, 90),
  };

  // If benchmark data available, add comparison
  if (benchmarkData && benchmarkData.length > 0) {
    const peerMedian = calculateMedianGrowthRate(benchmarkData);
    const percentile = calculatePercentile(yourGrowthRate, benchmarkData);

    return {
      yourGrowthRate,
      peerMedian,
      percentile,
      trendDirection,
      projection,
    };
  }

  return {
    yourGrowthRate,
    trendDirection,
    projection,
  };
}

/**
 * Calculate growth rate from trend data
 */
function calculateGrowthRate(trend: TimeSeriesPoint[]): number {
  if (trend.length < 2) return 0;

  // Use last 4 weeks
  const recentData = trend.slice(-4);
  if (recentData.length < 2) return 0;

  const first = recentData[0].value;
  const last = recentData[recentData.length - 1].value;
  const weeks = recentData.length - 1;

  return weeks > 0 ? (last - first) / weeks : 0;
}

/**
 * Determine if growth is accelerating, steady, or slowing
 */
function determineTrendDirection(trend: TimeSeriesPoint[]): TrendDirection {
  if (trend.length < 3) return 'steady';

  // Compare recent growth to earlier growth
  const mid = Math.floor(trend.length / 2);
  const firstHalf = trend.slice(0, mid);
  const secondHalf = trend.slice(mid);

  const firstRate = calculateGrowthRate(firstHalf);
  const secondRate = calculateGrowthRate(secondHalf);

  if (secondRate > firstRate * 1.2) return 'accelerating';
  if (secondRate < firstRate * 0.8) return 'slowing';
  return 'steady';
}

/**
 * Project future growth based on current rate
 */
function projectGrowth(weeklyRate: number, days: number): number {
  const weeks = days / 7;
  return Math.round(weeklyRate * weeks);
}

/**
 * Calculate median growth rate from benchmark data
 */
function calculateMedianGrowthRate(benchmarks: any[]): number {
  const rates = benchmarks.map((b) => b.growthRate || 0).sort((a, b) => a - b);
  const mid = Math.floor(rates.length / 2);
  return rates.length % 2 === 0
    ? (rates[mid - 1] + rates[mid]) / 2
    : rates[mid];
}

/**
 * Calculate percentile ranking
 */
function calculatePercentile(value: number, benchmarks: any[]): number {
  const rates = benchmarks.map((b) => b.growthRate || 0);
  const below = rates.filter((r) => r < value).length;
  return (below / rates.length) * 100;
}
