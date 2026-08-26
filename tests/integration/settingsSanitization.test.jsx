import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  GameStateProvider,
  useGameActions
} from '../../src/context/GameState.tsx'
import { readGlobalSettings } from '../../src/utils/storage'
import { logger, LOG_LEVELS } from '../../src/utils/logger'

const wrapper = ({ children }) => (
  <GameStateProvider>{children}</GameStateProvider>
)

describe('updateSettings global storage sanitization', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('does not persist invalid or unknown keys to global settings', () => {
    const { result } = renderHook(() => useGameActions(), { wrapper })

    const setItemSpy = vi.spyOn(window.localStorage, 'setItem')
    try {
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
      setItemSpy.mockRestore()
    }
  })

  it('holds the live logger to the same contract as persisted settings', () => {
    const { result } = renderHook(() => useGameActions(), { wrapper })

    // Baseline after mount, so the provider's logger-sync effect has already
    // run and cannot race the assertions below.
    logger.setLevel(LOG_LEVELS.WARN)

    act(() => {
      result.current.updateSettings({ logLevel: '0' })
    })

    // `Number('0')` is a valid level, so the logger used to drop to DEBUG here
    // while the reducer and global storage both rejected the string -- runtime
    // logging ran on a more permissive contract than the persisted setting.
    expect(logger.minLevel).toBe(LOG_LEVELS.WARN)
    expect(readGlobalSettings().logLevel).not.toBe('0')

    // A properly typed level still applies.
    act(() => {
      result.current.updateSettings({ logLevel: LOG_LEVELS.DEBUG })
    })
    expect(logger.minLevel).toBe(LOG_LEVELS.DEBUG)
    expect(readGlobalSettings().logLevel).toBe(LOG_LEVELS.DEBUG)
  })
})
