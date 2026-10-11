import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gameReducer } from '../../src/context/gameReducer'
import { ActionTypes } from '../../src/context/actionTypes'
import { createInitialState } from '../../src/context/initialState'
import {
  createUpdateRivalBandAction,
  createUpdateSocialAction
} from '../../src/context/actionCreators'
import { handleAdvanceDay } from '../../src/context/reducers/systemReducer'
import { handleMerchPress } from '../../src/context/reducers/socialReducer'
import { MINIGAME_TYPES } from '../../src/context/gameConstants'

const RIVAL = Object.freeze({
  id: 'rival_1',
  name: 'Rivals',
  alignment: 'EVIL',
  powerLevel: 2,
  currentLocationId: null
})

const withRival = (overrides = {}) => ({
  ...createInitialState(),
  rivalBand: { ...RIVAL },
  gameMap: { nodes: {}, connections: [] },
  ...overrides
})

describe('rival band payload authority', () => {
  it('SPAWN_RIVAL_BAND whitelists the stored rival', () => {
    const state = createInitialState()
    const next = gameReducer(state, {
      type: ActionTypes.SPAWN_RIVAL_BAND,
      payload: {
        rivalBand: {
          ...RIVAL,
          powerLevel: -4,
          alignment: 'NOT_AN_ALIGNMENT',
          injected: { nested: true }
        }
      }
    })
    assert.deepEqual(next.rivalBand, {
      id: 'rival_1',
      name: 'Rivals',
      alignment: 'NEUTRAL',
      powerLevel: 0,
      currentLocationId: null
    })
  })

  it('SPAWN_RIVAL_BAND rejects a structurally invalid rival', () => {
    const state = createInitialState()
    for (const rivalBand of [
      null,
      'rival',
      { name: 'No id' },
      { ...RIVAL, id: '__proto__' },
      { ...RIVAL, name: 42 }
    ]) {
      assert.equal(
        gameReducer(state, {
          type: ActionTypes.SPAWN_RIVAL_BAND,
          payload: { rivalBand }
        }),
        state
      )
    }
  })

  it('MOVE_RIVAL_BAND rejects a malformed rival and strips unknown keys', () => {
    const state = withRival()
    assert.equal(
      gameReducer(state, {
        type: ActionTypes.MOVE_RIVAL_BAND,
        payload: { rivalBand: { currentLocationId: 'node_1' } }
      }),
      state
    )
    const moved = gameReducer(state, {
      type: ActionTypes.MOVE_RIVAL_BAND,
      payload: {
        rivalBand: { ...RIVAL, currentLocationId: 'node_1', extra: 'x' }
      }
    })
    assert.equal(moved.rivalBand.currentLocationId, 'node_1')
    assert.equal(Object.hasOwn(moved.rivalBand, 'extra'), false)
  })

  it('UPDATE_RIVAL_BAND drops unknown, forbidden and mistyped fields on a raw dispatch', () => {
    const state = withRival()
    const payload = JSON.parse(
      '{"__proto__":{"polluted":true},"extra":1,"name":7,"alignment":"BOGUS","powerLevel":"9","currentLocationId":5,"id":"rival_2"}'
    )
    const next = gameReducer(state, {
      type: ActionTypes.UPDATE_RIVAL_BAND,
      payload
    })
    assert.deepEqual(next.rivalBand, { ...RIVAL, id: 'rival_2' })
    assert.equal({}.polluted, undefined)
  })

  it('createUpdateRivalBandAction uses the same whitelist', () => {
    const action = createUpdateRivalBandAction({
      name: 'New',
      alignment: 'GOOD',
      powerLevel: Number.NaN,
      currentLocationId: null,
      junk: true
    })
    assert.deepEqual(action.payload, {
      name: 'New',
      alignment: 'GOOD',
      currentLocationId: null
    })
  })
})

describe('minigame start payload authority', () => {
  const malformedIds = [42, '', '__proto__', 'constructor', null, ['node_1']]

  it('START_TRAVEL_MINIGAME rejects a malformed targetNodeId', () => {
    const state = createInitialState()
    for (const targetNodeId of malformedIds) {
      assert.equal(
        gameReducer(state, {
          type: ActionTypes.START_TRAVEL_MINIGAME,
          payload: { targetNodeId }
        }),
        state,
        `accepted targetNodeId ${String(targetNodeId)}`
      )
    }
  })

  for (const type of [
    ActionTypes.START_ROADIE_MINIGAME,
    ActionTypes.START_KABELSALAT_MINIGAME,
    ActionTypes.START_AMP_CALIBRATION
  ]) {
    it(`${type} rejects a malformed gigId`, () => {
      const state = createInitialState()
      for (const gigId of malformedIds) {
        assert.equal(
          gameReducer(state, { type, payload: { gigId } }),
          state,
          `accepted gigId ${String(gigId)}`
        )
      }
      const started = gameReducer(state, { type, payload: { gigId: 'gig_1' } })
      assert.equal(started.minigame.gigId, 'gig_1')
    })
  }

  it('COMPLETE_TRAVEL_MINIGAME ignores an inherited node key as the target', () => {
    const base = createInitialState()
    const state = {
      ...base,
      gameMap: { nodes: {}, connections: [] },
      minigame: {
        ...base.minigame,
        active: true,
        type: MINIGAME_TYPES.TOURBUS,
        targetDestination: 'toString'
      }
    }
    const next = gameReducer(state, {
      type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
      payload: { damageTaken: 0, itemsCollected: [] }
    })
    assert.equal(next.minigame.active, false)
    assert.equal(next.player.currentNodeId, state.player.currentNodeId)
    assert.equal(next.player.money, state.player.money)
  })
})

