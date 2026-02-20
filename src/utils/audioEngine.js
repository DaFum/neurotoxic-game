/**
 * Audio Engine Utility
 * This module manages the AudioContext and Tone.js logic for both Rhythm Game music and UI SFX.
 * Note: This file is an export hub. Side-effects (Tone.start, AudioContext creation) are handled in src/utils/audio/setup.js.
 *
 * REFACTORED: Implementation logic has been moved to src/utils/audio/*.
 */

export {
  setupAudio,
  ensureAudioContext,
  getAudioContextTimeSec,
  getToneStartTimeSec,
  disposeAudio
} from './audio/setup.js'

export { hasAudioAsset, loadAudioBuffer } from './audio/assets.js'

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
  getAudioTimeMs
} from './audio/playback.js'

export {
  playSongFromData,
  startMetalGenerator,
  playMidiFile,
  playRandomAmbientMidi,
  playRandomAmbientOgg,
  playNoteAtTime
} from './audio/procedural.js'

export * from './audio/midiUtils.js'
// playbackUtils functions are internal to src/utils/audio/ and not re-exported.
// Import directly from './audio/playbackUtils.js' if needed for testing.
export * from './audio/selectionUtils.js'
export * from './audio/songUtils.js'
export * from './audio/timingUtils.js'
