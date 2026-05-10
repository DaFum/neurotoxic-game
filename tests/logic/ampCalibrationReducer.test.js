import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import {
  handleStartAmpCalibration,
  handleCompleteAmpCalibration
} from '../../src/context/reducers/minigameReducer'
import { GAME_PHASES, MINIGAME_TYPES } from '../../src/context/gameConstants'

const BASE_COMPLETE_STATE = {
  minigame: { active: true, type: MINIGAME_TYPES.AMP_CALIBRATION },
  currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
  band: { harmony: 50 },
  player: { money: 100 }
}

describe('minigameReducer - Amp Calibration', () => {
  it('should initialize amp calibration minigame state correctly', () => {
    const initialState = {
      minigame: { active: false },
      currentScene: GAME_PHASES.PRE_GIG
    }
    const result = handleStartAmpCalibration(initialState, {
      gigId: 'gig_test_1'
    })

    assert.strictEqual(result.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)
    assert.strictEqual(result.minigame.active, true)
    assert.strictEqual(result.minigame.type, MINIGAME_TYPES.AMP_CALIBRATION)
    assert.strictEqual(result.minigame.gigId, 'gig_test_1')
    assert.strictEqual(result.minigame.score, 0)
  })

  // score < 50  → stress = Math.floor((50 - score) / 2), reward = 0
  // score >= 50 → stress = 0, reward = score
  const completionCases = [
    {
      label: 'low score applies stress penalty and zero reward',
      score: 10,
      initialHarmony: 50,
      initialMoney: 100,
      expectedHarmony: Math.max(1, 50 - Math.floor((50 - 10) / 2)), // 30
      expectedMoney: 100
    },
    {
      label: 'perfect score awards full bonus and no stress',
      score: 100,
      initialHarmony: 50,
      initialMoney: 100,
      expectedHarmony: 50,
      expectedMoney: 200
    },
    {
      label: 'high score clamps harmony at existing value (no regen)',
      score: 80,
      initialHarmony: 95,
      initialMoney: 100,
      expectedHarmony: 95,
      expectedMoney: 180
    },
    {
      label: 'threshold score 50 applies zero stress and awards reward',
      score: 50,
      initialHarmony: 50,
      initialMoney: 100,
      expectedHarmony: 50,
      expectedMoney: 150
    },
    {
      label: 'stress clamps harmony to minimum of 1',
      score: 10,
      initialHarmony: 5,
      initialMoney: 100,
      expectedHarmony: 1, // 5 - 20 = -15 → clamped
      expectedMoney: 100
    }
  ]

  completionCases.forEach(
    ({
      label,
      score,
      initialHarmony,
      initialMoney,
      expectedHarmony,
      expectedMoney
    }) => {
      it(`should ${label}`, () => {
        const state = {
          ...BASE_COMPLETE_STATE,
          band: { ...BASE_COMPLETE_STATE.band, harmony: initialHarmony },
          player: { money: initialMoney }
        }
        const result = handleCompleteAmpCalibration(state, { score })

        assert.strictEqual(result.minigame.active, false)
        assert.strictEqual(result.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)
        assert.strictEqual(result.band.harmony, expectedHarmony)
        assert.strictEqual(result.player.money, expectedMoney)
      })
    }
  )

  it('should apply Tech Wizard trait reward multiplier', () => {
    const state = {
      ...BASE_COMPLETE_STATE,
      band: {
        harmony: 50,
        members: [{ id: 'player1', traits: { tech_wizard: true } }]
      }
    }
    // score 100 → base reward 100 → tech_wizard 1.5x → 150
    const result = handleCompleteAmpCalibration(state, { score: 100 })

    assert.strictEqual(result.minigame.active, false)
    assert.strictEqual(result.currentScene, GAME_PHASES.PRE_GIG_MINIGAME)
    assert.strictEqual(result.player.money, 250)
  })
})
