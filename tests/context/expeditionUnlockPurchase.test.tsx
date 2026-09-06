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
import { EXPEDITION_UNLOCK_SETS } from '../../src/data/expedition/unlockSets'
import { createInitialState } from '../../src/context/initialState'

const SAVE_KEY = 'neurotoxic_v3_save'

/**
 * A Career that satisfies everything `mechanic_network` asks for.
 *
 * @remarks
 * Applied through the provider's own command surface where one exists; the
 * counters and facility level have no public command yet, so they are written
 * onto the reducer state the provider already holds.
 */
const READY_CAREER = {
  tourTokens: 5,
  finalizedExpeditionRuns: 1,
  hqFacilityLevels: { workshop: 1 }
}

const renderProvider = (adapter: InMemoryAdapter) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <StorageProvider adapter={adapter}>
      <GameStateProvider>{children}</GameStateProvider>
    </StorageProvider>
  )
  return renderHook(
    () => ({
      actions: useGameActions(),
      career: useGameSelector(state => state.career)
    }),
    { wrapper }
  )
}

/**
 * Seeds a save carrying the ready Career, so the provider reaches that state
 * through its own load path rather than by a test writing into the reducer.
 */
const seedSave = (
  adapter: InMemoryAdapter,
  overrides: Record<string, unknown> = {}
) => {
  const base = createInitialState()
  adapter.set(
    SAVE_KEY,
    JSON.stringify({
      player: base.player,
      band: base.band,
      social: base.social,
      gameMap: base.gameMap,
      career: { ...base.career, ...READY_CAREER, ...overrides }
    })
  )
}

describe('the unlock purchase is reachable through useGameActions', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  it('exposes one command rather than the three journal steps', () => {
    const { result } = renderProvider(new InMemoryAdapter())
    expect(typeof result.current.actions.purchaseExpeditionUnlockSet).toBe(
      'function'
    )
  })

  it('debits, persists the marker and grants, in that order', () => {
    const adapter = new InMemoryAdapter()
    seedSave(adapter)
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })

    let bought = false
    act(() => {
      bought =
        result.current.actions.purchaseExpeditionUnlockSet('mechanic_network')
    })

    expect(bought).toBe(true)
    expect(result.current.career.unlockedSetIds).toContain('mechanic_network')
    expect(result.current.career.tourTokens).toBe(
      READY_CAREER.tourTokens - EXPEDITION_UNLOCK_SETS.mechanic_network.cost
    )
    expect(result.current.career.pendingUnlockPurchase).toBeNull()

    // The save left behind is the *granted* state, not the open marker. The
    // marker is written first so a crash in that window is recoverable, but
    // the normal path must not leave the Career paid-up and empty-handed.
    const saved = adapter.get(SAVE_KEY)
    expect(saved).toBeTruthy()
    const persisted = JSON.parse(String(saved))
    expect(persisted.career.pendingUnlockPurchase).toBeNull()
    expect(persisted.career.unlockedSetIds).toContain('mechanic_network')
    expect(persisted.career.tourTokens).toBe(
      READY_CAREER.tourTokens - EXPEDITION_UNLOCK_SETS.mechanic_network.cost
    )
  })

  it('recovers a crash between the debit and the grant', () => {
    // Exactly the window the journal exists for: the process died after the
    // marker write, so the save carries a Career that paid and owns nothing.
    const adapter = new InMemoryAdapter()
    const cost = EXPEDITION_UNLOCK_SETS.mechanic_network.cost
    seedSave(adapter, {
      tourTokens: READY_CAREER.tourTokens - cost,
      pendingUnlockPurchase: { setId: 'mechanic_network', debitedTokens: cost }
    })
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })

    // The marker is a receipt, so load finishes the grant rather than
    // refunding: the debit is already inside the persisted balance.
    expect(result.current.career.unlockedSetIds).toContain('mechanic_network')
    expect(result.current.career.pendingUnlockPurchase).toBeNull()
    expect(result.current.career.tourTokens).toBe(
      READY_CAREER.tourTokens - cost
    )

    // And the set is owned once, not twice, however often the save is read.
    act(() => {
      result.current.actions.loadGame()
    })
    expect(
      result.current.career.unlockedSetIds.filter(
        (id: string) => id === 'mechanic_network'
      )
    ).toHaveLength(1)
  })

  it('does not block the next purchase after recovering one', () => {
    const adapter = new InMemoryAdapter()
    const cost = EXPEDITION_UNLOCK_SETS.mechanic_network.cost
    seedSave(adapter, {
      tourTokens: READY_CAREER.tourTokens - cost,
      hqFacilityLevels: { workshop: 1, rehearsal: 1 },
      finalizedExpeditionRuns: 2,
      completedExpeditionRuns: 1,
      pendingUnlockPurchase: { setId: 'mechanic_network', debitedTokens: cost }
    })
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })
    // Before the fix the recovered entry stayed open forever and
    // `handleBeginExpeditionUnlockPurchase` refused every later purchase.
    expect(result.current.career.pendingUnlockPurchase).toBeNull()

    let bought = false
    act(() => {
      bought =
        result.current.actions.purchaseExpeditionUnlockSet('festival_network')
    })
    expect(bought).toBe(true)
    expect(result.current.career.unlockedSetIds).toContain('festival_network')
  })

  it('takes nothing when the Career cannot afford the set', () => {
    const adapter = new InMemoryAdapter()
    seedSave(adapter, { tourTokens: 1 })
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })

    let bought = true
    act(() => {
      bought =
        result.current.actions.purchaseExpeditionUnlockSet('mechanic_network')
    })

    expect(bought).toBe(false)
    expect(result.current.career.tourTokens).toBe(1)
    expect(result.current.career.unlockedSetIds).not.toContain(
      'mechanic_network'
    )
    // No journal entry is left open, so nothing is owed on the next load.
    expect(result.current.career.pendingUnlockPurchase).toBeNull()
  })

  it('takes nothing for a set the registry does not have', () => {
    const adapter = new InMemoryAdapter()
    seedSave(adapter)
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })

    let bought = true
    act(() => {
      bought = result.current.actions.purchaseExpeditionUnlockSet('__proto__')
    })

    expect(bought).toBe(false)
    expect(result.current.career.tourTokens).toBe(READY_CAREER.tourTokens)
    expect(result.current.career.pendingUnlockPurchase).toBeNull()
  })
})
