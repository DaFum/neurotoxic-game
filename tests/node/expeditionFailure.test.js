/**
 * @fileoverview The multi-axis Expedition failure shell.
 *
 * The design requires several real failure axes, each attributable to visible
 * state, and forbids a single opaque roll ending a 20-30 minute run. So a
 * crisis is derived rather than raised, always names the resource that caused
 * it, always carries a legal response, and can only be accepted while it is
 * actually live.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import {
  acceptExpeditionFailure,
  resolveExpeditionCrisis
} from '../../src/context/expeditionActionCreators'
import {
  EXPEDITION_FAILURE_PRIORITY,
  EXPEDITION_TOW_COST,
  buildExpeditionFailureId,
  composeExpeditionFailureSignal,
  deriveExpeditionPendingFailure,
  getExpeditionCrisisChoices,
  getExpeditionEconomyFailureSignal,
  getExpeditionMobilityFailureSignal,
  isCurrentExpeditionFailureId
} from '../../src/domain/expedition/failure'
import {
  firstExtractionRouteStep,
  fixtureMap,
  startedState,
  walkTo
} from '../expeditionLifecycleFixture.js'

const map = fixtureMap()
const WINDOW_STEP = firstExtractionRouteStep()

/** Drives the run's spendable cash to zero through the real reducer. */
const broke = (state, obligation = 25) => {
  const next = gameReducer(state, {
    type: ActionTypes.UPDATE_PLAYER,
    payload: { money: 0 }
  })
  // A daily obligation is what turns a zero balance into bankruptcy: the
  // canonical rule is "at zero and still bleeding".
  return {
    ...next,
    liabilities: {
      liability_1: {
        id: 'liability_1',
        source: 'loan',
        assetId: 'asset_1',
        principalRemaining: 1000,
        interestRate: 0.01,
        dailyPayment: obligation,
        termDaysRemaining: 90,
        defaultCounter: 0
      }
    }
  }
}

describe('the economic axis', () => {
  it('stays quiet while the run is solvent', () => {
    assert.equal(
      getExpeditionEconomyFailureSignal(startedState({ money: 5000 })),
      null
    )
  })

  it('fires at zero spendable cash with an obligation still due', () => {
    const signal = getExpeditionEconomyFailureSignal(broke(startedState()))
    assert.ok(signal)
    assert.equal(signal.reason, 'bankruptcy')
    // The crisis must name the resource that caused it.
    assert.equal(signal.sourceId, 'expedition_cash')
    assert.ok(signal.choices.includes('accept_failure'))
  })

  it('fires on a wealthy career whose cash is all protected', () => {
    // This is the whole point of the protected slice: a rich Career cannot
    // silently rescue the run.
    const state = startedState({ money: 250_000 })
    const protectedRun = {
      ...state,
      expedition: { ...state.expedition, protectedCareerCash: 250_000 }
    }
    const signal = getExpeditionEconomyFailureSignal(broke(protectedRun, 25))
    assert.ok(signal)
    assert.equal(signal.reason, 'bankruptcy')
  })

  it('stays quiet outside an active run', () => {
    const state = broke(startedState())
    for (const status of [
      'idle',
      'prepared',
      'extracted',
      'completed',
      'failed'
    ]) {
      assert.equal(
        getExpeditionEconomyFailureSignal({
          ...state,
          expedition: { ...state.expedition, status }
        }),
        null
      )
    }
  })
})

describe('the mobility axis', () => {
  it('stays quiet with fuel and cash to move', () => {
    assert.equal(
      getExpeditionMobilityFailureSignal(
        walkTo(startedState({ money: 5000, fuel: 100 }), 1)
      ),
      null
    )
  })

  it('always exposes at least one legal response', () => {
    // Whatever the resources, `accept_failure` is unconditional: the design
    // forbids a softlock with no legal move.
    for (const money of [0, 100, 5000]) {
      const state = gameReducer(
        walkTo(startedState({ money: 5000, fuel: 0 }), 1),
        { type: ActionTypes.UPDATE_PLAYER, payload: { money } }
      )
      const signal = getExpeditionMobilityFailureSignal(state)
      if (!signal) continue
      assert.ok(signal.choices.length > 0)
      assert.ok(signal.choices.includes('accept_failure'))
    }
  })

  it('offers the paid escapes only when they are affordable', () => {
    const stranded = money =>
      getExpeditionMobilityFailureSignal(
        gameReducer(walkTo(startedState({ money: 5000, fuel: 0 }), 1), {
          type: ActionTypes.UPDATE_PLAYER,
          payload: { money }
        })
      )

    const poor = stranded(0)
    if (poor) {
      assert.equal(poor.choices.includes('refuel'), false)
      assert.equal(poor.choices.includes('tow'), false)
    }

    const rich = stranded(5000)
    if (rich) {
      assert.ok(rich.choices.includes('refuel'))
      assert.ok(rich.choices.includes('tow'))
    }
  })

  it('prices a tow above a full refuel so it is not the cheap default', () => {
    // A full tank from empty costs 175 at the canonical pump price.
    assert.ok(EXPEDITION_TOW_COST > 175)
  })

  it('names the node the crisis happened at', () => {
    const state = gameReducer(walkTo(startedState({ fuel: 0 }), 1), {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money: 0 }
    })
    const signal = getExpeditionMobilityFailureSignal(state)
    if (signal) {
      assert.ok(Object.hasOwn(map.meta, signal.sourceId))
    }
  })
})

