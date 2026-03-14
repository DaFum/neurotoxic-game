import { test } from 'node:test'
import assert from 'node:assert'
import { gameReducer, ActionTypes } from '../src/context/gameReducer.js'
import { initialState } from '../src/context/initialState.js'
import {
  GAME_PHASES,
  MINIGAME_TYPES,
  DEFAULT_MINIGAME_STATE
} from '../src/context/gameConstants.js'

test('Minigame State Transitions', async t => {
  await t.test('START_TRAVEL_MINIGAME updates state correctly', () => {
    const action = {
      type: ActionTypes.START_TRAVEL_MINIGAME,
      payload: { targetNodeId: 'node_1' }
    }
    const newState = gameReducer(initialState, action)

    assert.strictEqual(newState.currentScene, GAME_PHASES.TRAVEL_MINIGAME)
    assert.strictEqual(newState.minigame.active, true)
    assert.strictEqual(newState.minigame.type, MINIGAME_TYPES.TOURBUS)
    assert.strictEqual(newState.minigame.targetDestination, 'node_1')
  })

  await t.test(
    'COMPLETE_TRAVEL_MINIGAME applies results and updates location',
    () => {
      // Setup state as if minigame is active
      const activeState = {
        ...initialState,
        gameMap: {
          nodes: {
            node_0: {
              id: 'node_0',
              x: 0,
              y: 0,
              venue: { id: 'stendal_start_venue', name: 'Start' }
            },
            node_1: {
              id: 'node_1',
              x: 10,
              y: 10,
              venue: { id: 'berlin_end_venue', name: 'berlin' }
            } // dist ~90km -> 10.8L fuel
          }
        },
        player: {
          ...initialState.player,
          currentNodeId: 'node_0',
          money: 1000,
          van: { fuel: 100, condition: 100 }
        },
        currentScene: GAME_PHASES.TRAVEL_MINIGAME,
        minigame: {
          ...DEFAULT_MINIGAME_STATE,
          active: true,
          type: MINIGAME_TYPES.TOURBUS,
          targetDestination: 'node_1'
        }
      }

      const action = {
        type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
        payload: { damageTaken: 20, itemsCollected: ['FUEL'] } // 20 damage -> -10 condition. 1 Fuel -> +0.5L
      }
      const newState = gameReducer(activeState, action)

      assert.deepStrictEqual(newState.minigame, DEFAULT_MINIGAME_STATE)
      assert.strictEqual(newState.player.currentNodeId, 'node_1')
      assert.strictEqual(newState.player.location, 'berlin')
      assert.strictEqual(newState.currentScene, GAME_PHASES.TRAVEL_MINIGAME)

      // Check costs
      // Distance calculation: sqrt(10^2 + 10^2) * 5 + 20 = 90.71km -> 90km (floor)
      // Fuel Cost: (90 / 100) * 12 * 1.75 = 18.9 -> 18 (floor)
      // Food Cost: 24 (3 * 8)
      // Total Cost: 24 (Food only, fuel is paid via Refuel)
      // 1000 - 24 = 976
      assert.strictEqual(newState.player.money, 976)

      // Check condition
      // 100 - 10 = 90
      assert.strictEqual(newState.player.van.condition, 90)

      // Check fuel
      // Distance: 90km
      // Consumption: (90 / 100) * 12 = 10.8L
      // Bonus: +0.5L
      // Result: 100 - 10.8 + 0.5 = 89.7
      assert.ok(Math.abs(newState.player.van.fuel - 89.7) < 1e-9)
    }
  )

  await t.test('START_ROADIE_MINIGAME updates state correctly', () => {
    const action = {
      type: ActionTypes.START_ROADIE_MINIGAME,
      payload: { gigId: 'gig_123' }
    }
    const newState = gameReducer(initialState, action)

    assert.strictEqual(newState.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)
    assert.strictEqual(newState.minigame.active, true)
    assert.strictEqual(newState.minigame.type, MINIGAME_TYPES.ROADIE)
    assert.strictEqual(newState.minigame.gigId, 'gig_123')
  })

  await t.test('START_KABELSALAT_MINIGAME updates state correctly', () => {
    const action = {
      type: ActionTypes.START_KABELSALAT_MINIGAME,
      payload: { gigId: 'gig_123' }
    }
    const newState = gameReducer(initialState, action)

    assert.strictEqual(newState.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)
    assert.strictEqual(newState.minigame.active, true)
    assert.strictEqual(newState.minigame.type, MINIGAME_TYPES.KABELSALAT)
    assert.strictEqual(newState.minigame.gigId, 'gig_123')
  })

  await t.test(
    'COMPLETE_KABELSALAT_MINIGAME resets minigame state and applies economy effects',
    () => {
      const activeState = {
        ...initialState,
        player: { ...initialState.player, money: 1000 },
        band: { ...initialState.band, harmony: 50 },
        currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
        minigame: {
          active: true,
          type: MINIGAME_TYPES.KABELSALAT
        }
      }
      const action = {
        type: ActionTypes.COMPLETE_KABELSALAT_MINIGAME,
        payload: {
          results: { isPoweredOn: true, timeLeft: 15 } // Base 60 + (15/5)*15 = 105 reward
        }
      }
      const newState = gameReducer(activeState, action)

      assert.deepStrictEqual(newState.minigame, initialState.minigame)

      // Verify Economy Result applied correctly
      assert.strictEqual(newState.player.money, 1105)
      assert.strictEqual(newState.band.harmony, 50) // stress is 0
    }
  )

  await t.test(
    'COMPLETE_ROADIE_MINIGAME resets minigame state and applies economy effects',
    () => {
      const activeState = {
        ...initialState,
        currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
        player: { ...initialState.player, money: 500 },
        band: {
          ...initialState.band,
          harmony: 80,
          members: initialState.band.members.map(m =>
            m.name === 'Matze' ? { ...m, traits: [{ id: 'gear_nerd' }] } : m
          )
        },
        minigame: {
          ...DEFAULT_MINIGAME_STATE,
          active: true,
          type: MINIGAME_TYPES.ROADIE
        }
      }

      const action = {
        type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
        payload: { equipmentDamage: 5 }
      }
      const newState = gameReducer(activeState, action)

      assert.deepStrictEqual(newState.minigame, DEFAULT_MINIGAME_STATE)
      // Scene transition is now handled by UI overlay, so scene remains PRE_GIG_MINIGAME
      assert.strictEqual(newState.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)

      // equipmentDamage=5 -> stress=1 -> harmony-=1; repairCost=10.
      // Matze has 'gear_nerd' -> -20% repair cost -> repairCost = 8 -> money-=8
      // harmony: 80 - 1 = 79
      // money: 500 - 8 = 492
      assert.strictEqual(newState.band.harmony, 79)
      assert.strictEqual(newState.player.money, 492)
    }
  )
})
