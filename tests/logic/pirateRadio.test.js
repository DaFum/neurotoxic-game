import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { handlePirateBroadcast } from '../../src/context/reducers/socialReducer'

describe('Pirate Radio Logic', () => {
  it('should correctly apply costs and gains from broadcast', () => {
    const initialState = {
      player: {
        money: 1000,
        fame: 50,
        day: 5
      },
      band: {
        harmony: 80
      },
      social: {
        zealotry: 10,
        controversyLevel: 20,
        lastPirateBroadcastDay: 1
      },
      toasts: []
    }

    const payload = {
      cost: 200,
      fameGain: 100,
      zealotryGain: 15,
      controversyGain: 20,
      harmonyCost: 10,
      successToast: { message: 'success' }
    }

    const result = handlePirateBroadcast(initialState, payload)

    assert.equal(result.player.money, 800)
    assert.equal(result.player.fame, 150)
    assert.equal(result.band.harmony, 70)
    assert.equal(result.social.zealotry, 25)
    assert.equal(result.social.controversyLevel, 40)
    assert.equal(result.toasts.length, 1)
    assert.equal(result.toasts[0].message, 'success')
  })

  it('should clamp bounds correctly at upper limits', () => {
    const initialState = {
      player: {
        money: 100,
        fame: 0,
        day: 5
      },
      band: {
        harmony: 100
      },
      social: {
        zealotry: 95,
        controversyLevel: 90,
        lastPirateBroadcastDay: 1
      }
    }

    const payload = {
      cost: 0,
      fameGain: 0,
      zealotryGain: 20,
      controversyGain: 20,
      harmonyCost: 0
    }

    const result = handlePirateBroadcast(initialState, payload)

    assert.equal(
      result.social.zealotry,
      100,
      'Zealotry should be clamped to 100'
    )
    assert.equal(
      result.social.controversyLevel,
      100,
      'Controversy should be clamped to 100'
    )
  })

  it('should clamp bounds correctly at lower limits', () => {
    const initialState = {
      player: {
        money: 150,
        fame: 0,
        day: 5
      },
      band: {
        harmony: 15
      },
      social: {
        zealotry: 0,
        controversyLevel: 0,
        lastPirateBroadcastDay: 1
      }
    }

    const payload = {
      cost: 200, // costs more than we have
      fameGain: 0,
      zealotryGain: 0,
      controversyGain: 0,
      harmonyCost: 20 // costs more harmony than we have
    }

    const result = handlePirateBroadcast(initialState, payload)

    assert.equal(
      result.player.money,
      150,
      'Action should abort, leaving money unchanged'
    )
    assert.equal(
      result.band.harmony,
      15,
      'Action should abort, leaving harmony unchanged'
    )
  })

  it('should handle undefined and non-numeric payload fields gracefully without NaN', () => {
    const initialState = {
      player: {
        money: 50,
        fame: 10,
        day: 5
      },
      band: {
        harmony: 50
      },
      social: {
        zealotry: 10,
        controversyLevel: 10,
        lastPirateBroadcastDay: 1
      }
    }

    const payload = {
      cost: undefined,
      fameGain: 'invalid',
      zealotryGain: NaN,
      controversyGain: null,
      harmonyCost: undefined
    }

    const result = handlePirateBroadcast(initialState, payload)

    assert.equal(result.player.money, 50, 'Money should remain numeric')
    assert.equal(result.player.fame, 10, 'Fame should remain numeric')
    assert.equal(result.band.harmony, 50, 'Harmony should remain numeric')
    assert.equal(result.social.zealotry, 10, 'Zealotry should remain numeric')
    assert.equal(
      result.social.controversyLevel,
      10,
      'Controversy should remain numeric'
    )
  })
})
