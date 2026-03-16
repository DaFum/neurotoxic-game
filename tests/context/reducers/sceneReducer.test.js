// TODO: Implement this
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { handleChangeScene } from '../../../src/context/reducers/sceneReducer.js'
import { GAME_PHASES } from '../../../src/context/gameConstants.js'

describe('sceneReducer', () => {
  describe('handleChangeScene', () => {
    it('should change scene when a valid scene is provided', () => {
      const initialState = { currentScene: GAME_PHASES.MENU }
      const targetScene = GAME_PHASES.OVERWORLD
      const newState = handleChangeScene(initialState, targetScene)

      assert.strictEqual(newState.currentScene, targetScene)
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
