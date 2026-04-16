import { audioManager } from './AudioManager.js'

const getState = () => {
  return {
    musicVol: audioManager.musicVolume,
    sfxVol: audioManager.sfxVolume,
    isMuted: audioManager.muted,
    isPlaying: audioManager.isPlaying,
    currentSongId: audioManager.currentSongId ?? null
  }
}

const subscribe = listener => {
  if (typeof audioManager.subscribe === 'function') {
    return audioManager.subscribe(listener)
  }
  return () => {}
}

export const audioService = {
  getState,
  hasNativeSubscribe: () => typeof audioManager.subscribe === 'function',
  subscribe,
  setMusicVolume: value => audioManager.setMusicVolume(value),
  setSfxVolume: value => audioManager.setSFXVolume(value),
  setSFXVolume: value => audioManager.setSFXVolume(value),
  toggleMute: () => audioManager.toggleMute(),
  startAmbient: (...args) => audioManager.startAmbient(...args),
  stopMusic: () => audioManager.stopMusic(),
  resumeMusic: () => audioManager.resumeMusic()
}
