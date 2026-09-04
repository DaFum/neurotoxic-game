/**
 * @fileoverview The day tick under an active Expedition.
 *
 * `ADVANCE_DAY` predates the Expedition and owns two rules that collide with a
 * run: a flat daily van-wear tax and a wealth-scaled surplus drain. Inside a run
 * vehicle wear is settled once per leg from the route's own declared cost, and
 * run Cash is the resource the extraction decision is about — so both legacy
 * rules are suspended and mandatory obligations may only be paid from the
 * spendable slice. A shortfall is neither forgiven nor taken from the protected
 * Career Cash; it is recorded, and that record is what the Economic failure axis
 * derives its crisis from. Outside a run nothing about the tick changes.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { advanceDay } from '../../src/context/actionCreators'
import { calculateDailyUpdates } from '../../src/utils/simulationUtils'
import { BALANCE_CONSTANTS } from '../../src/utils/gameState'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { resolveExpeditionTravelCost } from '../../src/domain/expedition/travel'
import { getExpeditionEconomyFailureSignal } from '../../src/domain/expedition/failure'
import { fixtureMap, startedState } from '../expeditionLifecycleFixture.js'

const map = fixtureMap()

/** The first hop off the start node. */
const firstHop = () => {
  const to = map.connections.find(edge => edge.from === map.startNodeId)?.to
  assert.ok(to, 'the fixture route has no first hop')
  return to
}

const travelTo = (state, nodeId) => {
  const traveling = gameReducer(state, {
    type: ActionTypes.START_TRAVEL_MINIGAME,
    payload: { targetNodeId: nodeId }
  })
  return gameReducer(traveling, {
    type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
    payload: { damageTaken: 0, itemsCollected: [] }
  })
}

/**
 * The same career, standing outside a run.
 *
 * Everything the obligation math reads (player, band, social) is identical, so
 * a diff between the two ticks isolates the Expedition policy itself instead of
 * restating another task's balance numbers.
 */
const withoutRun = state => ({
  ...state,
  expedition: { ...state.expedition, status: 'idle' }
})

/** An rng that suppresses the newsletter perk and the wealth drain. */
const quietRng = () => 0.99

describe('vehicle wear is charged by the route, not by the day', () => {
  it('adds no second flat wear after a travel settlement', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const nodeId = firstHop()
    const { vehicleWear } = resolveExpeditionTravelCost(state, {
      targetNodeId: nodeId,
      distance: 0,
      baseFuelLiters: 0,
      minigameFuelBonus: 0,
      minigameConditionLoss: 0
    })
    assert.ok(vehicleWear > 0, 'the fixture hop costs no vehicle wear')

    const arrived = travelTo(state, nodeId)
    const nextDay = gameReducer(arrived, advanceDay(arrived))
    assert.equal(
      nextDay.player.van.condition,
      arrived.player.van.condition,
      'the day tick charged the leg a second time'
    )
  })

  it('does not wear the van on a Rest-in-Van day', () => {
    // Rest-in-Van is nothing but an ADVANCE_DAY, so a flat tax here would
    // damage the van for a day the player never drove.
    const state = startedState({ money: 5000, fuel: 100 })
    const rested = gameReducer(state, advanceDay(state))
    assert.equal(rested.player.van.condition, state.player.van.condition)
  })

  it('still recomputes the breakdown chance during a run', () => {
    // Suspending the wear tax must not suspend the risk readout the player
    // makes decisions from.
    const state = startedState({ money: 5000, fuel: 100 })
    const worn = {
      ...state,
      player: {
        ...state.player,
        van: { ...state.player.van, condition: 20, breakdownChance: 0 }
      }
    }
    const { player } = calculateDailyUpdates(worn, quietRng)
    assert.equal(player.van.condition, 20)
    assert.ok(player.van.breakdownChance > 0)
  })
})

