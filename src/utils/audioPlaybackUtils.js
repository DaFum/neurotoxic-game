/**
 * Normalizes MIDI playback options.
 * @param {object} [options] - Optional playback settings.
 * @param {boolean} [options.useCleanPlayback=true] - Whether to bypass FX for MIDI playback.
 * @param {Function} [options.onEnded] - Callback invoked when playback ends.
 * @param {number} [options.stopAfterSeconds] - Optional playback duration limit in seconds.
 * @returns {{useCleanPlayback: boolean, onEnded: Function|null, stopAfterSeconds: number|null}} Normalized options.
 */
export const normalizeMidiPlaybackOptions = options => {
  const useCleanPlayback =
    typeof options?.useCleanPlayback === 'boolean'
      ? options.useCleanPlayback
      : true
  const onEnded = typeof options?.onEnded === 'function' ? options.onEnded : null
  const stopAfterSeconds = Number.isFinite(options?.stopAfterSeconds)
    ? Math.max(0, options.stopAfterSeconds)
    : null

  return {
    useCleanPlayback,
    onEnded,
    stopAfterSeconds
  }
}

/**
 * Calculates remaining playback duration after applying an excerpt offset.
 * @param {number} totalSeconds - Total song duration in seconds.
 * @param {number} offsetSeconds - Excerpt offset in seconds.
 * @returns {number} Remaining playback duration in seconds.
 */
export const calculateRemainingDurationSeconds = (
  totalSeconds,
  offsetSeconds
) => {
  const safeTotal = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0
  const safeOffset = Number.isFinite(offsetSeconds)
    ? Math.max(0, offsetSeconds)
    : 0
  return Math.max(0, safeTotal - safeOffset)
}
