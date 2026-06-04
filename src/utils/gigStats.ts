import { clamp0to100 } from './gameStateUtils'

/**
 * Type: `def `object` GigPerformanceStats`.
 * Property `perfectHits`.
 * Property `misses`.
 * Property `maxCombo`.
 * Property `peakHype`.
 */

/**
 * Calculates hit accuracy as a percentage (0–100).
 * Returns 100 when no notes were attempted (no misses, no hits).
 * @param perfectHits - Perfect hits.
 * @param misses - Misses.
 * @returns */
export const calculateAccuracy = (
  perfectHits: number,
  misses: number
): number => {
  const total = perfectHits + misses
  if (total === 0) return 100
  return clamp0to100(Math.round((perfectHits / total) * 100))
}

/**
 * Updates peak performance stats without mutating the original object.
 * @param stats - Current performance stats.
 * @param payload - Current combo and hype values.
 * @returns Updated stats snapshot.
 */
import type { RhythmLiveStats } from '../types/rhythmGame'

export const updateGigPerformanceStats = (
  stats: RhythmLiveStats,
  payload: { combo: number; overload: number }
): RhythmLiveStats => ({
  ...stats,
  maxCombo: Math.max(stats.maxCombo, payload.combo),
  peakHype: Math.max(stats.peakHype, payload.overload)
})

/**
 * Builds a gig stats snapshot for post-gig economy calculations.
 * @param score - Final score.
 * @param stats - Performance stats accumulated during the gig.
 * @param toxicTimeTotal - Total time spent in toxic mode.
 * @param songStats - Array of stats for individual songs completed in the gig. Defaults to `[]`.
 * @returns Gig stats snapshot.
 */
export const buildGigStatsSnapshot = (
  score: number,
  stats: RhythmLiveStats,
  toxicTimeTotal: number,
  songStats: Array<{
    songId: string
    score: number
    accuracy: number
    index: number
  }> = []
): {
  score: number
  misses: number
  perfectHits: number
  maxCombo: number
  peakHype: number
  corruptionLevel: number
  toxicTimeTotal: number
  accuracy: number
  songStats: Array<{
    songId: string
    score: number
    accuracy: number
    index: number
  }>
} => ({
  score,
  misses: stats.misses,
  perfectHits: stats.perfectHits,
  maxCombo: stats.maxCombo,
  peakHype: stats.peakHype,
  corruptionLevel: stats.corruptionLevel ?? 0,
  toxicTimeTotal,
  accuracy: calculateAccuracy(
    stats.perfectHits + (stats.hits ?? 0),
    stats.misses
  ),
  songStats: songStats.map(s => ({ ...s }))
})
