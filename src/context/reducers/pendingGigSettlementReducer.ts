import type { GameState, PendingGigSettlement } from '../../types'
import { GAME_PHASES } from '../gameConstants'
import { logger } from '../../utils/logger'
import { isFiniteNumber } from '../../utils/finiteNumber'
import { hasForbiddenKeysDeep, isLooseRecord } from '../../utils/objectUtils'
import {
  BALANCE_CONSTANTS,
  calculateFameGain,
  calculateFameLevel,
  clampPlayerFame,
  clampPlayerMoney,
  finiteNumberOr
} from '../../utils/gameState'
import {
  PERF_SCORE_MAX,
  PERF_SCORE_MIN,
  calculateContinueStats
} from '../../utils/postGig/performanceLogic'
import { MAX_DEAL_FAME_MULTIPLIER } from '../../utils/brandDealBenefits'
import { getTotalDailyObligations } from '../../utils/assets/assetSelectors'
import { buildPerGigSocialReconciliation } from '../../utils/postGig/socialResolution'
import { handleSettleSoldMerch } from './gigReducer'
import { handleUpdateSocial } from './socialReducer'
import { handleAddQuest, handleApplyQuestEvent } from './questReducer'
import {
  handleCompleteExpedition,
  handleOfferExpeditionDraft,
  handleRecordExpeditionObligationSignal,
  settleExpeditionOnGameOver
} from './expeditionReducer'
import { handleUpdateBand } from './bandReducer'
import { handleRecordExpeditionCrewStressSource } from './crewReducer'
import {
  derivePostGigContinueEffects,
  derivePostGigEconomyQuestEvents,
  drainBandStamina,
  evaluateAcceptedSettlementSolvency,
  type PostGigContinueEffect
} from '../../hooks/postGig/handlers/continueHandlerUtils'
import { enforceExpeditionCashFloor } from '../../domain/expedition/loadout'
import { ActionTypes } from '../actionTypes'

const clampRange = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

/**
 * Validates an untrusted pending-settlement record.
 *
 * @param raw - Payload or loaded save value.
 * @returns A fresh, well-formed record, or `null` when any field is malformed.
 */
export const sanitizePendingGigSettlement = (
  raw: unknown
): PendingGigSettlement | null => {
  if (!isLooseRecord(raw) || hasForbiddenKeysDeep(raw)) return null
  const {
    id,
    gigId,
    net,
    perfScore,
    misses,
    dealFameMultiplier,
    soldMerch,
    socialReconciled
  } = raw
  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof gigId !== 'string' || gigId.length === 0) return null
  if (
    !isFiniteNumber(net) ||
    !isFiniteNumber(perfScore) ||
    !isFiniteNumber(misses) ||
    !isFiniteNumber(dealFameMultiplier)
  ) {
    return null
  }
  if (!isLooseRecord(soldMerch)) return null
  const sold: Record<string, number> = {}
  for (const key of Object.keys(soldMerch)) {
    const value = soldMerch[key]
    if (!isFiniteNumber(value) || value < 0) return null
    sold[key] = value
  }
  // Bound to what the post-gig screen can produce, so a tampered save cannot
  // overflow the fame or money arithmetic to Infinity (which clamps to 0).
  return {
    id,
    gigId,
    net: clampRange(net, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
    perfScore: clampRange(perfScore, PERF_SCORE_MIN, PERF_SCORE_MAX),
    misses: clampRange(misses, 0, Number.MAX_SAFE_INTEGER),
    dealFameMultiplier: clampRange(
      dealFameMultiplier,
      1,
      MAX_DEAL_FAME_MULTIPLIER
    ),
    soldMerch: sold,
    socialReconciled:
      Object.hasOwn(raw, 'socialReconciled') && socialReconciled === true
  }
}

/**
 * Stores the settlement the post-gig report presented, so a save taken before
 * Continue can still be settled on load.
 *
 * @param state - Current game state.
 * @param payload - Record built by `createRecordPendingGigSettlementAction`.
 * @returns Next state, or the identical reference for a malformed record or
 * one that does not belong to the gig on the post-gig screen.
 */
export const handleRecordPendingGigSettlement = (
  state: GameState,
  payload: unknown
): GameState => {
  const record = sanitizePendingGigSettlement(payload)
  if (
    !record ||
    state.currentScene !== GAME_PHASES.POST_GIG ||
    record.gigId !== state.currentGig?.id
  ) {
    return state
  }
  const socialReconciled =
    state.pendingGigSettlement?.gigId === record.gigId
      ? state.pendingGigSettlement.socialReconciled === true
      : record.socialReconciled

  return {
    ...state,
    pendingGigSettlement: {
      ...record,
      socialReconciled
    }
  }
}

