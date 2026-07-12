import type { GameState } from '../types'
import {
  clamp0to100,
  clampReputation,
  finiteNumberOr,
  isForbiddenKey
} from '../utils/gameState'
import { getRegionKeyForLocation } from '../utils/mapUtils'

const isValidReputationKey = (key: unknown): key is string =>
  typeof key === 'string' && key.length > 0 && !isForbiddenKey(key)

const applyReputationMapDelta = (
  state: GameState,
  mapName: 'reputationByRegion' | 'reputationByVenue',
  key: string | undefined,
  amount: number
): GameState => {
  if (!key) return state
  const reputationMap = state[mapName] ?? {}
  const previous = finiteNumberOr(reputationMap[key], 0)
  return {
    ...state,
    [mapName]: {
      ...reputationMap,
      [key]: clampReputation(previous + amount)
    }
  }
}

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
  return isValidReputationKey(key) ? key : undefined
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
      ? // player.location is the venue display key; region reputation is
        // keyed per canonical city key.
        getRegionKeyForLocation(state.player?.location)
      : scope
  return isValidReputationKey(key) ? key : undefined
}

/**
 * Applies a clamped region reputation delta to game state.
 */
export const applyReputationDelta = (
  state: GameState,
  key: string | undefined,
  amount: number
): GameState => {
  return applyReputationMapDelta(state, 'reputationByRegion', key, amount)
}

/**
 * Applies a clamped venue reputation delta to game state.
 */
export const applyVenueReputationDelta = (
  state: GameState,
  key: string | undefined,
  amount: number
): GameState => {
  return applyReputationMapDelta(state, 'reputationByVenue', key, amount)
}

/**
 * Resolves the brand reputation key from a brand-trust effect.
 */
const getBrandReputationKey = (effect: {
  brandId?: string
  alignment?: string
}): string | undefined => {
  const key = effect.brandId ?? effect.alignment ?? 'global'
  return isValidReputationKey(key) ? key : undefined
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
