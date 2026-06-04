import type * as Tone from 'tone'

/**
 * Rhythm-game note categories, including custom string values from song data.
 */
export type NoteType = 'tap' | 'hold' | 'slide' | 'special' | string

/**
 * Parsed note event used by rhythm charts and MIDI-derived song data.
 */
export interface Note {
  /** timestamp in milliseconds from song start */
  timestamp?: number
  /** legacy tick timestamp used in rhythm_songs.json */
  t?: number
  lane: number | string
  type?: NoteType
  durationMs?: number
  /** optional MIDI pitch (integer 0-127 finite number) */
  p?: number
  velocity?: number
}

/**
 * Rhythm song metadata, playable chart data, and optional MIDI/OGG source references.
 */
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

/**
 * Snare abstraction that layers noise and membrane synth voices behind one trigger.
 */
export interface LayeredSnare {
  triggerAttackRelease: (
    dur: number | string,
    time: number | string,
    vel?: number
  ) => void
  volume: Tone.Param<'decibels'>
  dispose: () => void
}

/**
 * Tone.js drum-kit voices used by gig and MIDI playback.
 */
export interface DrumKitSynth {
  kick: Tone.MembraneSynth
  snare: LayeredSnare
  hihat: Tone.MetalSynth
  crash: Tone.MetalSynth
}

/**
 * User-controlled audio preferences mirrored between UI and the audio service.
 */
export interface AudioState {
  musicVol: number
  sfxVol: number
  isMuted: boolean
}

/**
 * Audio preference snapshot plus optional playback status.
 */
export interface AudioSnapshot extends AudioState {
  isPlaying?: boolean
  currentSongId?: string | null
}

/**
 * Minimal audio manager contract consumed by React hooks and UI controls.
 */
export interface AudioManagerLike {
  musicVolume?: number
  sfxVolume?: number
  muted?: boolean
  isPlaying?: boolean
  currentSongId?: string | null
  getState?: () => AudioSnapshot
  getStateSnapshot?: () => AudioSnapshot
  hasNativeSubscribe?: () => boolean
  subscribe?: (listener: () => void) => () => void
  setMusicVolume?: (value: number) => unknown
  setSfxVolume?: (value: number) => unknown
  toggleMute?: () => unknown
  stopMusic?: () => unknown
  resumeMusic?: () => boolean | Promise<boolean>
}

/**
 * Options for polling or subscribing to audio-control state.
 */
export interface UseAudioControlOptions {
  pollEvenWithSubscribe?: boolean
  pollMs?: number
}

/**
 * Audio-control hook result with current state and command handlers.
 */
export interface UseAudioControlResult<TState> {
  audioState: TState
  handleAudioChange: AudioControlHandlers
}

/**
 * Volume and mute commands exposed to audio controls.
 */
export interface AudioControls {
  setMusic: (value: number) => void
  setSfx: (value: number) => void
  toggleMute: () => void
}

/**
 * Full audio command surface used by settings and playback controls.
 */
export interface AudioControlHandlers extends AudioControls {
  stopMusic: () => unknown
  resumeMusic: () => Promise<boolean>
}