describe('UPDATE_SOCIAL reducer-side whitelist', () => {
  it('drops unknown and forbidden keys from a raw dispatch', () => {
    const state = createInitialState()
    const payload = JSON.parse(
      '{"__proto__":{"polluted":true},"bogusCounter":5,"instagram":10}'
    )
    const next = gameReducer(state, {
      type: ActionTypes.UPDATE_SOCIAL,
      payload
    })
    assert.equal(next.social.instagram, 10)
    assert.equal(Object.hasOwn(next.social, 'bogusCounter'), false)
    assert.equal({}.polluted, undefined)
  })

  it('floors follower counts, reputationCooldown and last*Day markers at 0', () => {
    const state = createInitialState()
    const next = gameReducer(state, {
      type: ActionTypes.UPDATE_SOCIAL,
      payload: {
        instagram: -5,
        tiktok: -1,
        youtube: -2,
        newsletter: -3,
        viral: -4,
        reputationCooldown: -9,
        lastGigDay: -1,
        lastPirateBroadcastDay: -2,
        lastDarkWebLeakDay: null
      }
    })
    for (const key of [
      'instagram',
      'tiktok',
      'youtube',
      'newsletter',
      'viral',
      'reputationCooldown',
      'lastGigDay',
      'lastPirateBroadcastDay'
    ]) {
      assert.equal(next.social[key], 0, key)
    }
    assert.equal(next.social.lastDarkWebLeakDay, null)
  })

  it('applies the same rules to a functional updater', () => {
    const state = createInitialState()
    const next = gameReducer(state, {
      type: ActionTypes.UPDATE_SOCIAL,
      payload: () => ({ youtube: -10, madeUp: 1 })
    })
    assert.equal(next.social.youtube, 0)
    assert.equal(Object.hasOwn(next.social, 'madeUp'), false)
  })

  it('the creator floors the same counters', () => {
    const action = createUpdateSocialAction({ viral: -3, junk: 1 })
    assert.deepEqual(action.payload, { viral: 0 })
  })
})

describe('SET_ACTIVE_EVENT structural gate', () => {
  it('rejects non-records, missing ids and forbidden keys', () => {
    const state = createInitialState()
    for (const payload of [
      'event',
      42,
      [],
      { title: 'no id' },
      { id: 7 },
      JSON.parse('{"id":"e1","options":[{"__proto__":{"polluted":true}}]}'),
      JSON.parse('{"id":"e1","constructor":{"prototype":{}}}')
    ]) {
      assert.equal(
        gameReducer(state, { type: ActionTypes.SET_ACTIVE_EVENT, payload }),
        state
      )
    }
    assert.equal({}.polluted, undefined)
  })

  it('still sets a well-formed event and clears with null', () => {
    const state = createInitialState()
    const event = { id: 'e1', title: 'Event', options: [] }
    const set = gameReducer(state, {
      type: ActionTypes.SET_ACTIVE_EVENT,
      payload: event
    })
    assert.equal(set.activeEvent, event)
    const cleared = gameReducer(set, {
      type: ActionTypes.SET_ACTIVE_EVENT,
      payload: null
    })
    assert.equal(cleared.activeEvent, null)
  })
})

describe('ADVANCE_DAY purity', () => {
  it('never runs a payload-supplied rng function', () => {
    const state = createInitialState()
    let called = false
    const rng = () => {
      called = true
      throw new Error('reducer ran a payload function')
    }
    const withRng = handleAdvanceDay(state, { rng })
    const withoutRng = handleAdvanceDay(state)
    assert.equal(called, false)
    assert.deepEqual(withRng.player, withoutRng.player)
    assert.deepEqual(withRng.social, withoutRng.social)
  })
})

describe('paid social actions share one funds policy', () => {
  const payload = {
    cost: 0,
    loyaltyGain: 1,
    controversyGain: 0,
    harmonyCost: 0,
    fameGain: 0
  }

  it('repairs corrupt money to 0 instead of rejecting a free action', () => {
    const base = createInitialState()
    const state = {
      ...base,
      player: { ...base.player, money: Number.NaN }
    }
    const next = handleMerchPress(state, payload)
    assert.equal(next.player.money, 0)
    assert.equal(next.social.loyalty, base.social.loyalty + 1)
  })

  it('a repaired balance cannot pay a positive cost', () => {
    const base = createInitialState()
    const state = {
      ...base,
      player: { ...base.player, money: Number.NaN }
    }
    assert.equal(handleMerchPress(state, { ...payload, cost: 10 }), state)
  })

  it('repairs corrupt harmony to the floor so a harmony cost fails closed', () => {
    const base = createInitialState()
    const state = { ...base, band: { ...base.band, harmony: Number.NaN } }
    assert.equal(handleMerchPress(state, { ...payload, harmonyCost: 5 }), state)
  })
})
