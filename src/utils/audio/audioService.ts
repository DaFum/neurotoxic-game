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

export const audioService = {
  getState,
  hasNativeSubscribe: () => typeof audioManager.subscribe === 'function',
  subscribe,
  setMusicVolume: (value: number) => audioManager.setMusicVolume(value),
  setSfxVolume: (value: number) => audioManager.setSFXVolume(value),
  toggleMute: () => audioManager.toggleMute(),
  startAmbient: () => audioManager.startAmbient(),
  stopMusic: () => audioManager.stopMusic(),
  resumeMusic: () => audioManager.resumeMusic()
}
