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
        setAudioState(prev => ({ ...prev, musicVol: val }))
      } catch (e) {
        console.warn('[useAudioControl] setMusicVolume failed:', e)
      }
    },
    setSfx: val => {
      try {
        audioManager.setSFXVolume(val)
        setAudioState(prev => ({ ...prev, sfxVol: val }))
      } catch (e) {
        console.warn('[useAudioControl] setSFXVolume failed:', e)
      }
    },
    toggleMute: () => {
      try {
        const muted = audioManager.toggleMute()
        setAudioState(prev => ({ ...prev, isMuted: muted }))
      } catch (e) {
        console.warn('[useAudioControl] toggleMute failed:', e)
      }
    }
  }

  return { audioState, handleAudioChange }
}