describe('mandatory obligations are paid from the run slice only', () => {
  it('deducts normally while the run budget covers them', () => {
    const run = startedState({ money: 5000, fuel: 100 })
    const baseline = calculateDailyUpdates(withoutRun(run), quietRng)
    const inRun = calculateDailyUpdates(run, quietRng)

    assert.ok(
      baseline.player.money < run.player.money,
      'the fixture day costs nothing, so there is nothing to settle'
    )
    assert.equal(inRun.player.money, baseline.player.money)
    assert.equal(inRun.expeditionUnpaidObligation, 0)
  })

  it('stops at protectedCareerCash and records the shortfall', () => {
    const run = startedState(
      { money: 5000, fuel: 100 },
      { build: { protectedCareerCash: 2000 } }
    )
    assert.equal(run.expedition.protectedCareerCash, 2000)

    // Spendable is 10 — far below any day's obligations.
    const broke = {
      ...run,
      player: { ...run.player, money: 2010 }
    }
    const { player, expeditionUnpaidObligation } = calculateDailyUpdates(
      broke,
      quietRng
    )
    assert.equal(player.money, 2000, 'the protected reserve was spent')
    assert.ok(
      expeditionUnpaidObligation > 0,
      'the unpayable remainder was silently forgiven'
    )
  })

  it('carries the shortfall forward and clears it once a day can pay', () => {
    const run = startedState(
      { money: 5000, fuel: 100 },
      { build: { protectedCareerCash: 2000 } }
    )
    const broke = { ...run, player: { ...run.player, money: 2000 } }
    const shorted = gameReducer(broke, advanceDay(broke))
    const carried = shorted.expedition.unpaidDailyObligation
    assert.ok(carried > 0, 'the shortfall was not recorded on the run')

    // The next day is asked for the carried debt on top of its own cost.
    const funded = {
      ...shorted,
      player: { ...shorted.player, money: 2000 + carried + 10_000 }
    }
    const settled = gameReducer(funded, advanceDay(funded))
    assert.equal(settled.expedition.unpaidDailyObligation, 0)
    assert.ok(
      settled.player.money <= funded.player.money - carried,
      'the carried debt was cleared without being paid'
    )
  })

  it('raises an attributable bankruptcy crisis for the shortfall', () => {
    const run = startedState(
      { money: 5000, fuel: 100 },
      { build: { protectedCareerCash: 2000 } }
    )
    const broke = { ...run, player: { ...run.player, money: 2000 } }
    const shorted = gameReducer(broke, advanceDay(broke))

    const signal = getExpeditionEconomyFailureSignal(shorted)
    assert.equal(signal?.reason, 'bankruptcy')
    assert.equal(signal?.sourceId, 'expedition_unpaid_obligation')
    assert.equal(shorted.expedition.pendingFailure?.reason, 'bankruptcy')
    assert.equal(
      shorted.expedition.pendingFailure?.sourceId,
      'expedition_unpaid_obligation'
    )
  })

  it('never touches the protected reserve through the wealth drain', () => {
    const protectedCash = 20_000
    const run = startedState(
      { money: 30_000, fuel: 100 },
      { build: { protectedCareerCash: protectedCash } }
    )
    assert.ok(
      run.player.money > BALANCE_CONSTANTS.WEALTH_DRAIN_THRESHOLD,
      'the drain would not fire at this balance'
    )

    // `() => 0` makes both drain rolls succeed at the minimum rate.
    const drainRng = () => 0
    const idle = calculateDailyUpdates(withoutRun(run), drainRng)
    const inRun = calculateDailyUpdates(run, drainRng)
    const obligationOnly = calculateDailyUpdates(withoutRun(run), quietRng)

    assert.ok(
      idle.player.money < obligationOnly.player.money,
      'the drain did not fire outside the run, so this proves nothing'
    )
    assert.equal(
      inRun.player.money,
      obligationOnly.player.money,
      'the wealth drain was still taxing run Cash'
    )
    assert.ok(inRun.player.money > protectedCash)
  })
})

describe('the run owns its own insolvency', () => {
  it('does not send the Career to GAMEOVER during a run', () => {
    // With nothing protected, a broke run used to hit the legacy bankruptcy
    // transition, which put the game on the GAMEOVER scene and made the run's
    // own accept/extract dialog unreachable.
    const run = startedState({ money: 5000, fuel: 100 })
    const broke = { ...run, player: { ...run.player, money: 0 } }
    const next = gameReducer(broke, advanceDay(broke))

    assert.equal(next.currentScene, broke.currentScene)
    assert.equal(next.expedition.pendingFailure?.reason, 'bankruptcy')
    assert.ok(next.expedition.unpaidDailyObligation > 0)
  })

  it('hands the Career check back once the run has settled', () => {
    const run = startedState({ money: 5000, fuel: 100 })
    const settled = {
      ...run,
      player: { ...run.player, money: 0 },
      expedition: { ...run.expedition, status: 'idle' }
    }
    const next = gameReducer(settled, advanceDay(settled))
    assert.equal(next.currentScene, GAME_PHASES.GAMEOVER)
  })

  it('records what the upstream ticks took out of the protected slice', () => {
    // Upstream ticks (asset upkeep, liabilities) respect protectedCareerCash
    // and record unpayable portions as unpaid obligations without touching protected money.
    const run = startedState(
      { money: 5000, fuel: 100 },
      { build: { protectedCareerCash: 4000 } }
    )
    const withLiability = {
      ...run,
      player: { ...run.player, money: 4000 },
      liabilities: {
        liability_1: {
          id: 'liability_1',
          source: 'loan',
          assetId: 'asset_1',
          principalRemaining: 1000,
          interestRate: 0.01,
          dailyPayment: 120,
          missedPayments: 0,
          status: 'active'
        }
      }
    }
    const next = gameReducer(withLiability, advanceDay(withLiability))

    assert.equal(next.player.money, 4000)
    assert.ok(next.expedition.unpaidDailyObligation >= 120)
  })
})

