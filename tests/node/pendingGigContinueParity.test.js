import test from 'node:test'
import assert from 'node:assert/strict'
import { handleLoadGame } from '../../src/context/reducers/systemReducer'
import { gameReducer } from '../../src/context/gameReducer'
import { createInitialState } from '../../src/context/initialState'
import {
  GAME_PHASES,
  NEUROTOXIC_PEDAL_HARMONY_PENALTY
} from '../../src/context/gameConstants'
import {
  createAddQuestAction,
  createApplyQuestEventAction,
  createClearPendingGigSettlementAction,
  createRecordPendingGigSettlementAction,
  createSettleSoldMerchAction,
  createUpdateBandAction,
  createUpdatePlayerAction
} from '../../src/context/actionCreators'
import {
  completeExpedition,
  offerExpeditionDraft,
  recordExpeditionCrewStressSource,
  recordExpeditionObligationSignal
} from '../../src/context/expeditionActionCreators'
import { calculateContinueStats } from '../../src/utils/postGig/performanceLogic'
import {
  BALANCE_CONSTANTS,
  calculateFameGain,
  calculateFameLevel,
  clampBandHarmony,
  clampMemberStamina,
  clampPlayerFame,
  clampPlayerMoney,
  finiteNumberOr,
  readMemberStamina
} from '../../src/utils/gameState'
import { shouldTriggerBankruptcy } from '../../src/utils/economy'
import { getTotalDailyObligations } from '../../src/utils/assetSelectors'
import { getRegionKeyForLocation } from '../../src/utils/mapUtils'
import {
  createFameGainedQuestEvent,
  createMoneyEarnedQuestEvent
} from '../../src/quests/producers/economyQuestEvents'
import {
  buildStoryFlagQuests,
  evaluateAcceptedSettlementSolvency
} from '../../src/hooks/postGig/handlers/continueHandlerUtils'
import { getExpeditionFinaleProfile } from '../../src/domain/expedition/finales'
import { FLAGS } from '../../src/data/flags.registry'
import { createPersistedState } from '../../src/context/usePersistence'
import {
  startedState,
  walkTo,
  walkToFinale
} from '../expeditionLifecycleFixture.js'

const SETTLEMENT = {
  net: 300,
  perfScore: 80,
  misses: 0,
  dealFameMultiplier: 1,
  soldMerch: {}
}

/**
 * The dispatch sequence `useContinueHandler` runs for a settled record,
 * transcribed action by action from the hook and fed through the reducer.
 * `shown` is the state the post-gig screen rendered (the hook's props).
 */
