/**
 * @fileoverview Hybrid extraction, completion and the terminal lifecycle.
 *
 * Extraction is the mode's central push-your-luck decision, so the terms must
 * be explicit, reducer-authoritative and idempotent: a caller must not be able
 * to extract off-window, declare its own retention, carry more rare rewards
 * than its slots allow, or be paid twice by a replayed dispatch.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import {
  completeExpedition,
  extractExpedition,
  prepareNextExpedition
} from '../../src/context/expeditionActionCreators'
import {
  BASE_EXPLICIT_EXTRACTION_RARE_CARRY_SLOTS,
  EXPEDITION_BASE_RETENTION,
  MAX_EXPLICIT_EXTRACTION_RARE_CARRY_SLOTS,
  getExplicitExtractionRareCarrySlots,
  settleExpedition,
  splitExpeditionRewardLedger
} from '../../src/domain/expedition/extraction'
import {
  firstExtractionRouteStep,
  fixtureMap,
  startedState,
  walkTo,
  walkToFinale
} from '../expeditionLifecycleFixture.js'

const map = fixtureMap()
const WINDOW_STEP = firstExtractionRouteStep()

const currentNodeId = state =>
  state.expedition.visitedNodeIds[state.expedition.visitedNodeIds.length - 1]

/** Earns cash inside the run so retention has something to act on. */
const earn = (state, money, fame = 0) => ({
  ...state,
  player: {
    ...state.player,
    money: state.player.money + money,
    fame: state.player.fame + fame
  }
})

/**
 * The walk's first extraction window whose node also carries a route rare.
 *
 * Arriving there is the reward's canonical evidence, so the route advance banks
 * the ledger entry itself — and because the node is a window, the carry
 * decision happens on the spot.
 */
const RARE_WINDOW_STEP = 5

const extract = (state, payload) =>
  gameReducer(state, { type: ActionTypes.EXTRACT_EXPEDITION, payload })

describe('base retention terms', () => {
  it('matches the approved base rates', () => {
    assert.deepEqual(EXPEDITION_BASE_RETENTION, {
      extracted: 0.6,
      failed: 0.25,
      completed: 1
    })
  })

  it('carries one rare reward by default and never more than three', () => {
    assert.equal(BASE_EXPLICIT_EXTRACTION_RARE_CARRY_SLOTS, 1)
    assert.equal(MAX_EXPLICIT_EXTRACTION_RARE_CARRY_SLOTS, 3)
    assert.equal(getExplicitExtractionRareCarrySlots(startedState()), 1)
  })
})

describe('ledger split', () => {
  const ledger = [
    { id: 'a', secured: false },
    { id: 'b', secured: false },
    { id: 'c', secured: true },
    { id: 'd', secured: false }
  ]

  it('retains everything on completion', () => {
    const split = splitExpeditionRewardLedger(ledger, 'completed', [], 1)
    assert.deepEqual(split.retainedRewardEntryIds, ['a', 'b', 'c', 'd'])
    assert.deepEqual(split.abandonedRewardEntryIds, [])
  })

  it('retains only secured entries on failure', () => {
    const split = splitExpeditionRewardLedger(ledger, 'failed', ['a', 'b'], 3)
    assert.deepEqual(split.retainedRewardEntryIds, ['c'])
    assert.deepEqual(split.abandonedRewardEntryIds, ['a', 'b', 'd'])
  })

  it('carries the secured set plus the explicit slots on extraction', () => {
    const split = splitExpeditionRewardLedger(ledger, 'extracted', ['b'], 1)
    assert.deepEqual(split.retainedRewardEntryIds, ['b', 'c'])
    assert.deepEqual(split.abandonedRewardEntryIds, ['a', 'd'])
  })

  it('never carries more unsecured rewards than the slot cap', () => {
    const split = splitExpeditionRewardLedger(
      ledger,
      'extracted',
      ['a', 'b', 'd'],
      1
    )
    assert.deepEqual(split.retainedRewardEntryIds, ['a', 'c'])
    assert.deepEqual(split.abandonedRewardEntryIds, ['b', 'd'])
  })

  it('does not let a repeated id consume two slots', () => {
    const split = splitExpeditionRewardLedger(
      ledger,
      'extracted',
      ['a', 'a', 'b'],
      2
    )
    assert.deepEqual(split.retainedRewardEntryIds, ['a', 'b', 'c'])
  })

  it('clamps a hostile slot count', () => {
    for (const slots of [99, Number.NaN, -5, Number.POSITIVE_INFINITY]) {
      const split = splitExpeditionRewardLedger(
        ledger,
        'extracted',
        ['a', 'b', 'd'],
        slots
      )
      assert.ok(
        split.retainedRewardEntryIds.filter(id => id !== 'c').length <=
          MAX_EXPLICIT_EXTRACTION_RARE_CARRY_SLOTS,
        `slots ${String(slots)}`
      )
    }
  })

  it('ignores a non-string carry id', () => {
    const split = splitExpeditionRewardLedger(
      ledger,
      'extracted',
      [null, 42, 'a'],
      1
    )
    assert.deepEqual(split.retainedRewardEntryIds, ['a', 'c'])
  })
})

