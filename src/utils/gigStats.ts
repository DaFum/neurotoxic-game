import { clamp0to100, finiteNumberOr } from './gameState'
import type {
  GigStats,
  RhythmLiveStats,
  RhythmSongStatsEntry
} from '../types/rhythmGame'

/**
 * A {@link GigStats} snapshot plus the failure flag the post-gig outcome gates read.
 */
export type GigStatsSnapshot = GigStats & { failed: boolean }

/**
 * Calculates hit accuracy as a percentage (0–100).
 * Returns 100 when no notes were attempted (no misses, no hits).
 * @param perfectHits - Count of perfect hits; the numerator and part of the attempted-note total.
 * @param misses - Count of missed notes; the remainder of the attempted-note total.
 * @returns Hit accuracy as a percentage.
 */
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
  songStats: readonly RhythmSongStatsEntry[] = [],
  failed: boolean
): GigStatsSnapshot => {
  const nextSongStats = (songStats ?? []).map(entry => ({ ...entry }))

  const misses = finiteNumberOr(stats?.misses, 0)
  const perfectHits = finiteNumberOr(stats?.perfectHits, 0)
  const maxCombo = finiteNumberOr(stats?.maxCombo, 0)
  const peakHype = finiteNumberOr(stats?.peakHype, 0)
  const corruptionLevel = finiteNumberOr(stats?.corruptionLevel, 0)
  const hits = finiteNumberOr(stats?.hits, 0)

  return {
    score,
    misses,
    perfectHits,
    maxCombo,
    peakHype,
    corruptionLevel,
    toxicTimeTotal,
    accuracy: calculateAccuracy(perfectHits + hits, misses),
    failed: failed === true,
    songStats: nextSongStats
  }
}
