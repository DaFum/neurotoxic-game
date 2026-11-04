import { useSyncExternalStore } from 'react'

/**
 * Represents the active input modality being used by the player.
 */
export type InputSource = 'keyboard' | 'pointer' | 'touch' | 'gamepad'
let source: InputSource = 'keyboard'
const listeners = new Set<() => void>()

/**
 * Retrieves the currently active input source.
 *
 * @returns The active input source.
 */
export function getActiveInputSource(): InputSource {
  return source
}

/**
 * Updates the globally tracked input source and notifies all subscribers.
 *
 * @remarks
 * If the provided source is identical to the current one, this function acts as a no-op.
 * It also mutates the `data-input-source` attribute on the `document.documentElement`
 * for global CSS styling purposes, mirroring the central state without moving DOM focus.
 *
 * @param next - The new input source to set as active.
 */
export function setActiveInputSource(next: InputSource): void {
  if (source === next) return
  source = next
  if (typeof document !== 'undefined')
    document.documentElement.dataset.inputSource = next
  listeners.forEach(listener => listener())
}

/**
 * React hook that subscribes to and returns the active input source.
 *
 * @returns The current input source, defaulting to 'keyboard' during server-side rendering or before initialization.
 */
export function useActiveInputSource(): InputSource {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => source,
    () => 'keyboard'
  )
}
