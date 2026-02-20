import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { audioManager } from '../utils/AudioManager'
import { handleError } from '../utils/errorHandler'

export const useAudioControl = () => {
  const manager = useMemo(() => audioManager, [])
  const getSnapshot = useCallback(() => {
    if (typeof manager.getStateSnapshot === 'function') {
      return manager.getStateSnapshot()
    }

    return {
      musicVol: manager.musicVolume,
      sfxVol: manager.sfxVolume,
      isMuted: manager.muted,
      isPlaying: manager.isPlaying,
      currentSongId: manager.currentSongId ?? null
    }
  }, [manager])

  const subscribe = useCallback(
    listener => {
      if (typeof manager.subscribe === 'function') {
        return manager.subscribe(listener)
      }

      return () => {}
    },
    [manager]
  )

  const audioState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const setMusic = useCallback(
    val => {
      try {
        manager.setMusicVolume(val)
      } catch (error) {
        handleError(error, {
          fallbackMessage: 'useAudioControl.setMusic failed',
          silent: true
        })
      }
    },
    [manager]
  )

  const setSfx = useCallback(
    val => {
      try {
        manager.setSFXVolume(val)
      } catch (error) {
        handleError(error, {
          fallbackMessage: 'useAudioControl.setSfx failed',
          silent: true
        })
      }
    },
    [manager]
  )

  const toggleMute = useCallback(() => {
    try {
      manager.toggleMute()
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'useAudioControl.toggleMute failed',
        silent: true
      })
    }
  }, [manager])

  const handleAudioChange = useMemo(
    () => ({ setMusic, setSfx, toggleMute }),
    [setMusic, setSfx, toggleMute]
  )

  return { audioState, handleAudioChange }
}
