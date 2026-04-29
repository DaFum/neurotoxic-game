/**
 * Audio Engine Utility
 * This module manages the AudioContext and Tone.js logic for both Rhythm Game music and UI SFX.
 * Note: This file is an export hub. Side-effects (Tone.start, AudioContext creation) are handled in src/utils/audio/setup.ts.
 */

export { setupAudio } from './setup'
export {
  getRawAudioContext,
  ensureAudioContext,
  getAudioContextTimeSec,
  getToneStartTimeSec
} from './context'
export { disposeAudio, safeDispose } from './dispose'

export { hasAudioAsset, loadAudioBuffer } from './assets'

export {
  playSFX,
  setSFXVolume,
  setMusicVolume,
  calculateGigTimeMs,
  calculateGigPlaybackWindow,
  getGigTimeMs,
  startGigPlayback,
  startGigClock,
  pauseGigPlayback,
  resumeGigPlayback,
  stopGigPlayback,
  stopAmbientPlayback,
  isAmbientOggPlaying,
  stopAudio,
  pauseAudio,
  resumeAudio,
  getTransportState,
  setDestinationMute,
  getAudioTimeMs,
  getPlayRequestId
} from './playback'

export { startMetalGenerator } from './proceduralMetal'

export { playSongFromData, playMidiFile, playNoteAtTime } from './midiPlayback'

export { playRandomAmbientMidi, playRandomAmbientOgg } from './ambient'

export * from './midiUtils'
// playbackUtils functions are internal to src/utils/audio/ and not re-exported.
// Import directly from './playbackUtils' if needed for testing.
export * from './selectionUtils'
export * from './songUtils'
export * from './timingUtils'