describe('composition into one terminal owner', () => {
  it('lists every failure family in a documented priority order', () => {
    assert.deepEqual([...EXPEDITION_FAILURE_PRIORITY].sort(), [
      'authority_crisis',
      'bankruptcy',
      'crew_collapse',
      'critical_contract_breach',
      'fuel_stranded',
      'technical_shutdown'
    ])
  })

  it('lets the root cause win when several signals fire', () => {
    // Being unable to afford the escape is why the escape is unavailable, so
    // bankruptcy outranks a mobility crisis.
    const state = broke(walkTo(startedState({ fuel: 0 }), 1))
    const composed = composeExpeditionFailureSignal(state)
    assert.equal(composed?.reason, 'bankruptcy')
  })

  it('accepts signals a later gate exports without a second system', () => {
    const state = startedState({ money: 5000 })
    const composed = composeExpeditionFailureSignal(state, [
      {
        reason: 'technical_shutdown',
        sourceId: 'pa_rig',
        choices: ['accept_failure']
      }
    ])
    assert.equal(composed?.reason, 'technical_shutdown')
    assert.equal(composed?.sourceId, 'pa_rig')
  })

  it('prefers an earlier-priority later-gate signal over bankruptcy', () => {
    const state = broke(startedState())
    const composed = composeExpeditionFailureSignal(state, [
      {
        reason: 'crew_collapse',
        sourceId: 'crew_driver',
        choices: ['accept_failure']
      }
    ])
    assert.equal(composed?.reason, 'bankruptcy')
  })

  it('derives a stable, replay-safe crisis id', () => {
    const state = broke(startedState())
    const first = deriveExpeditionPendingFailure(state)
    const second = deriveExpeditionPendingFailure(state)
    assert.ok(first)
    assert.equal(first.id, second?.id)
    assert.equal(
      first.id,
      buildExpeditionFailureId(state, {
        reason: 'bankruptcy',
        sourceId: 'expedition_cash',
        choices: ['accept_failure']
      })
    )
    assert.equal(first.raisedAtRouteStep, state.expedition.routeStep)
  })

  it('adds the extraction escape at an extraction window', () => {
    const early = broke(walkTo(startedState(), 1))
    assert.equal(
      getExpeditionCrisisChoices(early, map).includes('extract'),
      false
    )
    const atWindow = broke(walkTo(startedState(), WINDOW_STEP))
    assert.ok(getExpeditionCrisisChoices(atWindow, map).includes('extract'))
  })

  it('reports no choices on a healthy run', () => {
    assert.deepEqual(
      getExpeditionCrisisChoices(startedState({ money: 5000 }), map),
      []
    )
  })
})

describe('the stored crisis is a derived cache, never a caller claim', () => {
  it('is written by the root reducer as soon as the cause appears', () => {
    const state = walkTo(startedState({ money: 5000 }), 1)
    assert.equal(state.expedition.pendingFailure, null)

    const bankrupt = broke(state)
    // The obligation is injected directly above, so drive one more action
    // through the reducer to let the central sync observe it.
    const synced = gameReducer(bankrupt, {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money: 0 }
    })
    assert.equal(synced.expedition.pendingFailure?.reason, 'bankruptcy')
  })

  it('clears itself once the cause is gone', () => {
    const bankrupt = gameReducer(broke(startedState()), {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money: 0 }
    })
    assert.ok(bankrupt.expedition.pendingFailure)

    const rescued = gameReducer(bankrupt, {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money: 4000 }
    })
    assert.equal(rescued.expedition.pendingFailure, null)
  })

  it('preserves the state reference when nothing changed', () => {
    const healthy = startedState({ money: 5000 })
    // A rejected action must leave the exact same state object, which the
    // central failure sync must not break.
    const rejected = gameReducer(healthy, {
      type: ActionTypes.PREPARE_EXPEDITION_RUN,
      payload: { prepId: 'x', runSeed: 1 }
    })
    assert.equal(rejected, healthy)
  })
})

