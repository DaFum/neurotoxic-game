import type { Song } from '../../types/audio'

/**
 * Normalizes a song entry to its ID.
 * @param {string|object} item - The song entry (ID string or object with ID).
 * @returns {string|undefined} The normalized song ID.
 */
export const getSongId = (
  item: string | Partial<Pick<Song, 'id'>> | undefined
): string | undefined => (typeof item === 'string' ? item : item?.id)

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
export const resolveSongPlaybackWindow = (
  song: Partial<Song> | null | undefined,
  options: { defaultDurationMs?: number } = {}
): {
  excerptStartMs: number
  excerptEndMs: number | null
  excerptDurationMs: number
} => {
  const rawDefaultMs = options.defaultDurationMs
  const defaultDurationMs = typeof rawDefaultMs === 'number' && Number.isFinite(rawDefaultMs)
    ? Math.max(0, rawDefaultMs)
    : 0

  const rawStartMs = song?.excerptStartMs
  const excerptStartMs = typeof rawStartMs === 'number' && Number.isFinite(rawStartMs)
    ? Math.max(0, rawStartMs)
    : 0

  const rawEndMs = song?.excerptEndMs
  const excerptEndMs = typeof rawEndMs === 'number' && Number.isFinite(rawEndMs)
    ? Math.max(0, rawEndMs)
    : null

  const derivedDurationMs =
    excerptEndMs != null &&
    Number.isFinite(excerptEndMs) &&
    excerptEndMs > excerptStartMs
      ? excerptEndMs - excerptStartMs
      : null

  const rawExplicitMs = song?.excerptDurationMs
  const explicitDurationMs = typeof rawExplicitMs === 'number' && Number.isFinite(rawExplicitMs)
    ? Math.max(0, rawExplicitMs)
    : null

  const rawAuthoredMs = song?.durationMs
  const authoredDurationMs = typeof rawAuthoredMs === 'number' && Number.isFinite(rawAuthoredMs)
    ? Math.max(0, rawAuthoredMs)
    : null

  const excerptDurationMs = (derivedDurationMs ??
    explicitDurationMs ??
    authoredDurationMs ??
    defaultDurationMs)

  return { excerptStartMs, excerptEndMs, excerptDurationMs }
}
