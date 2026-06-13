import { describe, it, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'

import {
  handleStartTravelMinigame,
  handleCompleteTravelMinigame,
  handleStartRoadieMinigame,
  handleCompleteRoadieMinigame,
  handleStartKabelsalatMinigame,
  handleCompleteKabelsalatMinigame,
  handleCompleteAmpCalibration
} from '../../src/context/reducers/minigameReducer.ts'

import {
  GAME_PHASES,
  MINIGAME_TYPES,
  DEFAULT_MINIGAME_STATE
} from '../../src/context/gameConstants.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'

const travelFuelModuleId = 'test_minigame_fuel_discount'
const originalTravelFuelModule = MODULE_REGISTRY[travelFuelModuleId]

after(() => {
  if (originalTravelFuelModule === undefined) {
    delete MODULE_REGISTRY[travelFuelModuleId]
  } else {
    MODULE_REGISTRY[travelFuelModuleId] = originalTravelFuelModule
  }
})

/**
 * Returns a copy of the given state with minigame set to active for the specified type.
 */
function withActiveMinigame(state, type) {
  return {
    ...state,
    minigame: {
      ...state.minigame,
      active: true,
      type
    }
  }
}

describe('minigameReducer', () => {
  let baseState

  beforeEach(() => {
    baseState = {
      player: {
        money: 1000,
        currentNodeId: 'node1',
        totalTravels: 0,
        van: { fuel: 100, condition: 100 },
        stats: { totalDistance: 0 }
      },
      band: {
        harmony: 50,
        members: []
      },
      gameMap: {
        nodes: {
          node1: { id: 'node1', venue: { name: 'Node 1 Venue' }, x: 0, y: 0 },
          node2: { id: 'node2', venue: { name: 'Node 2 Venue' }, x: 100, y: 0 }
        }
      },
      currentScene: GAME_PHASES.OVERWORLD,
      minigame: { ...DEFAULT_MINIGAME_STATE },
      gigModifiers: {},
      assets: [],
      toasts: []
    }
  })

  describe('handleStartTravelMinigame', () => {
    it('should set currentScene and minigame state', () => {
      const payload = { targetNodeId: 'node2' }
      const nextState = handleStartTravelMinigame(baseState, payload)

      assert.strictEqual(nextState.currentScene, GAME_PHASES.TRAVEL_MINIGAME)
      assert.strictEqual(nextState.minigame.active, true)
      assert.strictEqual(nextState.minigame.type, MINIGAME_TYPES.TOURBUS)
      assert.strictEqual(nextState.minigame.targetDestination, 'node2')
    })
  })

  describe('handleCompleteTravelMinigame', () => {
    it('should update state properly on valid target', () => {
      const activeState = withActiveMinigame(baseState, MINIGAME_TYPES.TOURBUS)
      activeState.minigame.targetDestination = 'node2'
      const payload = { damageTaken: 10, itemsCollected: 5 }
      const nextState = handleCompleteTravelMinigame(activeState, payload)

      // economic details are handled by economyEngine; here we only assert on state changes
      assert.ok(nextState.player.money < baseState.player.money)
      assert.strictEqual(nextState.player.location, 'Node 2 Venue')
      assert.strictEqual(nextState.player.currentNodeId, 'node2')
      assert.strictEqual(nextState.player.totalTravels, 1)
      assert.ok(nextState.player.van.fuel < baseState.player.van.fuel)
      assert.ok(nextState.player.van.condition < baseState.player.van.condition)
      assert.ok(
        nextState.player.stats.totalDistance >
          baseState.player.stats.totalDistance
      )
      assert.deepStrictEqual(nextState.minigame, { ...DEFAULT_MINIGAME_STATE })
    })

    it('applies active asset fuel modifiers to travel costs', () => {
      MODULE_REGISTRY[travelFuelModuleId] = {
        id: travelFuelModuleId,
        ownerKind: 'tourbus_chassis',
        slotType: 'tb_roof',
        flavor: 'legit',
        cost: 100,
        installCost: 10,
        removalRefundFraction: 0.5,
        boni: { fuelMultiplier: 0.5 },
        unlock: {},
        imagePromptKey: 'test_minigame_fuel'
      }
      const baselineState = withActiveMinigame(
        baseState,
        MINIGAME_TYPES.TOURBUS
      )
      baselineState.minigame.targetDestination = 'node2'
      const baseline = handleCompleteTravelMinigame(baselineState, {
        damageTaken: 0,
        itemsCollected: []
      })

      const boostedBase = withActiveMinigame(
        {
          ...baseState,
          assets: [
            {
              id: 'asset_fuel',
              kind: 'tourbus_chassis',
              chassisFlavor: 'legit',
              chassisTier: 1,
              condition: 100,
              baseUpkeep: 0,
              baseDailyRevenue: 0,
              slots: [
                {
                  id: 'slot_fuel',
                  slotType: 'tb_roof',
                  position: { x: 0, y: 0 },
                  installedModuleId: travelFuelModuleId
                }
              ],
              acquiredOnDay: 1,
              acquisitionMode: 'cash',
              baseRiskEventChance: 0
            }
          ]
        },
        MINIGAME_TYPES.TOURBUS
      )
      boostedBase.minigame.targetDestination = 'node2'
      const boosted = handleCompleteTravelMinigame(boostedBase, {
        damageTaken: 0,
        itemsCollected: []
      })

      assert.ok(boosted.player.van.fuel > baseline.player.van.fuel)
    })

    it('should prefer venue.id over venue.name when both exist', () => {
      const activeState = withActiveMinigame(baseState, MINIGAME_TYPES.TOURBUS)
      activeState.gameMap = {
        ...baseState.gameMap,
        nodes: {
          ...baseState.gameMap.nodes,
          node2: {
            id: 'node2',
            venue: { id: 'berlin_end_venue', name: 'some_other_name' },
            x: 100,
            y: 0
          }
        }
      }
      activeState.minigame.targetDestination = 'node2'

      const payload = { damageTaken: 10, itemsCollected: [] }
      const nextState = handleCompleteTravelMinigame(activeState, payload)

      assert.strictEqual(
        nextState.player.location,
        'venues:berlin_end_venue.name'
      )
    })

    it('should return safely if invalid targetNode and preserve currentScene', () => {
      const activeState = withActiveMinigame(baseState, MINIGAME_TYPES.TOURBUS)
      activeState.currentScene = GAME_PHASES.TRAVEL_MINIGAME
      activeState.minigame.targetDestination = 'invalid_node'
      const payload = { damageTaken: 10, itemsCollected: 5 }
      const nextState = handleCompleteTravelMinigame(activeState, payload)
      assert.strictEqual(nextState.currentScene, GAME_PHASES.TRAVEL_MINIGAME) // should preserve the initial scene without overriding it
      assert.deepStrictEqual(nextState.minigame, { ...DEFAULT_MINIGAME_STATE })
    })

    it('clamps non-finite rngValue before applying void hazard stamina loss', () => {
      const activeState = withActiveMinigame(
        {
          ...baseState,
          band: {
            ...baseState.band,
            members: [
              { id: 'matze', stamina: 100, staminaMax: 100 },
              { id: 'marius', stamina: 100, staminaMax: 100 }
            ]
          }
        },
        MINIGAME_TYPES.TOURBUS
      )
      activeState.minigame.targetDestination = 'node2'

      const nextState = handleCompleteTravelMinigame(activeState, {
        damageTaken: 0,
        itemsCollected: ['VOID_HAZARD'],
        rngValue: Number.POSITIVE_INFINITY
      })

      assert.strictEqual(nextState.band.members[0].stamina, 90)
      assert.strictEqual(nextState.band.members[1].stamina, 100)
    })
  })

  describe('handleCompleteAmpCalibration', () => {
    it('should set minigame to inactive and type to amp calibration', () => {
      baseState.minigame.type = MINIGAME_TYPES.AMP_CALIBRATION
      baseState.minigame.active = true
      const payload = { score: 100 }
      const nextState = handleCompleteAmpCalibration(baseState, payload)

      assert.strictEqual(nextState.minigame.active, false)
      assert.strictEqual(
        nextState.minigame.type,
        MINIGAME_TYPES.AMP_CALIBRATION
      )
      // Scene transition is driven by the UI overlay's CONTINUE button, so the
      // reducer must not touch currentScene here.
      assert.strictEqual(nextState.currentScene, baseState.currentScene)
    })

    it('should correctly handle the PRE_GIG_MINIGAME path without mutating scene', () => {
      baseState.currentScene = GAME_PHASES.PRE_GIG_MINIGAME
      baseState.minigame.type = MINIGAME_TYPES.AMP_CALIBRATION
      baseState.minigame.active = true
      const payload = { score: 100 }
      const nextState = handleCompleteAmpCalibration(baseState, payload)

      assert.strictEqual(nextState.minigame.active, false)
      assert.strictEqual(
        nextState.minigame.type,
        MINIGAME_TYPES.AMP_CALIBRATION
      )
      assert.strictEqual(nextState.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)
    })
  })

  describe('handleStartKabelsalatMinigame', () => {
    it('should set currentScene and minigame state', () => {
      const payload = { gigId: 'gig1' }
      const nextState = handleStartKabelsalatMinigame(baseState, payload)

      assert.strictEqual(nextState.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)
      assert.strictEqual(nextState.minigame.active, true)
      assert.strictEqual(nextState.minigame.type, MINIGAME_TYPES.KABELSALAT)
      assert.strictEqual(nextState.minigame.gigId, 'gig1')
    })
  })

  describe('handleCompleteKabelsalatMinigame', () => {
    it('should apply penalty on failure', () => {
      baseState.minigame.type = MINIGAME_TYPES.KABELSALAT
      baseState.minigame.active = true
      const payload = { results: { isPoweredOn: false } }
      const nextState = handleCompleteKabelsalatMinigame(baseState, payload)

      assert.strictEqual(nextState.band.harmony, 35) // 50 - 15 stress (updated to 15)
      assert.strictEqual(nextState.player.money, 1000) // No reward on failure
      assert.strictEqual(nextState.gigModifiers.damaged_gear, true)
      // minigame.type is preserved so SceneRouter keeps the scene mounted while
      // the completion overlay is visible; only `active` is cleared.
      assert.strictEqual(nextState.minigame.active, false)
      assert.strictEqual(nextState.minigame.type, MINIGAME_TYPES.KABELSALAT)
      assert.strictEqual(nextState.currentScene, baseState.currentScene)
    })

    it('should apply reward on success', () => {
      baseState.minigame.type = MINIGAME_TYPES.KABELSALAT
      baseState.minigame.active = true
      const payload = { results: { isPoweredOn: true, timeLeft: 30 } }
      const nextState = handleCompleteKabelsalatMinigame(baseState, payload)

      assert.strictEqual(nextState.band.harmony, 50) // No stress on success
      assert.strictEqual(nextState.player.money, 1150) // 60 base + (30/5)*15 = 150 reward
      assert.strictEqual(nextState.gigModifiers.damaged_gear, undefined)
      assert.strictEqual(nextState.minigame.active, false)
      assert.strictEqual(nextState.minigame.type, MINIGAME_TYPES.KABELSALAT)
      assert.strictEqual(nextState.currentScene, baseState.currentScene)
    })
  })

  describe('handleStartRoadieMinigame', () => {
    it('should set currentScene and minigame state', () => {
      const payload = { gigId: 'gig2' }
      const nextState = handleStartRoadieMinigame(baseState, payload)

      assert.strictEqual(nextState.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)
      assert.strictEqual(nextState.minigame.active, true)
      assert.strictEqual(nextState.minigame.type, MINIGAME_TYPES.ROADIE)
      assert.strictEqual(nextState.minigame.gigId, 'gig2')
      assert.strictEqual(nextState.minigame.equipmentRemaining, 10)
    })
  })

  describe('handleCompleteRoadieMinigame', () => {
    it('should update player money and band harmony', () => {
      const activeState = withActiveMinigame(baseState, MINIGAME_TYPES.ROADIE)
      const payload = { equipmentDamage: 60 }
      const nextState = handleCompleteRoadieMinigame(activeState, payload)

      // 50 - 12
      assert.strictEqual(nextState.band.harmony, 38)
      // 1000 - 120
      assert.strictEqual(nextState.player.money, 880)
      assert.strictEqual(nextState.gigModifiers.damaged_gear, true)
      // Scene transition is driven by the UI overlay's CONTINUE button, so the
      // reducer must not touch currentScene here.
      assert.strictEqual(nextState.currentScene, activeState.currentScene)
      assert.strictEqual(nextState.minigame.active, false)
      assert.strictEqual(nextState.minigame.type, MINIGAME_TYPES.ROADIE)
    })

    it('should not set damaged_gear if equipmentDamage is low', () => {
      const activeState = withActiveMinigame(baseState, MINIGAME_TYPES.ROADIE)
      const payload = { equipmentDamage: 20 }
      const nextState = handleCompleteRoadieMinigame(activeState, payload)

      assert.strictEqual(nextState.gigModifiers.damaged_gear, undefined)
    })
  })

  describe('replay guards (idempotency)', () => {
    it('amp calibration completion is idempotent on replay', () => {
      const activeState = withActiveMinigame(
        baseState,
        MINIGAME_TYPES.AMP_CALIBRATION
      )
      const payload = {
        score: 100,
        voidResonance: 0,
        purgesUsed: 0,
        hijacksOverridden: 0
      }
      const once = handleCompleteAmpCalibration(activeState, payload)
      const twice = handleCompleteAmpCalibration(once, payload)
      assert.strictEqual(twice, once) // identical reference — no re-apply
    })

    it('kabelsalat completion is idempotent on replay', () => {
      const activeState = withActiveMinigame(
        baseState,
        MINIGAME_TYPES.KABELSALAT
      )
      const payload = { results: { isPoweredOn: true, timeLeft: 30 } }
      const once = handleCompleteKabelsalatMinigame(activeState, payload)
      const twice = handleCompleteKabelsalatMinigame(once, payload)
      assert.strictEqual(twice, once) // identical reference — no re-apply
    })

    it('roadie completion is idempotent on replay', () => {
      const activeState = withActiveMinigame(baseState, MINIGAME_TYPES.ROADIE)
      const payload = { equipmentDamage: 60 }
      const once = handleCompleteRoadieMinigame(activeState, payload)
      const twice = handleCompleteRoadieMinigame(once, payload)
      assert.strictEqual(twice, once) // identical reference — no re-apply
    })

    it('tourbus completion is idempotent on replay', () => {
      const activeState = withActiveMinigame(baseState, MINIGAME_TYPES.TOURBUS)
      activeState.minigame.targetDestination = 'node2'
      const payload = { damageTaken: 0, itemsCollected: [] }
      const once = handleCompleteTravelMinigame(activeState, payload)
      const twice = handleCompleteTravelMinigame(once, payload)
      assert.strictEqual(twice, once) // identical reference — no re-apply
    })
  })
})
