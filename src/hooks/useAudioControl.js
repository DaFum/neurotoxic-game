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
      audioManager.setMusicVolume(val)
      setAudioState(prev => ({ ...prev, musicVol: val }))
    },
    setSfx: val => {
      audioManager.setSFXVolume(val)
      setAudioState(prev => ({ ...prev, sfxVol: val }))
    },
    toggleMute: () => {
      const muted = audioManager.toggleMute()
      setAudioState(prev => ({ ...prev, isMuted: muted }))
    }
  }

  return { audioState, handleAudioChange }
}