const runContinue = shown => {
  const gigId = shown.currentGig.id
  const stats = shown.lastGigStats
  const { player, band, expedition } = shown
  const settlement = shown.pendingGigSettlement ?? SETTLEMENT
  let state = gameReducer(
    shown,
    createSettleSoldMerchAction(settlement.soldMerch)
  )

  const ledger = calculateContinueStats({
    player,
    perfScore: settlement.perfScore,
    financials: { net: settlement.net },
    misses: stats.misses,
    bandStyle: finiteNumberOr(band.style, 0),
    dealFameMultiplier: settlement.dealFameMultiplier,
    calculateFameGain,
    calculateFameLevel,
    clampPlayerFame,
    clampPlayerMoney,
    BALANCE_CONSTANTS
  })
  const { acceptedMoney, insolvent } = evaluateAcceptedSettlementSolvency({
    expedition,
    previousMoney: player.money,
    proposedMoney: ledger.newMoney,
    net: settlement.net,
    totalDailyObligations: getTotalDailyObligations(shown)
  })
  const isFinaleGig =
    shown.gameMap?.nodes?.[player.currentNodeId]?.type === 'FINALE'
  const successfulFinale = isFinaleGig && !insolvent && stats.failed !== true

  state = gameReducer(
    state,
    createUpdatePlayerAction({
      money: acceptedMoney,
      fame: ledger.newFame,
      fameLevel: ledger.fameLevel
    })
  )
  state = gameReducer(
    state,
    createClearPendingGigSettlementAction(shown.pendingGigSettlement.id)
  )
  if (ledger.newFame > player.fame) {
    state = gameReducer(
      state,
      createApplyQuestEventAction(
        createFameGainedQuestEvent({
          region: getRegionKeyForLocation(player.location) ?? 'Unknown',
          amount: ledger.newFame - player.fame,
          reason: 'post_gig_fame'
        })
      )
    )
  }
  if (acceptedMoney > player.money) {
    state = gameReducer(
      state,
      createApplyQuestEventAction(
        createMoneyEarnedQuestEvent({ amount: acceptedMoney - player.money })
      )
    )
  }

  let postPenaltyHarmony
  if (band.inventory?.neurotoxicPedal) {
    postPenaltyHarmony = clampBandHarmony(
      band.harmony - NEUROTOXIC_PEDAL_HARMONY_PENALTY
    )
    state = gameReducer(
      state,
      createUpdateBandAction(() => ({ harmony: postPenaltyHarmony }))
    )
  }
  for (const quest of buildStoryFlagQuests({
    activeStoryFlags: shown.activeStoryFlags,
    day: player.day,
    bandHarmony: band.harmony,
    postPenaltyHarmony
  })) {
    state = gameReducer(state, createAddQuestAction(quest))
  }

  state = gameReducer(
    state,
    recordExpeditionObligationSignal(state, 'gig', gigId)
  )
  if (successfulFinale) {
    state = gameReducer(
      state,
      recordExpeditionObligationSignal(state, 'finale', gigId)
    )
  }
  if (!isFinaleGig && stats.failed !== true) {
    state = gameReducer(state, offerExpeditionDraft(state, 'major_gig', gigId))
  }
  if (stats.accuracy < 60 || stats.accuracy >= 80) {
    const sourceType = stats.accuracy < 60 ? 'poor_gig' : 'successful_gig'
    for (const crewId of expedition.loadout.crewIds) {
      state = gameReducer(
        state,
        recordExpeditionCrewStressSource(
          state,
          crewId,
          sourceType,
          `gig:${gigId}:${expedition.routeStep}`
        )
      )
    }
  }
  if (isFinaleGig) {
    const multiplier =
      getExpeditionFinaleProfile(expedition.finaleType)
        ?.staminaDrainMultiplier ?? 1
    const extraDrain = Math.round(15 * (multiplier - 1))
    if (extraDrain > 0) {
      state = gameReducer(
        state,
        createUpdateBandAction(prev => ({
          ...prev,
          members: prev.members.map(member => {
            const max = finiteNumberOr(member.staminaMax, 100)
            return {
              ...member,
              stamina: clampMemberStamina(
                readMemberStamina(member.stamina, max) - extraDrain,
                max
              )
            }
          })
        }))
      )
    }
  }
  if (successfulFinale && expedition.status === 'active') {
    state = gameReducer(state, completeExpedition(state, `gig:${gigId}`))
  }
  return state
}

/** Records the settlement on the post-gig screen, as `usePostGigLogic` does. */
const recordSettlement = atResult => {
  const action = createRecordPendingGigSettlementAction({
    gigId: atResult.currentGig.id,
    ...SETTLEMENT,
    ...(atResult.pendingGigSettlement ?? {})
  })
  assert.ok(action)
  const recorded = gameReducer(atResult, action)
  assert.ok(recorded.pendingGigSettlement, 'the record is accepted')
  return recorded
}

const reload = state =>
  handleLoadGame(
    createInitialState(),
    JSON.parse(JSON.stringify(createPersistedState(state)))
  )

const rawSlices = state => ({
  money: state.player.money,
  fame: state.player.fame,
  fameLevel: state.player.fameLevel,
  harmony: state.band.harmony,
  stamina: state.band.members.map(member => [member.id, member.stamina]),
  quests: state.activeQuests.map(quest => [
    quest.id,
    quest.progress,
    quest.deadline
  ]),
  expeditionStatus: state.expedition.status,
  pendingRunDraftOffer: state.expedition.pendingRunDraftOffer ?? null,
  crewStress: state.expedition.crew?.stressByCrewId ?? {},
  crewSourceIds: state.expedition.resolvedCrewSourceIds ?? [],
  obligationSignals: state.expedition.resolvedObligationSignalIds ?? [],
  pendingGigSettlement: state.pendingGigSettlement,
  pendingFailure: state.expedition.pendingFailure ?? null,
  terminalOutcome: state.terminalOutcome ?? null
})

