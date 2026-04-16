// @ts-nocheck
import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { audioService } from '../utils/audioService'
import { handleError } from '../utils/errorHandler'

export const executeAudioAction = (
  manager,
  methodName,
  errorContext,
  ...args
) => {
  try {
    return manager[methodName](...args)
  } catch (error) {
    handleError(error, {
      fallbackMessage: `useAudioControl.${errorContext} failed`,
      silent: true
    })
    return undefined
  }
}

export const createAudioHandlers = manager => ({
  setMusic: val =>
    executeAudioAction(manager, 'setMusicVolume', 'setMusic', val),
  setSfx: val => executeAudioAction(manager, 'setSfxVolume', 'setSfx', val),
  toggleMute: () => executeAudioAction(manager, 'toggleMute', 'toggleMute'),
  stopMusic: () => executeAudioAction(manager, 'stopMusic', 'stopMusic'),
  resumeMusic: () => {
    const result = executeAudioAction(manager, 'resumeMusic', 'resumeMusic')
    return result === undefined ? Promise.resolve(false) : result
  }
})

export const getAudioSnapshot = (
  manager,
  hasNativeSubscribe,
  fallbackSnapshotRef
) => {
  const nextSnapshot =
    typeof manager.getState === 'function'
      ? manager.getState()
      : hasNativeSubscribe && typeof manager.getStateSnapshot === 'function'
        ? manager.getStateSnapshot()
        : {
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
}

export const createAudioSubscriber = (
  manager,
  hasNativeSubscribe,
  pollEvenWithSubscribe,
  pollMs
) => {
  return listener => {
    const unsubscribe = hasNativeSubscribe
      ? manager.subscribe(listener)
      : () => {}

    if (hasNativeSubscribe && !pollEvenWithSubscribe) {
      return unsubscribe
    }

    const pollId = setInterval(() => {
      try {
        listener()
      } catch (error) {
        handleError(error, {
          fallbackMessage: 'useAudioControl polling listener failed',
          silent: true
        })
      }
    }, pollMs)

    return () => {
      clearInterval(pollId)
      unsubscribe()
    }
  }
}

/**
 * Provides reactive audio controls backed by AudioManager.
 *
 * @param {(state: object) => any} [selector] - Optional selector to read a focused slice of audio state.
 * @param {{ pollEvenWithSubscribe?: boolean, pollMs?: number }} [options] - Optional polling configuration.
 * @returns {{ audioState: any, handleAudioChange: { setMusic: Function, setSfx: Function, toggleMute: Function, stopMusic: Function, resumeMusic: Function } }}
 */
export const useAudioControl = (selector, options = {}) => {
  const manager = useMemo(() => audioService, [])
  const fallbackSnapshotRef = useRef(null)
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  const hasNativeSubscribe =
    typeof manager.hasNativeSubscribe === 'function'
      ? manager.hasNativeSubscribe()
      : typeof manager.subscribe === 'function'
  const pollMs =
    Number.isFinite(options.pollMs) && options.pollMs > 0
      ? options.pollMs
      : 1000
  const pollEvenWithSubscribe = options.pollEvenWithSubscribe === true

  const getSnapshot = useCallback(
    () => getAudioSnapshot(manager, hasNativeSubscribe, fallbackSnapshotRef),
    [hasNativeSubscribe, manager]
  )

  const subscribe = useMemo(
    () =>
      createAudioSubscriber(
        manager,
        hasNativeSubscribe,
        pollEvenWithSubscribe,
        pollMs
      ),
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

  const handleAudioChange = useMemo(
    () => createAudioHandlers(manager),
    [manager]
  )

  return { audioState, handleAudioChange }
}
