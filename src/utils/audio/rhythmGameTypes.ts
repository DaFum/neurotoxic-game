import type { Song, Note } from '../../types/audio'

/**
 * Silent countdown before gig audio and the scheduled note window begin, in milliseconds.
 *
 * @remarks
 * Passed as `delayMs` when starting the gig clock so players see the stage settle
 * before the first note is due.
 */
export const GIG_LEAD_IN_MS = 2000

/**
 * Lead-in applied when generating fallback notes, in milliseconds.
 *
 * @remarks
 * Shifts the first generated note later so players have a moment to react once a
 * song ships without authored note data.
 */
export const NOTE_LEAD_IN_MS = 100

/**
 * Extra note lifetime after the scheduled song window, in milliseconds.
 */
export const NOTE_TAIL_MS = 1000

/**
 * Minimal writable container mirroring React's `MutableRefObject`.
 *
 * @remarks
 * Lets audio modules share a mutable value without depending on React.
 *
 * @typeParam T - Value held in `current`.
 */
export interface MutableRef<T> {
  current: T
}

/**
 * Song shape the rhythm engine needs to play a track.
 *
 * @remarks
 * A `Partial<Song>` with the playback-critical fields (`id`, `name`, `bpm`,
 * `duration`, `difficulty`) guaranteed present. `notes` is absent when note data
 * is generated at runtime; `sourceMid`/`sourceOgg` select the background audio
 * strategy and may be omitted for fully procedural playback.
 */
export type ActiveSong = Partial<Song> & {
  id: string
  name: string
  bpm: number
  duration: number
  difficulty: number
  notes?: Note[]
  sourceMid?: string
  sourceOgg?: string | null
}

/**
 * Type guard for an untrusted value that carries a `notes` array.
 *
 * @param v - Candidate value, typically a parsed song record of unknown shape.
 * @returns `true` when `v` is a non-null object whose `notes` field is an array.
 */
export const hasNotesField = (
  v: unknown
): v is {
  notes: Note[]
  id?: string
  name?: string
  bpm?: number
  duration?: number
  difficulty?: number
  sourceMid?: string
  sourceOgg?: string | null
} => {
  return (
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as { notes?: unknown }).notes)
  )
}
