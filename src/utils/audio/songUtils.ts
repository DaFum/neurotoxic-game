import type { Song } from '../../types/audio'
import { isFiniteNumber } from '../finiteNumber'

/**
 * Normalizes a song entry to its ID string.
 *
 * @param item - Song ID string or partial song-like object.
 * @returns Song ID when one is present.
 */
export const getSongId = (
  item: string | Partial<Pick<Song, 'id'>> | undefined
): string | undefined => (typeof item === 'string' ? item : item?.id)

/**
 * Resolves non-negative excerpt timing for playback.
 *
 * Duration priority is `excerptEndMs - excerptStartMs`, then
 * `excerptDurationMs`, then `durationMs`, then the default duration fallback.
 *
 * @param song - Partial song metadata entry.
 * @param options - Optional behavior flags. `defaultDurationMs` provides the
 *   duration fallback in milliseconds and defaults to `0`.
 * @returns Excerpt start, optional excerpt end, and resolved excerpt duration in milliseconds.
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
    isFiniteNumber(val) ? Math.max(0, val) : fallback

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
