/**
 * @fileoverview Tests for the action creators module
 */

import { describe, it, test } from 'node:test'
import assert from 'node:assert'
import {
  createChangeSceneAction,
  createUpdatePlayerAction,
  createUpdateBandAction,
  createUpdateSocialAction,
  createUpdateSettingsAction,
  createSetMapAction,
  createSetGigAction,
  createStartGigAction,
  createSetSetlistAction,
  createSetLastGigStatsAction,
  createSetActiveEventAction,
  createAddToastAction,
  createRemoveToastAction,
  createSetGigModifiersAction,
  createLoadGameAction,
  createResetStateAction,
  createApplyEventDeltaAction,
  createPopPendingEventAction,
  createConsumeItemAction,
  createAdvanceDayAction,
  createUnlockTraitAction
} from '../src/context/actionCreators.js'
import { ActionTypes } from '../src/context/gameReducer.js'

describe('Action Creators', () => {
  describe('createChangeSceneAction', () => {
    it('should create correct action', () => {
      const action = createChangeSceneAction('OVERWORLD')

      assert.strictEqual(action.type, ActionTypes.CHANGE_SCENE)
      assert.strictEqual(action.payload, 'OVERWORLD')
    })
  })

  describe('createUpdatePlayerAction', () => {
    it('should create correct action', () => {
      const updates = { money: 1000, fame: 50 }
      const action = createUpdatePlayerAction(updates)

      assert.strictEqual(action.type, ActionTypes.UPDATE_PLAYER)
      assert.deepStrictEqual(action.payload, updates)
    })
  })

  describe('createUpdateBandAction', () => {
    it('should create correct action', () => {
      const updates = { harmony: 80 }
      const action = createUpdateBandAction(updates)

      assert.strictEqual(action.type, ActionTypes.UPDATE_BAND)
      assert.deepStrictEqual(action.payload, updates)
    })
  })

  describe('createUpdateSocialAction', () => {
    it('should create correct action', () => {
      const updates = { instagram: 1000 }
      const action = createUpdateSocialAction(updates)

      assert.strictEqual(action.type, ActionTypes.UPDATE_SOCIAL)
      assert.deepStrictEqual(action.payload, updates)
    })
  })

  describe('createUpdateSettingsAction', () => {
    it('should create correct action', () => {
      const updates = { crtEnabled: false }
      const action = createUpdateSettingsAction(updates)

      assert.strictEqual(action.type, ActionTypes.UPDATE_SETTINGS)
      assert.deepStrictEqual(action.payload, updates)
    })
  })

  describe('createSetMapAction', () => {
    it('should create correct action', () => {
      const map = { nodes: {}, connections: [] }
      const action = createSetMapAction(map)

      assert.strictEqual(action.type, ActionTypes.SET_MAP)
      assert.deepStrictEqual(action.payload, map)
    })
  })

  describe('createSetGigAction', () => {
    it('should create correct action', () => {
      const gig = { name: 'Test Venue', capacity: 100 }
      const action = createSetGigAction(gig)

      assert.strictEqual(action.type, ActionTypes.SET_GIG)
      assert.deepStrictEqual(action.payload, gig)
    })
  })

  describe('createStartGigAction', () => {
    it('should create correct action', () => {
      const venue = { name: 'Test Venue' }
      const action = createStartGigAction(venue)

      assert.strictEqual(action.type, ActionTypes.START_GIG)
      assert.deepStrictEqual(action.payload, venue)
    })
  })

  describe('createSetSetlistAction', () => {
    it('should create correct action', () => {
      const setlist = [{ id: 'song1', name: 'Song 1' }]
      const action = createSetSetlistAction(setlist)

      assert.strictEqual(action.type, ActionTypes.SET_SETLIST)
      assert.deepStrictEqual(action.payload, setlist)
    })
  })

  describe('createSetLastGigStatsAction', () => {
    it('should create correct action', () => {
      const stats = { score: 1000, combo: 50 }
      const action = createSetLastGigStatsAction(stats)

      assert.strictEqual(action.type, ActionTypes.SET_LAST_GIG_STATS)
      assert.deepStrictEqual(action.payload, stats)
    })
  })

  describe('createSetActiveEventAction', () => {
    it('should create correct action with event', () => {
      const event = { id: 'event1', title: 'Test Event' }
      const action = createSetActiveEventAction(event)

      assert.strictEqual(action.type, ActionTypes.SET_ACTIVE_EVENT)
      assert.deepStrictEqual(action.payload, event)
    })

    it('should create correct action with null', () => {
      const action = createSetActiveEventAction(null)

      assert.strictEqual(action.type, ActionTypes.SET_ACTIVE_EVENT)
      assert.strictEqual(action.payload, null)
    })
  })

  describe('createAddToastAction', () => {
    it('should create correct action with default type', () => {
      const action = createAddToastAction('Test message')

      assert.strictEqual(action.type, ActionTypes.ADD_TOAST)
      assert.strictEqual(action.payload.message, 'Test message')
      assert.strictEqual(action.payload.type, 'info')
      assert.strictEqual(typeof action.payload.id, 'string')
      assert.ok(action.payload.id.length > 0)
    })

    it('should create correct action with custom type', () => {
      const action = createAddToastAction('Error message', 'error')

      assert.strictEqual(action.payload.message, 'Error message')
      assert.strictEqual(action.payload.type, 'error')
    })
  })

  describe('createRemoveToastAction', () => {
    it('should create correct action', () => {
      const action = createRemoveToastAction(12345)

      assert.strictEqual(action.type, ActionTypes.REMOVE_TOAST)
      assert.strictEqual(action.payload, 12345)
    })
  })

  describe('createSetGigModifiersAction', () => {
    it('should create correct action with object', () => {
      const modifiers = { soundcheck: true }
      const action = createSetGigModifiersAction(modifiers)

      assert.strictEqual(action.type, ActionTypes.SET_GIG_MODIFIERS)
      assert.deepStrictEqual(action.payload, modifiers)
    })

    it('should create correct action with function', () => {
      const updater = prev => ({ ...prev, catering: true })
      const action = createSetGigModifiersAction(updater)

      assert.strictEqual(action.type, ActionTypes.SET_GIG_MODIFIERS)
      assert.strictEqual(typeof action.payload, 'function')
    })
  })

  describe('createLoadGameAction', () => {
    it('should create correct action', () => {
      const data = { player: {}, band: {} }
      const action = createLoadGameAction(data)

      assert.strictEqual(action.type, ActionTypes.LOAD_GAME)
      assert.deepStrictEqual(action.payload, data)
    })
  })

  describe('createResetStateAction', () => {
    it('should create correct action', () => {
      const action = createResetStateAction()

      assert.strictEqual(action.type, ActionTypes.RESET_STATE)
    })
  })

  describe('createApplyEventDeltaAction', () => {
    it('should create correct action', () => {
      const delta = { player: { money: 100 } }
      const action = createApplyEventDeltaAction(delta)

      assert.strictEqual(action.type, ActionTypes.APPLY_EVENT_DELTA)
      assert.deepStrictEqual(action.payload, delta)
    })
  })

  describe('createPopPendingEventAction', () => {
    it('should create correct action', () => {
      const action = createPopPendingEventAction()

      assert.strictEqual(action.type, ActionTypes.POP_PENDING_EVENT)
    })
  })

  describe('createConsumeItemAction', () => {
    it('should create correct action', () => {
      const action = createConsumeItemAction('strings')

      assert.strictEqual(action.type, ActionTypes.CONSUME_ITEM)
      assert.strictEqual(action.payload, 'strings')
    })
  })

  describe('createAdvanceDayAction', () => {
    it('should create correct action', () => {
      const action = createAdvanceDayAction()

      assert.strictEqual(action.type, ActionTypes.ADVANCE_DAY)
    })
  })

  describe('createUnlockTraitAction', () => {
    test('creates correct action', () => {
      const action = createUnlockTraitAction('matze', 'gear_nerd')
      assert.deepStrictEqual(action, {
        type: ActionTypes.UNLOCK_TRAIT,
        payload: { memberId: 'matze', traitId: 'gear_nerd' }
      })
    })
  })
})
