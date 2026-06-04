import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { audioService } from '../utils/audio/audioEngine'
import { handleError } from '../utils/errorHandler'
import type {
  AudioControlHandlers,
  AudioManagerLike,
  AudioSnapshot,
  UseAudioControlOptions,
  UseAudioControlResult
} from '../types/audio'

// Deliberate test seams: these helpers stay exported so audio-control behavior
// can be tested with mock managers without coupling tests to React scheduling.

/**
 * Invokes an audio manager method with consistent silent error handling.
 *
 * @param manager - Audio manager or service facade receiving the method call.
 * @param methodName - Manager method to invoke when it exists.
 * @param errorContext - Label appended to the handled fallback error message.
 * @param args - Arguments forwarded to the selected manager method.
 * @returns The manager method result, or `undefined` when the method is absent or throws.
 */
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
 * Builds UI-facing audio control handlers bound to a manager instance.
 *
 * The manager must expose `setSfxVolume` (camelCase), not `setSFXVolume`.
 * In production this is always `audioService`; custom managers in tests must
 * match this interface.
 *
 * @param manager - Audio manager or service facade receiving handler calls.
 * @returns Handlers for volume, mute, stop, and resume controls.
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

/**
 * Reads and normalizes the current audio snapshot from a manager.
 *
 * Prefers `getStateSnapshot()` over `getState()`, fills missing fields from
 * manager properties, and reuses the previous snapshot object when values are
 * unchanged.
 *
 * @param manager - Audio manager or service facade to read from.
 * @param fallbackSnapshotRef - Mutable cache for the last complete snapshot.
 * @returns Stable complete audio snapshot for React subscription consumers.
 */
export const getAudioSnapshot = (
  manager: AudioManagerLike,
  fallbackSnapshotRef: { current: AudioSnapshot | null }
): AudioSnapshot => {
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
        Object.hasOwn(raw, 'musicVol') &&
        typeof raw.musicVol === 'number' &&
        Number.isFinite(raw.musicVol)
          ? raw.musicVol
          : defaults.musicVol,
      sfxVol:
        Object.hasOwn(raw, 'sfxVol') &&
        typeof raw.sfxVol === 'number' &&
        Number.isFinite(raw.sfxVol)
          ? raw.sfxVol
          : defaults.sfxVol,
      isMuted:
        Object.hasOwn(raw, 'isMuted') && typeof raw.isMuted === 'boolean'
          ? raw.isMuted
          : defaults.isMuted,
      isPlaying:
        Object.hasOwn(raw, 'isPlaying') && typeof raw.isPlaying === 'boolean'
          ? raw.isPlaying
          : defaults.isPlaying,
      currentSongId:
        Object.hasOwn(raw, 'currentSongId') &&
        (typeof raw.currentSongId === 'string' || raw.currentSongId === null)
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

/**
 * Creates a `useSyncExternalStore` subscriber for audio state changes.
 *
 * Subscribes through the manager when available and keeps interval polling
 * active when native subscription support is missing or explicitly requested.
 *
 * @param manager - Audio manager or service facade providing subscription hooks.
 * @param hasNativeSubscribe - Whether the manager's native subscription should be used.
 * @param pollEvenWithSubscribe - Whether to poll even after native subscription succeeds.
 * @param pollMs - Polling interval in milliseconds.
 * @returns Subscribe function that registers a listener and returns cleanup.
 */
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
 * Provides reactive audio state and control handlers backed by `audioService`.
 *
 * Consumers can pass a selector to subscribe to a focused state slice. Polling
 * remains active when the service lacks native subscriptions.
 *
 * @param selector - Optional selector to read a focused slice of audio state.
 * @param options - Optional polling configuration.
 * @returns Selected audio state and control handlers.
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
