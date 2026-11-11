import { audioManager } from './AudioManager'
import type { AudioSfxType } from './AudioManager'

type AudioServiceListener = () => void

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
  getState: () => audioManager.getStateSnapshot(),
  getStateSnapshot: () => audioManager.getStateSnapshot(),
  hasNativeSubscribe: () => typeof audioManager.subscribe === 'function',
  subscribe,
  setMusicVolume: (value: number) => audioManager.setMusicVolume(value),
  setSfxVolume: (value: number) => audioManager.setSFXVolume(value),
  toggleMute: () => audioManager.toggleMute(),
  startAmbient: () => audioManager.startAmbient(),
  stopMusic: () => audioManager.stopMusic(),
  resumeMusic: () => audioManager.resumeMusic(),
  ensureAudioContext: () => audioManager.ensureAudioContext(),
  playSFX: (id: AudioSfxType) => audioManager.playSFX(id),
  setNeuroDecimator: (isActive: boolean) =>
    audioManager.setNeuroDecimator(isActive)
}
