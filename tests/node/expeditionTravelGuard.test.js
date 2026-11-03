/**
 * @fileoverview Travel must not split the player's node from the run's route.
 *
 * `COMPLETE_TRAVEL_MINIGAME` composes the route advance in the same pass. A
 * refused advance (for example a pending Run Draft) must refuse the whole leg,
 * not charge it and move the player while `routeStep` stays behind.
 */

import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import {
  fixtureMap,
  startedState,
  walkTo
} from '../expeditionLifecycleFixture.js'

import { calculateTravelExpenses } from '../../src/utils/economy'
import { getActiveAssetModifiers } from '../../src/utils/assets/assetSelectors'
import { resolveExpeditionTravelCost } from '../../src/domain/expedition/travel'
import { quest_tourbus_inspection } from '../../src/data/quests/quest_tourbus_inspection'
import { QuestEvents } from '../../src/utils/questProgress'
import { deriveExpeditionPendingFailure } from '../../src/domain/expedition/failure'

const map = fixtureMap()

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

describe('expedition travel guard', () => {
  it('refuses the whole leg while a Run Draft is pending', () => {
    const run = startedState({ money: 5000, fuel: 100 })
    const drafting = {
      ...run,
      expedition: {
        ...run.expedition,
        pendingRunDraftOffer: {
          sourceType: 'major_gig',
          candidateTraitIds: ['reckless_encore'],
          routeStep: run.expedition.routeStep
        }
      }
    }
    const next = travelTo(drafting, firstHop())

    assert.equal(next.player.currentNodeId, drafting.player.currentNodeId)
    assert.equal(next.player.money, drafting.player.money)
    assert.equal(next.player.van.fuel, drafting.player.van.fuel)
    assert.equal(next.expedition.routeStep, drafting.expedition.routeStep)
  })

  it('refuses to complete a leg the route has since started refusing', () => {
    const run = startedState({ money: 5000, fuel: 100 })
    const traveling = gameReducer(run, {
      type: ActionTypes.START_TRAVEL_MINIGAME,
      payload: { targetNodeId: firstHop() }
    })
    assert.equal(traveling.minigame.active, true)
    const drafting = {
      ...traveling,
      expedition: {
        ...traveling.expedition,
        pendingRunDraftOffer: {
          sourceType: 'major_gig',
          candidateTraitIds: ['reckless_encore'],
          routeStep: traveling.expedition.routeStep
        }
      }
    }
    const next = gameReducer(drafting, {
      type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
      payload: { damageTaken: 0, itemsCollected: [] }
    })

    assert.equal(next.player.currentNodeId, run.player.currentNodeId)
    assert.equal(next.player.money, run.player.money)
    assert.equal(next.player.van.fuel, run.player.van.fuel)
  })

  it('refuses a raw travel to a node the route does not offer', () => {
    const run = startedState({ money: 5000, fuel: 100 })
    const hop = firstHop()
    const farNode = Object.keys(map.meta).find(
      id => map.meta[id].routeStep >= 3 && id !== hop
    )
    assert.ok(farNode)
    const next = travelTo(run, farNode)

    assert.equal(next.player.currentNodeId, run.player.currentNodeId)
    assert.equal(next.player.money, run.player.money)
  })

  it('still travels a legal hop', () => {
    const run = startedState({ money: 5000, fuel: 100 })
    const next = travelTo(run, firstHop())
    assert.equal(next.player.currentNodeId, firstHop())
    assert.equal(next.expedition.routeStep, 1)
  })
})

