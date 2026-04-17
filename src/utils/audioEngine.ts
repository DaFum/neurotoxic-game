// TODO: Review this file
/**
 * Audio Engine Utility
 * This module manages the AudioContext and Tone.js logic for both Rhythm Game music and UI SFX.
 * Note: This file is an export hub. Side-effects (Tone.start, AudioContext creation) are handled in src/utils/audio/setup.js.
 *
 * REFACTORED: Implementation logic has been moved to src/utils/audio/*.
 */

export { setupAudio } from './audio/setup'
export {
  getRawAudioContext,
  ensureAudioContext,
  getAudioContextTimeSec,
  getToneStartTimeSec
} from './audio/context'
export { disposeAudio, safeDispose } from './audio/dispose'

export { hasAudioAsset, loadAudioBuffer } from './audio/assets'

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
} from './audio/playback'

export { startMetalGenerator } from './audio/proceduralMetal'

export {
  playSongFromData,
  playMidiFile,
  playNoteAtTime
} from './audio/midiPlayback'

export { playRandomAmbientMidi, playRandomAmbientOgg } from './audio/ambient'

export * from './audio/midiUtils'
// playbackUtils functions are internal to src/utils/audio/ and not re-exported.
// Import directly from './audio/playbackUtils' if needed for testing.
export * from './audio/selectionUtils'
export * from './audio/songUtils'
export * from './audio/timingUtils'
