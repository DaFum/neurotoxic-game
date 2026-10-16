import type { Song } from '../../types/audio'
import type { RhythmNote } from '../../types/rhythmGame'
import { isFiniteNumber } from '../finiteNumber'
import { NOTE_TAIL_MS } from './rhythmGameTypes'

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

/**
 * Resolves how long OGG buffer or MIDI synthesis playback runs before it is cut.
 *
 * @param notes - Notes scheduled for the song, ordered by time; the last one sets the cap.
 * @param excerptDurationMs - Resolved excerpt duration, used when no note is timed after `0`.
 * @returns The last note time plus `NOTE_TAIL_MS` when that note is after `0`,
 *   otherwise the excerpt duration when positive, otherwise `null` (no cap).
 */
export const resolveNoteCappedPlaybackMs = (
  notes: ReadonlyArray<Pick<RhythmNote, 'time'>>,
  excerptDurationMs: number
): number | null => {
  const maxNoteTime = notes[notes.length - 1]?.time ?? 0
  if (maxNoteTime > 0) return maxNoteTime + NOTE_TAIL_MS
  return excerptDurationMs > 0 ? excerptDurationMs : null
}
