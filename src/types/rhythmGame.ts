import type { Note } from './audio'

export type RhythmLane = {
  id: 'guitar' | 'drums' | 'bass'
  key: 'ArrowLeft' | 'ArrowDown' | 'ArrowRight'
  x: number
  color: number
  active: boolean
  hitWindow: number
  renderX?: number
}

export type RhythmLiveStats = {
  perfectHits: number
  perfects?: number
  hits?: number
  misses: number
  earlyHits?: number
  lateHits?: number
  maxCombo: number
  peakHype: number
}

export type RhythmNote = {
  time: number
  laneIndex: number
  hit: boolean
  visible: boolean
  songId: string
  type: 'note'
  originalNote?: Note
}

export type RhythmSongStatsEntry = {
  songId: string
  score: number
  accuracy: number
  index: number
}

export type GigStats = {
  score: number
  misses: number
  perfectHits: number
  maxCombo: number
  peakHype: number
  toxicTimeTotal: number
  accuracy: number
  songStats: RhythmSongStatsEntry[]
}

export type SetLastGigStats = (stats: GigStats) => void

export type RhythmSetlistEntry =
  | string
  | {
      id?: string
      name?: string
      bpm?: number
      duration?: number
      difficulty?: number
      notes?: unknown[]
      sourceMid?: string
      sourceOgg?: string | null
      [key: string]: unknown
    }

export type RhythmModifiers = {
  drumMultiplier?: number
  guitarScoreMult?: number
  bassScoreMult?: number
  hitWindowBonus?: number
  drumSpeedMult?: number
  hasPerfektionist?: boolean
  guestlist?: boolean
  noteJitter?: boolean
  activeEffects?: unknown[]
  soundcheck?: boolean
  catering?: boolean
  [key: string]: unknown
}

export type RhythmGameRefState = {
  notes: RhythmNote[]
  nextMissCheckIndex: number
  lanes: RhythmLane[]
  speed: number
  modifiers: RhythmModifiers
  stats: RhythmLiveStats
  projectiles: unknown[]
  combo: number
  health: number
  score: number
  progress: number
  isToxicMode: boolean
  isGameOver: boolean
  overload: number
  totalDuration: number
  hasSubmittedResults: boolean
  songTransitioning: boolean
  songStats: RhythmSongStatsEntry[]
  lastEndedSongIndex: number
  currentSongStartScore: number
  currentSongStartPerfectHits: number
  currentSongStartMisses: number
  setlistCompleted: boolean
  notesVersion: number
  transportPausedByOverlay: boolean
  toxicTimeTotal: number
  toxicModeEndTime: number
  rng: () => number
}
