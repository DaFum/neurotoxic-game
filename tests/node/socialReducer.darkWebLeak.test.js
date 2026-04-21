import test from 'node:test'
import assert from 'node:assert'
import { handleDarkWebLeak } from '../../src/context/reducers/socialReducer.js'
import { ActionTypes } from '../../src/context/actionTypes.js'
import { clampPlayerFame } from '../../src/utils/gameStateUtils.js'

test('socialReducer - handleDarkWebLeak', async t => {
  await t.test(
    'applies exact stat changes without exceeding boundaries',
    () => {
      const initialState = {
        player: { money: 1000, fame: 100, day: 1 },
        band: { harmony: 50 },
        social: {
          controversyLevel: 10,
          zealotry: 20,
          lastDarkWebLeakDay: null
        }
      }

      const action = {
        type: ActionTypes.DARK_WEB_LEAK,
        payload: {
          cost: 500,
          fameGain: 300,
          zealotryGain: 25,
          controversyGain: 30,
          harmonyCost: 20
        }
      }

      const result = handleDarkWebLeak(initialState, action.payload)

      assert.strictEqual(result.player.money, 500)
      assert.strictEqual(result.player.fame, 400)
      assert.strictEqual(result.band.harmony, 30)
      assert.strictEqual(result.social.controversyLevel, 40)
      assert.strictEqual(result.social.zealotry, 45)
    }
  )

  await t.test('aborts if leaked on the same day', () => {
    const initialState = {
      player: { money: 1000, fame: 100, day: 42 },
      band: { harmony: 50 },
      social: {
        controversyLevel: 10,
        zealotry: 20,
        lastDarkWebLeakDay: 42
      }
    }

    const action = {
      type: ActionTypes.DARK_WEB_LEAK,
      payload: {
        cost: 500,
        fameGain: 300,
        zealotryGain: 25,
        controversyGain: 30,
        harmonyCost: 20
      }
    }

    const result = handleDarkWebLeak(initialState, action.payload)

    // Should return original state (money stays 1000)
    assert.strictEqual(result.player.money, 1000)
    assert.strictEqual(result.player.fame, 100)
    assert.strictEqual(result.band.harmony, 50)
    assert.strictEqual(result.social.controversyLevel, 10)
    assert.strictEqual(result.social.zealotry, 20)
    assert.strictEqual(result.social.lastDarkWebLeakDay, 42)
  })

  await t.test('clamps values to correct boundaries', () => {
    const initialState = {
      player: { money: 1000, fame: 999990, day: 1 },
      band: { harmony: 10 },
      social: {
        controversyLevel: 90,
        zealotry: 95,
        lastDarkWebLeakDay: null
      }
    }

    const action = {
      type: ActionTypes.DARK_WEB_LEAK,
      payload: {
        cost: 500,
        fameGain: 300,
        zealotryGain: 25,
        controversyGain: 30,
        harmonyCost: 10
      }
    }

    const result = handleDarkWebLeak(initialState, action.payload)

    assert.strictEqual(result.player.fame, 1000290)
    assert.strictEqual(result.band.harmony, 1)
    assert.strictEqual(result.social.controversyLevel, 100)
    assert.strictEqual(result.social.zealotry, 100)
  })

  await t.test('records last event day', () => {
    const initialState = {
      player: { money: 1000, day: 42, fame: 100 },
      band: { harmony: 50 },
      social: {
        controversyLevel: 10,
        zealotry: 20,
        lastDarkWebLeakDay: null
      }
    }

    const action = {
      type: ActionTypes.DARK_WEB_LEAK,
      payload: {
        cost: 500,
        fameGain: 300,
        zealotryGain: 25,
        controversyGain: 30,
        harmonyCost: 20
      }
    }

    const result = handleDarkWebLeak(initialState, action.payload)

    assert.strictEqual(result.social.lastDarkWebLeakDay, 42)
  })

  await t.test(
    'aborts if leaked on same day with non-finite day value (e.g. NaN -> 0)',
    () => {
      const initialState = {
        player: { money: 1000, fame: 100, day: NaN },
        band: { harmony: 50 },
        social: {
          controversyLevel: 10,
          zealotry: 20,
          lastDarkWebLeakDay: 0
        }
      }

      const action = {
        type: ActionTypes.DARK_WEB_LEAK,
        payload: {
          cost: 500,
          fameGain: 300,
          zealotryGain: 25,
          controversyGain: 30,
          harmonyCost: 20
        }
      }

      const result = handleDarkWebLeak(initialState, action.payload)

      // Should return original state (money stays 1000)
      assert.strictEqual(result.player.money, 1000)
      assert.strictEqual(result.player.fame, 100)
      assert.strictEqual(result.band.harmony, 50)
      assert.strictEqual(result.social.controversyLevel, 10)
      assert.strictEqual(result.social.zealotry, 20)
      assert.strictEqual(result.social.lastDarkWebLeakDay, 0)
    }
  )
})
