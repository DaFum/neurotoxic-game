import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { audioService } from '../utils/audioService'
import { handleError } from '../utils/errorHandler'

type AudioSnapshot = {
  musicVol: number
  sfxVol: number
  isMuted: boolean
  isPlaying?: boolean
  currentSongId?: string | null
}
type AudioManagerLike = {
  [key: string]: unknown
  musicVolume?: number
  sfxVolume?: number
  muted?: boolean
  isPlaying?: boolean
  currentSongId?: string | null
  getState?: () => AudioSnapshot
  getStateSnapshot?: () => AudioSnapshot
  hasNativeSubscribe?: () => boolean
  subscribe?: (listener: () => void) => () => void
  setMusicVolume?: (value: number) => unknown
  setSfxVolume?: (value: number) => unknown
  toggleMute?: () => unknown
  stopMusic?: () => unknown
  resumeMusic?: () => Promise<boolean> | boolean
}

type AudioHandlers = {
  setMusic: (val: number) => unknown
  setSfx: (val: number) => unknown
  toggleMute: () => unknown
  stopMusic: () => unknown
  resumeMusic: () => unknown
}

type UseAudioControlOptions = {
  pollEvenWithSubscribe?: boolean
  pollMs?: number
}

export const executeAudioAction = (
  manager: AudioManagerLike,
  methodName: keyof AudioManagerLike,
  errorContext: string,
  ...args: unknown[]
): unknown => {
  try {
    const method = manager[methodName]
    if (typeof method !== 'function') return undefined
    return method(...args)
  } catch (error) {
    handleError(error, {
      fallbackMessage: `useAudioControl.${errorContext} failed`,
      silent: true
    })
    return undefined
  }
}

/**
 * Build audio event handlers bound to a manager instance.
 * The manager must expose `setSfxVolume` (camelCase), not `setSFXVolume`.
 * In production this is always `audioService`; custom managers in tests must
 * match this interface.
 */
export const createAudioHandlers = (manager: AudioManagerLike): AudioHandlers => ({
  setMusic: (val: number) =>
    executeAudioAction(manager, 'setMusicVolume', 'setMusic', val),
  setSfx: (val: number) =>
    executeAudioAction(manager, 'setSfxVolume', 'setSfx', val),
  toggleMute: () => executeAudioAction(manager, 'toggleMute', 'toggleMute'),
  stopMusic: () => executeAudioAction(manager, 'stopMusic', 'stopMusic'),
  resumeMusic: () => {
    const result = executeAudioAction(manager, 'resumeMusic', 'resumeMusic')
    return result === undefined ? false : result
  }
})

export const getAudioSnapshot = (
  manager: AudioManagerLike,
  hasNativeSubscribe: boolean,
  fallbackSnapshotRef: { current: AudioSnapshot | null }
): AudioSnapshot => {
  const nextSnapshot =
    typeof manager.getState === 'function'
      ? manager.getState()
      : hasNativeSubscribe && typeof manager.getStateSnapshot === 'function'
          ? manager.getStateSnapshot()
          : {
            musicVol: manager.musicVolume ?? 1,
            sfxVol: manager.sfxVolume ?? 1,
            isMuted: manager.muted ?? false,
            isPlaying: manager.isPlaying ?? false,
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
  manager: AudioManagerLike,
  hasNativeSubscribe: boolean,
  pollEvenWithSubscribe: boolean,
  pollMs: number
): ((listener: () => void) => () => void) => {
  return (listener: () => void) => {
    const unsubscribe = hasNativeSubscribe
      ? (manager.subscribe?.(listener) ?? (() => {}))
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
export const useAudioControl = (
  selector?: ((state: AudioSnapshot) => unknown) | null,
  options: UseAudioControlOptions = {}
): { audioState: unknown; handleAudioChange: AudioHandlers } => {
  const manager = useMemo(() => audioService as AudioManagerLike, [])
  const fallbackSnapshotRef = useRef<AudioSnapshot | null>(null)
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  const hasNativeSubscribe =
    typeof manager.hasNativeSubscribe === 'function'
      ? manager.hasNativeSubscribe()
      : typeof manager.subscribe === 'function'
  const pollMs =
    Number.isFinite(options.pollMs ?? NaN) && (options.pollMs ?? 0) > 0
      ? (options.pollMs as number)
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
