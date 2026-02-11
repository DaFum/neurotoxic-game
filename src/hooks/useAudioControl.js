import { useCallback, useMemo, useState } from 'react'
import { audioManager } from '../utils/AudioManager'
import { handleError } from '../utils/errorHandler'

export const useAudioControl = () => {
  const manager = useMemo(() => audioManager, [])
  const [audioState, setAudioState] = useState({
    musicVol: manager.musicVolume,
    sfxVol: manager.sfxVolume,
    isMuted: manager.muted
  })

  const setMusic = useCallback(
    val => {
      let didApply = false
      try {
        didApply = manager.setMusicVolume(val) !== false
      } catch (error) {
        handleError(error, {
          fallbackMessage: 'useAudioControl.setMusic failed',
          silent: true
        })
      }
      if (didApply) {
        setAudioState(prev => ({ ...prev, musicVol: manager.musicVolume }))
      }
    },
    [manager]
  )

  const setSfx = useCallback(
    val => {
      let didApply = false
      try {
        didApply = manager.setSFXVolume(val) !== false
      } catch (error) {
        handleError(error, {
          fallbackMessage: 'useAudioControl.setSfx failed',
          silent: true
        })
      }
      if (didApply) {
        setAudioState(prev => ({ ...prev, sfxVol: manager.sfxVolume }))
      }
    },
    [manager]
  )

  const toggleMute = useCallback(() => {
    let didApply = false
    let nextMuted = manager.muted
    try {
      nextMuted = manager.toggleMute()
      didApply = true
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'useAudioControl.toggleMute failed',
        silent: true
      })
    }
    if (didApply) {
      setAudioState(prev => ({ ...prev, isMuted: nextMuted }))
    }
  }, [manager])

  const handleAudioChange = useMemo(
    () => ({ setMusic, setSfx, toggleMute }),
    [setMusic, setSfx, toggleMute]
  )

  return { audioState, handleAudioChange }
}