/**
 * Applies social updates and sets `socialReconciled: true` on matching pending settlement.
 *
 * @param state - Current game state.
 * @param payload - Object carrying `socialUpdate` and optional `settlementId`.
 * @returns State with social updates applied and settlement marker set if IDs match.
 */
export const handleApplyGigSocialReconciliation = (
  state: GameState,
  payload: unknown
): GameState => {
  if (!isLooseRecord(payload)) return state
  const { socialUpdate, settlementId } = payload
  const namesSettlement =
    typeof settlementId === 'string' && settlementId.length > 0
  const targetsPending =
    namesSettlement && state.pendingGigSettlement?.id === settlementId
  // Exactly once per settlement: a replay, or an id that no longer names the
  // pending record (already cleared by Continue), must not decrement deals again.
  if (namesSettlement && !targetsPending) return state
  if (targetsPending && state.pendingGigSettlement?.socialReconciled === true) {
    return state
  }
  const nextState = handleUpdateSocial(
    state,
    socialUpdate as Partial<GameState['social']>
  )
  // Guards a rejected update only (a payload that is not an object): an
  // accepted patch, even an empty one, always allocates a new state and so
  // reaches the marker below.
  if (nextState === state) return state

  const pending = nextState.pendingGigSettlement
  if (pending && targetsPending) {
    return {
      ...nextState,
      pendingGigSettlement: {
        ...pending,
        socialReconciled: true
      }
    }
  }

  return nextState
}

/**
 * Drops the pending record once Continue has settled it.
 *
 * @param state - Current game state.
 * @param payload - Names the settled record.
 * @returns Next state, or the identical reference when the id does not match.
 */
export const handleClearPendingGigSettlement = (
  state: GameState,
  payload: unknown
): GameState => {
  if (
    !isLooseRecord(payload) ||
    typeof payload.id !== 'string' ||
    state.pendingGigSettlement?.id !== payload.id
  ) {
    return state
  }
  return { ...state, pendingGigSettlement: null }
}

/**
 * Applies one Continue effect through the reducer handler its action reaches.
 */
const applyPostGigContinueEffect = (
  state: GameState,
  effect: PostGigContinueEffect
): GameState => {
  const expectedRouteStep = state.expedition.routeStep
  switch (effect.kind) {
    case 'harmony':
      return handleUpdateBand(state, { harmony: effect.harmony })
    case 'addQuest':
      return handleAddQuest(state, effect.quest)
    case 'obligationSignal':
      return handleRecordExpeditionObligationSignal(state, {
        signalType: effect.signalType,
        sourceId: effect.sourceId,
        expectedRouteStep
      })
    case 'offerMajorGigDraft':
      return handleOfferExpeditionDraft(state, {
        sourceType: 'major_gig',
        sourceKey: effect.sourceKey,
        expectedRouteStep
      })
    case 'crewStress':
      return handleRecordExpeditionCrewStressSource(state, {
        crewId: effect.crewId,
        sourceType: effect.sourceType,
        sourceId: effect.sourceId,
        expectedRouteStep
      })
    case 'staminaDrain':
      return handleUpdateBand(state, prevBand =>
        drainBandStamina(prevBand, effect.amount)
      )
  }
}

/**
 * Settles a gig whose save was written before Continue ran.
 *
 * @param state - Fully sanitized loaded state.
 * @param raw - The save's `pendingGigSettlement` value.
 * @returns The loaded state with the record applied once and cleared.
 *
 * @remarks
 * Mirrors `useContinueHandler`: sold merch, money, fame, the post-gig economy
 * quest events, every {@link derivePostGigContinueEffects} effect (pedal
 * penalty, story quests, Contract signals, Festival Run Draft, crew Stress,
 * Finale stamina drain), Finale completion, and the bankruptcy and
 * Career-victory routing. The scene never reopens GIG or POST_GIG.
 */
