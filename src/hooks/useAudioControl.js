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
      try {
        audioManager.setMusicVolume(val)
      } catch (e) {
        console.warn('[useAudioControl] setMusicVolume failed:', e)
      }
      setAudioState(prev => ({ ...prev, musicVol: audioManager.musicVolume }))
    },
    setSfx: val => {
      try {
        audioManager.setSFXVolume(val)
      } catch (e) {
        console.warn('[useAudioControl] setSFXVolume failed:', e)
      }
      setAudioState(prev => ({ ...prev, sfxVol: audioManager.sfxVolume }))
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
