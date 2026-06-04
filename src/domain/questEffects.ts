import type { GameState } from '../types'
import {
  clamp0to100,
  clampReputation,
  finiteNumberOr,
  isForbiddenKey
} from '../utils/gameStateUtils'

/**
 * Resolves the venue reputation key for current or explicit quest scopes.
 */
export const getVenueReputationKey = (
  state: GameState,
  scope: 'current' | string | null | undefined
): string | undefined => {
  const key =
    scope === 'current' || scope === null || scope === undefined
      ? (state.currentGig?.id ?? state.player?.currentNodeId)
      : scope
  return typeof key === 'string' && key.length > 0 && !isForbiddenKey(key)
    ? key
    : undefined
}

/**
 * Resolves the region reputation key for current or explicit quest scopes.
 */
export const getRegionReputationKey = (
  state: GameState,
  scope: 'current' | string | null | undefined
): string | undefined => {
  const key =
    scope === 'current' || scope === null || scope === undefined
      ? state.player?.location
      : scope
  return typeof key === 'string' && key.length > 0 && !isForbiddenKey(key)
    ? key
    : undefined
}

/**
 * Applies a clamped region reputation delta to game state.
 */
export const applyReputationDelta = (
  state: GameState,
  key: string | undefined,
  amount: number
): GameState => {
  if (!key) return state
  const previous = finiteNumberOr(state.reputationByRegion?.[key], 0)
  return {
    ...state,
    reputationByRegion: {
      ...(state.reputationByRegion ?? {}),
      [key]: clampReputation(previous + amount)
    }
  }
}

/**
 * Applies a clamped venue reputation delta to game state.
 */
export const applyVenueReputationDelta = (
  state: GameState,
  key: string | undefined,
  amount: number
): GameState => {
  if (!key) return state
  const previous = finiteNumberOr(state.reputationByVenue?.[key], 0)
  return {
    ...state,
    reputationByVenue: {
      ...(state.reputationByVenue ?? {}),
      [key]: clampReputation(previous + amount)
    }
  }
}

/**
 * Resolves the brand reputation key from a brand-trust effect.
 */
export const getBrandReputationKey = (effect: {
  brandId?: string
  alignment?: string
}): string | undefined => {
  const key = effect.brandId ?? effect.alignment ?? 'global'
  return typeof key === 'string' && key.length > 0 && !isForbiddenKey(key)
    ? key
    : undefined
}

/**
 * Applies a clamped brand trust delta to social state.
 */
export const applyBrandTrustDelta = (
  state: GameState,
  effect: { brandId?: string; alignment?: string; amount: number }
): GameState => {
  const key = getBrandReputationKey(effect)
  if (!key) return state
  const previous = finiteNumberOr(state.social?.brandReputation?.[key], 0)
  return {
    ...state,
    social: {
      ...state.social,
      brandReputation: {
        ...(state.social?.brandReputation ?? {}),
        [key]: clamp0to100(previous + effect.amount)
      }
    }
  }
}

/**
 * Queues an event id if it is valid and not already pending.
 */
export const queueEvent = (state: GameState, eventId: string): GameState => {
  if (!eventId || isForbiddenKey(eventId)) return state
  if (state.pendingEvents?.includes(eventId)) return state
  return {
    ...state,
    pendingEvents: [...(state.pendingEvents ?? []), eventId]
  }
}