export const settlePendingGigOnLoad = (
  state: GameState,
  raw: unknown
): GameState => {
  const record = sanitizePendingGigSettlement(raw)
  let next: GameState = { ...state, pendingGigSettlement: null }
  if (!record || !state.lastGigStats || record.gigId !== state.currentGig?.id) {
    return next
  }

  // Records saved before the marker existed carry no field. Those written after
  // the social post already stamped today's gig day and must not reconcile twice.
  //
  // `lastGigDay === day` can only mistake a second gig for a reconciled one if
  // two paid gigs complete on one day, which production does not allow: arrival
  // runs `advanceDay` before `START_GIG`, and `SET_LAST_GIG_STATS` stamps
  // `lastGigNodeId` so the node cannot be replayed. Alternatives were rejected:
  // a migration has no per-settlement evidence, `regionalGigHistory` collapses
  // same-day entries and carries no settlement id, and `lastGigNodeId` proves a
  // gig was played, not that its post was applied. Records created by
  // `createRecordPendingGigSettlementAction` always carry the marker.
  const legacyAlreadyReconciled =
    !(isLooseRecord(raw) && Object.hasOwn(raw, 'socialReconciled')) &&
    finiteNumberOr(state.social.lastGigDay, -1) ===
      finiteNumberOr(state.player.day, 0)
  if (record.socialReconciled !== true && !legacyAlreadyReconciled) {
    try {
      const socialPatch = buildPerGigSocialReconciliation({
        player: state.player,
        social: state.social,
        currentGig: state.currentGig
      })
      next = handleUpdateSocial(next, socialPatch)
    } catch (error) {
      // Payout recovery continues; the failure must stay visible.
      logger.warn(
        'GameState',
        'Per-gig social reconciliation failed on load',
        error
      )
    }
  }

  next = handleSettleSoldMerch(next, record.soldMerch)

  const player = next.player
  // Measured before the gig's fame lands, like the `totalDailyObligations` the
  // Continue handler receives from the screen it was pressed on. Fame raises
  // the lifestyle cost, so re-reading it after settling could flip a Finale
  // that live Continue completed.
  const totalDailyObligations = getTotalDailyObligations(next)
  const stats = calculateContinueStats({
    player,
    perfScore: record.perfScore,
    financials: { net: record.net },
    misses: record.misses,
    // Read from state like the Finale gate below, so a reload settles a
    // collapsed gig exactly as live Continue did.
    failed: state.lastGigStats?.failed === true,
    bandStyle: finiteNumberOr(next.band.style, 0),
    dealFameMultiplier: record.dealFameMultiplier,
    calculateFameGain,
    calculateFameLevel,
    clampPlayerFame,
    clampPlayerMoney,
    BALANCE_CONSTANTS
  })
  // Continue refuses only the Cash an active run's protected Career Cash floor
  // forbids and still lands the fame; settle under the same rule so a reload
  // can neither spend that Cash nor lose that fame.
  const { acceptedMoney } = evaluateAcceptedSettlementSolvency({
    expedition: next.expedition,
    previousMoney: player.money,
    proposedMoney: stats.newMoney,
    net: record.net,
    totalDailyObligations
  })

  const settled: GameState = {
    ...next,
    player: {
      ...player,
      money: acceptedMoney,
      fame: stats.newFame,
      fameLevel: stats.fameLevel
    }
  }
  // The capped Cash never crosses the floor, so this only runs the floor's
  // bookkeeping (a rising balance retires a recorded travel refusal).
  next = enforceExpeditionCashFloor(next, settled, ActionTypes.UPDATE_PLAYER)

  // Evaluate solvency from post-floor state money and the pre-settlement obligations.
  const { insolvent, careerBankrupt } = evaluateAcceptedSettlementSolvency({
    expedition: next.expedition,
    previousMoney: next.player.money,
    proposedMoney: next.player.money,
    net: record.net,
    totalDailyObligations
  })

  const isFinaleGig =
    next.gameMap?.nodes?.[player.currentNodeId]?.type === 'FINALE'
  const successfulFinale =
    isFinaleGig && !insolvent && state.lastGigStats.failed !== true
  const careerFinale = successfulFinale && next.expedition.status === 'idle'
  const expeditionFinale =
    successfulFinale && next.expedition.status === 'active'

  if (careerFinale) {
    next = {
      ...next,
      player: {
        ...next.player,
        stats: { ...next.player.stats, tourCompleted: true }
      }
    }
  }

  for (const event of derivePostGigEconomyQuestEvents(player, stats)) {
    next = handleApplyQuestEvent(next, event)
  }

  // Continue's remaining effects, derived from the state its screen showed
  // and applied in its dispatch order. The Contract signals among them must
  // land before completion, or a Finale settled here would fail Contracts the
  // gig actually satisfied.
  for (const effect of derivePostGigContinueEffects({
    band: state.band,
    day: state.player.day,
    activeStoryFlags: state.activeStoryFlags,
    expedition: state.expedition,
    gigId: record.gigId,
    lastGigStats: state.lastGigStats,
    isFinaleGig,
    successfulFinale
  })) {
    next = applyPostGigContinueEffect(next, effect)
  }

  if (expeditionFinale) {
    next = handleCompleteExpedition(next, {
      finaleResultId: `gig:${record.gigId}`,
      expectedRouteStep: next.expedition.routeStep
    })
  }

  if (!careerBankrupt && !careerFinale) return next
  const ended: GameState = {
    ...next,
    terminalOutcome: careerBankrupt
      ? { reason: 'bankruptcy' }
      : { reason: 'career_victory' },
    currentScene: GAME_PHASES.GAMEOVER
  }
  // A run still active when the Career goes bankrupt ends with it.
  return careerBankrupt
    ? settleExpeditionOnGameOver(ended, 'bankruptcy')
    : ended
}
