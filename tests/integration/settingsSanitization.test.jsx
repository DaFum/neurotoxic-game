import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions
} from '../../src/context/GameState.tsx'
import { readGlobalSettings } from '../../src/utils/storage'

const wrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
)

describe('updateSettings global storage sanitization', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('does not persist invalid or unknown keys to global settings', () => {
    const { result } = renderHook(() => useGameActions(), { wrapper })

    const originalSetItem = window.localStorage.setItem
    try {
      window.localStorage.setItem = vi.fn(originalSetItem)

      act(() => {
        result.current.updateSettings({
          logLevel: 'bad',
          unknown: true,
          crtEnabled: true
        })
      })

      const persisted = readGlobalSettings()
      expect(Object.hasOwn(persisted, 'unknown')).toBe(false)
      expect(persisted.logLevel).not.toBe('bad')
      // Valid whitelisted keys still persist.
      expect(persisted.crtEnabled).toBe(true)
    } finally {
      window.localStorage.setItem = originalSetItem
    }
  })
})
