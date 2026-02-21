import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { audioManager } from '../utils/AudioManager'
import { handleError } from '../utils/errorHandler'

/**
 * Provides reactive audio controls backed by AudioManager.
 *
 * @param {(state: object) => any} [selector] - Optional selector to read a focused slice of audio state.
 * @param {{ pollEvenWithSubscribe?: boolean, pollMs?: number }} [options] - Optional polling configuration.
 * @returns {{ audioState: any, handleAudioChange: { setMusic: Function, setSfx: Function, toggleMute: Function, stopMusic: Function, resumeMusic: Function } }}
 */
export const useAudioControl = (selector, options = {}) => {
  const manager = useMemo(() => audioManager, [])
  const fallbackSnapshotRef = useRef(null)
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  const hasNativeSubscribe = typeof manager.subscribe === 'function'
  const pollMs = Number.isFinite(options.pollMs) && options.pollMs > 0 ? options.pollMs : 1000
  const pollEvenWithSubscribe = options.pollEvenWithSubscribe === true

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
      const unsubscribe = hasNativeSubscribe ? manager.subscribe(listener) : () => {}

      if (hasNativeSubscribe && !pollEvenWithSubscribe) {
        return unsubscribe
      }

      const pollId = setInterval(listener, pollMs)
      return () => {
        clearInterval(pollId)
        unsubscribe()
      }
    },
    [hasNativeSubscribe, manager, pollEvenWithSubscribe, pollMs]
  )

  const getSelectedSnapshot = useCallback(() => {
    const snapshot = getSnapshot()
    if (typeof selectorRef.current === 'function') {
      return selectorRef.current(snapshot)
    }

    return snapshot
  }, [getSnapshot])

  const audioState = useSyncExternalStore(
    subscribe,
    getSelectedSnapshot,
    getSelectedSnapshot
  )

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

  const stopMusic = useCallback(() => {
    try {
      manager.stopMusic()
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'useAudioControl.stopMusic failed',
        silent: true
      })
    }
  }, [manager])

  const resumeMusic = useCallback(() => {
    try {
      return manager.resumeMusic()
    } catch (error) {
      handleError(error, {
        fallbackMessage: 'useAudioControl.resumeMusic failed',
        silent: true
      })
      return Promise.resolve(false)
    }
  }, [manager])

  const handleAudioChange = useMemo(
    () => ({ setMusic, setSfx, toggleMute, stopMusic, resumeMusic }),
    [setMusic, setSfx, toggleMute, stopMusic, resumeMusic]
  )

  return { audioState, handleAudioChange }
}
