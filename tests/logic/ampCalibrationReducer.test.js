import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  handleStartAmpCalibration,
  handleCompleteAmpCalibration
} from '../../src/context/reducers/minigameReducer.js'
import { GAME_PHASES, MINIGAME_TYPES } from '../../src/context/gameConstants.js'

describe('minigameReducer - Amp Calibration', () => {
  it('should initialize amp calibration minigame state correctly', () => {
    const initialState = {
      minigame: { active: false },
      currentScene: GAME_PHASES.PRE_GIG
    }

    const payload = { gigId: 'gig_test_1' }
    const result = handleStartAmpCalibration(initialState, payload)

    assert.strictEqual(result.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)
    assert.strictEqual(result.minigame.active, true)
    assert.strictEqual(result.minigame.type, MINIGAME_TYPES.AMP_CALIBRATION)
    assert.strictEqual(result.minigame.gigId, 'gig_test_1')
    assert.strictEqual(result.minigame.score, 0)
  })

  it('should complete minigame and clamp bad scores with high stress penalty', () => {
    const state = {
      minigame: { active: true, type: MINIGAME_TYPES.AMP_CALIBRATION },
      currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
      band: { harmony: 50 },
      player: { money: 100 }
    }

    // A low score (< 50) means stress penalty
    const result = handleCompleteAmpCalibration(state, { score: 10 })

    assert.strictEqual(result.minigame.active, false)
    assert.strictEqual(result.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)

    // Low score: stress goes up (harmony goes down)
    // economyEngine says: < 50 score -> stress = Math.floor((50 - 10) / 2) = 20
    assert.strictEqual(result.band.harmony, Math.max(1, 50 - 20))
    // < 50 score -> reward = 0
    assert.strictEqual(result.player.money, 100)
  })

  it('should complete minigame and award bonus for perfect score', () => {
    const state = {
      minigame: { active: true, type: MINIGAME_TYPES.AMP_CALIBRATION },
      currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
      band: { harmony: 50 },
      player: { money: 100 }
    }

    // A perfect score (100) means no stress, high reward
    const result = handleCompleteAmpCalibration(state, { score: 100 })

    assert.strictEqual(result.minigame.active, false)
    assert.strictEqual(result.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)

    // Perfect score (100) -> stress = 0
    assert.strictEqual(result.band.harmony, 50)
    // 100 score -> reward = 100
    assert.strictEqual(result.player.money, 200)
  })

  it('should complete minigame and clamp upper bounds properly', () => {
    const state = {
      minigame: { active: true, type: MINIGAME_TYPES.AMP_CALIBRATION },
      currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
      band: { harmony: 95 },
      player: { money: 100 }
    }

    // 80 score -> reward = 80
    const result = handleCompleteAmpCalibration(state, { score: 80 })

    assert.strictEqual(result.minigame.active, false)
    assert.strictEqual(result.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)

    // harmony remains at 95 (no stress, no healing)
    assert.strictEqual(result.band.harmony, 95)
    // 100 + 80 = 180 money
    assert.strictEqual(result.player.money, 180)
  })
})
