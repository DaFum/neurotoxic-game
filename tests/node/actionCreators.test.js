/**
 * @fileoverview Tests for the action creators module
 */

import { describe, it } from 'node:test'
import assert from 'node:assert'
import { GAME_PHASES } from '../../src/context/gameConstants'
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
  createAddCooldownAction,
  createStartTravelMinigameAction,
  createCompleteTravelMinigameAction,
  createStartRoadieMinigameAction,
  createCompleteRoadieMinigameAction,
  createStartKabelsalatMinigameAction,
  createCompleteKabelsalatMinigameAction,
  createUnlockTraitAction,
  createAddVenueBlacklistAction,
  createAddQuestAction,
  createAdvanceQuestAction,
  createCompleteQuestAction,
  createFailQuestsAction,
  createAddUnlockAction,
  createAddContrabandAction,
  createUseContrabandAction,
  createClinicHealAction,
  createClinicEnhanceAction,
  createPirateBroadcastAction
} from '../../src/context/actionCreators'
import { ActionTypes } from '../../src/context/gameReducer'

describe('Action Creators', () => {
  describe('createChangeSceneAction', () => {
    it('should create correct action', () => {
      const action = createChangeSceneAction(GAME_PHASES.OVERWORLD)

      assert.strictEqual(action.type, ActionTypes.CHANGE_SCENE)
      assert.strictEqual(action.payload, GAME_PHASES.OVERWORLD)
    })
  })

  describe('createUpdatePlayerAction', () => {
    it('should create correct action', () => {
      const updates = { money: 1000, fame: 50 }
      const action = createUpdatePlayerAction(updates)

      assert.strictEqual(action.type, ActionTypes.UPDATE_PLAYER)
      assert.deepStrictEqual(action.payload, { ...updates, fameLevel: 0 })
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

    it('should generate fresh id for structured payloads even when id is provided', () => {
      const action = createAddToastAction({
        id: 'stale-id',
        messageKey: 'ui:toast.test',
        options: { value: 1 }
      })

      assert.strictEqual(action.type, ActionTypes.ADD_TOAST)
      assert.strictEqual(action.payload.messageKey, 'ui:toast.test')
      assert.strictEqual(action.payload.options.value, 1)
      assert.notStrictEqual(action.payload.id, 'stale-id')
      assert.strictEqual(typeof action.payload.id, 'string')
      assert.ok(action.payload.id.length > 0)
    })

    it('should allow structured payload type to override default type argument', () => {
      const action = createAddToastAction(
        {
          messageKey: 'ui:toast.test',
          type: 'success'
        },
        'error'
      )

      assert.strictEqual(action.payload.type, 'success')
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
    it('creates correct action', () => {
      const action = createUnlockTraitAction('matze', 'gear_nerd')
      assert.deepStrictEqual(action, {
        type: ActionTypes.UNLOCK_TRAIT,
        payload: { memberId: 'matze', traitId: 'gear_nerd' }
      })
    })
  })

  describe('createAddCooldownAction', () => {
    it('creates correct action', () => {
      const action = createAddCooldownAction('test_event')
      assert.deepStrictEqual(action, {
        type: ActionTypes.ADD_COOLDOWN,
        payload: 'test_event'
      })
    })
  })

  describe('createStartTravelMinigameAction', () => {
    it('creates correct action', () => {
      const action = createStartTravelMinigameAction('node_1')
      assert.deepStrictEqual(action, {
        type: ActionTypes.START_TRAVEL_MINIGAME,
        payload: { targetNodeId: 'node_1' }
      })
    })
  })

  describe('createCompleteTravelMinigameAction', () => {
    it('creates correct action with all params', () => {
      const action = createCompleteTravelMinigameAction(
        10,
        ['item1'],
        0.5,
        'contra1',
        'inst1'
      )
      assert.deepStrictEqual(action, {
        type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
        payload: {
          damageTaken: 10,
          itemsCollected: ['item1'],
          rngValue: 0.5,
          contrabandId: 'contra1',
          instanceId: 'inst1'
        }
      })
    })
  })

  describe('createStartRoadieMinigameAction', () => {
    it('creates correct action', () => {
      const action = createStartRoadieMinigameAction('gig_1')
      assert.deepStrictEqual(action, {
        type: ActionTypes.START_ROADIE_MINIGAME,
        payload: { gigId: 'gig_1' }
      })
    })
  })

  describe('createCompleteRoadieMinigameAction', () => {
    it('creates correct action', () => {
      const action = createCompleteRoadieMinigameAction(5)
      assert.deepStrictEqual(action, {
        type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
        payload: { equipmentDamage: 5 }
      })
    })
  })

  describe('createStartKabelsalatMinigameAction', () => {
    it('creates correct action', () => {
      const action = createStartKabelsalatMinigameAction('gig_1')
      assert.deepStrictEqual(action, {
        type: ActionTypes.START_KABELSALAT_MINIGAME,
        payload: { gigId: 'gig_1' }
      })
    })
  })

  describe('createCompleteKabelsalatMinigameAction', () => {
    it('creates correct action', () => {
      const results = { score: 100 }
      const action = createCompleteKabelsalatMinigameAction(results)
      assert.deepStrictEqual(action, {
        type: ActionTypes.COMPLETE_KABELSALAT_MINIGAME,
        payload: { results }
      })
    })
  })

  describe('createAddVenueBlacklistAction', () => {
    it('creates correct action', () => {
      const action = createAddVenueBlacklistAction('venue_1')
      assert.strictEqual(action.type, ActionTypes.ADD_VENUE_BLACKLIST)
      assert.strictEqual(action.payload.venueId, 'venue_1')
      assert.ok(typeof action.payload.toastId === 'string')
    })
  })

  describe('createAddQuestAction', () => {
    it('creates correct action', () => {
      const quest = { id: 'quest_1' }
      const action = createAddQuestAction(quest)
      assert.deepStrictEqual(action, {
        type: ActionTypes.ADD_QUEST,
        payload: quest
      })
    })
  })

  describe('createAdvanceQuestAction', () => {
    it('creates correct action with defaults', () => {
      const action = createAdvanceQuestAction('quest_1')
      assert.deepStrictEqual(action, {
        type: ActionTypes.ADVANCE_QUEST,
        payload: { questId: 'quest_1', amount: 1, randomIdx: undefined }
      })
    })

    it('creates correct action with params', () => {
      const action = createAdvanceQuestAction('quest_1', 2, 5)
      assert.deepStrictEqual(action, {
        type: ActionTypes.ADVANCE_QUEST,
        payload: { questId: 'quest_1', amount: 2, randomIdx: 5 }
      })
    })
  })

  describe('createCompleteQuestAction', () => {
    it('creates correct action', () => {
      const action = createCompleteQuestAction('quest_1', 2)
      assert.deepStrictEqual(action, {
        type: ActionTypes.COMPLETE_QUEST,
        payload: { questId: 'quest_1', randomIdx: 2 }
      })
    })
  })

  describe('createFailQuestsAction', () => {
    it('creates correct action', () => {
      const action = createFailQuestsAction()
      assert.deepStrictEqual(action, {
        type: ActionTypes.FAIL_QUESTS
      })
    })
  })

  describe('createAddUnlockAction', () => {
    it('creates correct action', () => {
      const action = createAddUnlockAction('test_unlock')
      assert.deepStrictEqual(action, {
        type: ActionTypes.ADD_UNLOCK,
        payload: 'test_unlock'
      })
    })
  })

  describe('createAddContrabandAction', () => {
    it('creates correct action', () => {
      const action = createAddContrabandAction('smoke')
      assert.strictEqual(action.type, ActionTypes.ADD_CONTRABAND)
      assert.strictEqual(action.payload.contrabandId, 'smoke')
      assert.ok(action.payload.instanceId.length > 0)
    })
  })

  describe('createUseContrabandAction', () => {
    it('creates correct action', () => {
      const action = createUseContrabandAction(
        'inst_1',
        'c_void_energy',
        'matze'
      )
      assert.deepStrictEqual(action, {
        type: ActionTypes.USE_CONTRABAND,
        payload: {
          instanceId: 'inst_1',
          contrabandId: 'c_void_energy',
          memberId: 'matze'
        }
      })
    })
  })

  describe('createClinicHealAction', () => {
    it('creates correct action', () => {
      const payload = {
        memberId: 'matze',
        type: 'heal',
        staminaGain: 50,
        moodGain: 20
      }
      const action = createClinicHealAction(payload)
      assert.deepStrictEqual(action, {
        type: ActionTypes.CLINIC_HEAL,
        payload
      })
    })
  })

  describe('createClinicEnhanceAction', () => {
    it('creates correct action', () => {
      const payload = { memberId: 'matze', type: 'enhance', trait: 'gear_nerd' }
      const action = createClinicEnhanceAction(payload)
      assert.deepStrictEqual(action, {
        type: ActionTypes.CLINIC_ENHANCE,
        payload
      })
    })
  })

  describe('createPirateBroadcastAction', () => {
    it('creates correct action', () => {
      const payload = {
        cost: 100,
        fameGain: 50,
        zealotryGain: 20,
        controversyGain: 10,
        harmonyCost: 5
      }
      const action = createPirateBroadcastAction(payload)
      assert.deepStrictEqual(action, {
        type: ActionTypes.PIRATE_BROADCAST,
        payload: { ...payload, successToast: undefined }
      })
    })

    it('creates correct action with successToast', () => {
      const payload = {
        cost: 100,
        fameGain: 50,
        zealotryGain: 20,
        controversyGain: 10,
        harmonyCost: 5,
        successToast: { message: 'Success', type: 'success' }
      }
      const action = createPirateBroadcastAction(payload)
      assert.strictEqual(action.type, ActionTypes.PIRATE_BROADCAST)
      assert.strictEqual(action.payload.cost, 100)
      assert.strictEqual(action.payload.fameGain, 50)
      assert.strictEqual(action.payload.successToast.message, 'Success')
      assert.strictEqual(action.payload.successToast.type, 'success')
      assert.ok(action.payload.successToast.id.length > 0)
    })
  })
})
