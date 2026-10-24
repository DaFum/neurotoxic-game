import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createInitialState } from '../../src/context/initialState.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import { projectQueuedActions } from '../../src/context/queuedActions.ts'

describe('projectQueuedActions', () => {
  it('returns the base state and an empty list for an empty queue', () => {
    const base = createInitialState()
    const { snapshot, pending } = projectQueuedActions(base, [])
    assert.strictEqual(snapshot, base)
    assert.deepEqual(pending, [])
  })

  it('replays state-changing actions in order and drops no-ops', () => {
    const base = createInitialState()
    // A rejected payload is a reducer no-op.
    const noop = {
      type: ActionTypes.APPLY_SOCIAL_POST_RESULT,
      payload: { social: { pendingSocialOptionId: '' } }
    }
    const change = {
      type: ActionTypes.UPDATE_PLAYER,
      payload: { money: base.player.money + 123 }
    }

    const { snapshot, pending } = projectQueuedActions(base, [
      noop,
      change,
      noop
    ])

    assert.equal(snapshot.player.money, base.player.money + 123)
    assert.deepEqual(pending, [change])
  })
})
