import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { MINIGAME_REGISTRY } from '../src/utils/minigameRegistry.ts'
import { ActionTypes } from '../src/context/actionTypes.ts'
import { GAME_PHASES } from '../src/context/gameConstants.ts'

describe('MINIGAME_REGISTRY', () => {
  const KNOWN_MINIGAMES = ['travel', 'roadie', 'ampCalibration', 'kabelsalat']

  it('has an entry for every known minigame', () => {
    for (const key of KNOWN_MINIGAMES) {
      assert.ok(
        Object.hasOwn(MINIGAME_REGISTRY, key),
        `Missing registry entry for "${key}"`
      )
    }
  })

  for (const [key, entry] of Object.entries(MINIGAME_REGISTRY)) {
    it(`${key}: startAction references a valid ActionType`, () => {
      const values = Object.values(ActionTypes)
      assert.ok(
        values.includes(entry.startAction),
        `startAction "${entry.startAction}" not in ActionTypes`
      )
    })

    it(`${key}: completeAction references a valid ActionType`, () => {
      const values = Object.values(ActionTypes)
      assert.ok(
        values.includes(entry.completeAction),
        `completeAction "${entry.completeAction}" not in ActionTypes`
      )
    })

    it(`${key}: scene references a valid GAME_PHASES value`, () => {
      const phases = Object.values(GAME_PHASES)
      assert.ok(
        phases.includes(entry.scene),
        `scene "${entry.scene}" not in GAME_PHASES`
      )
    })

    it(`${key}: calculateResult is a function`, () => {
      assert.strictEqual(typeof entry.calculateResult, 'function')
    })
  }
})