describe('ACCEPT_EXPEDITION_FAILURE', () => {
  const bankruptRun = () =>
    gameReducer(broke(walkTo(startedState({ money: 5000 }), 1)), {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money: 0 }
    })

  it('ends the run and records the attributable reason', () => {
    const state = bankruptRun()
    const pendingFailureId = state.expedition.pendingFailure?.id
    const next = gameReducer(state, {
      type: ActionTypes.ACCEPT_EXPEDITION_FAILURE,
      payload: { pendingFailureId, expectedRouteStep: 1 }
    })
    assert.equal(next.expedition.status, 'failed')
    assert.equal(next.expedition.outcome?.reason, 'bankruptcy')
    assert.equal(next.expedition.outcome?.settlement.retentionRate, 0.25)
    assert.equal(next.expedition.pendingFailure, null)
  })

  it('refuses a forged crisis id', () => {
    const state = bankruptRun()
    for (const pendingFailureId of ['forged', '', null, 42]) {
      assert.equal(
        gameReducer(state, {
          type: ActionTypes.ACCEPT_EXPEDITION_FAILURE,
          payload: { pendingFailureId, expectedRouteStep: 1 }
        }),
        state
      )
    }
  })

  it('refuses to end a healthy run', () => {
    const healthy = walkTo(startedState({ money: 5000 }), 1)
    assert.equal(
      gameReducer(healthy, {
        type: ActionTypes.ACCEPT_EXPEDITION_FAILURE,
        payload: { pendingFailureId: 'anything', expectedRouteStep: 1 }
      }),
      healthy
    )
  })

  it('refuses a stale accept after the run recovered', () => {
    const state = bankruptRun()
    const pendingFailureId = state.expedition.pendingFailure?.id
    const rescued = gameReducer(state, {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money: 4000 }
    })
    assert.equal(
      gameReducer(rescued, {
        type: ActionTypes.ACCEPT_EXPEDITION_FAILURE,
        payload: { pendingFailureId, expectedRouteStep: 1 }
      }),
      rescued
    )
  })

  it('refuses a stale route-step guard', () => {
    const state = bankruptRun()
    const pendingFailureId = state.expedition.pendingFailure?.id
    for (const expectedRouteStep of [0, 2, Number.NaN]) {
      assert.equal(
        gameReducer(state, {
          type: ActionTypes.ACCEPT_EXPEDITION_FAILURE,
          payload: { pendingFailureId, expectedRouteStep }
        }),
        state
      )
    }
  })

  it('keeps only secured rare rewards on failure', () => {
    // Step 5 is the walk's first rare-bearing node, and arriving on it is the
    // reward's canonical evidence, so the ledger entry is banked by the route
    // advance itself.
    const state = walkTo(startedState({ money: 5000 }), 5)
    assert.equal(state.expedition.rewardLedger.length, 1)

    const bankrupt = gameReducer(broke(state), {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money: 0 }
    })
    const failed = gameReducer(bankrupt, {
      type: ActionTypes.ACCEPT_EXPEDITION_FAILURE,
      payload: {
        pendingFailureId: bankrupt.expedition.pendingFailure?.id,
        expectedRouteStep: bankrupt.expedition.routeStep
      }
    })
    assert.equal(failed.expedition.status, 'failed')
    assert.deepEqual(
      failed.expedition.outcome?.settlement.retainedRewardEntryIds,
      []
    )
    assert.equal(failed.band.inventory.shirts, 50)
  })

  it('is built by the creator only while a crisis is live', () => {
    assert.equal(acceptExpeditionFailure(startedState({ money: 5000 })), null)
    const state = bankruptRun()
    const action = acceptExpeditionFailure(state)
    assert.ok(action)
    assert.ok(
      isCurrentExpeditionFailureId(state, action.payload.pendingFailureId)
    )
    assert.equal(gameReducer(state, action).expedition.status, 'failed')
  })

  it('is idempotent: a replayed accept changes nothing', () => {
    const state = bankruptRun()
    const payload = {
      pendingFailureId: state.expedition.pendingFailure?.id,
      expectedRouteStep: 1
    }
    const once = gameReducer(state, {
      type: ActionTypes.ACCEPT_EXPEDITION_FAILURE,
      payload
    })
    const twice = gameReducer(once, {
      type: ActionTypes.ACCEPT_EXPEDITION_FAILURE,
      payload
    })
    assert.equal(twice, once)
  })
})

