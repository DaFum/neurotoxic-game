/**
 * @typedef {object} GigPerformanceStats
 * @property {number} perfectHits
 * @property {number} misses
 * @property {number} maxCombo
 * @property {number} peakHype
 */

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
});

/**
 * Builds a gig stats snapshot for post-gig economy calculations.
 * @param {number} score - Final score.
 * @param {GigPerformanceStats} stats - Performance stats accumulated during the gig.
 * @param {number} toxicTimeTotal - Total time spent in toxic mode.
 * @returns {{score: number, misses: number, perfectHits: number, maxCombo: number, peakHype: number, toxicTimeTotal: number}}
 */
export const buildGigStatsSnapshot = (score, stats, toxicTimeTotal) => ({
    score,
    misses: stats.misses,
    perfectHits: stats.perfectHits,
    maxCombo: stats.maxCombo,
    peakHype: stats.peakHype,
    toxicTimeTotal
});
