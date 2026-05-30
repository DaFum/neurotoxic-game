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
  const getFiniteNumber = <T>(val: unknown, fallback: T): number | T =>
    typeof val === 'number' && Number.isFinite(val)
      ? Math.max(0, val)
      : fallback

  const defaultDurationMs = getFiniteNumber(options.defaultDurationMs, 0)
  const excerptStartMs = getFiniteNumber(song?.excerptStartMs, 0)
  const excerptEndMs = getFiniteNumber(song?.excerptEndMs, null)

  const derivedDurationMs =
    excerptEndMs != null &&
    Number.isFinite(excerptEndMs) &&
    excerptEndMs > excerptStartMs
      ? excerptEndMs - excerptStartMs
      : null

  const explicitDurationMs = getFiniteNumber(song?.excerptDurationMs, null)
  const authoredDurationMs = getFiniteNumber(song?.durationMs, null)

  const excerptDurationMs = (derivedDurationMs ??
    explicitDurationMs ??
    authoredDurationMs ??
    defaultDurationMs) as number

  return { excerptStartMs, excerptEndMs, excerptDurationMs }
}
