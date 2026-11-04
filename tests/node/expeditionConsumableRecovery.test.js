import test from 'node:test'
import assert from 'node:assert/strict'
import { startedState, walkTo } from '../expeditionLifecycleFixture.js'
import { getExpeditionMobilityFailureSignal } from '../../src/domain/expedition/failure.ts'

test('mobility rescue counts packed blood pact but cannot spend HQ-only stock', () => {
  const state = walkTo(startedState({ money: 5000, fuel: 100 }), 1)
  state.player.money = state.expedition.protectedCareerCash + 50
  state.band.harmony = 10
  state.band.members = state.band.members.map(member => ({
    ...member,
    stamina: 100
  }))
  state.band.stash = { c_blood_pact: { id: 'c_blood_pact', stacks: 1 } }
  state.assets = []
  state.liabilities = {}
  state.expedition.blockedTravelAtRouteStep = undefined
  // A short leg with enough fuel but no spendable cash. Only an item-assisted
  // donation can pay it; the active-run detector does not model resting.
  const current = state.gameMap.nodes[state.player.currentNodeId]
  for (const edge of state.gameMap.connections) {
    if (edge.from !== state.player.currentNodeId) continue
    state.gameMap.nodes[edge.to] = {
      ...state.gameMap.nodes[edge.to],
      type: 'REST',
      x: current.x + 1,
      y: current.y
    }
  }
  state.expedition.cargo.contraband = []
  assert.equal(
    getExpeditionMobilityFailureSignal(state)?.reason,
    'fuel_stranded'
  )
  state.expedition.cargo.contraband = [{ stashKey: 'c_blood_pact', stacks: 1 }]
  assert.equal(getExpeditionMobilityFailureSignal(state), null)
  // Legacy active saves resolve cargo from the committed loadout.
  state.expedition.loadout.build.contraband = [
    { stashKey: 'c_blood_pact', stacks: 1 }
  ]
  delete state.expedition.cargo
  assert.equal(getExpeditionMobilityFailureSignal(state), null)
  state.expedition.loadout.build.contraband = []
  assert.equal(
    getExpeditionMobilityFailureSignal(state)?.reason,
    'fuel_stranded'
  )
})
