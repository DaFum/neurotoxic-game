import { useSyncExternalStore } from 'react'

export type InputSource = 'keyboard' | 'pointer' | 'touch' | 'gamepad'
let source: InputSource = 'keyboard'
const listeners = new Set<() => void>()
export function getActiveInputSource(): InputSource {
  return source
}
export function setActiveInputSource(next: InputSource): void {
  if (source === next) return
  source = next
  if (typeof document !== 'undefined')
    document.documentElement.dataset.inputSource = next
  listeners.forEach(listener => listener())
}
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