/** The gameplay slices Continue and a reload must agree on. */
const gameplaySlices = state => JSON.parse(JSON.stringify(rawSlices(state)))

// The load rebuilds an active run's map from its seed, so the result must sit
// on a node the fixture route really has.
const withPostGigResult = (walked, { nodeType, gigId }) => {
  assert.equal(
    walked.gameMap.nodes[walked.player.currentNodeId]?.type,
    nodeType
  )
  return {
    ...walked,
    currentScene: GAME_PHASES.POST_GIG,
    currentGig: { id: gigId, name: 'Parity Venue' },
    lastGigStats: { score: 9000, misses: 0, accuracy: 90, failed: false },
    expedition: {
      ...walked.expedition,
      lastGigResolvedAtRouteStep: walked.expedition.routeStep,
      loadout: { ...walked.expedition.loadout, crewIds: ['yara'] },
      // Seeded so the successful-gig Stress relief is visible.
      crew: {
        stressByCrewId: { yara: 20 },
        injuryByCrewId: walked.expedition.crew?.injuryByCrewId ?? {}
      }
    }
  }
}

test('a reload on a successful Expedition Festival result matches Continue', () => {
  const walked = walkTo(startedState({ money: 5000, fame: 100 }), 4)
  const recorded = recordSettlement(
    withPostGigResult(walked, { nodeType: 'FESTIVAL', gigId: 'festival_venue' })
  )

  const continued = runContinue(recorded)
  const loaded = reload(recorded)

  assert.equal(
    continued.expedition.pendingRunDraftOffer?.sourceType,
    'major_gig',
    'Continue offers the Festival Run Draft'
  )
  assert.ok(
    continued.expedition.crew.stressByCrewId.yara < 20,
    'Continue records accuracy-based crew Stress'
  )
  assert.deepEqual(gameplaySlices(loaded), gameplaySlices(continued))
  assert.equal(loaded.currentScene, GAME_PHASES.OVERWORLD)
})

test('a reload on an Expedition Finale result matches Continue (stamina, pedal, story quest)', () => {
  const walked = walkToFinale(startedState({ money: 5000, fame: 100 }))
  const atResult = withPostGigResult(walked, {
    nodeType: 'FINALE',
    gigId: 'finale_venue'
  })
  const recorded = recordSettlement({
    ...atResult,
    activeStoryFlags: [FLAGS.BREAKUP_QUEST_ACTIVE],
    band: {
      ...atResult.band,
      harmony: 70,
      inventory: { ...atResult.band.inventory, neurotoxicPedal: true }
    },
    expedition: { ...atResult.expedition, finaleType: 'illegal_show' }
  })

  const continued = runContinue(recorded)
  const loaded = reload(recorded)

  assert.equal(continued.expedition.status, 'completed')
  assert.equal(continued.band.harmony, 70 - NEUROTOXIC_PEDAL_HARMONY_PENALTY)
  assert.ok(
    continued.band.members.every(
      (member, index) => member.stamina < recorded.band.members[index].stamina
    ),
    'Continue drains extra Finale stamina'
  )
  assert.ok(
    continued.activeQuests.length > recorded.activeQuests.length,
    'Continue adds the story-flag quest'
  )
  assert.deepEqual(gameplaySlices(loaded), gameplaySlices(continued))
  assert.notEqual(loaded.currentScene, GAME_PHASES.POST_GIG)
})

test('a settled reload applies the Continue effects exactly once', () => {
  const walked = walkTo(startedState({ money: 5000, fame: 100 }), 4)
  const recorded = recordSettlement(
    withPostGigResult(walked, { nodeType: 'FESTIVAL', gigId: 'festival_venue' })
  )
  const loaded = reload(recorded)
  assert.equal(loaded.pendingGigSettlement, null)
  assert.notEqual(loaded.currentScene, GAME_PHASES.POST_GIG)

  // A second load of the settled save, and a late Continue clear for the
  // consumed record, re-apply nothing; the unresolved Run Draft offer the
  // settlement produced survives that second load.
  assert.ok(loaded.expedition.pendingRunDraftOffer)
  assert.deepEqual(gameplaySlices(reload(loaded)), gameplaySlices(loaded))
  assert.equal(
    gameReducer(
      loaded,
      createClearPendingGigSettlementAction(recorded.pendingGigSettlement.id)
    ),
    loaded
  )
  // The Continue effects' own replay guards hold against the settled state.
  const gigId = recorded.currentGig.id
  assert.equal(
    gameReducer(loaded, offerExpeditionDraft(loaded, 'major_gig', gigId)),
    loaded
  )
  assert.equal(
    gameReducer(
      loaded,
      recordExpeditionCrewStressSource(
        loaded,
        'yara',
        'successful_gig',
        `gig:${gigId}:${loaded.expedition.routeStep}`
      )
    ),
    loaded
  )
})

