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
import { BETWEEN_TOUR_CASH_OUT_PAYOUT } from '../../src/data/expedition/betweenTour'
import { createInitialState } from '../../src/context/initialState'

/**
 * Task 13 makes a Between-Tour answer persisted Career state, and answering
 * changes no scene. These tests hold that the write travels with the command:
 * the scene-transition autosave is the only other writer, so a crash after the
 * first of several answers used to restore the open decision and let the same
 * choice be taken again.
 */

const SAVE_KEY = 'neurotoxic_v3_save'
const RUN_ID = 'run_between_tour_1'

/** Two open decisions, so answering one leaves the set unfinished. */
const DECISIONS = [
  {
    id: 'decision_contact',
    type: 'network_contact',
    target: { kind: 'archive', id: 'home_turf' },
    optionIds: ['follow_lead', 'cash_out']
  },
  {
    id: 'decision_rival',
    type: 'rival_response',
    target: { kind: 'rival', id: 'rival_primary' },
    optionIds: ['confront', 'cool_down']
  }
]

const START_MONEY = 1000

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
      money: useGameSelector(state => state.player.money),
      scene: useGameSelector(state => state.currentScene)
    }),
    { wrapper }
  )
}

/**
 * Seeds a save carrying the open decision set, so the provider reaches it
 * through its own load path rather than by a test writing into the reducer.
 */
const seedSave = (adapter: InMemoryAdapter) => {
  const base = createInitialState()
  adapter.set(
    SAVE_KEY,
    JSON.stringify({
      player: { ...base.player, money: START_MONEY },
      band: base.band,
      social: base.social,
      gameMap: base.gameMap,
      career: {
        ...base.career,
        betweenTourByRunId: {
          [RUN_ID]: {
            runId: RUN_ID,
            decisions: DECISIONS,
            resolvedOptionByDecisionId: {}
          }
        }
      }
    })
  )
}

const persisted = (adapter: InMemoryAdapter) =>
  JSON.parse(String(adapter.get(SAVE_KEY)))

describe('a Between-Tour answer persists itself', () => {
  beforeEach(() => {
    resetStorageFallback()
    localStorage.clear()
  })

  it('writes the resolution without waiting for a scene change', () => {
    const adapter = new InMemoryAdapter()
    seedSave(adapter)
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })
    const sceneBefore = result.current.scene

    act(() => {
      result.current.actions.resolveExpeditionBetweenTourDecision(
        RUN_ID,
        'decision_contact',
        'cash_out'
      )
    })

    // The answer landed in the reducer...
    expect(
      result.current.career.betweenTourByRunId[RUN_ID]
        ?.resolvedOptionByDecisionId
    ).toMatchObject({ decision_contact: 'cash_out' })
    expect(result.current.money).toBe(
      START_MONEY + BETWEEN_TOUR_CASH_OUT_PAYOUT
    )

    // ...and in storage, with the player still standing in the same scene:
    // the write cannot have come from the scene-transition autosave.
    expect(result.current.scene).toBe(sceneBefore)
    const save = persisted(adapter)
    expect(save.currentScene).toBe(sceneBefore)
    expect(
      save.career.betweenTourByRunId[RUN_ID].resolvedOptionByDecisionId
    ).toMatchObject({ decision_contact: 'cash_out' })
    expect(save.player.money).toBe(START_MONEY + BETWEEN_TOUR_CASH_OUT_PAYOUT)
  })

  it('reloads with the answer kept and the rest still open', () => {
    const adapter = new InMemoryAdapter()
    seedSave(adapter)
    const { result } = renderProvider(adapter)
    act(() => {
      result.current.actions.loadGame()
    })
    act(() => {
      result.current.actions.resolveExpeditionBetweenTourDecision(
        RUN_ID,
        'decision_contact',
        'cash_out'
      )
    })

    // The crash the persisted answer exists for: the process comes back on
    // the save written above, not on the state the reducer held.
    act(() => {
      result.current.actions.loadGame()
    })

    const restored = result.current.career.betweenTourByRunId[RUN_ID]
    expect(restored?.resolvedOptionByDecisionId).toMatchObject({
      decision_contact: 'cash_out'
    })
    // The payout is not collectable a second time, which is what a restored
    // open decision would have allowed.
    expect(result.current.money).toBe(
      START_MONEY + BETWEEN_TOUR_CASH_OUT_PAYOUT
    )
    // And the unanswered decision survived the write.
    expect(restored?.decisions.map(decision => decision.id)).toEqual([
      'decision_contact',
      'decision_rival'
    ])
    expect(
      Object.hasOwn(
        restored?.resolvedOptionByDecisionId ?? {},
        'decision_rival'
      )
    ).toBe(false)
  })
})
