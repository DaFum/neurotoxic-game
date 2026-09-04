/**
 * @fileoverview Route Fuel and vehicle wear, settled exactly once.
 *
 * Two invariants matter here. Wear must be attributable — the route's declared
 * cost scaled by the chassis/module road-wear rules, plus whatever the player's
 * own travel-minigame run cost them — and it must land exactly once, on the
 * canonical `player.van.condition` only. Copying it into the Expedition's
 * technical Condition would double-charge the player for one trip and blur the
 * two failure axes G2 keeps separate.
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import { clampVanCondition } from '../../src/utils/gameState'
import { resolveExpeditionTravelCost } from '../../src/domain/expedition/travel'
import { getEffectiveExpeditionRules } from '../../src/domain/expedition/effectiveRules'
import { getExpeditionTechnicalCondition } from '../../src/domain/expedition/condition'
import { getExpeditionNodeFogByNodeId } from '../../src/domain/expedition/nodeFog'
import { fixtureMap, startedState } from '../expeditionLifecycleFixture.js'

const map = fixtureMap()

/** The first hop off the start node, and the node it lands on. */
const firstHop = () => {
  const to = map.connections.find(edge => edge.from === map.startNodeId)?.to
  assert.ok(to, 'the fixture route has no first hop')
  return to
}

const routeContext = (overrides = {}) => ({
  targetNodeId: firstHop(),
  distance: 120,
  baseFuelLiters: 20,
  minigameFuelBonus: 0,
  minigameConditionLoss: 0,
  ...overrides
})

describe('resolveExpeditionTravelCost outside a run', () => {
  it('reports the legacy numbers unchanged', () => {
    const state = createInitialState()
    const settlement = resolveExpeditionTravelCost(
      state,
      routeContext({ baseFuelLiters: 20, minigameConditionLoss: 7 })
    )
    // Career travel must be byte-identical to before: fuel is the helper's
    // litres and wear is purely what the minigame run cost.
    assert.equal(settlement.fuelConsumed, 20)
    assert.equal(settlement.vehicleWear, 7)
  })

  it('still applies the minigame fuel bonus', () => {
    const state = createInitialState()
    const settlement = resolveExpeditionTravelCost(
      state,
      routeContext({ baseFuelLiters: 20, minigameFuelBonus: 5 })
    )
    assert.equal(settlement.fuelConsumed, 15)
  })
})

