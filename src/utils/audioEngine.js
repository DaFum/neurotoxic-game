/**
 * Audio Engine Utility
 * This module manages the AudioContext and Tone.js logic for both Rhythm Game music and UI SFX.
 * Note: This file contains side-effects (Tone.start, AudioContext creation) as per architectural design exceptions.
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
export * from './audio/playbackUtils.js'
export * from './audio/selectionUtils.js'
export * from './audio/songUtils.js'
export * from './audio/timingUtils.js'
