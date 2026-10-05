/**
 * @fileoverview Expedition quests reach the player through the real offer path.
 *
 * The three Expedition quest families used to be registered but never offered,
 * which left Ascension unearnable: nothing put `quest_expedition_meta_unlock`
 * into `activeQuests` except a test fixture. These tests start from an event
 * roll on a live run - selection, option processing, choice resolution and the
 * reducer - and never inject a quest into `activeQuests`.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { gameReducer } from '../../src/context/gameReducer.ts'
import {
  createApplyQuestEventAction,
  createSetActiveEventAction
} from '../../src/context/actionCreators.ts'
import { eventEngine } from '../../src/utils/eventEngine/index.ts'
import { resolveEvent } from '../../src/domain/eventResolver.ts'
import { mulberry32 } from '../../src/utils/seededRng.ts'
import { QUEST_EVENTS } from '../../src/data/events/quests.ts'
import {
  QUEST_EXPEDITION_META_UNLOCK,
  QUEST_EXPEDITION_NEMESIS,
  QUEST_EXPEDITION_RUN_GOAL
} from '../../src/data/questsConstants.ts'
import { isExpeditionAscensionEligible } from '../../src/domain/expedition/meta.ts'
import { createExpeditionFinaleQuestEvent } from '../../src/quests/producers/expeditionQuestEvents.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import { startedState, walkTo } from '../expeditionLifecycleFixture.js'

const OFFER_EVENT_IDS = {
  [QUEST_EXPEDITION_RUN_GOAL]: 'quest_trigger_expedition_run_goal',
  [QUEST_EXPEDITION_NEMESIS]: 'quest_trigger_expedition_nemesis',
  [QUEST_EXPEDITION_META_UNLOCK]: 'quest_trigger_expedition_meta_unlock'
}

/**
 * Rolls the real event pool with seeded RNGs until the wanted event is
 * selected, then resolves its accept option through the production resolver.
 */
const acceptOfferThroughEventPipeline = (
  state,
  category,
  triggerPoint,
  eventId
) => {
  let selected = null
  for (let seed = 1; seed <= 5000 && !selected; seed += 1) {
    const event = eventEngine.checkEvent(
      category,
      state,
      triggerPoint,
      mulberry32(seed)
    )
    if (event?.id === eventId) selected = event
  }
  assert.ok(selected, `${eventId} was never selected from the ${category} pool`)

  const processed = eventEngine.processOptions(selected, state)
  assert.ok(processed)
  let next = gameReducer(state, createSetActiveEventAction(processed))
  const accept = processed.options[0]
  const resolution = resolveEvent(accept, next)
  for (const action of resolution.actions) next = gameReducer(next, action)
  return next
}

const activeQuest = (state, questId) =>
  state.activeQuests.find(quest => quest.id === questId) ?? null

describe('Expedition quest offers', () => {
  it('registers one offer event per Expedition quest family', () => {
    for (const eventId of Object.values(OFFER_EVENT_IDS)) {
      assert.ok(
        QUEST_EVENTS.some(event => event.id === eventId),
        `${eventId} missing`
      )
    }
  })

  it('offers only while an Expedition run is active', () => {
    const live = startedState()
    const idle = createInitialState()
    for (const eventId of Object.values(OFFER_EVENT_IDS)) {
      const event = QUEST_EVENTS.find(entry => entry.id === eventId)
      assert.equal(event.condition(live), true, `${eventId} on a live run`)
      assert.equal(event.condition(idle), false, `${eventId} without a run`)
    }
  })

  it('reaches the run goal from a travel roll and progresses it on the route', () => {
    const offered = acceptOfferThroughEventPipeline(
      startedState(),
      'transport',
      'travel',
      OFFER_EVENT_IDS[QUEST_EXPEDITION_RUN_GOAL]
    )
    const quest = activeQuest(offered, QUEST_EXPEDITION_RUN_GOAL)
    assert.ok(quest, 'accepting the offer did not add the quest')
    assert.equal(quest.progress, 0)

    // Every committed route advance emits `expedition.nodeResolved`.
    const deeper = walkTo(offered, 2)
    assert.equal(activeQuest(deeper, QUEST_EXPEDITION_RUN_GOAL)?.progress, 2)
  })

  it('reaches the feud quest from a travel band roll', () => {
    const offered = acceptOfferThroughEventPipeline(
      startedState(),
      'band',
      'travel',
      OFFER_EVENT_IDS[QUEST_EXPEDITION_NEMESIS]
    )
    assert.ok(activeQuest(offered, QUEST_EXPEDITION_NEMESIS))
  })
})

describe('the meta-unlock quest opens Ascension once completed', () => {
  it('turns isExpeditionAscensionEligible true when its two Finales land', () => {
    // A Career that already meets the rank and unlock-set prerequisites, so
    // the only missing piece is the quest under test.
    const run = startedState()
    const career = {
      ...run.career,
      completedExpeditionRuns: 5,
      finalizedExpeditionRuns: 5,
      completedExpeditionRegionIds: ['home_turf', 'industrial_belt'],
      unlockedSetIds: [
        'mechanic_network',
        'industry_network',
        'festival_network'
      ]
    }
    const ready = { ...run, career }
    assert.equal(isExpeditionAscensionEligible(ready), false)

    let state = acceptOfferThroughEventPipeline(
      ready,
      'special',
      null,
      OFFER_EVENT_IDS[QUEST_EXPEDITION_META_UNLOCK]
    )
    assert.ok(activeQuest(state, QUEST_EXPEDITION_META_UNLOCK))
    assert.equal(isExpeditionAscensionEligible(state), false)

    for (let finale = 0; finale < 2; finale += 1) {
      state = gameReducer(
        state,
        createApplyQuestEventAction(
          createExpeditionFinaleQuestEvent('regional_headliner', true)
        )
      )
    }

    assert.ok(state.completedQuestIds.includes(QUEST_EXPEDITION_META_UNLOCK))
    assert.equal(activeQuest(state, QUEST_EXPEDITION_META_UNLOCK), null)
    assert.equal(isExpeditionAscensionEligible(state), true)
  })
})
