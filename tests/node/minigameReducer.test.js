import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'

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
      baseState.minigame.targetDestination = 'node2'
      const payload = { damageTaken: 10, itemsCollected: 5 }
      const nextState = handleCompleteTravelMinigame(baseState, payload)

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

    it('should prefer venue.id over venue.name when both exist', () => {
      baseState.gameMap.nodes.node2 = {
        id: 'node2',
        venue: { id: 'berlin_end_venue', name: 'some_other_name' },
        x: 100,
        y: 0
      }
      baseState.minigame.targetDestination = 'node2'

      const payload = { damageTaken: 10, itemsCollected: [] }
      const nextState = handleCompleteTravelMinigame(baseState, payload)

      assert.strictEqual(
        nextState.player.location,
        'venues:berlin_end_venue.name'
      )
    })

    it('should return safely if invalid targetNode and preserve currentScene', () => {
      baseState.currentScene = GAME_PHASES.TRAVEL_MINIGAME
      baseState.minigame.targetDestination = 'invalid_node'
      const payload = { damageTaken: 10, itemsCollected: 5 }
      const nextState = handleCompleteTravelMinigame(baseState, payload)
      assert.strictEqual(nextState.currentScene, GAME_PHASES.TRAVEL_MINIGAME) // should preserve the initial scene without overriding it
      assert.deepStrictEqual(nextState.minigame, { ...DEFAULT_MINIGAME_STATE })
    })
  })

  describe('handleCompleteAmpCalibration', () => {
    it('should set minigame to inactive and type to amp calibration', () => {
      baseState.minigame.type = MINIGAME_TYPES.AMP_CALIBRATION
      baseState.minigame.active = true
      const payload = { score: 100 }
      const nextState = handleCompleteAmpCalibration(baseState, payload)

      assert.strictEqual(nextState.minigame.active, false)
      assert.strictEqual(nextState.minigame.type, MINIGAME_TYPES.AMP_CALIBRATION)
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
      assert.strictEqual(nextState.minigame.type, MINIGAME_TYPES.AMP_CALIBRATION)
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
      const payload = { results: { isPoweredOn: false } }
      const nextState = handleCompleteKabelsalatMinigame(baseState, payload)

      assert.strictEqual(nextState.band.harmony, 35) // 50 - 15 stress (updated to 15)
      assert.strictEqual(nextState.player.money, 1000) // No reward on failure
      assert.strictEqual(nextState.gigModifiers.damaged_gear, true)
      // minigame.type is preserved so SceneRouter keeps the scene mounted while
      // the completion overlay is visible; only `active` is cleared.
      assert.strictEqual(nextState.minigame.active, false)
      assert.strictEqual(nextState.minigame.type, MINIGAME_TYPES.KABELSALAT)
    })

    it('should apply reward on success', () => {
      const payload = { results: { isPoweredOn: true, timeLeft: 30 } }
      const nextState = handleCompleteKabelsalatMinigame(baseState, payload)

      assert.strictEqual(nextState.band.harmony, 50) // No stress on success
      assert.strictEqual(nextState.player.money, 1150) // 60 base + (30/5)*15 = 150 reward
      assert.strictEqual(nextState.gigModifiers.damaged_gear, undefined)
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
      const payload = { equipmentDamage: 60 }
      const nextState = handleCompleteRoadieMinigame(baseState, payload)

      // 50 - 12
      assert.strictEqual(nextState.band.harmony, 38)
      // 1000 - 120
      assert.strictEqual(nextState.player.money, 880)
      assert.strictEqual(nextState.gigModifiers.damaged_gear, true)
      // Scene transition is driven by the UI overlay's CONTINUE button, so the
      // reducer must not touch currentScene here.
      assert.strictEqual(nextState.currentScene, baseState.currentScene)
      assert.strictEqual(nextState.minigame.active, false)
      assert.strictEqual(nextState.minigame.type, baseState.minigame.type)
    })

    it('should not set damaged_gear if equipmentDamage is low', () => {
      const payload = { equipmentDamage: 20 }
      const nextState = handleCompleteRoadieMinigame(baseState, payload)

      assert.strictEqual(nextState.gigModifiers.damaged_gear, undefined)
    })
  })
})
