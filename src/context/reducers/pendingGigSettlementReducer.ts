import type { GameState, PendingGigSettlement } from '../../types'
import { GAME_PHASES } from '../gameConstants'
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
import { shouldTriggerBankruptcy } from '../../utils/economy'
import { getTotalDailyObligations } from '../../utils/assetSelectors'
import { getRegionKeyForLocation } from '../../utils/mapUtils'
import {
  createFameGainedQuestEvent,
  createMoneyEarnedQuestEvent
} from '../../quests/producers/economyQuestEvents'
import { handleSettleSoldMerch } from './gigReducer'
import { handleAddQuest, handleApplyQuestEvent } from './questReducer'
import {
  handleCompleteExpedition,
  handleOfferExpeditionDraft,
  handleRecordExpeditionObligationSignal
} from './expeditionReducer'
import { handleUpdateBand } from './bandReducer'
import { handleRecordExpeditionCrewStressSource } from './crewReducer'
import {
  derivePostGigContinueEffects,
  drainBandStamina,
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
  const { id, gigId, net, perfScore, misses, dealFameMultiplier, soldMerch } =
    raw
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
    soldMerch: sold
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
  return { ...state, pendingGigSettlement: record }
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

  next = handleSettleSoldMerch(next, record.soldMerch)

  const player = next.player
  const stats = calculateContinueStats({
    player,
    perfScore: record.perfScore,
    financials: { net: record.net },
    misses: record.misses,
    bandStyle: finiteNumberOr(next.band.style, 0),
    dealFameMultiplier: record.dealFameMultiplier,
    calculateFameGain,
    calculateFameLevel,
    clampPlayerFame,
    clampPlayerMoney,
    BALANCE_CONSTANTS
  })
  const bankrupt = shouldTriggerBankruptcy(
    stats.newMoney,
    record.net,
    getTotalDailyObligations(next)
  )
  const isFinaleGig =
    next.gameMap?.nodes?.[player.currentNodeId]?.type === 'FINALE'
  const successfulFinale =
    isFinaleGig && !bankrupt && state.lastGigStats.failed !== true
  const careerFinale = successfulFinale && next.expedition.status === 'idle'
  const expeditionFinale =
    successfulFinale && next.expedition.status === 'active'

  // Continue applies this ledger as one UPDATE_PLAYER, which an active run's
  // protected Career Cash floor rejects whole; settle it under the same rule
  // so a reload cannot spend Cash that Continue would have refused.
  next = enforceExpeditionCashFloor(
    next,
    {
      ...next,
      player: {
        ...player,
        money: stats.newMoney,
        fame: stats.newFame,
        fameLevel: stats.fameLevel,
        ...(careerFinale
          ? { stats: { ...player.stats, tourCompleted: true } }
          : {})
      }
    },
    ActionTypes.UPDATE_PLAYER
  )

  const fameGain = stats.newFame - finiteNumberOr(player.fame, 0)
  if (fameGain > 0) {
    next = handleApplyQuestEvent(
      next,
      createFameGainedQuestEvent({
        region: getRegionKeyForLocation(player.location) ?? 'Unknown',
        amount: fameGain,
        reason: 'post_gig_fame'
      })
    )
  }
  const moneyGain = stats.newMoney - finiteNumberOr(player.money, 0)
  if (moneyGain > 0) {
    next = handleApplyQuestEvent(
      next,
      createMoneyEarnedQuestEvent({ amount: moneyGain })
    )
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

  return bankrupt || careerFinale
    ? { ...next, currentScene: GAME_PHASES.GAMEOVER }
    : next
}