describe('mandatory section 1 regressions', () => {
  it('1. Money 150, protectedCareerCash 100, Liability 100: final Money 100, 50 paid, 50 unpaid, principal reduced by 50', () => {
    const run = startedState(
      { money: 5000, fuel: 100 },
      { build: { protectedCareerCash: 100 } }
    )
    const state = {
      ...run,
      player: { ...run.player, money: 150 },
      liabilities: {
        l1: {
          id: 'l1',
          assetId: 'a1',
          dailyPayment: 100,
          principalRemaining: 1000,
          interestRate: 0,
          termDaysRemaining: 10,
          defaultCounter: 0
        }
      }
    }
    const next = gameReducer(state, advanceDay(state))

    assert.equal(next.player.money, 100, 'money stopped at protectedCareerCash')
    assert.equal(next.liabilities.l1.principalRemaining, 950, 'principal reduced by paid 50')
    assert.equal(next.liabilities.l1.defaultCounter, 1, 'default counter incremented on shortfall')
    assert.ok(next.expedition.unpaidDailyObligation >= 50, 'unpaid 50 carried as debt')
  })

  it('2. combined asset upkeep + liability + living cost exceeding spendable cash stops exacly on protectedCareerCash', () => {
    const run = startedState(
      { money: 5000, fuel: 100 },
      { build: { protectedCareerCash: 500 } }
    )
    const state = {
      ...run,
      player: { ...run.player, money: 600 },
      assets: [
        {
          id: 'a1',
          condition: 100,
          baseDailyRevenue: 0,
          baseUpkeep: 200,
          slots: []
        }
      ],
      liabilities: {
        l1: {
          id: 'l1',
          assetId: 'a1',
          dailyPayment: 300,
          principalRemaining: 2000,
          interestRate: 0,
          termDaysRemaining: 10,
          defaultCounter: 0
        }
      }
    }
    const next = gameReducer(state, advanceDay(state))

    assert.equal(next.player.money, 500, 'money stopped exactly on protectedCareerCash')
    assert.ok(next.expedition.unpaidDailyObligation > 0, 'complete unpaid remainder tracked')
  })

  it('3. sufficient expedition-spendable cash: normal payments unchanged', () => {
    const run = startedState(
      { money: 5000, fuel: 100 },
      { build: { protectedCareerCash: 1000 } }
    )
    const state = {
      ...run,
      player: { ...run.player, money: 3000 },
      liabilities: {
        l1: {
          id: 'l1',
          assetId: 'a1',
          dailyPayment: 100,
          principalRemaining: 1000,
          interestRate: 0,
          termDaysRemaining: 10,
          defaultCounter: 0
        }
      }
    }
    const next = gameReducer(state, advanceDay(state))

    assert.equal(next.liabilities.l1.principalRemaining, 900)
    assert.equal(next.liabilities.l1.defaultCounter, 0)
  })

  it('4. Rest-in-Van: same cash boundary, no extra travel wear', () => {
    const run = startedState(
      { money: 5000, fuel: 100 },
      { build: { protectedCareerCash: 500 } }
    )
    const initialVanCondition = run.player.van.condition
    const rested = gameReducer(run, advanceDay(run))

    assert.equal(rested.player.van.condition, initialVanCondition)
    assert.ok(rested.player.money >= 500)
  })

  it('5. outside active expedition: legacy day-tick unchanged', () => {
    const run = startedState({ money: 3000, fuel: 100 })
    const idleState = withoutRun(run)
    const initialCondition = idleState.player.van.condition
    const next = gameReducer(idleState, advanceDay(idleState))

    assert.equal(next.player.van.condition, initialCondition - 2)
  })

  it('6. no money clamp-up retroactively', () => {
    const run = startedState(
      { money: 5000, fuel: 100 },
      { build: { protectedCareerCash: 1000 } }
    )
    // Money is already below protected cash before tick (e.g. 800)
    const broke = {
      ...run,
      player: { ...run.player, money: 800 }
    }
    const next = gameReducer(broke, advanceDay(broke))

    assert.ok(next.player.money <= 800, 'money did not artificially clamp up')
  })
})

describe('the day tick outside a run is unchanged', () => {
  it('still applies the flat van wear and the wealth drain', () => {
    const idle = withoutRun(startedState({ money: 30_000, fuel: 100 }))
    const drained = calculateDailyUpdates(idle, () => 0)
    const quiet = calculateDailyUpdates(idle, quietRng)

    assert.equal(drained.player.van.condition, idle.player.van.condition - 2)
    assert.ok(drained.player.money < quiet.player.money)
    assert.equal(drained.expeditionUnpaidObligation, 0)
  })
})
