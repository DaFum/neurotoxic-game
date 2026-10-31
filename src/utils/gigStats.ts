import { clamp0to100, clampPercent, finiteNumberOr } from './gameState'
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
 * Reads the 0–100 hit accuracy that post-gig outcome gates compare against.
 *
 * @remarks
 * Every real gig dispatch carries accuracy, so a missing or non-finite value
 * is malformed and reads as `0` (a bad show), never as a pass. A failed gig
 * (`failed: true`) also reads as `0`, whatever accuracy it recorded.
 * Callers gate on the stats being present: no stats means no gig was played,
 * which is not a bad show.
 * @param stats - The stored or incoming post-gig stats.
 * @returns Accuracy clamped to 0–100, or `0` when missing, non-finite or failed.
 */
export const getOutcomeAccuracy = (stats: {
  accuracy?: unknown
  failed?: unknown
}): number => (stats.failed === true ? 0 : clampPercent(stats.accuracy, 0))

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
  maxCombo: Math.max(finiteNumberOr(stats?.maxCombo, 0), payload.combo),
  peakHype: Math.max(finiteNumberOr(stats?.peakHype, 0), payload.overload)
})

/**
 * Builds a gig stats snapshot for post-gig economy calculations.
 * @param score - Final score.
 * @param stats - Performance stats accumulated during the gig. May be partial or
 *   absent: every counter read here falls back to `0` when missing or non-finite.
 * @param toxicTimeTotal - Total time spent in toxic mode.
 * @param songStats - Array of stats for individual songs completed in the gig. Defaults to `[]`.
 * @returns Gig stats snapshot.
 */
export const buildGigStatsSnapshot = (
  score: number,
  stats: Partial<RhythmLiveStats> | undefined,
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
