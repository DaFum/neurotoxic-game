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
import { updateFirstMatchingAssetCondition } from './questHelpers'

/**
 * State, story flags, and cooldowns produced by quest failure penalties.
 */
interface QuestPenaltyResult {
  state: GameState
  flagsToAdd: string[]
  cooldownsToAdd: GameState['questCooldowns']
}

const normalizeLegacyPenalties = (quest: QuestState): QuestPenalty[] => {
  const penalty = isLooseRecord(quest.failurePenalty)
    ? Object.assign(Object.create(null), quest.failurePenalty)
    : undefined
  if (!penalty) return []

  const penalties: QuestPenalty[] = []
  const socialPenalty =
    Object.hasOwn(penalty, 'social') && isLooseRecord(penalty.social)
      ? Object.assign(Object.create(null), penalty.social)
      : undefined
  if (
    socialPenalty &&
    Object.hasOwn(socialPenalty, 'controversyLevel') &&
    socialPenalty.controversyLevel != null
  ) {
    const amount = Number(socialPenalty.controversyLevel)
    penalties.push({
      type: 'social.controversy',
      amount: Number.isFinite(amount) ? amount : 0
    })
  }
  if (
    socialPenalty &&
    Object.hasOwn(socialPenalty, 'loyalty') &&
    socialPenalty.loyalty != null
  ) {
    const amount = Number(socialPenalty.loyalty)
    penalties.push({
      type: 'social.loyalty',
      amount: Number.isFinite(amount) ? amount : 0
    })
  }

  const bandPenalty =
    Object.hasOwn(penalty, 'band') && isLooseRecord(penalty.band)
      ? Object.assign(Object.create(null), penalty.band)
      : undefined
  if (
    bandPenalty &&
    Object.hasOwn(bandPenalty, 'harmony') &&
    bandPenalty.harmony != null
  ) {
    const amount = Number(bandPenalty.harmony)
    penalties.push({
      type: 'band.harmony',
      amount: Number.isFinite(amount) ? amount : 0
    })
  }

  if (Array.isArray(penalty.flags)) {
    for (const flag of penalty.flags) {
      if (typeof flag === 'string' && flag.length > 0) {
        penalties.push({ type: 'flag.add', flag })
      }
    }
  }

  if (Array.isArray(penalty.cooldowns)) {
    for (const cooldown of penalty.cooldowns) {
      if (!isLooseRecord(cooldown)) continue
      const days = finiteNumberOr(cooldown.days, Number.NaN)
      if (Number.isFinite(days)) {
        // Legacy `id` labels are dropped: cooldown matching is keyed by the
        // quest id alone (canAcceptQuest compares cd.questId).
        penalties.push({ type: 'quest.cooldown', days })
      }
    }
  }

  return penalties
}

/**
 * Returns declarative failure penalties, falling back to legacy penalty fields.
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
        isOptionalString(value.assetKind)
      )
    case 'flag.add':
      return typeof value.flag === 'string' && value.flag.length > 0
    case 'event.queue':
      return typeof value.eventId === 'string' && value.eventId.length > 0
    case 'quest.cooldown':
      return isFiniteNumber(value.days)
    default:
      return false
  }
}

export const getQuestPenalties = (quest: QuestState): QuestPenalty[] => {
  if (
    Array.isArray(quest.failurePenalties) &&
    quest.failurePenalties.length > 0
  ) {
    return quest.failurePenalties.filter(isQuestPenalty)
  }
  return normalizeLegacyPenalties(quest)
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
