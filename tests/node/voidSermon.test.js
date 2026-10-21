import test from 'node:test'
import assert from 'node:assert'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { VOID_SERMON_REQUIRED_ZEALOTRY } from '../../src/data/zealotryActionGates'
import { createInitialState } from '../../src/context/initialState'

test('Void Sermon', async (t) => {
  await t.test('should successfully apply void sermon and clamp bounds when zealotry is high enough', () => {
    const initialState = createInitialState()
    const state = {
      ...initialState,
      player: {
        ...initialState.player,
        money: 100,
        fame: 100
      },
      band: {
        ...initialState.band,
        harmony: 50
      },
      social: {
        ...initialState.social,
        zealotry: VOID_SERMON_REQUIRED_ZEALOTRY + 10,
        controversyLevel: 10,
        lastVoidSermonDay: null
      }
    }

    const payload = {
      cost: 50,
      fameGain: 100,
      zealotryGain: 10,
      controversyGain: 20,
      harmonyCost: 10
    }

    const nextState = gameReducer(state, {
      type: ActionTypes.VOID_SERMON,
      payload
    })

    assert.strictEqual(nextState.player.money, 50) // 100 - 50
    assert.strictEqual(nextState.player.fame, 200) // 100 + 100
    assert.strictEqual(nextState.band.harmony, 40) // 50 - 10
    assert.strictEqual(nextState.social.zealotry, VOID_SERMON_REQUIRED_ZEALOTRY + 20)
    assert.strictEqual(nextState.social.controversyLevel, 30)
    assert.strictEqual(nextState.social.lastVoidSermonDay, nextState.player.day)
  })

  await t.test('should reject void sermon if zealotry is too low', () => {
    const initialState = createInitialState()
    const state = {
      ...initialState,
      player: {
        ...initialState.player,
        money: 100,
        fame: 100
      },
      band: {
        ...initialState.band,
        harmony: 50
      },
      social: {
        ...initialState.social,
        zealotry: VOID_SERMON_REQUIRED_ZEALOTRY - 1,
        controversyLevel: 10,
        lastVoidSermonDay: null
      }
    }

    const payload = {
      cost: 50,
      fameGain: 100,
      zealotryGain: 10,
      controversyGain: 20,
      harmonyCost: 10
    }

    const nextState = gameReducer(state, {
      type: ActionTypes.VOID_SERMON,
      payload
    })

    assert.strictEqual(nextState.player.money, 100)
    assert.strictEqual(nextState.player.fame, 100)
    assert.strictEqual(nextState.social.lastVoidSermonDay, null)
  })
})
