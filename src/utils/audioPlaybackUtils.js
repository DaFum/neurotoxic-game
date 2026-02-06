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
