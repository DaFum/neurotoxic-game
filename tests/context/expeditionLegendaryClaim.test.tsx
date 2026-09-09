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
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { startedState, walkToFinale } from '../expeditionLifecycleFixture.js'

/**
 * Task 11 makes the Legendary marker a hard barrier: the award is durable
 * before the Career is allowed to record it. This suite drives the real claim
 * command against real storage, which is the half the scene tests cannot
 * reach - they inject the verdict, and the G5 integration suite dispatches
 * `COMMIT_EXPEDITION_LEGENDARY_REWARD` directly and so never touches
 * `unlockManager` at all.
 */

const SAVE_KEY = 'neurotoxic_v3_save'
const UNLOCKS_KEY = 'neurotoxic_unlocks'

/** The Legendary a completed `regional_headliner` Finale awards. */
const AWARD = 'safe_harbor'

/** An adapter whose writes stop landing, the way a full or blocked quota does. */
class RefusingAdapter extends InMemoryAdapter {
  refuse = false

  override set(key: string, value: string): boolean {
    if (this.refuse) return false
    return super.set(key, value)
  }
}

/**
 * A save carrying a completed Finale, built by walking the real route.
 *
 * @remarks
 * Assembled through the production reducers rather than hand-written, because
 * `sanitizeExpeditionState` validates the whole visited path against the
 * canonical map on load: a seeded terminal run that did not really happen
 * collapses to idle and the claim would then have nothing to refuse.
 */
const completedFinaleSave = () => {
  let state = startedState({ money: 5000 })
  state = walkToFinale(state)
  state = {
    ...state,
    currentGig: { id: 'finale_venue' },
    lastGigStats: { score: 9000, accuracy: 85, failed: false },
    expedition: {
      ...state.expedition,
      finaleType: 'regional_headliner',
      lastGigResolvedAtRouteStep: state.expedition.routeStep
    }
  }
  state = gameReducer(state, {
    type: ActionTypes.COMPLETE_EXPEDITION,
    payload: {
      finaleResultId: 'claim_barrier_finale',
      expectedRouteStep: state.expedition.routeStep
    }
  })
  expect(state.expedition.status).toBe('completed')
  return {
    runId: state.expedition.outcome.runId,
    save: {
      player: state.player,
      band: state.band,
      social: state.social,
      gameMap: state.gameMap,
      runSeed: state.runSeed,
      currentGig: state.currentGig,
      lastGigStats: state.lastGigStats,
      expedition: state.expedition,
      // The rank the award needs. Written onto the seeded Career because the
      // counters have no public command; everything the claim itself reads is
      // recomputed from the outcome above.
      career: {
        ...state.career,
        finalizedExpeditionRuns: 5,
        completedExpeditionRuns: 5,
        completedExpeditionRegionIds: ['home_turf', 'festival_fields']
      }
    }
  }
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
      career: useGameSelector(state => state.career),
      unlocks: useGameSelector(state => state.unlocks)
    }),
    { wrapper }
  )
}

describe('the Legendary claim mints nothing without a durable marker', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  it('grants the award once the marker is written', () => {
    const adapter = new RefusingAdapter()
    const { runId, save } = completedFinaleSave()
    adapter.set(SAVE_KEY, JSON.stringify(save))
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })
    // The run survived the load path, or the refusal below would prove nothing.
    expect(result.current.career.legendaryIds).toEqual([])

    let claim: string | null = null
    act(() => {
      claim = result.current.actions.claimExpeditionLegendaryReward(runId)
    })

    expect(claim).toBe('claimed')
    expect(result.current.career.legendaryIds).toContain(AWARD)
    expect(result.current.career.legendaryClaimedRunIds).toContain(runId)
    expect(String(adapter.get(UNLOCKS_KEY))).toContain(
      `expedition.legendary.${AWARD}`
    )
  })

  it('refuses the claim and records nothing when the write does not land', () => {
    const adapter = new RefusingAdapter()
    const { runId, save } = completedFinaleSave()
    adapter.set(SAVE_KEY, JSON.stringify(save))
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })

    // Storage stops accepting writes. The marker still reads back for this
    // session out of the fallback store, which is exactly the loss the barrier
    // exists for: the next load would not have it.
    adapter.refuse = true
    let claim: string | null = null
    act(() => {
      claim = result.current.actions.claimExpeditionLegendaryReward(runId)
    })

    expect(claim).toBe('persistence_failed')
    // Nothing minted: no capability, no spent claim, no unlock in state.
    expect(result.current.career.legendaryIds).toEqual([])
    expect(result.current.career.legendaryClaimedRunIds).not.toContain(runId)
    expect(result.current.unlocks).not.toContain(
      `expedition.legendary.${AWARD}`
    )

    // And the claim is still unspent, so a retry once storage recovers awards
    // the Legendary rather than having quietly lost it.
    adapter.refuse = false
    act(() => {
      claim = result.current.actions.claimExpeditionLegendaryReward(runId)
    })
    expect(claim).toBe('claimed')
    expect(result.current.career.legendaryIds).toContain(AWARD)
  })
})
