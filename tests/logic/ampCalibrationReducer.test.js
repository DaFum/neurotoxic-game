import { describe, it, expect } from 'vitest'
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

    expect(result.currentScene).toBe(GAME_PHASES.PRE_GIG_MINIGAME)
    expect(result.minigame.active).toBe(true)
    expect(result.minigame.type).toBe(MINIGAME_TYPES.AMP_CALIBRATION)
    expect(result.minigame.gigId).toBe('gig_test_1')
    expect(result.minigame.score).toBe(0)
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

    expect(result.minigame.active).toBe(false)
    expect(result.currentScene).toBe(GAME_PHASES.PRE_GIG_MINIGAME)

    // Low score: stress goes up (harmony goes down)
    // economyEngine says: < 50 score -> stress = Math.floor((50 - 10) / 2) = 20
    expect(result.band.harmony).toBe(Math.max(1, 50 - 20))
    // < 50 score -> reward = 0
    expect(result.player.money).toBe(100)
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

    expect(result.minigame.active).toBe(false)
    expect(result.currentScene).toBe(GAME_PHASES.PRE_GIG_MINIGAME)

    // Perfect score (100) -> stress = 0
    expect(result.band.harmony).toBe(50)
    // 100 score -> reward = 100
    expect(result.player.money).toBe(200)
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

    expect(result.minigame.active).toBe(false)
    expect(result.currentScene).toBe(GAME_PHASES.PRE_GIG_MINIGAME)

    // harmony remains at 95 (no stress, no healing)
    expect(result.band.harmony).toBe(95)
    // 100 + 80 = 180 money
    expect(result.player.money).toBe(180)
  })

  it('should complete minigame and act appropriately on exact threshold score (50)', () => {
    const state = {
      minigame: { active: true, type: MINIGAME_TYPES.AMP_CALIBRATION },
      currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
      band: { harmony: 50 },
      player: { money: 100 }
    }

    const result = handleCompleteAmpCalibration(state, { score: 50 })

    expect(result.minigame.active).toBe(false)
    expect(result.currentScene).toBe(GAME_PHASES.PRE_GIG_MINIGAME)

    // 50 score -> stress = 0
    expect(result.band.harmony).toBe(50)
    // 50 score -> reward = 50
    expect(result.player.money).toBe(150)
  })

  it('should clamp harmony to 1 when stress drops it below 1', () => {
    const state = {
      minigame: { active: true, type: MINIGAME_TYPES.AMP_CALIBRATION },
      currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
      band: { harmony: 5 },
      player: { money: 100 }
    }

    // score: 10 -> stress = 20. 5 - 20 = -15 -> clamps to 1
    const result = handleCompleteAmpCalibration(state, { score: 10 })

    expect(result.minigame.active).toBe(false)
    expect(result.currentScene).toBe(GAME_PHASES.PRE_GIG_MINIGAME)

    expect(result.band.harmony).toBe(1)
  })

  it('should apply Tech Wizard trait reward multiplier', () => {
    const state = {
      minigame: { active: true, type: MINIGAME_TYPES.AMP_CALIBRATION },
      currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
      band: {
        harmony: 50,
        members: [{ id: 'player1', traits: { 'tech_wizard': true } }]
      },
      player: { money: 100 }
    }

    // score 100 -> base reward 100 -> tech wizard 1.5x -> 150
    const result = handleCompleteAmpCalibration(state, { score: 100 })

    expect(result.minigame.active).toBe(false)
    expect(result.currentScene).toBe(GAME_PHASES.PRE_GIG_MINIGAME)

    expect(result.player.money).toBe(250)
  })
})
