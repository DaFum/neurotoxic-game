import { describe, it, beforeEach } from 'node:test'
import { handleCultIndoctrination } from '../../src/context/reducers/socialReducer'
import { createInitialState } from '../../src/context/initialState'
import assert from 'node:assert/strict'

describe('socialReducer: handleCultIndoctrination', () => {
  /** @type {import('../../src/types').GameState} */
  let baseState

  beforeEach(() => {
    baseState = createInitialState()
    baseState.player.money = 2000
    baseState.player.fame = 100
    baseState.band.harmony = 80
    baseState.social.zealotry = 50
    baseState.social.controversyLevel = 10
    baseState.player.day = 5
  })

  it('rejects payload when funds are insufficient', () => {
    baseState.player.money = 500
    const payload = {
      cost: 1000,
      fameGain: 500,
      zealotryGain: 40,
      controversyGain: 50,
      harmonyCost: 30
    }
    const nextState = handleCultIndoctrination(baseState, payload)
    assert.strictEqual(nextState, baseState)
  })

  it('rejects payload when already indoctrinated today', () => {
    baseState.social.lastCultIndoctrinationDay = 5
    const payload = {
      cost: 1000,
      fameGain: 500,
      zealotryGain: 40,
      controversyGain: 50,
      harmonyCost: 30
    }
    const nextState = handleCultIndoctrination(baseState, payload)
    assert.strictEqual(nextState, baseState)
  })

  it('applies indoctrination correctly and updates lastCultIndoctrinationDay', () => {
    const payload = {
      cost: 1000,
      fameGain: 500,
      zealotryGain: 40,
      controversyGain: 50,
      harmonyCost: 30
    }
    const nextState = handleCultIndoctrination(baseState, payload)
    assert.notStrictEqual(nextState, baseState)
    assert.strictEqual(nextState.player.money, 1000)
    assert.strictEqual(nextState.player.fame, 600)
    assert.strictEqual(nextState.band.harmony, 50)
    assert.strictEqual(nextState.social.zealotry, 90)
    assert.strictEqual(nextState.social.controversyLevel, 60)
    assert.strictEqual(nextState.social.lastCultIndoctrinationDay, 5)
  })
})
