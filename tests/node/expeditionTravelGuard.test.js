/**
 * @fileoverview Travel must not split the player's node from the run's route.
 *
 * `COMPLETE_TRAVEL_MINIGAME` composes the route advance in the same pass. A
 * refused advance (for example a pending Run Draft) must refuse the whole leg,
 * not charge it and move the player while `routeStep` stays behind.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { fixtureMap, startedState } from '../expeditionLifecycleFixture.js'

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
