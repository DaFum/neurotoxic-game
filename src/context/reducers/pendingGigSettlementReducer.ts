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
import { calculateContinueStats } from '../../utils/postGig/performanceLogic'
import { shouldTriggerBankruptcy } from '../../utils/economy'
import { getTotalDailyObligations } from '../../utils/assetSelectors'
import { getRegionKeyForLocation } from '../../utils/mapUtils'
import {
  createFameGainedQuestEvent,
  createMoneyEarnedQuestEvent
} from '../../quests/producers/economyQuestEvents'
import { handleSettleSoldMerch } from './gigReducer'
import { handleApplyQuestEvent } from './questReducer'
import {
  handleCompleteExpedition,
  handleRecordExpeditionObligationSignal
} from './expeditionReducer'

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
  return {
    id,
    gigId,
    net,
    perfScore,
    misses,
    dealFameMultiplier,
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
 * Settles a gig whose save was written before Continue ran.
 *
 * @param state - Fully sanitized loaded state.
 * @param raw - The save's `pendingGigSettlement` value.
 * @returns The loaded state with the record applied once and cleared.
 *
 * @remarks
 * Mirrors the ledger of `useContinueHandler`: sold merch, money, fame, the
 * post-gig economy quest events, the Expedition `gig`/`finale` obligation
 * signals, Finale completion, and the bankruptcy and
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
    getTotalDailyObligations(state)
  )
  const successfulFinale =
    next.gameMap?.nodes?.[player.currentNodeId]?.type === 'FINALE' &&
    !bankrupt &&
    state.lastGigStats.failed !== true
  const careerFinale = successfulFinale && next.expedition.status === 'idle'
  const expeditionFinale =
    successfulFinale && next.expedition.status === 'active'

  next = {
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
  }

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

  // Contract evidence Continue records before completing the run; without it
  // a Finale settled here would fail Contracts the gig actually satisfied.
  if (next.expedition.status === 'active') {
    next = handleRecordExpeditionObligationSignal(next, {
      signalType: 'gig',
      sourceId: record.gigId,
      expectedRouteStep: next.expedition.routeStep
    })
    if (successfulFinale) {
      next = handleRecordExpeditionObligationSignal(next, {
        signalType: 'finale',
        sourceId: record.gigId,
        expectedRouteStep: next.expedition.routeStep
      })
    }
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
