import type { GameState, QuestPenalty, QuestState } from '../types'
import {
  clampBandHarmony,
  clamp0to100,
  clampControversyLevel,
  clampLoyalty,
  finiteNumberOr,
  isForbiddenKey,
  isLooseRecord
} from '../utils/gameState'
import {
  applyBrandTrustDelta,
  applyReputationDelta,
  applyVenueReputationDelta,
  getRegionReputationKey,
  getVenueReputationKey,
  queueEvent
} from './questEffects'

/**
 * State, story flags, and cooldowns produced by quest failure penalties.
 */
export interface QuestPenaltyResult {
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
        const cooldownId =
          Object.hasOwn(cooldown, 'id') &&
          typeof cooldown.id === 'string' &&
          cooldown.id.length > 0 &&
          !isForbiddenKey(cooldown.id)
            ? cooldown.id
            : quest.id
        penalties.push({ type: 'quest.cooldown', id: cooldownId, days })
      }
    }
  }

  return penalties
}

/**
 * Returns declarative failure penalties, falling back to legacy penalty fields.
 */
export const getQuestPenalties = (quest: QuestState): QuestPenalty[] =>
  Array.isArray(quest.failurePenalties) && quest.failurePenalties.length > 0
    ? quest.failurePenalties
    : normalizeLegacyPenalties(quest)

const applyAssetDamage = (
  state: GameState,
  penalty: Extract<QuestPenalty, { type: 'asset.damage' }>
): GameState => {
  let damaged = false
  const assets = (state.assets ?? []).map(asset => {
    const matchesId =
      typeof penalty.assetId === 'string' && asset.id === penalty.assetId
    const matchesKind =
      penalty.assetId == null &&
      typeof penalty.assetKind === 'string' &&
      asset.kind === penalty.assetKind
    if (damaged || (!matchesId && !matchesKind)) return asset
    damaged = true
    return {
      ...asset,
      condition: clamp0to100(
        finiteNumberOr(asset.condition, 0) - Math.abs(penalty.amount)
      )
    }
  })
  return damaged ? { ...state, assets } : state
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
          (nextState.social.controversyLevel ?? 0) + penalty.amount
        )
        break
      }
      case 'social.loyalty': {
        nextState = { ...nextState, social: { ...nextState.social } }
        nextState.social.loyalty = clampLoyalty(
          (nextState.social.loyalty ?? 0) + penalty.amount
        )
        break
      }
      case 'band.harmony': {
        nextState = { ...nextState, band: { ...nextState.band } }
        nextState.band.harmony = clampBandHarmony(
          (nextState.band.harmony ?? 1) + penalty.amount
        )
        break
      }
      case 'asset.damage':
        nextState = applyAssetDamage(nextState, penalty)
        break
      case 'venue.reputation':
        nextState = applyVenueReputationDelta(
          nextState,
          getVenueReputationKey(nextState, penalty.scope),
          penalty.amount
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
      case 'quest.cooldown': {
        const cooldownId =
          typeof penalty.id === 'string' &&
          penalty.id.length > 0 &&
          !isForbiddenKey(penalty.id)
            ? penalty.id
            : undefined
        cooldownsToAdd.push({
          questId: quest.id,
          ...(cooldownId ? { id: cooldownId } : {}),
          expiresOnDay: currentDay + penalty.days
        })
        break
      }
    }
  }

  return { state: nextState, flagsToAdd, cooldownsToAdd }
}