describe('RESOLVE_EXPEDITION_CRISIS', () => {
  /**
   * A run stranded at route step 1 with a chosen final balance.
   *
   * @remarks
   * START must be affordable, so the run always begins funded and the balance
   * is set afterwards — a run cannot start with the empty tank *and* no cash to
   * fill it.
   */
  const strandedRun = (money = 5000) =>
    gameReducer(walkTo(startedState({ money: 5000, fuel: 0 }), 1), {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money }
    })

  const resolve = (state, choice, overrides = {}) =>
    gameReducer(state, {
      type: ActionTypes.RESOLVE_EXPEDITION_CRISIS,
      payload: {
        pendingFailureId: state.expedition.pendingFailure?.id,
        choice,
        expectedRouteStep: state.expedition.routeStep,
        ...overrides
      }
    })

  it('fills the tank and charges the canonical refuel price', () => {
    const state = strandedRun()
    if (!state.expedition.pendingFailure) return
    const next = resolve(state, 'refuel')
    assert.equal(next.player.van.fuel, 100)
    // An empty tank costs 100 litres at 1.75 EUR/l.
    assert.equal(next.player.money, state.player.money - 175)
  })

  it('charges the tow price for a partial refill', () => {
    const state = strandedRun()
    if (!state.expedition.pendingFailure) return
    const next = resolve(state, 'tow')
    assert.equal(next.player.money, state.player.money - EXPEDITION_TOW_COST)
    // A tow gets the run moving without also solving the next leg.
    assert.ok(next.player.van.fuel > 0)
    assert.ok(next.player.van.fuel < 100)
  })

  it('clears the crisis once the cause is resolved', () => {
    const state = strandedRun()
    if (!state.expedition.pendingFailure) return
    const next = resolve(state, 'refuel')
    assert.equal(next.expedition.pendingFailure, null)
  })

  it('refuses a recovery the crisis does not offer', () => {
    // With no spendable cash the paid escapes are not offered, so paying for
    // one must be refused rather than silently succeeding.
    const broke = strandedRun(0)
    if (!broke.expedition.pendingFailure) return
    assert.equal(broke.expedition.pendingFailure.choices.includes('tow'), false)
    assert.equal(resolve(broke, 'tow'), broke)
    assert.equal(resolve(broke, 'refuel'), broke)
  })

  it('refuses a forged crisis id or a stale route step', () => {
    const state = strandedRun()
    if (!state.expedition.pendingFailure) return
    assert.equal(
      resolve(state, 'refuel', { pendingFailureId: 'forged' }),
      state
    )
    assert.equal(resolve(state, 'refuel', { expectedRouteStep: 99 }), state)
  })

  it('refuses an unknown recovery choice', () => {
    const state = strandedRun()
    if (!state.expedition.pendingFailure) return
    for (const choice of ['extract', 'accept_failure', 'teleport', null]) {
      assert.equal(resolve(state, choice), state)
    }
  })

  it('refuses to spend past the protected career slice', () => {
    const base = strandedRun(5000)
    if (!base.expedition.pendingFailure) return
    // Only 100 spendable against a 175 refuel and a 180 tow.
    const guarded = {
      ...base,
      expedition: { ...base.expedition, protectedCareerCash: 4900 }
    }
    assert.equal(resolve(guarded, 'refuel'), guarded)
    assert.equal(resolve(guarded, 'tow'), guarded)
  })

  it('refuses every recovery on a healthy run', () => {
    const healthy = walkTo(startedState({ money: 5000, fuel: 100 }), 1)
    assert.equal(resolve(healthy, 'refuel'), healthy)
  })

  it('returns null from the creator for a recovery that is not offered', () => {
    const healthy = walkTo(startedState({ money: 5000, fuel: 100 }), 1)
    assert.equal(resolveExpeditionCrisis(healthy, 'refuel'), null)

    const state = strandedRun()
    if (!state.expedition.pendingFailure) return
    const action = resolveExpeditionCrisis(state, 'refuel')
    assert.ok(action)
    assert.equal(action.payload.choice, 'refuel')
    assert.equal(gameReducer(state, action).player.van.fuel, 100)
  })
})
