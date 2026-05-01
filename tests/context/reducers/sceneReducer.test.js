import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  ALLOWED_SCENE_VALUES,
  handleChangeScene
} from '../../../src/context/reducers/sceneReducer'
import { GAME_PHASES } from '../../../src/context/gameConstants'

describe('sceneReducer', () => {
  describe('handleChangeScene', () => {
    it('should change scene when a valid scene is provided', () => {
      const initialState = { currentScene: GAME_PHASES.MENU }
      const targetScene = GAME_PHASES.OVERWORLD
      const newState = handleChangeScene(initialState, targetScene)

      assert.strictEqual(newState.currentScene, targetScene)
    })

    it('should keep ALLOWED_SCENE_VALUES aligned with GAME_PHASES values', () => {
      const phaseValues = Object.values(GAME_PHASES)
      for (const scene of phaseValues) {
        assert.strictEqual(ALLOWED_SCENE_VALUES.includes(scene), true)
      }

      assert.strictEqual(ALLOWED_SCENE_VALUES.length, phaseValues.length)
      for (const allowedScene of ALLOWED_SCENE_VALUES) {
        assert.strictEqual(phaseValues.includes(allowedScene), true)
      }
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
