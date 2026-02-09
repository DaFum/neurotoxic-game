import { useState } from 'react'
import { audioManager } from '../utils/AudioManager'

export const useAudioControl = () => {
  const [audioState, setAudioState] = useState({
    musicVol: audioManager.musicVolume,
    sfxVol: audioManager.sfxVolume,
    isMuted: audioManager.muted
  })

  const handleAudioChange = {
    setMusic: val => {
      let didApply = false
      try {
        didApply = audioManager.setMusicVolume(val) !== false
      } catch (e) {
        console.warn('[useAudioControl] setMusicVolume failed:', e)
      }
      if (didApply) {
        setAudioState(prev => ({ ...prev, musicVol: audioManager.musicVolume }))
      }
    },
    setSfx: val => {
      let didApply = false
      try {
        didApply = audioManager.setSFXVolume(val) !== false
      } catch (e) {
        console.warn('[useAudioControl] setSFXVolume failed:', e)
      }
      if (didApply) {
        setAudioState(prev => ({ ...prev, sfxVol: audioManager.sfxVolume }))
      }
    },
    toggleMute: () => {
      let didApply = false
      try {
        audioManager.toggleMute()
        didApply = true
      } catch (e) {
        console.warn('[useAudioControl] toggleMute failed:', e)
      }
      if (didApply) {
        setAudioState(prev => ({ ...prev, isMuted: audioManager.muted }))
      }
    }
  }

  return { audioState, handleAudioChange }
}