test('protected-loss parity for net -600 across live Continue and load recovery', () => {
  const walked = walkTo(
    startedState(
      { money: 500, fame: 100, van: { fuel: 100, fuelMax: 100 } },
      { build: { protectedCareerCash: 400 } }
    ),
    1
  )
  const atResult = {
    ...walked,
    currentScene: GAME_PHASES.POST_GIG,
    player: {
      ...walked.player,
      money: 500,
      fame: 100,
      van: { ...walked.player.van, fuel: 100, fuelMax: 100 }
    },
    currentGig: { id: 'protected_venue', name: 'Protected Venue' },
    lastGigStats: { score: 1000, misses: 58, accuracy: 30, failed: false },
    expedition: {
      ...walked.expedition,
      protectedCareerCash: 400,
      lastGigResolvedAtRouteStep: walked.expedition.routeStep,
      loadout: { ...walked.expedition.loadout, crewIds: ['yara'] },
      crew: {
        stressByCrewId: { yara: 20 },
        injuryByCrewId: walked.expedition.crew?.injuryByCrewId ?? {}
      }
    }
  }
  const recorded = recordSettlement({
    ...atResult,
    pendingGigSettlement: {
      id: 'settlement-protected',
      gigId: 'protected_venue',
      net: -600,
      perfScore: 30,
      misses: 58,
      dealFameMultiplier: 1,
      soldMerch: {}
    }
  })

  const continued = runContinue(recorded)
  const loaded = reload(recorded)

  assert.equal(continued.player.money, 500)
  assert.equal(continued.expedition.status, 'active')
  assert.equal(continued.expedition.pendingFailure, null)
  assert.equal(continued.terminalOutcome, null)

  assert.deepEqual(gameplaySlices(loaded), gameplaySlices(continued))
})

test('floor-0 active-run insolvency parity for pending failure across live Continue and load recovery', () => {
  const walked = walkTo(
    startedState(
      { money: 500, fame: 100, van: { fuel: 100, fuelMax: 100 } },
      { build: { protectedCareerCash: 0 } }
    ),
    1
  )
  const atResult = {
    ...walked,
    currentScene: GAME_PHASES.POST_GIG,
    player: {
      ...walked.player,
      money: 500,
      fame: 100,
      van: { ...walked.player.van, fuel: 100, fuelMax: 100 }
    },
    currentGig: { id: 'bust_venue', name: 'Bust Venue' },
    lastGigStats: { score: 1000, misses: 58, accuracy: 30, failed: false },
    expedition: {
      ...walked.expedition,
      protectedCareerCash: 0,
      lastGigResolvedAtRouteStep: walked.expedition.routeStep,
      loadout: { ...walked.expedition.loadout, crewIds: ['yara'] },
      crew: {
        stressByCrewId: { yara: 20 },
        injuryByCrewId: walked.expedition.crew?.injuryByCrewId ?? {}
      }
    }
  }
  const recorded = recordSettlement({
    ...atResult,
    pendingGigSettlement: {
      id: 'settlement-bust',
      gigId: 'bust_venue',
      net: -600,
      perfScore: 30,
      misses: 58,
      dealFameMultiplier: 1,
      soldMerch: {}
    }
  })

  const continued = runContinue(recorded)
  const loaded = reload(recorded)

  assert.equal(continued.player.money, 0)
  assert.equal(continued.expedition.status, 'active')
  assert.ok(continued.expedition.pendingFailure)
  assert.equal(continued.expedition.pendingFailure.reason, 'bankruptcy')
  assert.equal(continued.terminalOutcome, null)

  assert.deepEqual(gameplaySlices(loaded), gameplaySlices(continued))
})
