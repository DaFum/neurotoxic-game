import type { GameState, QuestPenalty, QuestState } from '../types'
import {
  clampBandHarmony,
  clampControversyLevel,
  clampLoyalty,
  finiteNumberOr,
  isLooseRecord,
  isFiniteNumber
} from '../utils/gameState'
import {
  applyBrandTrustDelta,
  applyReputationDelta,
  getRegionReputationKey,
  queueEvent
} from './questEffects'
import {
  hasAssetTarget,
  updateFirstMatchingAssetCondition
} from './questHelpers'

/**
 * State, story flags, and cooldowns produced by quest failure penalties.
 */
interface QuestPenaltyResult {
  state: GameState
  flagsToAdd: string[]
  cooldownsToAdd: GameState['questCooldowns']
}

/**
 * Returns declarative failure penalties.
 */
const isOptionalString = (value: unknown): boolean =>
  value === undefined || typeof value === 'string'

const isQuestPenalty = (value: unknown): value is QuestPenalty => {
  if (!isLooseRecord(value) || typeof value.type !== 'string') return false

  switch (value.type) {
    case 'band.harmony':
    case 'social.loyalty':
    case 'social.controversy':
      return isFiniteNumber(value.amount)
    case 'region.reputation':
      return isFiniteNumber(value.amount) && isOptionalString(value.scope)
    case 'brand.trust':
      return (
        isFiniteNumber(value.amount) &&
        isOptionalString(value.brandId) &&
        isOptionalString(value.alignment)
      )
    case 'asset.damage':
      return (
        isFiniteNumber(value.amount) &&
        isOptionalString(value.assetId) &&
        isOptionalString(value.assetKind) &&
        hasAssetTarget(value)
      )
    case 'flag.add':
      return typeof value.flag === 'string' && value.flag.length > 0
    case 'event.queue':
      return typeof value.eventId === 'string' && value.eventId.length > 0
    case 'quest.cooldown':
      // A zero or negative duration writes an entry whose `expiresOnDay` is
      // not in the future, which the acceptance check reads as already
      // expired — a declared retry delay that never delays anything.
      return isFiniteNumber(value.days) && value.days > 0
    default:
      return false
  }
}

export const getQuestPenalties = (quest: QuestState): QuestPenalty[] => {
  // Single schema by construction: migrateLegacyQuestSchema converts the
  // nested failurePenalty record at the save-load and ADD_QUEST boundaries,
  // so nothing reaches here still carrying it.
  if (!Array.isArray(quest.failurePenalties)) return []
  return quest.failurePenalties.filter(isQuestPenalty)
}

/**
 * Applies all failure penalties for a quest without dispatching side effects.
 */
export const applyQuestFailurePenalties = (
  state: GameState,
  quest: QuestState,
  currentDay: number
): QuestPenaltyResult => {
  let nextState = state
  const flagsToAdd: string[] = []
  const cooldownsToAdd: GameState['questCooldowns'] = []

  for (const penalty of getQuestPenalties(quest)) {
    switch (penalty.type) {
      case 'social.controversy': {
        nextState = { ...nextState, social: { ...nextState.social } }
        nextState.social.controversyLevel = clampControversyLevel(
          finiteNumberOr(nextState.social.controversyLevel, 0) + penalty.amount
        )
        break
      }
      case 'social.loyalty': {
        nextState = { ...nextState, social: { ...nextState.social } }
        nextState.social.loyalty = clampLoyalty(
          finiteNumberOr(nextState.social.loyalty, 0) + penalty.amount
        )
        break
      }
      case 'band.harmony': {
        nextState = { ...nextState, band: { ...nextState.band } }
        nextState.band.harmony = clampBandHarmony(
          finiteNumberOr(nextState.band.harmony, 1) + penalty.amount
        )
        break
      }
      case 'asset.damage':
        nextState = updateFirstMatchingAssetCondition(
          nextState,
          penalty,
          -Math.abs(penalty.amount)
        )
        break
      case 'region.reputation':
        nextState = applyReputationDelta(
          nextState,
          getRegionReputationKey(nextState, penalty.scope),
          penalty.amount
        )
        break
      case 'brand.trust':
        nextState = applyBrandTrustDelta(nextState, penalty)
        break
      case 'flag.add':
        flagsToAdd.push(penalty.flag)
        break
      case 'event.queue':
        nextState = queueEvent(nextState, penalty.eventId)
        break
      case 'quest.cooldown':
        cooldownsToAdd.push({
          questId: quest.id,
          expiresOnDay: currentDay + penalty.days
        })
        break
    }
  }

  return { state: nextState, flagsToAdd, cooldownsToAdd }
}
