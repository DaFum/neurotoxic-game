import test from 'node:test'
import assert from 'node:assert'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { VOID_SERMON_REQUIRED_ZEALOTRY } from '../../src/data/zealotryActionGates'
import { createInitialState } from '../../src/context/initialState'

test('Void Sermon', async t => {
  await t.test(
    'should successfully apply void sermon and clamp bounds when zealotry is high enough',
    () => {
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
      assert.strictEqual(
        nextState.social.zealotry,
        VOID_SERMON_REQUIRED_ZEALOTRY + 20
      )
      assert.strictEqual(nextState.social.controversyLevel, 30)
      assert.strictEqual(
        nextState.social.lastVoidSermonDay,
        nextState.player.day
      )
    }
  )

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

  const baseState = (overrides = {}) => {
    const initialState = createInitialState()
    return {
      ...initialState,
      player: { ...initialState.player, money: 2000, fame: 100 },
      band: { ...initialState.band, harmony: 80 },
      social: {
        ...initialState.social,
        zealotry: VOID_SERMON_REQUIRED_ZEALOTRY,
        controversyLevel: 10,
        lastVoidSermonDay: null
      },
      ...overrides
    }
  }

  const payload = {
    cost: 750,
    fameGain: 400,
    zealotryGain: 25,
    controversyGain: 40,
    harmonyCost: 25
  }

  const sermon = state =>
    gameReducer(state, { type: ActionTypes.VOID_SERMON, payload })

  await t.test('accepts zealotry exactly at the gate', () => {
    const next = sermon(baseState())
    assert.strictEqual(next.player.money, 1250)
    assert.strictEqual(next.social.zealotry, VOID_SERMON_REQUIRED_ZEALOTRY + 25)
  })

  await t.test('rejects a second sermon on the same day', () => {
    const once = sermon(baseState())
    const twice = sermon(once)
    assert.strictEqual(twice, once)
  })

  await t.test('rejects a non-finite cost payload', () => {
    const state = baseState()
    const next = gameReducer(state, {
      type: ActionTypes.VOID_SERMON,
      payload: { ...payload, cost: Number.NaN }
    })
    assert.strictEqual(next.player.money, state.player.money)
    assert.strictEqual(next.social.lastVoidSermonDay, null)
  })

  await t.test(
    'rejects a spend that crosses the protected expedition cash floor',
    () => {
      const state = baseState({
        player: { ...baseState().player, money: 1000 },
        expedition: {
          ...createInitialState().expedition,
          status: 'active',
          protectedCareerCash: 500
        }
      })
      const next = sermon(state)
      assert.strictEqual(next.player.money, 1000)
      assert.strictEqual(next.social.lastVoidSermonDay, null)
    }
  )

  await t.test(
    'removes active deals and applies 10 trust lost per deal on upward crossing of 85 controversy',
    () => {
      const state = baseState({
        social: {
          ...baseState().social,
          controversyLevel: 70,
          activeDeals: [
            { id: 'deal1', alignment: 'corporate', remainingGigs: 3 },
            { id: 'deal2', alignment: 'indie', remainingGigs: 4 }
          ],
          brandReputation: { corporate: 50, indie: 50 }
        }
      })
      const next = sermon(state)
      assert.strictEqual(next.social.activeDeals.length, 0)
      assert.strictEqual(next.social.brandReputation.corporate, 40)
      assert.strictEqual(next.social.brandReputation.indie, 40)
    }
  )

  await t.test(
    'does not remove active deal when starting at 85 or higher controversy',
    () => {
      const state = baseState({
        social: {
          ...baseState().social,
          controversyLevel: 85,
          activeDeals: [{ id: 'deal1', alignment: 'corporate', remainingGigs: 3 }],
          brandReputation: { corporate: 50 }
        }
      })
      const next = sermon(state)
      assert.strictEqual(next.social.activeDeals.length, 1)
      assert.strictEqual(next.social.brandReputation.corporate, 50)
      assert.strictEqual(next.social.controversyLevel, 100)
    }
  )

  await t.test(
    'deducts full cost and harmony with no zealotry gain when zealotry is already 100',
    () => {
      const state = baseState({
        social: {
          ...baseState().social,
          zealotry: 100
        }
      })
      const next = sermon(state)
      assert.strictEqual(next.player.money, 1250)
      assert.strictEqual(next.band.harmony, 55)
      assert.strictEqual(next.social.zealotry, 100)
    }
  )
})
