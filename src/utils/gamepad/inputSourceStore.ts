/**
 * External Input Source Store & useActiveInputSource hook.
 * Tracks activity across 'keyboard', 'pointer', 'touch', and 'gamepad'.
 * Mirrors changes to `data-input-source` on document.documentElement.
 */

import { useSyncExternalStore } from 'react'

export type ActiveInputSource = 'keyboard' | 'pointer' | 'touch' | 'gamepad'

let currentSource: ActiveInputSource = 'keyboard'
const listeners = new Set<() => void>()

function syncDocumentAttribute(source: ActiveInputSource): void {
  if (typeof document !== 'undefined' && document.documentElement) {
    if (document.documentElement.getAttribute('data-input-source') !== source) {
      document.documentElement.setAttribute('data-input-source', source)
    }
  }
}

export function setActiveInputSource(source: ActiveInputSource): void {
  if (currentSource === source) return
  currentSource = source
  syncDocumentAttribute(source)
  listeners.forEach(listener => listener())
}

export function getActiveInputSource(): ActiveInputSource {
  return currentSource
}

export function subscribeActiveInputSource(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useActiveInputSource(): ActiveInputSource {
  return useSyncExternalStore(
    subscribeActiveInputSource,
    getActiveInputSource,
    () => 'keyboard' as ActiveInputSource
  )
}

if (typeof window !== 'undefined') {
  syncDocumentAttribute(currentSource)

  window.addEventListener(
    'keydown',
    () => {
      setActiveInputSource('keyboard')
    },
    { capture: true, passive: true }
  )

  window.addEventListener(
    'pointerdown',
    e => {
      if (e.pointerType === 'touch') {
        setActiveInputSource('touch')
      } else {
        setActiveInputSource('pointer')
      }
    },
    { capture: true, passive: true }
  )

  window.addEventListener(
    'touchstart',
    () => {
      setActiveInputSource('touch')
    },
    { capture: true, passive: true }
  )
}
