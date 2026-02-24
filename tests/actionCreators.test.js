import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  createUnlockTraitAction
} from '../src/context/actionCreators.js'
import { ActionTypes } from '../src/context/gameReducer.js'

describe('Action Creators', () => {
  test('createUnlockTraitAction creates correct action', () => {
    const action = createUnlockTraitAction('matze', 'gear_nerd')
    assert.deepEqual(action, {
      type: ActionTypes.UNLOCK_TRAIT,
      payload: { memberId: 'matze', traitId: 'gear_nerd' }
    })
  })
})
