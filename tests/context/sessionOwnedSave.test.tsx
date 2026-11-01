import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { GameStateProvider, useGameActions } from '../../src/context/GameState'
import { StorageProvider } from '../../src/context/StorageContext'
import { InMemoryAdapter } from '../../src/utils/storageAdapter'
import { SAVE_KEY } from '../../src/context/usePersistence'
import { resetStorageFallback } from '../../src/utils/storage'

// Start Expedition commits a run without `resetState`, so it asks before
// saving over a stored save only when that save is not this session's own.
// A quota failure: the adapter refuses every write, so saves land in the
// in-memory fallback instead.
class RefusingAdapter extends InMemoryAdapter {
  override set(): boolean {
    return false
  }
}

describe('hasOtherStoredSave', () => {
  const renderActions = (adapter: InMemoryAdapter) => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StorageProvider adapter={adapter}>
        <GameStateProvider>{children}</GameStateProvider>
      </StorageProvider>
    )
    return renderHook(() => useGameActions(), { wrapper }).result
  }

  /** A healthy save written by an earlier session. */
  const seedSaveFromEarlierSession = (adapter: InMemoryAdapter) => {
    const earlier = renderActions(adapter)
    act(() => {
      earlier.current.saveGame(false)
    })
    expect(adapter.get(SAVE_KEY)).not.toBeNull()
  }

  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  afterEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  it('is false when nothing is stored', () => {
    const result = renderActions(new InMemoryAdapter())
    expect(result.current.hasOtherStoredSave()).toBe(false)
  })

  it('is true on a fresh boot over a save from an earlier session', () => {
    const adapter = new InMemoryAdapter()
    seedSaveFromEarlierSession(adapter)

    const result = renderActions(adapter)
    expect(result.current.hasOtherStoredSave()).toBe(true)
  })

  it('is false once this session has written the save', () => {
    const adapter = new InMemoryAdapter()
    seedSaveFromEarlierSession(adapter)
    const result = renderActions(adapter)

    act(() => {
      result.current.saveGame(false)
    })

    expect(result.current.hasOtherStoredSave()).toBe(false)
  })

  it('is false once this session has loaded the save', () => {
    const adapter = new InMemoryAdapter()
    seedSaveFromEarlierSession(adapter)
    const result = renderActions(adapter)

    act(() => {
      expect(result.current.loadGame()).toEqual({ ok: true })
    })

    expect(result.current.hasOtherStoredSave()).toBe(false)
  })

  it('is true again after a new run starts, until its first save lands', () => {
    const adapter = new InMemoryAdapter()
    seedSaveFromEarlierSession(adapter)
    const result = renderActions(adapter)
    act(() => {
      result.current.loadGame()
    })

    act(() => {
      result.current.resetState()
    })
    expect(result.current.hasOtherStoredSave()).toBe(true)

    act(() => {
      result.current.saveGame(false)
    })
    expect(result.current.hasOtherStoredSave()).toBe(false)

    // TourPrep's commit releases the slot the same way.
    act(() => {
      result.current.releaseUnprotectedSlot()
    })
    expect(result.current.hasOtherStoredSave()).toBe(true)
  })

  it('is false once this session saved into the in-memory fallback', () => {
    const result = renderActions(new RefusingAdapter())

    act(() => {
      result.current.saveGame(false)
    })

    expect(result.current.hasOtherStoredSave()).toBe(false)
  })
})
