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
  createCompleteAmpCalibrationAction,
  createCompleteRoadieMinigameAction,
  createCompleteTravelMinigameAction,
  createConsumeItemAction,
  createSetLastGigStatsAction,
  createUpdateSocialAction
} from '../../src/context/actionCreators.ts'
import {
  installModule,
  purchaseChassis,
  repairChassis
} from '../../src/context/assetActionCreators.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'
import { POST_OPTIONS } from '../../src/data/postOptions.ts'
import { applySocialPostResult } from '../../src/hooks/postGig/handlers/socialPostHandlerUtils.ts'
import { createInitialState } from '../../src/context/initialState.ts'
import { QUEST_EVENTS } from '../../src/data/events/quests.ts'
import { getQuestDefinition } from '../../src/data/questRegistry.ts'
import { BRAND_DEALS } from '../../src/data/brandDeals.ts'
import {
  QUEST_BEST_BEFORE,
  QUEST_DAMAGE_CONTROL,
  QUEST_EXPEDITION_EXIT_STRATEGY,
  QUEST_GARAGE_DAYS,
  QUEST_HARD_KNOCKS,
  QUEST_PREVENTIVE_MAINTENANCE,
  QUEST_SIGN_HERE,
  QUEST_STAGE_TIME
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

  it('does not count a trend rotation from UPDATE_SOCIAL as a trend match', () => {
    const state = gameReducer(
      withQuest(
        withSocial(createInitialState(), {
          controversyLevel: 60,
          trend: 'TECH'
        }),
        QUEST_DAMAGE_CONTROL
      ),
      createUpdateSocialAction({ trend: 'DRAMA' })
    )
    assert.equal(state.social.trend, 'DRAMA')
    assert.equal(activeQuest(state, QUEST_DAMAGE_CONTROL).progress, 0)
  })

  it('credits corporate quest trust to brandReputation.CORPORATE', () => {
    const state = gameReducer(
      withQuest(createInitialState(), QUEST_SIGN_HERE),
      createApplyQuestEventAction(
        createBrandOfferAcceptedQuestEvent(BRAND_DEALS[0])
      )
    )
    assert.equal(state.social.brandReputation.CORPORATE, 10)
    assert.equal(
      Object.hasOwn(state.social.brandReputation, 'corporate'),
      false
    )
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

const NEW_OFFER_EVENT_IDS = {
  [QUEST_GARAGE_DAYS]: 'quest_trigger_garage_days',
  [QUEST_PREVENTIVE_MAINTENANCE]: 'quest_trigger_preventive_maintenance',
  [QUEST_HARD_KNOCKS]: 'quest_trigger_hard_knocks',
  [QUEST_STAGE_TIME]: 'quest_trigger_stage_time'
}

const NEW_CONSUMED_EVENTS = {
  [QUEST_GARAGE_DAYS]: [
    'asset.acquired',
    'asset.moduleInstalled',
    'asset.repaired'
  ],
  [QUEST_PREVENTIVE_MAINTENANCE]: ['asset.conditionChanged'],
  [QUEST_HARD_KNOCKS]: ['minigame.completed', 'minigame.failed'],
  [QUEST_STAGE_TIME]: ['venue.gigCompleted', 'venue.goodGig']
}

const newOfferEvent = questId =>
  QUEST_EVENTS.find(event => event.id === NEW_OFFER_EVENT_IDS[questId])

const richState = () => {
  const base = createInitialState()
  return {
    ...base,
    player: { ...base.player, money: 50000, fame: 100, day: 1 }
  }
}

const buy = (state, kind) => {
  const action = purchaseChassis(
    { kind, flavor: 'legit', tier: 1, mode: 'cash' },
    state
  )
  assert.equal(action.type, ActionTypes.PURCHASE_CHASSIS, `buy ${kind}`)
  return gameReducer(state, action)
}

const damageFirstAsset = (state, condition) => ({
  ...state,
  assets: state.assets.map((asset, i) =>
    i === 0 ? { ...asset, condition } : asset
  )
})

const repairFirst = state => {
  const action = repairChassis(state.assets[0].id, state)
  assert.equal(action.type, ActionTypes.REPAIR_CHASSIS)
  return gameReducer(state, action)
}

const withAmpMinigame = state => ({
  ...state,
  minigame: { ...state.minigame, active: true, type: 'AMP_CALIBRATION' }
})

const withMinigame = (state, type, extra = {}) => ({
  ...state,
  minigame: { ...state.minigame, active: true, type, ...extra }
})

const withTravelMap = state => ({
  ...state,
  player: { ...state.player, currentNodeId: 'node1' },
  gameMap: {
    nodes: {
      node1: { id: 'node1', venue: { name: 'Node 1 Venue' }, x: 0, y: 0 },
      node2: { id: 'node2', venue: { name: 'Node 2 Venue' }, x: 100, y: 0 }
    }
  }
})

const gigState = () => {
  const base = createInitialState()
  return {
    ...base,
    currentGig: { id: 'venue_test', name: 'Test', capacity: 200 }
  }
}

describe('quests consuming the asset, minigame and venue events', () => {
  it('registers each quest with a rule for every event it consumes', () => {
    for (const [questId, events] of Object.entries(NEW_CONSUMED_EVENTS)) {
      const definition = getQuestDefinition(questId)
      assert.ok(definition, `${questId} is not registered`)
      const ruleEvents = definition.progressRules.map(rule => rule.event)
      assert.deepEqual(ruleEvents, events, `${questId} rules`)
    }
  })

  it('offers each quest through a quest-offer event that adds it', () => {
    for (const questId of Object.keys(NEW_OFFER_EVENT_IDS)) {
      const event = newOfferEvent(questId)
      assert.ok(event, `${questId} has no offer event`)
      assert.deepEqual(event.options[0].effect, {
        type: 'quest',
        quest: questId
      })
      const added = gameReducer(
        createInitialState(),
        createAddQuestAction({ id: event.options[0].effect.quest })
      )
      assert.ok(activeQuest(added, questId), `${questId} accept adds it`)
    }
  })

  it('offers the asset quests only to owners of the asset they service', () => {
    const none = richState()
    assert.equal(newOfferEvent(QUEST_GARAGE_DAYS).condition(none), false)
    assert.equal(
      newOfferEvent(QUEST_PREVENTIVE_MAINTENANCE).condition(none),
      false
    )
    assert.equal(
      newOfferEvent(QUEST_GARAGE_DAYS).condition(buy(none, 'tourbus_chassis')),
      true
    )
    assert.equal(
      newOfferEvent(QUEST_PREVENTIVE_MAINTENANCE).condition(
        buy(none, 'bandhaus_chassis')
      ),
      true
    )
  })

  it('offers hard-knocks and stage-time unless already running', () => {
    for (const questId of [QUEST_HARD_KNOCKS, QUEST_STAGE_TIME]) {
      const event = newOfferEvent(questId)
      const base = createInitialState()
      assert.equal(event.condition(base), true, `${questId} offered`)
      assert.equal(
        event.condition(withQuest(base, questId)),
        false,
        `${questId} offered while active`
      )
    }
  })

  it('counts buying, upgrading and repairing toward garage days', () => {
    let state = buy(
      withQuest(richState(), QUEST_GARAGE_DAYS),
      'tourbus_chassis'
    )
    assert.equal(activeQuest(state, QUEST_GARAGE_DAYS).progress, 1)

    const asset = state.assets[0]
    const install = (moduleId, slotId) =>
      installModule({ assetId: asset.id, slotId, moduleId }, state)
    let action = null
    for (const slot of asset.slots) {
      if (slot.installedModuleId !== null) continue
      for (const moduleId of Object.keys(MODULE_REGISTRY)) {
        if (MODULE_REGISTRY[moduleId].slotType !== slot.slotType) continue
        const candidate = install(moduleId, slot.id)
        if (candidate.type === ActionTypes.INSTALL_MODULE) {
          action = candidate
          break
        }
      }
      if (action) break
    }
    assert.ok(action, 'no installable module on the tier-1 tourbus')
    state = gameReducer(state, action)
    assert.equal(activeQuest(state, QUEST_GARAGE_DAYS).progress, 2)

    state = repairFirst(damageFirstAsset(state, 60))
    assert.equal(activeQuest(state, QUEST_GARAGE_DAYS), null)
    assert.ok(state.completedQuestIds.includes(QUEST_GARAGE_DAYS))
  })

  it('counts restored condition points toward preventive maintenance', () => {
    let state = withQuest(
      buy(richState(), 'bandhaus_chassis'),
      QUEST_PREVENTIVE_MAINTENANCE
    )
    state = repairFirst(damageFirstAsset(state, 75))
    assert.equal(activeQuest(state, QUEST_PREVENTIVE_MAINTENANCE).progress, 25)

    state = repairFirst(damageFirstAsset(state, 80))
    assert.equal(activeQuest(state, QUEST_PREVENTIVE_MAINTENANCE), null)
    assert.ok(state.completedQuestIds.includes(QUEST_PREVENTIVE_MAINTENANCE))
  })

  it('counts each minigame attempt once, failed or not, toward hard knocks', () => {
    let state = withQuest(createInitialState(), QUEST_HARD_KNOCKS)

    state = gameReducer(
      withAmpMinigame(state),
      createCompleteAmpCalibrationAction(80)
    )
    assert.equal(activeQuest(state, QUEST_HARD_KNOCKS).progress, 1)

    state = gameReducer(
      withAmpMinigame(state),
      createCompleteAmpCalibrationAction(0)
    )
    assert.equal(activeQuest(state, QUEST_HARD_KNOCKS).progress, 2)
  })

  it('does not count ordinary travel toward hard knocks, but a roadie job', () => {
    let state = withTravelMap(
      withQuest(createInitialState(), QUEST_HARD_KNOCKS)
    )

    for (const damage of [0, 60]) {
      state = gameReducer(
        withMinigame(state, 'TOURBUS', { targetDestination: 'node2' }),
        createCompleteTravelMinigameAction(damage, [], 0.5)
      )
      assert.equal(activeQuest(state, QUEST_HARD_KNOCKS).progress, 0)
    }

    state = gameReducer(
      withMinigame(state, 'ROADIE'),
      createCompleteRoadieMinigameAction(0)
    )
    assert.equal(activeQuest(state, QUEST_HARD_KNOCKS).progress, 1)
  })

  it('counts every venue gig once and a good gig twice toward stage time', () => {
    let state = withQuest(gigState(), QUEST_STAGE_TIME)

    state = gameReducer(
      state,
      createSetLastGigStatsAction({ score: 20000, accuracy: 45 })
    )
    assert.equal(activeQuest(state, QUEST_STAGE_TIME).progress, 1)

    state = gameReducer(
      state,
      createSetLastGigStatsAction({ score: 90000, accuracy: 85 })
    )
    assert.equal(activeQuest(state, QUEST_STAGE_TIME).progress, 3)
  })
})

describe('social.trendMatched from the post-gig social post', () => {
  const runPost = (state, option) => {
    let next = state
    const noop = () => {}
    applySocialPostResult({
      option,
      updates: {
        finalResult: {},
        newBand: state.band,
        hasBandUpdates: false,
        appliedHarmonyDelta: 0,
        nextMoney: state.player.money,
        appliedMoneyDelta: 0,
        updatedSocial: {}
      },
      player: state.player,
      band: state.band,
      social: state.social,
      t: (_key, opts) => opts?.defaultValue ?? '',
      dispatchers: {
        updateBand: noop,
        updatePlayer: noop,
        updateSocial: noop,
        unlockTrait: noop,
        applyQuestEvent: event => {
          next = gameReducer(next, createApplyQuestEventAction(event))
        },
        addToast: noop,
        setPostResult: noop,
        requestBrandOffers: noop
      }
    })
    return next
  }

  const dramaPost = POST_OPTIONS.find(opt => opt.category === 'Drama')

  it('advances damage control when the resolved post rides the trend', () => {
    assert.ok(dramaPost, 'no Drama post option')
    const state = withQuest(
      withSocial(createInitialState(), {
        controversyLevel: 60,
        trend: 'DRAMA'
      }),
      QUEST_DAMAGE_CONTROL
    )
    const next = runPost(state, dramaPost)
    assert.equal(activeQuest(next, QUEST_DAMAGE_CONTROL).progress, 1)
  })

  it('does not count a post that misses the trend', () => {
    const state = withQuest(
      withSocial(createInitialState(), {
        controversyLevel: 60,
        trend: 'TECH'
      }),
      QUEST_DAMAGE_CONTROL
    )
    const next = runPost(state, dramaPost)
    assert.equal(activeQuest(next, QUEST_DAMAGE_CONTROL).progress, 0)
  })
})