describe('settlement arithmetic', () => {
  it('applies retention only to what the run itself earned', () => {
    const state = earn(startedState({ money: 5000, fame: 100 }), 1000, 50)
    const settlement = settleExpedition(state, 'extracted')
    assert.equal(settlement.moneyEarned, 1000)
    assert.equal(settlement.moneyRetained, 600)
    assert.equal(settlement.moneyForfeited, 400)
    assert.equal(settlement.fameEarned, 50)
    assert.equal(settlement.fameRetained, 30)
  })

  it('forfeits nothing when the run lost money', () => {
    const state = earn(startedState({ money: 5000 }), -2000)
    const settlement = settleExpedition(state, 'failed')
    assert.equal(settlement.moneyEarned, 0)
    assert.equal(settlement.moneyForfeited, 0)
    // Retention is not a second penalty on an already-bad run.
    assert.equal(settlement.moneyRetained, 0)
  })

  it('keeps the whole run income on completion', () => {
    const state = earn(startedState({ money: 5000 }), 1000)
    const settlement = settleExpedition(state, 'completed')
    assert.equal(settlement.moneyRetained, 1000)
    assert.equal(settlement.moneyForfeited, 0)
  })
})

describe('EXTRACT_EXPEDITION', () => {
  const atWindow = (options = {}) =>
    walkTo(startedState({ money: 5000, fame: 100, ...options }), WINDOW_STEP)

  it('extracts at a legal window and keeps 60% of run income', () => {
    const state = earn(atWindow(), 1000, 50)
    const next = extract(state, {
      expectedRouteStep: WINDOW_STEP,
      explicitRareRewardIds: []
    })
    assert.equal(next.expedition.status, 'extracted')
    assert.equal(next.expedition.outcome?.kind, 'extracted')
    assert.equal(next.expedition.outcome?.settlement.retentionRate, 0.6)
    assert.equal(next.player.money, 5000 + 600)
    assert.equal(next.player.fame, 100 + 30)
  })

  it('refuses extraction before the route offers a window', () => {
    const early = startedState()
    for (const step of [0, 1]) {
      const state = walkTo(early, step)
      assert.equal(
        extract(state, { expectedRouteStep: step, explicitRareRewardIds: [] }),
        state,
        `route step ${step}`
      )
    }
  })

  it('refuses a stale route-step guard', () => {
    const state = atWindow()
    for (const expectedRouteStep of [
      WINDOW_STEP - 1,
      WINDOW_STEP + 1,
      Number.NaN
    ]) {
      assert.equal(
        extract(state, { expectedRouteStep, explicitRareRewardIds: [] }),
        state
      )
    }
  })

  it('carries one explicitly named unsecured rare reward', () => {
    const state = walkTo(startedState({ money: 5000 }), RARE_WINDOW_STEP)
    const entryId = state.expedition.rewardLedger[0]?.id
    assert.ok(entryId, 'the walk banked no route rare to carry')

    const carried = extract(state, {
      expectedRouteStep: RARE_WINDOW_STEP,
      explicitRareRewardIds: [entryId]
    })
    assert.deepEqual(
      carried.expedition.outcome?.settlement.retainedRewardEntryIds,
      [entryId]
    )
    // 15 shirts, materialized once, after the settlement committed.
    assert.equal(carried.band.inventory.shirts, 50 + 15)
    assert.equal(carried.expedition.rewardLedger[0]?.materialized, true)
  })

  it('abandons an unsecured rare reward the player did not name', () => {
    const state = walkTo(startedState({ money: 5000 }), RARE_WINDOW_STEP)
    assert.equal(state.expedition.rewardLedger.length, 1)
    const abandoned = extract(state, {
      expectedRouteStep: RARE_WINDOW_STEP,
      explicitRareRewardIds: []
    })
    assert.equal(
      abandoned.expedition.outcome?.settlement.abandonedRewardEntryIds.length,
      1
    )
    assert.equal(abandoned.band.inventory.shirts, 50)
    assert.equal(abandoned.expedition.rewardLedger[0]?.materialized, false)
  })

  it('is idempotent: a replayed extraction changes nothing', () => {
    const state = earn(atWindow(), 1000)
    const payload = {
      expectedRouteStep: WINDOW_STEP,
      explicitRareRewardIds: []
    }
    const once = extract(state, payload)
    const twice = extract(once, payload)
    assert.equal(twice, once)
    assert.equal(twice.player.money, once.player.money)
  })

  it('is built by the creator from the current route step', () => {
    const state = earn(atWindow(), 500)
    const action = extractExpedition(state, ['x'])
    assert.equal(action.payload.expectedRouteStep, WINDOW_STEP)
    assert.equal(gameReducer(state, action).expedition.status, 'extracted')
  })
})

