import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { audioService } from '../utils/audioService'
import { handleError } from '../utils/errorHandler'
import type {
  AudioControlHandlers,
  AudioManagerLike,
  AudioSnapshot,
  UseAudioControlOptions,
  UseAudioControlResult
} from '../types/audio'

export const executeAudioAction = (
  manager: AudioManagerLike,
  methodName: keyof AudioManagerLike,
  errorContext: string,
  ...args: unknown[]
): unknown => {
  try {
    const method = manager[methodName]
    if (typeof method !== 'function') return undefined
    return Reflect.apply(method, manager, args)
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
export const createAudioHandlers = (
  manager: AudioManagerLike
): AudioControlHandlers => ({
  setMusic: (val: number) =>
    executeAudioAction(manager, 'setMusicVolume', 'setMusic', val),
  setSfx: (val: number) =>
    executeAudioAction(manager, 'setSfxVolume', 'setSfx', val),
  toggleMute: () => executeAudioAction(manager, 'toggleMute', 'toggleMute'),
  stopMusic: () => executeAudioAction(manager, 'stopMusic', 'stopMusic'),
  resumeMusic: async () => {
    const result = executeAudioAction(manager, 'resumeMusic', 'resumeMusic')
    if (result === undefined) return false
    return Promise.resolve(result as boolean | Promise<boolean>)
  }
})

export const getAudioSnapshot = (
  manager: AudioManagerLike,
  hasNativeSubscribeOrFallbackRef: boolean | { current: AudioSnapshot | null },
  fallbackSnapshotRefArg?: { current: AudioSnapshot | null }
): AudioSnapshot => {
  const fallbackSnapshotRef =
    typeof hasNativeSubscribeOrFallbackRef === 'boolean'
      ? fallbackSnapshotRefArg
      : hasNativeSubscribeOrFallbackRef
  if (!fallbackSnapshotRef) {
    throw new Error(
      'getAudioSnapshot requires a fallback snapshot ref when called with hasNativeSubscribe'
    )
  }

  const getDefaultSnapshot = (): AudioSnapshot => ({
    musicVol: manager.musicVolume ?? 1,
    sfxVol: manager.sfxVolume ?? 1,
    isMuted: manager.muted ?? false,
    isPlaying: manager.isPlaying ?? false,
    currentSongId: manager.currentSongId ?? null
  })

  const normalizeAudioSnapshot = (value: unknown): AudioSnapshot => {
    const defaults = getDefaultSnapshot()
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return defaults
    }
    const raw = value as Record<string, unknown>
    return {
      musicVol:
        typeof raw.musicVol === 'number' ? raw.musicVol : defaults.musicVol,
      sfxVol: typeof raw.sfxVol === 'number' ? raw.sfxVol : defaults.sfxVol,
      isMuted:
        typeof raw.isMuted === 'boolean' ? raw.isMuted : defaults.isMuted,
      isPlaying:
        typeof raw.isPlaying === 'boolean' ? raw.isPlaying : defaults.isPlaying,
      currentSongId:
        typeof raw.currentSongId === 'string' || raw.currentSongId === null
          ? raw.currentSongId
          : defaults.currentSongId
    }
  }

  const maybeManagedSnapshot =
    typeof manager.getStateSnapshot === 'function'
      ? manager.getStateSnapshot()
      : typeof manager.getState === 'function'
        ? manager.getState()
        : null
  const nextSnapshot = normalizeAudioSnapshot(maybeManagedSnapshot)

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
export function useAudioControl(
  selector?: null,
  options?: UseAudioControlOptions
): UseAudioControlResult<AudioSnapshot>
export function useAudioControl<TSelected>(
  selector: (state: AudioSnapshot) => TSelected,
  options?: UseAudioControlOptions
): UseAudioControlResult<TSelected>
export function useAudioControl<TSelected = AudioSnapshot>(
  selector?: ((state: AudioSnapshot) => TSelected) | null,
  options: UseAudioControlOptions = {}
): UseAudioControlResult<TSelected> {
  const manager = useMemo(() => audioService as AudioManagerLike, [])
  const fallbackSnapshotRef = useRef<AudioSnapshot | null>(null)
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  const hasNativeSubscribe =
    typeof manager.subscribe === 'function' &&
    (typeof manager.hasNativeSubscribe === 'function'
      ? manager.hasNativeSubscribe()
      : true)
  const pollMs =
    Number.isFinite(options.pollMs ?? NaN) && (options.pollMs ?? 0) > 0
      ? (options.pollMs as number)
      : 1000
  const pollEvenWithSubscribe = options.pollEvenWithSubscribe === true

  const getSnapshot = useCallback(
    () => getAudioSnapshot(manager, fallbackSnapshotRef),
    [manager]
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

  return { audioState: audioState as TSelected, handleAudioChange }
}
