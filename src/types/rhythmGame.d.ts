import type { Note } from './audio'
import type { Projectile } from '../utils/hecklerLogic'

/**
 * Runtime lane configuration for one playable rhythm-game input track.
 */
export type RhythmLane = {
  id: 'guitar' | 'drums' | 'bass'
  key: 'ArrowLeft' | 'ArrowDown' | 'ArrowRight'
  x: number
  color: number
  active: boolean
  hitWindow: number
  renderX?: number
}

/**
 * Live rhythm-game scoring and health counters.
 */
export type RhythmLiveStats = {
  perfectHits: number
  perfects?: number
  hits?: number
  misses: number
  earlyHits?: number
  lateHits?: number
  maxCombo: number
  peakHype: number
  corruptionLevel?: number
}

/**
 * Runtime rhythm note scheduled for player input.
 */
export type RhythmNote = {
  time: number
  laneIndex: number
  hit: boolean
  visible: boolean
  songId: string
  type: 'note'
  originalNote?: Note
}

/**
 * Score, accuracy, and setlist position recorded for one completed rhythm song.
 */
export type RhythmSongStatsEntry = {
  songId: string
  score: number
  accuracy: number
  index: number
}

/**
 * Final gig performance stats submitted after a setlist.
 */
export type GigStats = {
  score: number
  misses: number
  perfectHits: number
  maxCombo: number
  peakHype: number
  corruptionLevel: number
  toxicTimeTotal: number
  accuracy: number
  songStats: RhythmSongStatsEntry[]
}

/**
 * Payload shape for updating last-gig statistics.
 */
export type SetLastGigStats = (stats: GigStats) => void

/**
 * Setlist entry accepted by rhythm-game setup.
 */
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

/**
 * Active rhythm gameplay modifiers from band, venue, and prep effects.
 */
export type RhythmModifiers = {
  drumMultiplier?: number
  guitarScoreMult?: number
  bassScoreMult?: number
  hitWindowBonus?: number
  drumSpeedMult?: number
  crowdDecay?: number
  hasPerfektionist?: boolean
  guestlist?: boolean
  noteJitter?: boolean
  activeEffects?: unknown[]
  soundcheck?: boolean
  catering?: boolean
  [key: string]: unknown
}

/**
 * Mutable rhythm-game state shared across loop, audio, and UI code.
 */
export type RhythmGameRefState = {
  notes: RhythmNote[]
  /** First note index still eligible for automatic miss detection. */
  nextMissCheckIndex: number
  lanes: RhythmLane[]
  speed: number
  modifiers: RhythmModifiers
  stats: RhythmLiveStats
  projectiles: Projectile[]
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
  /** Index of the most recent setlist song that completed playback. */
  lastEndedSongIndex: number
  currentSongStartScore: number
  rivalPenaltyActive: boolean
  currentSongStartPerfectHits: number
  currentSongStartMisses: number
  /** Whether every setlist entry has reached its completion boundary. */
  setlistCompleted: boolean
  notesVersion: number
  /** Whether transport was paused by an overlay rather than normal playback end. */
  transportPausedByOverlay: boolean
  toxicTimeTotal: number
  toxicModeEndTime: number
  corruptionLevel: number
  isCorruptionBurstActive: boolean
  corruptionBurstEndTime: number
  /** The clock time observed during the last process tick. Used to detect resets. */
  lastTickTimeMs?: number
  rng: () => number
}