describe('COMPLETE_EXPEDITION', () => {
  it('completes on the Finale and keeps everything', () => {
    let state = walkToFinale(startedState({ money: 5000, fame: 100 }))
    state = earn(state, 1000, 50)
    const finaleStep = state.expedition.routeStep

    const next = gameReducer(state, {
      type: ActionTypes.COMPLETE_EXPEDITION,
      payload: {
        finaleResultId: 'finale_result_1',
        expectedRouteStep: finaleStep
      }
    })
    assert.equal(next.expedition.status, 'completed')
    assert.equal(next.expedition.outcome?.finaleResultId, 'finale_result_1')
    assert.equal(next.expedition.outcome?.settlement.retentionRate, 1)
    assert.equal(next.player.money, 5000 + 1000)
    assert.equal(next.player.fame, 100 + 50)

    // Every rare reward is kept, without the player naming any. Walking the
    // route also banks the rares the nodes themselves carry, so the expected
    // merch is derived from the ledger rather than hardcoded.
    assert.deepEqual(
      next.expedition.outcome?.settlement.abandonedRewardEntryIds,
      []
    )
    const crates = next.expedition.rewardLedger.filter(
      entry => entry.rewardDefinitionId === 'reward_route_merch_crate'
    )
    assert.ok(crates.length > 0)
    assert.equal(next.band.inventory.shirts, 50 + 15 * crates.length)
    for (const entry of next.expedition.rewardLedger) {
      assert.equal(entry.materialized, true)
    }
  })

  it('refuses completion anywhere but the Finale', () => {
    const state = walkTo(startedState(), WINDOW_STEP)
    assert.equal(
      gameReducer(state, {
        type: ActionTypes.COMPLETE_EXPEDITION,
        payload: {
          finaleResultId: 'finale_result_1',
          expectedRouteStep: WINDOW_STEP
        }
      }),
      state
    )
  })

  it('refuses completion without a Finale result id', () => {
    const state = walkToFinale(startedState())
    for (const finaleResultId of ['', null, 42]) {
      assert.equal(
        gameReducer(state, {
          type: ActionTypes.COMPLETE_EXPEDITION,
          payload: {
            finaleResultId,
            expectedRouteStep: state.expedition.routeStep
          }
        }),
        state
      )
    }
  })

  it('is built by the creator from the current route step', () => {
    const state = walkToFinale(startedState())
    const action = completeExpedition(state, 'finale_result_2')
    assert.equal(action.payload.expectedRouteStep, state.expedition.routeStep)
    assert.equal(gameReducer(state, action).expedition.status, 'completed')
  })

  it('lands on the route Finale node', () => {
    const state = walkToFinale(startedState())
    assert.equal(currentNodeId(state), map.finaleNodeId)
  })
})

