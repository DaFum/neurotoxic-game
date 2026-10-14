/**
 * @fileoverview Quests that consume the social, brand, item and extraction
 * quest events.
 *
 * Each of these event types had a producer but no quest whose progressRules
 * read it. These tests pin that every consuming quest is registered, reachable
 * through a quest-offer event, and progressed by its producer through the real
 * reducer path.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer.ts'
import { ActionTypes } from '../../src/context/actionTypes.ts'
import {
  createAddQuestAction,
  createApplyQuestEventAction,
  createConsumeItemAction,
  createUpdateSocialAction
} from '../../src/context/actionCreators.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import { QUEST_EVENTS } from '../../src/data/events/quests.ts'
import { getQuestDefinition } from '../../src/data/questRegistry.ts'
import { BRAND_DEALS } from '../../src/data/brandDeals.ts'
import {
  QUEST_BEST_BEFORE,
  QUEST_DAMAGE_CONTROL,
  QUEST_EXPEDITION_EXIT_STRATEGY,
  QUEST_SIGN_HERE
} from '../../src/data/questsConstants.ts'
import { createBrandOfferAcceptedQuestEvent } from '../../src/quests/producers/brandQuestEvents.ts'
import { createSocialTrendMatchedQuestEvent } from '../../src/quests/producers/socialQuestEvents.ts'
import {
  firstExtractionRouteStep,
  startedState,
  walkTo
} from '../expeditionLifecycleFixture.js'

const OFFER_EVENT_IDS = {
  [QUEST_DAMAGE_CONTROL]: 'quest_trigger_damage_control',
  [QUEST_SIGN_HERE]: 'quest_trigger_sign_here',
  [QUEST_BEST_BEFORE]: 'quest_trigger_best_before',
  [QUEST_EXPEDITION_EXIT_STRATEGY]: 'quest_trigger_expedition_exit_strategy'
}

const CONSUMED_EVENTS = {
  [QUEST_DAMAGE_CONTROL]: [
    'social.controversyChanged',
    'social.loyaltyChanged',
    'social.trendMatched'
  ],
  [QUEST_SIGN_HERE]: ['brand.offerAccepted'],
  [QUEST_BEST_BEFORE]: ['item.used'],
  [QUEST_EXPEDITION_EXIT_STRATEGY]: ['expedition.extracted']
}

const offerEvent = questId =>
  QUEST_EVENTS.find(event => event.id === OFFER_EVENT_IDS[questId])

const activeQuest = (state, questId) =>
  state.activeQuests.find(quest => quest.id === questId) ?? null

const withQuest = (state, questId) => {
  const next = gameReducer(state, createAddQuestAction({ id: questId }))
  assert.equal(activeQuest(next, questId)?.progress, 0, `${questId} not added`)
  return next
}

const withSocial = (state, social) => ({
  ...state,
  social: { ...state.social, ...social }
})

describe('quests consuming the social, brand, item and extraction events', () => {
  it('registers each quest with a rule for every event it consumes', () => {
    for (const [questId, events] of Object.entries(CONSUMED_EVENTS)) {
      const definition = getQuestDefinition(questId)
      assert.ok(definition, `${questId} is not registered`)
      const ruleEvents = definition.progressRules.map(rule => rule.event)
      assert.deepEqual(ruleEvents, events, `${questId} rules`)
    }
  })

  it('offers each quest through a quest-offer event that adds it', () => {
    for (const questId of Object.keys(OFFER_EVENT_IDS)) {
      const event = offerEvent(questId)
      assert.ok(event, `${questId} has no offer event`)
      assert.deepEqual(event.options[0].effect, {
        type: 'quest',
        quest: questId
      })
    }
  })

  it('offers damage control only while controversy is hot', () => {
    const event = offerEvent(QUEST_DAMAGE_CONTROL)
    const base = createInitialState()
    assert.equal(
      event.condition(withSocial(base, { controversyLevel: 60 })),
      true
    )
    assert.equal(
      event.condition(withSocial(base, { controversyLevel: 10 })),
      false
    )
  })

  it('offers the exit strategy only on a live run', () => {
    const event = offerEvent(QUEST_EXPEDITION_EXIT_STRATEGY)
    assert.equal(event.condition(startedState()), true)
    assert.equal(event.condition(createInitialState()), false)
  })

  it('offers sign-here and best-before without a state precondition', () => {
    const base = createInitialState()
    assert.equal(offerEvent(QUEST_SIGN_HERE).condition(base), true)
    assert.equal(offerEvent(QUEST_BEST_BEFORE).condition(base), true)
  })

  it('counts calming social updates toward damage control', () => {
    let state = withQuest(
      withSocial(createInitialState(), { controversyLevel: 60, loyalty: 20 }),
      QUEST_DAMAGE_CONTROL
    )

    // Rising controversy is the wrong direction and must not count.
    state = gameReducer(
      state,
      createUpdateSocialAction({ controversyLevel: 70 })
    )
    assert.equal(activeQuest(state, QUEST_DAMAGE_CONTROL).progress, 0)

    // One post-style update that lowers controversy and raises loyalty.
    state = gameReducer(
      state,
      createUpdateSocialAction({ controversyLevel: 50, loyalty: 30 })
    )
    assert.equal(activeQuest(state, QUEST_DAMAGE_CONTROL).progress, 2)

    state = gameReducer(
      state,
      createApplyQuestEventAction(
        createSocialTrendMatchedQuestEvent({ trendId: 'DRAMA' })
      )
    )
    assert.equal(activeQuest(state, QUEST_DAMAGE_CONTROL).progress, 3)
  })

  it('completes sign-here when a brand offer is accepted', () => {
    const state = gameReducer(
      withQuest(createInitialState(), QUEST_SIGN_HERE),
      createApplyQuestEventAction(
        createBrandOfferAcceptedQuestEvent(BRAND_DEALS[0])
      )
    )
    assert.equal(activeQuest(state, QUEST_SIGN_HERE), null)
    assert.ok(state.completedQuestIds.includes(QUEST_SIGN_HERE))
  })

  it('counts a consumed inventory item toward best-before', () => {
    const base = createInitialState()
    let state = withQuest(
      {
        ...base,
        band: {
          ...base.band,
          inventory: { ...base.band.inventory, energy_drink: true }
        }
      },
      QUEST_BEST_BEFORE
    )
    state = gameReducer(state, createConsumeItemAction('energy_drink'))
    assert.equal(activeQuest(state, QUEST_BEST_BEFORE).progress, 1)

    // Nothing left to consume: no progress.
    state = gameReducer(state, createConsumeItemAction('energy_drink'))
    assert.equal(activeQuest(state, QUEST_BEST_BEFORE).progress, 1)
  })

  it('completes the exit strategy on a voluntary extraction', () => {
    const step = firstExtractionRouteStep()
    const atWindow = walkTo(
      withQuest(startedState(), QUEST_EXPEDITION_EXIT_STRATEGY),
      step
    )
    assert.equal(
      activeQuest(atWindow, QUEST_EXPEDITION_EXIT_STRATEGY).progress,
      0
    )

    const extracted = gameReducer(atWindow, {
      type: ActionTypes.EXTRACT_EXPEDITION,
      payload: { expectedRouteStep: step, explicitRareRewardIds: [] }
    })
    assert.equal(extracted.expedition.status, 'extracted')
    assert.equal(activeQuest(extracted, QUEST_EXPEDITION_EXIT_STRATEGY), null)
    assert.ok(
      extracted.completedQuestIds.includes(QUEST_EXPEDITION_EXIT_STRATEGY)
    )
  })
})
