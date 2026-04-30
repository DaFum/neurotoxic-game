import { describe, it } from 'node:test'
import assert from 'node:assert'
import { handleChangeScene } from '../../../src/context/reducers/sceneReducer'
import { GAME_PHASES, DEFAULT_MINIGAME_STATE } from '../../../src/context/gameConstants'

describe('sceneReducer', () => {
  describe('handleChangeScene', () => {
    it('should change scene when a valid scene is provided', () => {
      const initialState = { currentScene: GAME_PHASES.MENU }
      const targetScene = GAME_PHASES.OVERWORLD
      const newState = handleChangeScene(initialState, targetScene)

      assert.strictEqual(newState.currentScene, targetScene)
    })

    it('should reset minigame state when changing scenes', () => {
      const initialState = {
        currentScene: GAME_PHASES.PRE_GIG_MINIGAME,
        minigame: { active: false, type: 'KABELSALAT', score: 100 }
      }
      const newState = handleChangeScene(initialState, GAME_PHASES.GIG)
      assert.deepStrictEqual(newState.minigame, DEFAULT_MINIGAME_STATE)
    })

    it('should ignore scene change when an invalid scene is provided', () => {
      const initialState = { currentScene: GAME_PHASES.MENU }
      const targetScene = 'INVALID_SCENE'
      const newState = handleChangeScene(initialState, targetScene)

      assert.strictEqual(newState.currentScene, initialState.currentScene)
      assert.deepStrictEqual(newState, initialState)
    })
  })
})
