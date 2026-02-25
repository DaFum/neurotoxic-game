/**
 * Normalizes a song entry to its ID.
 * @param {string|object} item - The song entry (ID string or object with ID).
 * @returns {string} The normalized song ID.
 */
export const getSongId = item => (typeof item === 'string' ? item : item?.id)

/**
 * Resolves playback window metadata for a song excerpt.
 *
 * Priority for duration resolution:
 * 1) excerptEndMs - excerptStartMs (when both are finite and positive)
 * 2) excerptDurationMs (legacy normalized value)
 * 3) durationMs (raw authored value)
 * 4) defaultDurationMs fallback
 *
 * @param {object} song - Song metadata entry.
 * @param {object} [options] - Optional behavior flags.
 * @param {number} [options.defaultDurationMs=0] - Fallback duration.
 * @returns {{ excerptStartMs: number, excerptEndMs: number|null, excerptDurationMs: number }}
 */
export const resolveSongPlaybackWindow = (song, options = {}) => {
  const defaultDurationMs = Number.isFinite(options.defaultDurationMs)
    ? Math.max(0, options.defaultDurationMs)
    : 0

  const excerptStartMs = Number.isFinite(song?.excerptStartMs)
    ? Math.max(0, song.excerptStartMs)
    : 0

  const excerptEndMs = Number.isFinite(song?.excerptEndMs)
    ? Math.max(0, song.excerptEndMs)
    : null

  const derivedDurationMs =
    Number.isFinite(excerptEndMs) && excerptEndMs > excerptStartMs
      ? excerptEndMs - excerptStartMs
      : null

  const explicitDurationMs = Number.isFinite(song?.excerptDurationMs)
    ? Math.max(0, song.excerptDurationMs)
    : null

  const authoredDurationMs = Number.isFinite(song?.durationMs)
    ? Math.max(0, song.durationMs)
    : null

  const excerptDurationMs =
    derivedDurationMs ??
    explicitDurationMs ??
    authoredDurationMs ??
    defaultDurationMs

  return { excerptStartMs, excerptEndMs, excerptDurationMs }
}
