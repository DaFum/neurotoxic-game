import { SONGS_BY_ID } from '../../data/songs'
import type { Note } from '../../types/audio'
import type { RhythmSetlistEntry } from '../../types/rhythmGame'
import type { ActiveSong } from './rhythmGameTypes'
import { hasNotesField } from './rhythmGameTypes'

/**
 * Resolves the active setlist to complete song entries with safe defaults and parsed notes.
 *
 * @param setlist - Requested rhythm-game setlist entries.
 * @returns Playable songs used by note generation and audio sequencing.
 */
export const resolveActiveSetlist = (
  setlist: RhythmSetlistEntry[]
): ActiveSong[] => {
  // Applies canonical defaults for the core ActiveSong numeric/identity fields.
  // `notes` is passed through explicitly because each call site computes it
  // from a different source (own notes, resolved SONGS_BY_ID notes, or undefined).
  type SongRefShape = {
    id?: string
    name?: string
    bpm?: number
    duration?: number
    difficulty?: number
  }
  const fillSongDefaults = (
    songRef: SongRefShape,
    base: SongRefShape | undefined,
    notes: Note[] | undefined
  ) => ({
    ...(base ?? {}),
    ...songRef,
    id: songRef.id ?? base?.id ?? 'jam',
    name: songRef.name ?? base?.name ?? songRef.id ?? 'Jam',
    bpm: songRef.bpm ?? base?.bpm ?? 120,
    duration: songRef.duration ?? base?.duration ?? 60,
    difficulty: songRef.difficulty ?? base?.difficulty ?? 2,
    notes
  })

  return (
    setlist.length > 0
      ? setlist
      : [{ id: 'jam', name: 'Jam', bpm: 120, duration: 60, difficulty: 2 }]
  ).map(songRef => {
    if (typeof songRef === 'string') {
      return (
        SONGS_BY_ID.get(songRef) || {
          id: songRef,
          name: songRef,
          bpm: 120,
          duration: 60,
          difficulty: 2
        }
      )
    }
    if (hasNotesField(songRef) && songRef.notes.length > 0) {
      return fillSongDefaults(songRef, undefined, songRef.notes)
    }

    if (songRef.id && songRef.id !== 'jam') {
      const resolvedSong = SONGS_BY_ID.get(songRef.id)
      return fillSongDefaults(
        songRef,
        resolvedSong,
        hasNotesField(songRef) ? songRef.notes : resolvedSong?.notes
      )
    }
    return fillSongDefaults(
      songRef,
      undefined,
      hasNotesField(songRef) ? songRef.notes : undefined
    )
  })
}