describe('resolveExpeditionTravelCost during a run', () => {
  it('charges the route node its declared wear cost', () => {
    const state = startedState()
    const nodeId = firstHop()
    const declared = map.meta[nodeId]?.hidden.exactWearCost
    assert.ok(declared > 0, 'the fixture hop declares no wear cost')

    const settlement = resolveExpeditionTravelCost(
      state,
      routeContext({ targetNodeId: nodeId })
    )
    // The multiplier is read from the effective rules rather than assumed:
    // the fixture commits no chassis, and the "no chassis" profile is a real
    // balance value G2 Task 1 owns, not a neutral 1.
    const { roadWearMultiplier } = getEffectiveExpeditionRules(state).numeric
    assert.equal(settlement.vehicleWear, declared * roadWearMultiplier)
  })

  it('adds the player-owned minigame damage on top of the route cost', () => {
    const state = startedState()
    const nodeId = firstHop()
    const declared = map.meta[nodeId]?.hidden.exactWearCost
    const { roadWearMultiplier } = getEffectiveExpeditionRules(state).numeric
    const settlement = resolveExpeditionTravelCost(
      state,
      routeContext({ targetNodeId: nodeId, minigameConditionLoss: 9 })
    )
    assert.equal(settlement.vehicleWear, declared * roadWearMultiplier + 9)
  })

  it('scales only the route term by the road-wear multiplier', () => {
    const state = startedState()
    const nodeId = firstHop()
    const declared = map.meta[nodeId]?.hidden.exactWearCost

    // A road-wear multiplier is a management modifier: it makes the route
    // harsher. It must not also punish the player's own driving, or skill and
    // management stop being separable axes.
    const harsh = resolveExpeditionTravelCost(
      state,
      routeContext({ targetNodeId: nodeId, minigameConditionLoss: 10 }),
      { roadWearMultiplier: 2, fuelConsumptionMultiplier: 1 }
    )
    assert.equal(harsh.vehicleWear, declared * 2 + 10)
  })

  it('scales fuel by the consumption multiplier', () => {
    const state = startedState()
    const thirsty = resolveExpeditionTravelCost(
      state,
      routeContext({ baseFuelLiters: 20 }),
      { roadWearMultiplier: 1, fuelConsumptionMultiplier: 1.35 }
    )
    assert.equal(thirsty.fuelConsumed, 27)

    const efficient = resolveExpeditionTravelCost(
      state,
      routeContext({ baseFuelLiters: 20 }),
      { roadWearMultiplier: 1, fuelConsumptionMultiplier: 0.85 }
    )
    assert.equal(efficient.fuelConsumed, 17)
  })

  it('applies the minigame fuel bonus after the multiplier', () => {
    const state = startedState()
    const settlement = resolveExpeditionTravelCost(
      state,
      routeContext({ baseFuelLiters: 20, minigameFuelBonus: 7 }),
      { roadWearMultiplier: 1, fuelConsumptionMultiplier: 1.35 }
    )
    // The bonus is litres recovered, not a share of consumption.
    assert.equal(settlement.fuelConsumed, 27 - 7)
  })

  it('never reports negative wear, and nets fuel honestly', () => {
    const state = startedState()
    const settlement = resolveExpeditionTravelCost(
      state,
      routeContext({ baseFuelLiters: 5, minigameFuelBonus: 999 })
    )
    // Wear is a cost and can never be negative. Fuel is a net figure: an
    // oversized pickup is a gain, and `clampVanFuel` in the reducer — not this
    // resolver — is what keeps the tank inside its bounds.
    assert.ok(settlement.vehicleWear >= 0)
    assert.ok(settlement.fuelConsumed < 0)
  })

  it('falls back to a distance-derived cost for a node off the route', () => {
    const state = startedState()
    const settlement = resolveExpeditionTravelCost(
      state,
      routeContext({ targetNodeId: 'not_on_the_route' })
    )
    // A node the route does not declare must still cost something, otherwise an
    // off-route arrival would be free wear-wise.
    assert.ok(settlement.vehicleWear > 0)
    assert.ok(Number.isFinite(settlement.vehicleWear))
  })

  it('rejects malformed route context values rather than producing NaN', () => {
    const state = startedState()
    for (const overrides of [
      { distance: Number.NaN },
      { baseFuelLiters: Number.NaN },
      { baseFuelLiters: Number.POSITIVE_INFINITY },
      { minigameConditionLoss: Number.NaN },
      { minigameFuelBonus: Number.NaN },
      { distance: -50 }
    ]) {
      const settlement = resolveExpeditionTravelCost(
        state,
        routeContext(overrides)
      )
      assert.ok(
        Number.isFinite(settlement.fuelConsumed),
        `fuelConsumed for ${JSON.stringify(overrides)}`
      )
      assert.ok(
        Number.isFinite(settlement.vehicleWear),
        `vehicleWear for ${JSON.stringify(overrides)}`
      )
      assert.ok(settlement.vehicleWear >= 0)
    }
  })
})

describe('minigame fuel pickups', () => {
  it('nets a career leg out to a fuel gain when pickups exceed the burn', () => {
    // Career travel predates the Expedition layer and let a good minigame run
    // end a short trip with a fuller tank. Clamping the consumption at zero
    // would silently pocket the surplus.
    const state = createInitialState()
    const { fuelConsumed } = resolveExpeditionTravelCost(
      state,
      routeContext({ baseFuelLiters: 1.36, minigameFuelBonus: 1.5 })
    )
    assert.ok(fuelConsumed < 0)
    assert.equal(Math.round(fuelConsumed * 100) / 100, -0.14)
  })

  it('nets an in-run leg out the same way', () => {
    const state = startedState({ money: 5000, fuel: 50 })
    const { fuelConsumed } = resolveExpeditionTravelCost(state, {
      ...routeContext({ baseFuelLiters: 2, minigameFuelBonus: 20 })
    })
    assert.ok(fuelConsumed < 0)
  })
})

