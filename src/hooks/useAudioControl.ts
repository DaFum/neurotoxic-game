import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react'
import { audioService } from '../utils/audio/audioEngine'
import {
  createAudioHandlers,
  createAudioSubscriber,
  getAudioSnapshot
} from './audioControlUtils'
import type {
  AudioManagerLike,
  AudioSnapshot,
  UseAudioControlOptions,
  UseAudioControlResult
} from '../types/audio'

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
