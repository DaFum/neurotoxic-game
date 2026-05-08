import test from 'node:test'
import assert from 'node:assert'
import {
  handleStartRoadieMinigame,
  handleCompleteRoadieMinigame
} from '../../src/context/reducers/minigameReducer.ts'
import { GAME_PHASES } from '../../src/context/gameConstants.ts'

test('minigameReducer - Roadie Run Contraband Extension', async t => {
  await t.test(
    'handleCompleteRoadieMinigame applies equipment damage to harmony and modifiers',
    () => {
      const initialState = {
        player: { money: 1000 },
        band: { harmony: 50 },
        gigModifiers: {},
        minigame: { active: true }
      }

      // Heavy damage triggers damaged_gear
      const payload = { equipmentDamage: 60 }

      // Using handleCompleteRoadieMinigame which computes calculateRoadieMinigameResult
      // 60 damage -> repair cost: 60 * 2 = 120. stress: floor(60/5) = 12. harmony -= 12 -> 38. money: 880
      const state = handleCompleteRoadieMinigame(initialState, payload)

      assert.strictEqual(state.player.money, 880)
      assert.strictEqual(state.band.harmony, 38)
      assert.strictEqual(state.gigModifiers.damaged_gear, true)
      assert.strictEqual(state.minigame.active, false)
    }
  )

  await t.test(
    'handleCompleteRoadieMinigame handles low equipment damage without damaged_gear modifier',
    () => {
      const initialState = {
        player: { money: 1000 },
        band: { harmony: 50 },
        gigModifiers: {},
        minigame: { active: true }
      }

      // Low damage (<= 50) does not trigger damaged_gear
      const payload = { equipmentDamage: 10 }

      const state = handleCompleteRoadieMinigame(initialState, payload)

      // 10 damage -> cost = 20. stress: floor(10/5) = 2. money = 980. harmony = 48.
      assert.strictEqual(state.player.money, 980)
      assert.strictEqual(state.band.harmony, 48)
      assert.strictEqual(state.gigModifiers.damaged_gear, undefined)
    }
  )

  await t.test(
    'handleStartRoadieMinigame initializes ROADIE minigame state',
    () => {
      const initialState = {
        currentScene: 'ANY',
        minigame: { active: false }
      }

      const payload = { gigId: 'gig-123' }
      const state = handleStartRoadieMinigame(initialState, payload)

      assert.strictEqual(state.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)
      assert.strictEqual(state.minigame.active, true)
      assert.strictEqual(state.minigame.type, 'ROADIE')
      assert.strictEqual(state.minigame.gigId, 'gig-123')
    }
  )
})
