/**
 * @typedef {object} GigPerformanceStats
 * @property {number} perfectHits
 * @property {number} misses
 * @property {number} maxCombo
 * @property {number} peakHype
 */

/**
 * Calculates hit accuracy as a percentage (0–100).
 * Returns 100 when no notes were attempted (no misses, no hits).
 * @param {number} perfectHits
 * @param {number} misses
 * @returns {number}
 */
export const calculateAccuracy = (perfectHits, misses) => {
  const total = perfectHits + misses
  if (total === 0) return 100
  return Math.round((perfectHits / total) * 100)
}

/**
 * Updates peak performance stats without mutating the original object.
 * @param {GigPerformanceStats} stats - Current performance stats.
 * @param {{combo: number, overload: number}} payload - Current combo and hype values.
 * @returns {GigPerformanceStats} Updated stats snapshot.
 */
export const updateGigPerformanceStats = (stats, payload) => ({
  ...stats,
  maxCombo: Math.max(stats.maxCombo, payload.combo),
  peakHype: Math.max(stats.peakHype, payload.overload)
})

/**
 * Builds a gig stats snapshot for post-gig economy calculations.
 * @param {number} score - Final score.
 * @param {GigPerformanceStats} stats - Performance stats accumulated during the gig.
 * @param {number} toxicTimeTotal - Total time spent in toxic mode.
 * @returns {{score: number, misses: number, perfectHits: number, maxCombo: number, peakHype: number, toxicTimeTotal: number, accuracy: number}}
 */
export const buildGigStatsSnapshot = (score, stats, toxicTimeTotal) => ({
  score,
  misses: stats.misses,
  perfectHits: stats.perfectHits,
  maxCombo: stats.maxCombo,
  peakHype: stats.peakHype,
  toxicTimeTotal,
  accuracy: calculateAccuracy(stats.perfectHits, stats.misses)
})