describe('the travel reducer settles the leg exactly once', () => {
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

  it('charges the route wear to the canonical van condition', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const nodeId = firstHop()

    // Expected drop comes from the same resolver the reducer uses, through the
    // same clamp — hardcoding it would just restate another task's tuning.
    const { vehicleWear } = resolveExpeditionTravelCost(state, {
      targetNodeId: nodeId,
      distance: 0,
      baseFuelLiters: 0,
      minigameFuelBonus: 0,
      minigameConditionLoss: 0
    })
    assert.ok(vehicleWear > 0, 'the fixture hop costs no vehicle wear')

    const arrived = travelTo(state, nodeId)
    assert.equal(
      arrived.player.van.condition,
      clampVanCondition(state.player.van.condition - vehicleWear)
    )
    assert.ok(arrived.player.van.condition < state.player.van.condition)
  })

  it('never copies vehicle wear into technical Condition', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const before = getExpeditionTechnicalCondition(state)
    const arrived = travelTo(state, firstHop())
    // Vehicle and technical Condition are separate failure axes; a trip must
    // not quietly damage the PA.
    assert.deepEqual(getExpeditionTechnicalCondition(arrived), before)
  })

  it('consumes fuel once for one leg', () => {
    const state = startedState({ money: 5000, fuel: 100 })
    const arrived = travelTo(state, firstHop())
    assert.ok(arrived.player.van.fuel < 100)

    // A replayed completion finds no active minigame and must change nothing.
    const replayed = gameReducer(arrived, {
      type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
      payload: { damageTaken: 0, itemsCollected: [] }
    })
    assert.equal(replayed.player.van.fuel, arrived.player.van.fuel)
    assert.equal(replayed.player.van.condition, arrived.player.van.condition)
  })

  it('leaves Career travel wear unchanged', () => {
    // Outside a run the only wear source stays the minigame result, exactly as
    // before this task.
    const career = createInitialState()
    career.player.money = 5000
    career.player.currentNodeId = 'node_0_0'
    career.gameMap = {
      nodes: {
        node_0_0: { id: 'node_0_0', layer: 0, type: 'START', x: 50, y: 10 },
        node_1_0: { id: 'node_1_0', layer: 1, type: 'GIG', x: 50, y: 20 }
      },
      connections: [{ from: 'node_0_0', to: 'node_1_0' }]
    }
    const arrived = travelTo(career, 'node_1_0')
    assert.equal(arrived.player.van.condition, career.player.van.condition)
  })
})

describe('the Fog reveals the cost the player will actually pay', () => {
  it('reveals the effective wear, not the route declaration', () => {
    const state = startedState()
    const nodeId = firstHop()
    const declared = map.meta[nodeId]?.hidden.exactWearCost
    const { roadWearMultiplier } = getEffectiveExpeditionRules(state).numeric
    assert.notEqual(
      roadWearMultiplier,
      1,
      'this case needs a non-neutral multiplier to be meaningful'
    )

    // Intel level 1 has to be earned, so grant it the way a Social result does.
    const withIntel = {
      ...state,
      expedition: {
        ...state.expedition,
        intelByNodeId: Object.assign(Object.create(null), { [nodeId]: 1 })
      }
    }
    const fog = getExpeditionNodeFogByNodeId(withIntel)
    assert.ok(fog)

    const revealed = fog[nodeId]?.exactWearCost
    const charged = resolveExpeditionTravelCost(withIntel, {
      targetNodeId: nodeId,
      distance: 0,
      baseFuelLiters: 0,
      minigameFuelBonus: 0,
      minigameConditionLoss: 0
    }).vehicleWear

    // Showing `declared` would be an invisible debuff: the player would plan
    // against 4 and be charged 4.4.
    assert.equal(revealed, charged)
    assert.notEqual(revealed, declared)
  })

  it('still hides the cost entirely at intel level 0', () => {
    const fog = getExpeditionNodeFogByNodeId(startedState())
    assert.ok(fog)
    assert.equal(fog[firstHop()]?.exactWearCost, null)
  })
})
