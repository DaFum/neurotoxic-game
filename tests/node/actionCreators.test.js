/**
 * @fileoverview Tests for the action creators module
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
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
  createAddUnlockAction,
  createUseContrabandAction,
  createClinicHealAction,
  createClinicEnhanceAction,
  createPirateBroadcastAction,
  createBloodBankDonateAction,
  createDarkWebLeakAction,
  createMerchPressAction
} from '../../src/context/actionCreators'
import { ActionTypes } from '../../src/context/gameReducer'

describe('Action Creators', () => {
  // Hoisted fixtures reused across table entries
  const _healPayload = {
    memberId: 'matze',
    type: 'heal',
    staminaGain: 50,
    moodGain: 20
  }
  const _enhancePayload = {
    memberId: 'matze',
    type: 'enhance',
    trait: 'gear_nerd'
  }
  const _quest = { id: 'quest_1' }
  const _kabelResults = { score: 100 }

  // --- Simple full-action deepEqual cases (single test per creator) ---
  const simpleCases = [
    {
      name: 'createChangeSceneAction',
      call: () => createChangeSceneAction(GAME_PHASES.OVERWORLD),
      expected: {
        type: ActionTypes.CHANGE_SCENE,
        payload: GAME_PHASES.OVERWORLD
      }
    },
    {
      name: 'createUpdateBandAction',
      call: () => createUpdateBandAction({ harmony: 80 }),
      expected: { type: ActionTypes.UPDATE_BAND, payload: { harmony: 80 } }
    },
    {
      name: 'createUpdateSocialAction',
      call: () => createUpdateSocialAction({ instagram: 1000 }),
      expected: {
        type: ActionTypes.UPDATE_SOCIAL,
        payload: { instagram: 1000 }
      }
    },
    {
      name: 'createUpdateSettingsAction',
      call: () => createUpdateSettingsAction({ crtEnabled: false }),
      expected: {
        type: ActionTypes.UPDATE_SETTINGS,
        payload: { crtEnabled: false }
      }
    },
    {
      name: 'createSetMapAction',
      call: () => createSetMapAction({ nodes: {}, connections: [] }),
      expected: {
        type: ActionTypes.SET_MAP,
        payload: { nodes: {}, connections: [] }
      }
    },
    {
      name: 'createSetGigAction',
      call: () => createSetGigAction({ name: 'Test Venue', capacity: 100 }),
      expected: {
        type: ActionTypes.SET_GIG,
        payload: { name: 'Test Venue', capacity: 100 }
      }
    },
    {
      name: 'createStartGigAction',
      call: () => createStartGigAction({ name: 'Test Venue' }),
      expected: { type: ActionTypes.START_GIG, payload: { name: 'Test Venue' } }
    },
    {
      name: 'createSetSetlistAction',
      call: () => createSetSetlistAction([{ id: 'song1', name: 'Song 1' }]),
      expected: {
        type: ActionTypes.SET_SETLIST,
        payload: [{ id: 'song1', name: 'Song 1' }]
      }
    },
    {
      name: 'createSetLastGigStatsAction',
      call: () => {
        const action = createSetLastGigStatsAction({ score: 1000, combo: 50 })
        // toastId is dynamically minted and must be present; assert before
        // stripping so a regression that drops it can't silently slip through.
        assert.ok(action.payload, 'expected action.payload to be defined')
        assert.ok(
          typeof action.payload.toastId === 'string' &&
            action.payload.toastId.length > 0,
          'expected action.payload.toastId to be a non-empty string'
        )
        delete action.payload.toastId
        return action
      },
      expected: {
        type: ActionTypes.SET_LAST_GIG_STATS,
        payload: { score: 1000, combo: 50 }
      }
    },
    {
      name: 'createRemoveToastAction',
      call: () => createRemoveToastAction(12345),
      expected: { type: ActionTypes.REMOVE_TOAST, payload: 12345 }
    },
    {
      name: 'createLoadGameAction',
      call: () => createLoadGameAction({ player: {}, band: {} }),
      expected: {
        type: ActionTypes.LOAD_GAME,
        payload: { player: {}, band: {} }
      }
    },
    {
      name: 'createApplyEventDeltaAction',
      call: () => createApplyEventDeltaAction({ player: { money: 100 } }),
      expected: {
        type: ActionTypes.APPLY_EVENT_DELTA,
        payload: { player: { money: 100 } }
      }
    },
    {
      name: 'createConsumeItemAction',
      call: () => createConsumeItemAction('strings'),
      expected: { type: ActionTypes.CONSUME_ITEM, payload: 'strings' }
    },
    {
      name: 'createAddCooldownAction',
      call: () => createAddCooldownAction('test_event'),
      expected: { type: ActionTypes.ADD_COOLDOWN, payload: 'test_event' }
    },
    {
      name: 'createUnlockTraitAction',
      call: () => createUnlockTraitAction('matze', 'gear_nerd'),
      expected: {
        type: ActionTypes.UNLOCK_TRAIT,
        payload: { memberId: 'matze', traitId: 'gear_nerd' }
      }
    },
    {
      name: 'createStartTravelMinigameAction',
      call: () => createStartTravelMinigameAction('node_1'),
      expected: {
        type: ActionTypes.START_TRAVEL_MINIGAME,
        payload: { targetNodeId: 'node_1' }
      }
    },
    {
      name: 'createStartRoadieMinigameAction',
      call: () => createStartRoadieMinigameAction('gig_1'),
      expected: {
        type: ActionTypes.START_ROADIE_MINIGAME,
        payload: { gigId: 'gig_1' }
      }
    },
    {
      name: 'createCompleteRoadieMinigameAction',
      call: () => createCompleteRoadieMinigameAction(5),
      expected: {
        type: ActionTypes.COMPLETE_ROADIE_MINIGAME,
        payload: { equipmentDamage: 5, contrabandDelivered: 0 }
      }
    },
    {
      name: 'createStartKabelsalatMinigameAction',
      call: () => createStartKabelsalatMinigameAction('gig_1'),
      expected: {
        type: ActionTypes.START_KABELSALAT_MINIGAME,
        payload: { gigId: 'gig_1' }
      }
    },
    {
      name: 'createCompleteKabelsalatMinigameAction',
      call: () => createCompleteKabelsalatMinigameAction(_kabelResults),
      expected: {
        type: ActionTypes.COMPLETE_KABELSALAT_MINIGAME,
        payload: { results: _kabelResults }
      }
    },
    {
      name: 'createAddQuestAction',
      call: () => createAddQuestAction(_quest),
      expected: { type: ActionTypes.ADD_QUEST, payload: _quest }
    },
    {
      name: 'createAddUnlockAction',
      call: () => createAddUnlockAction('test_unlock'),
      expected: { type: ActionTypes.ADD_UNLOCK, payload: 'test_unlock' }
    },
    {
      name: 'createClinicHealAction',
      call: () => createClinicHealAction(_healPayload),
      expected: { type: ActionTypes.CLINIC_HEAL, payload: _healPayload }
    },
    {
      name: 'createClinicEnhanceAction',
      call: () => createClinicEnhanceAction(_enhancePayload),
      expected: { type: ActionTypes.CLINIC_ENHANCE, payload: _enhancePayload }
    },
    {
      name: 'createUseContrabandAction',
      call: () => createUseContrabandAction('inst_1', 'c_void_energy', 'matze'),
      expected: {
        type: ActionTypes.USE_CONTRABAND,
        payload: {
          instanceId: 'inst_1',
          contrabandId: 'c_void_energy',
          memberId: 'matze'
        }
      }
    }
  ]

  simpleCases.forEach(({ name, call, expected }) => {
    describe(name, () => {
      it('creates correct action', () => {
        assert.deepStrictEqual(call(), expected)
      })
    })
  })

  // --- No-arg creators: only verify action.type ---
  const noArgCases = [
    {
      name: 'createResetStateAction',
      fn: createResetStateAction,
      type: ActionTypes.RESET_STATE
    },
    {
      name: 'createPopPendingEventAction',
      fn: createPopPendingEventAction,
      type: ActionTypes.POP_PENDING_EVENT
    },
    {
      name: 'createAdvanceDayAction',
      fn: createAdvanceDayAction,
      type: ActionTypes.ADVANCE_DAY
    }
  ]

  noArgCases.forEach(({ name, fn, type }) => {
    describe(name, () => {
      it('creates correct action', () => {
        assert.strictEqual(fn().type, type)
      })
    })
  })

  // --- Creators with multiple tests or non-trivial payload logic ---

  describe('createUpdatePlayerAction', () => {
    it('should create correct action', () => {
      const updates = { money: 1000, fame: 50 }
      const action = createUpdatePlayerAction(updates)
      assert.strictEqual(action.type, ActionTypes.UPDATE_PLAYER)
      assert.deepStrictEqual(action.payload, { ...updates, fameLevel: 0 })
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
        { messageKey: 'ui:toast.test', type: 'success' },
        'error'
      )
      assert.strictEqual(action.payload.type, 'success')
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

  describe('createCompleteTravelMinigameAction', () => {
    it('creates correct action with all params', () => {
      assert.deepStrictEqual(
        createCompleteTravelMinigameAction(10, ['item1'], 0.5),
        {
          type: ActionTypes.COMPLETE_TRAVEL_MINIGAME,
          payload: { damageTaken: 10, itemsCollected: ['item1'], rngValue: 0.5 }
        }
      )
    })

    it('sanitizes numeric payload boundaries', () => {
      assert.deepStrictEqual(
        createCompleteTravelMinigameAction(
          Number.POSITIVE_INFINITY,
          'bad-items',
          1
        ).payload,
        { damageTaken: 0, itemsCollected: [], rngValue: 0.9999999999999999 }
      )
      assert.deepStrictEqual(
        createCompleteTravelMinigameAction(Number.NaN, [], Number.NaN).payload,
        { damageTaken: 0, itemsCollected: [], rngValue: undefined }
      )
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

  describe('createAdvanceQuestAction', () => {
    it('creates correct action with defaults', () => {
      assert.deepStrictEqual(createAdvanceQuestAction('quest_1'), {
        type: ActionTypes.ADVANCE_QUEST,
        payload: { questId: 'quest_1', amount: 1, randomIdx: undefined }
      })
    })

    it('creates correct action with params', () => {
      assert.deepStrictEqual(createAdvanceQuestAction('quest_1', 2, 5), {
        type: ActionTypes.ADVANCE_QUEST,
        payload: { questId: 'quest_1', amount: 2, randomIdx: 5 }
      })
    })

    it('clamps negative amount to zero', () => {
      assert.strictEqual(
        createAdvanceQuestAction('quest_1', -5).payload.amount,
        0
      )
    })

    it('coerces NaN amount to zero', () => {
      assert.strictEqual(
        createAdvanceQuestAction('quest_1', Number.NaN).payload.amount,
        0
      )
    })

    it('coerces Infinity amount to zero', () => {
      assert.strictEqual(
        createAdvanceQuestAction('quest_1', Number.POSITIVE_INFINITY).payload
          .amount,
        0
      )
      assert.strictEqual(
        createAdvanceQuestAction('quest_1', Number.NEGATIVE_INFINITY).payload
          .amount,
        0
      )
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
      assert.deepStrictEqual(createPirateBroadcastAction(payload), {
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

    it('coerces non-finite numeric fields to zero across service actions', () => {
      const pirate = createPirateBroadcastAction({
        cost: Number.POSITIVE_INFINITY,
        fameGain: Number.NaN,
        zealotryGain: 20,
        controversyGain: 10,
        harmonyCost: 5
      })
      assert.strictEqual(pirate.payload.cost, 0)
      assert.strictEqual(pirate.payload.fameGain, 0)

      const blood = createBloodBankDonateAction({
        moneyGain: Number.NaN,
        harmonyCost: Number.NEGATIVE_INFINITY,
        staminaCost: 10,
        controversyGain: 5
      })
      assert.strictEqual(blood.payload.moneyGain, 0)
      assert.strictEqual(blood.payload.harmonyCost, 0)

      const leak = createDarkWebLeakAction({
        cost: 100,
        fameGain: Number.POSITIVE_INFINITY,
        zealotryGain: 1,
        controversyGain: 1,
        harmonyCost: 1
      })
      assert.strictEqual(leak.payload.fameGain, 0)

      const merch = createMerchPressAction({
        cost: 100,
        loyaltyGain: Number.NaN,
        controversyGain: 1,
        fameGain: 1,
        harmonyCost: 1
      })
      assert.strictEqual(merch.payload.loyaltyGain, 0)
    })
  })
})