// Settlement checks use live state and must precede every travel effect.
describe('expedition settlement resources and crisis (#3493)', () => {
  const begin = () => {
    const run = walkTo(startedState({ money: 5000 }), 1)
    const outgoing = run.gameMap.connections.filter(
      edge => edge.from === run.player.currentNodeId
    )
    assert.ok(outgoing.length >= 2)
    const origin = run.gameMap.nodes[run.player.currentNodeId]
    const targetId = outgoing[0].to
    for (const edge of outgoing) {
      run.gameMap.nodes[edge.to] = {
        ...run.gameMap.nodes[edge.to],
        x: origin.x + (edge.to === targetId ? 50 : 1),
        y: origin.y
      }
    }
    const state = gameReducer(run, {
      type: ActionTypes.START_TRAVEL_MINIGAME,
      payload: { targetNodeId: targetId }
    })
    assert.equal(state.minigame.active, true)
    state.activeQuests = [
      {
        ...quest_tourbus_inspection,
        id: 'quest_tourbus_inspection',
        progress: 0
      }
    ]
    return { state, targetId }
  }
  let emittedEvents = 0
  const complete = state => {
    const spy = mock.method(QuestEvents, 'emit')
    try {
      return gameReducer(state, {
        type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
        payload: {
          damageTaken: 2,
          itemsCollected: ['VOID_HAZARD'],
          rngValue: 0.01
        }
      })
    } finally {
      // The route pre-check runs the pure advance helper on a discarded state,
      // which derives nodeResolved progress. Only settlement events must be
      // absent; the state assertions below also reject committed quest progress.
      emittedEvents = spy.mock.calls.filter(
        call => call.arguments[1]?.type !== 'expedition.nodeResolved'
      ).length
      spy.mock.restore()
    }
  }
  const assertAtomic = (next, state) => {
    assert.equal(emittedEvents, 0)
    assert.deepEqual(next.player, state.player)
    assert.deepEqual(next.band, state.band)
    assert.deepEqual(next.activeQuests, state.activeQuests)
    assert.deepEqual(next.toasts, state.toasts)
    assert.deepEqual(next.terminalOutcome, state.terminalOutcome)
    assert.equal(next.currentScene, state.currentScene)
    assert.deepEqual(next.minigame, state.minigame)
    for (const field of [
      'routeStep',
      'visitedNodeIds',
      'rewardLedger',
      'technicalCondition'
    ]) {
      assert.deepEqual(next.expedition[field], state.expedition[field])
    }
  }

  for (const stored of [true, false]) {
    it(`refuses a ${stored ? 'stored' : 'not yet synchronized'} live crisis atomically`, () => {
      const { state } = begin()
      state.expedition.bandInjuryByMemberId = {
        [state.band.members[0].id]: 'critical'
      }
      const pending = deriveExpeditionPendingFailure(state)
      assert.equal(pending?.reason, 'crew_collapse')
      state.expedition.pendingFailure = stored ? pending : null
      const next = complete(state)
      assertAtomic(next, state)
      assert.equal(next.expedition.pendingFailure?.id, pending.id)
      assert.equal(
        next.expedition.blockedTravelAtRouteStep,
        state.expedition.blockedTravelAtRouteStep
      )
    })
  }

  it('does not let stale stored failure block a healthy settlement', () => {
    const { state, targetId } = begin()
    state.expedition.pendingFailure = {
      id: 'stale',
      reason: 'crew_collapse',
      choices: ['accept_failure']
    }
    assert.equal(deriveExpeditionPendingFailure(state), null)
    assert.equal(complete(state).player.currentNodeId, targetId)
  })

  it('refuses insufficient target-leg fuel while a cheaper leg is viable', () => {
    const { state } = begin()
    state.player.van.fuel = 1
    assert.equal(deriveExpeditionPendingFailure(state), null)
    const next = complete(state)
    assertAtomic(next, state)
    assert.equal(
      next.expedition.blockedTravelAtRouteStep,
      state.expedition.blockedTravelAtRouteStep
    )
  })

  for (const protectedCash of [0, 500]) {
    it(`refuses insufficient target-leg cash with ${protectedCash} protected cash`, () => {
      const { state } = begin()
      state.expedition.protectedCareerCash = protectedCash
      state.player.money = protectedCash + 30
      assert.equal(deriveExpeditionPendingFailure(state), null)
      const next = complete(state)
      assertAtomic(next, state)
      assert.equal(
        next.expedition.blockedTravelAtRouteStep,
        state.expedition.routeStep
      )
      assert.ok(
        next.expedition.pendingFailure?.choices.includes('accept_failure')
      )
    })
  }

  it('accepts exact spendable cash and fractional fuel and settles only once', () => {
    const { state, targetId } = begin()
    state.player.money = 100
    const quote = calculateTravelExpenses(
      state.gameMap.nodes[targetId],
      state.gameMap.nodes[state.player.currentNodeId],
      state.player,
      state.band,
      getActiveAssetModifiers(state.assets)
    )
    state.player.money = quote.totalCost
    // The reserve fee is zero on both wallets, so equality is exact.
    assert.equal(
      calculateTravelExpenses(
        state.gameMap.nodes[targetId],
        state.gameMap.nodes[state.player.currentNodeId],
        state.player,
        state.band
      ).totalCost,
      quote.totalCost
    )
    const { fuelConsumed } = resolveExpeditionTravelCost(state, {
      targetNodeId: targetId,
      distance: quote.dist,
      baseFuelLiters: quote.fuelLiters,
      minigameFuelBonus: 0,
      minigameConditionLoss: 0
    })
    state.player.van.fuel = fuelConsumed
    assert.equal(deriveExpeditionPendingFailure(state), null)
    const next = complete(state)
    assert.equal(next.player.currentNodeId, targetId)
    assert.equal(next.player.money, 0)
    assert.ok(Math.abs(next.player.van.fuel) < 1e-10)
    assert.equal(next.expedition.routeStep, state.expedition.routeStep + 1)
    assert.equal(next.activeQuests[0].progress, 1)
    assert.strictEqual(complete(next), next)
    assert.equal(emittedEvents, 0)
  })

  for (const pickups of [4, 6]) {
    it(`uses net fuel from ${pickups} pickups, including a surplus`, () => {
      const { state, targetId } = begin()
      // Commit the production armored-hauler profile (1.35), without a registry mutation.
      state.assets = [
        {
          id: 'hauler',
          kind: 'tourbus_chassis',
          chassisFlavor: 'diy',
          chassisTier: 3,
          condition: 100,
          slots: []
        }
      ]
      state.expedition.loadout.activeTourbusAssetId = 'hauler'
      const origin = state.gameMap.nodes[state.player.currentNodeId]
      state.gameMap.nodes[targetId] = {
        ...state.gameMap.nodes[targetId],
        x: origin.x,
        y: origin.y
      }
      const quote = calculateTravelExpenses(
        state.gameMap.nodes[targetId],
        origin,
        state.player,
        state.band,
        getActiveAssetModifiers(state.assets)
      )
      assert.equal(quote.fuelLiters, 2)
      state.player.van.fuel = pickups === 4 ? 0.7 + 1e-10 : 10
      assert.equal(deriveExpeditionPendingFailure(state), null)
      const before = state.player.van.fuel
      const next = gameReducer(state, {
        type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
        payload: {
          damageTaken: 0,
          itemsCollected: Array(pickups).fill('FUEL'),
          rngValue: 0.99
        }
      })
      assert.equal(next.player.currentNodeId, targetId)
      assert.ok(
        Math.abs(next.player.van.fuel - (before - (2 * 1.35 - pickups * 0.5))) <
          1e-9
      )
    })
  }
})