describe('PREPARE_NEXT_EXPEDITION', () => {
  const finalized = () => {
    const state = earn(walkTo(startedState({ money: 5000 }), WINDOW_STEP), 1000)
    return extract(state, {
      expectedRouteStep: WINDOW_STEP,
      explicitRareRewardIds: []
    })
  }

  it('returns a finalized run to idle', () => {
    const state = finalized()
    const next = gameReducer(state, {
      type: ActionTypes.PREPARE_NEXT_EXPEDITION,
      payload: { runId: 'run_fixture' }
    })
    assert.equal(next.expedition.status, 'idle')
    assert.equal(next.expedition.runId, null)
    assert.equal(next.expedition.outcome, null)
    assert.deepEqual(next.expedition.rewardLedger, [])
  })

  it('succeeds with no post-run decision layer installed', () => {
    // G1B must pass before G5 exists: nothing here may require a Between-Tour
    // decision to have been settled.
    const next = gameReducer(finalized(), {
      type: ActionTypes.PREPARE_NEXT_EXPEDITION,
      payload: { runId: 'run_fixture' }
    })
    assert.equal(next.expedition.status, 'idle')
  })

  it('refuses a mismatched or malformed run id', () => {
    const state = finalized()
    for (const payload of [
      { runId: 'other_run' },
      { runId: '' },
      { runId: 42 },
      {},
      null
    ]) {
      assert.equal(
        gameReducer(state, {
          type: ActionTypes.PREPARE_NEXT_EXPEDITION,
          payload
        }),
        state
      )
    }
  })

  it('refuses to clear a run that has not finalized', () => {
    for (const state of [startedState(), walkTo(startedState(), 2)]) {
      assert.equal(
        gameReducer(state, {
          type: ActionTypes.PREPARE_NEXT_EXPEDITION,
          payload: { runId: 'run_fixture' }
        }),
        state
      )
    }
  })

  it('is a no-op on a replay, because the run is already idle', () => {
    const state = finalized()
    const payload = { runId: 'run_fixture' }
    const once = gameReducer(state, {
      type: ActionTypes.PREPARE_NEXT_EXPEDITION,
      payload
    })
    const twice = gameReducer(once, {
      type: ActionTypes.PREPARE_NEXT_EXPEDITION,
      payload
    })
    assert.equal(twice, once)
  })

  it('returns null from the creator when no run has finalized', () => {
    assert.equal(prepareNextExpedition(startedState()), null)
    assert.ok(prepareNextExpedition(finalized()))
  })

  it('allows a fresh PREPARE afterwards', () => {
    const idle = gameReducer(finalized(), {
      type: ActionTypes.PREPARE_NEXT_EXPEDITION,
      payload: { runId: 'run_fixture' }
    })
    const prepared = gameReducer(idle, {
      type: ActionTypes.PREPARE_EXPEDITION_RUN,
      payload: { prepId: 'run_second', runSeed: 999 }
    })
    assert.equal(prepared.expedition.status, 'prepared')
    assert.equal(prepared.runSeed, 999)
  })
})

describe('settlement robustness', () => {
  it('never strands the player when a retired reward cannot resolve', () => {
    // A reward id retired between builds has nothing to materialize. Leaving
    // the entry unsettled would make PREPARE_NEXT refuse forever, so the run
    // summary must still be dismissible.
    let state = walkTo(startedState({ money: 5000 }), RARE_WINDOW_STEP)
    const entryId = state.expedition.rewardLedger[0]?.id
    assert.ok(entryId, 'the walk banked no route rare to retire')
    state = {
      ...state,
      expedition: {
        ...state.expedition,
        rewardLedger: [
          {
            ...state.expedition.rewardLedger[0],
            rewardDefinitionId: 'reward_retired_in_a_later_build'
          }
        ]
      }
    }

    const extracted = extract(state, {
      expectedRouteStep: RARE_WINDOW_STEP,
      explicitRareRewardIds: [entryId]
    })
    assert.equal(extracted.expedition.status, 'extracted')
    assert.equal(extracted.expedition.rewardLedger[0]?.materialized, true)

    const cleared = gameReducer(extracted, {
      type: ActionTypes.PREPARE_NEXT_EXPEDITION,
      payload: { runId: 'run_fixture' }
    })
    assert.equal(cleared.expedition.status, 'idle')
  })
})
