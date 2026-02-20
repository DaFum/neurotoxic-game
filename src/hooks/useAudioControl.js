import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { audioManager } from '../utils/AudioManager'
import { handleError } from '../utils/errorHandler'

/**
 * Provides reactive audio controls backed by AudioManager.
 *
 * @param {(state: object) => any} [selector] - Optional selector to read a focused slice of audio state.
 * @returns {{ audioState: any, handleAudioChange: { setMusic: Function, setSfx: Function, toggleMute: Function } }}
 */
export const useAudioControl = selector => {
  const manager = useMemo(() => audioManager, [])
  const fallbackSnapshotRef = useRef(null)
  const hasNativeSubscribe = typeof manager.subscribe === 'function'

  const getSnapshot = useCallback(() => {
    if (hasNativeSubscribe && typeof manager.getStateSnapshot === 'function') {
      return manager.getStateSnapshot()
    }

    const nextSnapshot = {
      musicVol: manager.musicVolume,
      sfxVol: manager.sfxVolume,
      isMuted: manager.muted,
      isPlaying: manager.isPlaying,
      currentSongId: manager.currentSongId ?? null
    }

    const previousSnapshot = fallbackSnapshotRef.current
    if (
      previousSnapshot &&
      previousSnapshot.musicVol === nextSnapshot.musicVol &&
      previousSnapshot.sfxVol === nextSnapshot.sfxVol &&
      previousSnapshot.isMuted === nextSnapshot.isMuted &&
      previousSnapshot.isPlaying === nextSnapshot.isPlaying &&
      previousSnapshot.currentSongId === nextSnapshot.currentSongId
    ) {
      return previousSnapshot
    }

    fallbackSnapshotRef.current = nextSnapshot
    return nextSnapshot
  }, [hasNativeSubscribe, manager])

  const subscribe = useCallback(
    listener => {
      if (hasNativeSubscribe) {
        return manager.subscribe(listener)
      }

      const pollId = setInterval(listener, 1000)
      return () => clearInterval(pollId)
    },
    [hasNativeSubscribe, manager]
  )

  const baseAudioState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const audioState = useMemo(() => {
    if (typeof selector === 'function') {
      return selector(baseAudioState)
    }

    return baseAudioState
  }, [baseAudioState, selector])

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
    [hasNativeSubscribe, manager]
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
    [hasNativeSubscribe, manager]
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
  }, [hasNativeSubscribe, manager])

  const handleAudioChange = useMemo(
    () => ({ setMusic, setSfx, toggleMute }),
    [setMusic, setSfx, toggleMute]
  )

  return { audioState, handleAudioChange }
}
