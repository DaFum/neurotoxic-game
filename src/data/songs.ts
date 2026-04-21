// Music Library
import rhythmSongs from '../assets/rhythm_songs.json' with { type: 'json' }
import type { Note, Song } from '../types/audio'

type RawNote = {
  t?: number
  timestamp?: number
  lane?: number | string
  type?: string
  durationMs?: number
  velocity?: number
  p?: number
  v?: number
  [key: string]: unknown
}

type RawSong = {
  name?: string
  notes?: RawNote[]
  tpb?: number
  bpm?: number
  durationMs?: number
  difficultyRank?: number
  tags?: string[]
  notePattern?: string
  crowdAppeal?: number
  staminaDrain?: number
  tempoMap?: unknown[]
  sourceMid?: string
  sourceOgg?: string | null
  excerptStartMs?: number
  excerptEndMs?: number
  excerptDurationMs?: number
  [key: string]: unknown
}

/**
 * Transform a raw rhythm_songs JSON object into the SONGS_DB array format.
 * Exported so tests can invoke the transformation with controlled fixture data
 * without needing to mock the JSON module.
 */
export function transformSongsData(rawSongs: Record<string, RawSong>): Song[] {
  return Object.entries(rawSongs).map(([key, song]) => {
    const durationMsValue = Number.isFinite(song.durationMs)
      ? Number(song.durationMs)
      : null
    const excerptDurationValue = Number.isFinite(song.excerptDurationMs)
      ? Number(song.excerptDurationMs)
      : null
    const excerptEndValue = Number.isFinite(song.excerptEndMs)
      ? Number(song.excerptEndMs)
      : null
    let lastNoteTick = 0
    const validNotes: Note[] = []

    if (Array.isArray(song.notes)) {
      for (let i = 0; i < song.notes.length; i++) {
        const note = song.notes[i]
        if (
          note !== null &&
          typeof note === 'object' &&
          Number.isFinite(note.t)
        ) {
          validNotes.push({
            ...note,
            lane: note.lane ?? 'unknown',
            timestamp: note.timestamp ?? note.t,
            velocity: typeof note.velocity === 'number' ? note.velocity : note.v
          } as Note)
          if (note.t! > lastNoteTick) {
            lastNoteTick = note.t!
          }
        }
      }
    }

    const tpb = Math.max(1, song.tpb || 480)
    const bpm = Math.max(1, song.bpm || 120)
    const lastNoteTimeSeconds = (lastNoteTick / tpb) * (60 / bpm)
    const duration = Math.ceil(
      Math.max((song.durationMs || 0) / 1000, lastNoteTimeSeconds + 4)
    )

    return {
      id: key,
      leaderboardId: key
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 64),
      name: song.name || key,
      title: song.name || key,
      duration,
      difficulty: Math.max(1, Math.min(7, song.difficultyRank || 2)),
      intensity:
        (song.difficultyRank || 2) > 5
          ? 'EXTREME'
          : (song.difficultyRank || 2) > 3
            ? 'HIGH'
            : (song.difficultyRank || 2) > 2
              ? 'MEDIUM'
              : 'LOW',
      bpm,
      tags: song.tags || ['Metal', 'Instrumental'],
      notePattern: song.notePattern || 'standard',
      crowdAppeal: Number.isFinite(Number(song.crowdAppeal))
        ? Math.min(10, Math.max(1, Number(song.crowdAppeal)))
        : Math.min(
            10,
            Math.max(1, Math.ceil((song.difficultyRank || 2) * 1.5))
          ),
      staminaDrain: Number.isFinite(Number(song.staminaDrain))
        ? Number(song.staminaDrain)
        : 10 + (song.difficultyRank || 2) * 2,
      energy: { peak: Math.min(100, 60 + (song.difficultyRank || 2) * 5) },
      notes: validNotes,
      tempoMap: song.tempoMap || [],
      tpb,
      sourceMid: song.sourceMid,
      sourceOgg: song.sourceOgg || null,
      excerptStartMs: song.excerptStartMs || 0,
      excerptEndMs: excerptEndValue,
      durationMs: durationMsValue,
      excerptDurationMs:
        excerptDurationValue !== null
          ? Math.max(0, excerptDurationValue)
          : durationMsValue !== null
            ? Math.max(0, durationMsValue)
            : null
    }
  })
}

// transformSongsData is the single source of truth for the shape.
// Runtime uses it here; tests import and call it directly with fixture data.
export const SONGS_DB = transformSongsData(rhythmSongs)

// Pre-computed maps for O(1) lookups
export const SONGS_BY_ID = new Map(SONGS_DB.map(song => [song.id, song]))

export const SONGS_BY_MID = new Map<string, Song>()
for (let i = 0; i < SONGS_DB.length; i++) {
  const song = SONGS_DB[i]
  if (song && song.sourceMid) {
    SONGS_BY_MID.set(song.sourceMid, song)
  }
}
