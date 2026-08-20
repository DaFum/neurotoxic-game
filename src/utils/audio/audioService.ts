import { audioManager } from './AudioManager'

type AudioServiceListener = () => void

const getState = () => {
  const snapshot = audioManager.getStateSnapshot()
  return {
    ...snapshot,
    musicVol: audioManager.musicVolume ?? snapshot.musicVol,
    sfxVol: audioManager.sfxVolume ?? snapshot.sfxVol,
    isMuted: audioManager.muted ?? snapshot.isMuted,
    isPlaying: audioManager.isPlaying ?? snapshot.isPlaying,
    currentSongId: audioManager.currentSongId ?? snapshot.currentSongId ?? null
  }
}

const subscribe = (listener: AudioServiceListener): (() => void) => {
  if (typeof audioManager.subscribe === 'function') {
    return audioManager.subscribe(listener)
  }
  return () => {}
}

/**
 * React-facing audio facade with snapshot, subscription, volume, and playback helpers.
 *
 * @remarks
 * `setSfxVolume` intentionally normalizes the React-facing acronym casing while
 * delegating to `audioManager.setSFXVolume`.
 */
export const audioService = {
  getState,
  hasNativeSubscribe: () => typeof audioManager.subscribe === 'function',
  subscribe,
  setMusicVolume: audioManager.setMusicVolume.bind(audioManager),
  setSfxVolume: audioManager.setSFXVolume.bind(audioManager),
  toggleMute: audioManager.toggleMute.bind(audioManager),
  startAmbient: audioManager.startAmbient.bind(audioManager),
  stopMusic: audioManager.stopMusic.bind(audioManager),
  resumeMusic: audioManager.resumeMusic.bind(audioManager),
  ensureAudioContext: audioManager.ensureAudioContext.bind(audioManager),
  playSFX: audioManager.playSFX.bind(audioManager),
  setNeuroDecimator: audioManager.setNeuroDecimator.bind(audioManager)
}
