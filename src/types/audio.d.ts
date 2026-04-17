export type NoteType = 'tap' | 'hold' | 'slide' | 'special' | string

export interface Note {
  /** timestamp in milliseconds from song start */
  timestamp?: number
  /** legacy tick timestamp used in rhythm_songs.json */
  t?: number
  lane: number | string
  type?: NoteType
  durationMs?: number
  velocity?: number
}

export interface Song {
  id: string
  leaderboardId: string
  title: string
  name: string
  bpm: number
  duration: number
  durationMs: number | null
  excerptStartMs: number
  excerptEndMs: number | null
  excerptDurationMs: number | null
  difficulty: number
  intensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  notes: Note[]
  tags?: string[]
  notePattern?: string
  crowdAppeal?: number
  staminaDrain?: number
  energy?: { peak: number }
  tempoMap?: unknown[]
  sourceMid?: string
  sourceOgg?: string | null
  tpb?: number
}
