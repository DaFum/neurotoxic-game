import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'

import {
  GameStateProvider,
  useGameSelector,
  useGameActions
} from '../../src/context/GameState'
import { StorageProvider } from '../../src/context/StorageContext'
import { InMemoryAdapter } from '../../src/utils/storageAdapter'
import { resetStorageFallback } from '../../src/utils/storage'

const UNLOCKS_KEY = 'neurotoxic_unlocks'

describe('GameStateProvider initialization honors the injected adapter', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  it('reads initial unlocks from the provided adapter, not the default', () => {
    // Two different backends carrying two different unlock sets: whichever one
    // shows up in state tells us which adapter the lazy initializer read.
    const adapter = new InMemoryAdapter()
    adapter.set(UNLOCKS_KEY, JSON.stringify(['injected_unlock']))
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify(['default_unlock']))

    const wrapper = ({ children }: { children: ReactNode }) => (
      <StorageProvider adapter={adapter}>
        <GameStateProvider>{children}</GameStateProvider>
      </StorageProvider>
    )

    const { result } = renderHook(
      () => useGameSelector(state => state.unlocks),
      { wrapper }
    )

    expect(result.current).toContain('injected_unlock')
    expect(result.current).not.toContain('default_unlock')
  })

  it('reads reset unlocks from the provided adapter, not the default', () => {
    // resetState re-seeds unlocks on a new game / post-game-over reset. Reading
    // the module default there would overwrite the injected backend's unlocks
    // with whatever sits in browser storage.
    const adapter = new InMemoryAdapter()
    adapter.set(UNLOCKS_KEY, JSON.stringify(['injected_unlock']))
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify(['default_unlock']))

    const wrapper = ({ children }: { children: ReactNode }) => (
      <StorageProvider adapter={adapter}>
        <GameStateProvider>{children}</GameStateProvider>
      </StorageProvider>
    )

    const { result } = renderHook(
      () => ({
        unlocks: useGameSelector(state => state.unlocks),
        actions: useGameActions()
      }),
      { wrapper }
    )

    act(() => {
      result.current.actions.resetState()
    })

    expect(result.current.unlocks).toContain('injected_unlock')
    expect(result.current.unlocks).not.toContain('default_unlock')
  })

  it('still uses the default adapter when no provider is mounted', () => {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify(['default_unlock']))

    const wrapper = ({ children }: { children: ReactNode }) => (
      <GameStateProvider>{children}</GameStateProvider>
    )

    const { result } = renderHook(
      () => useGameSelector(state => state.unlocks),
      { wrapper }
    )

    expect(result.current).toContain('default_unlock')
  })
})
