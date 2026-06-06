import type { Song, Note } from '../../types/audio'



export const GIG_LEAD_IN_MS = 2000
export const NOTE_LEAD_IN_MS = 100

/**
 * Extra note lifetime after the scheduled song window, in milliseconds.
 */
export const NOTE_TAIL_MS = 1000

export interface MutableRef<T> {
  current: T
}

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
