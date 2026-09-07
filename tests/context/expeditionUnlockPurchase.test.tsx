import { describe, it, expect, beforeEach, vi } from 'vitest'
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

    // Whatever is in storage at this instant - the marker, or the granted
    // state once the commit-driven save flushes - must reload to the same
    // place. That is the actual crash-safety contract; asserting one specific
    // intermediate would pin the timing rather than the guarantee.
    const saved = adapter.get(SAVE_KEY)
    expect(saved).toBeTruthy()
    const persisted = JSON.parse(String(saved))
    expect(persisted.career.tourTokens).toBe(
      READY_CAREER.tourTokens - EXPEDITION_UNLOCK_SETS.mechanic_network.cost
    )
    act(() => {
      result.current.actions.loadGame()
    })
    expect(result.current.career.unlockedSetIds).toContain('mechanic_network')
    expect(result.current.career.pendingUnlockPurchase).toBeNull()
    expect(result.current.career.tourTokens).toBe(
      READY_CAREER.tourTokens - EXPEDITION_UNLOCK_SETS.mechanic_network.cost
    )
  })

  it('never writes a save that omits a change from the same batch', () => {
    // The journal used to persist a locally computed post-debit snapshot.
    // That snapshot is derived from the state the provider last rendered, so
    // anything dispatched earlier in the same batch is missing from it - and
    // writing it puts the omission into storage, where a process exit before
    // the next save makes it permanent. Every write the purchase makes must
    // therefore carry the committed state, not a simulation of it.
    const adapter = new InMemoryAdapter()
    seedSave(adapter)
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })

    const writes = vi.spyOn(adapter, 'set')
    let bought = false
    act(() => {
      result.current.actions.updateSettings({ tutorialSeen: true })
      bought =
        result.current.actions.purchaseExpeditionUnlockSet('mechanic_network')
    })
    expect(bought).toBe(true)

    const saves = writes.mock.calls
      .filter(([key]) => key === SAVE_KEY)
      .map(([, value]) => JSON.parse(String(value)))
    expect(saves.length).toBeGreaterThan(0)
    for (const save of saves) {
      expect(save.settings.tutorialSeen).toBe(true)
      // And the debit the journal entry is a receipt for is in every one of
      // them, which is what makes the entry recoverable.
      expect(save.career.tourTokens).toBe(
        READY_CAREER.tourTokens - EXPEDITION_UNLOCK_SETS.mechanic_network.cost
      )
    }
  })

  it('refuses a second purchase started inside the same batch', () => {
    // `dispatch` does not update `stateRef`, so without the guard the second
    // call would recompute from the pre-begin snapshot and persist a state
    // that has never seen the first purchase. The Career below can legally
    // afford *both* sets, so only the guard can refuse the second one.
    const adapter = new InMemoryAdapter()
    seedSave(adapter, {
      tourTokens: 8,
      finalizedExpeditionRuns: 2,
      completedExpeditionRuns: 1,
      hqFacilityLevels: { workshop: 1, rehearsal: 1 }
    })
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })

    let second: boolean | null = null
    act(() => {
      result.current.actions.purchaseExpeditionUnlockSet('mechanic_network')
      second =
        result.current.actions.purchaseExpeditionUnlockSet('festival_network')
    })
    expect(second).toBe(false)
    expect(result.current.career.unlockedSetIds).toEqual(['mechanic_network'])
    expect(result.current.career.tourTokens).toBe(
      8 - EXPEDITION_UNLOCK_SETS.mechanic_network.cost
    )

    // The guard releases at the next commit, so the second set is buyable
    // straight afterwards rather than being lost.
    act(() => {
      second =
        result.current.actions.purchaseExpeditionUnlockSet('festival_network')
    })
    expect(second).toBe(true)
    expect(result.current.career.unlockedSetIds).toContain('festival_network')
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
