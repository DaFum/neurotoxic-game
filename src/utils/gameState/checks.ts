import { finiteNumberOr } from '../finiteNumber'

import { hasForbiddenOwnKeys, isLooseRecord } from '../objectUtils'

import type { StashEntry } from '../../types'

/**
 * Checks whether an unknown value has the stash-entry shape.
 *
 * @param entry - Unknown value to inspect.
 * @returns True when the value has the minimal persisted stash-entry shape.
 */
export const isStashEntry = (entry: unknown): entry is StashEntry => {
  if (entry === null || typeof entry !== 'object') return false
  const obj = entry as Record<string, unknown>

  return (
    Object.hasOwn(obj, 'stacks') &&
    (typeof obj.stacks === 'number' || obj.stacks === null)
  )
}

/**
 * High-performance check for object emptiness.
 * Returns true if the object has no enumerable properties.
 * Avoids the array allocation of Object.keys().length === 0.
 *
 * @param obj - The object to check
 * @returns True if empty, false otherwise
 */
export const isEmptyObject = (obj: Record<string, unknown>): boolean => {
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      return false
    }
  }
  return true
}

/**
 * Optimized check for forbidden keys in an object.
 * Avoids `Object.keys(obj).some(isForbiddenKey)` which allocates an array.
 *
 * @param obj - The object to check
 * @returns True if the object has any forbidden keys
 */
export const hasForbiddenKeys = (obj: Record<string, unknown>): boolean =>
  hasForbiddenOwnKeys(obj)

/**
 * Checks if a collection (Set or Array) contains an item.
 * Used primarily for optimizedState which passes Sets instead of Arrays for performance.
 *
 * @param collection - The collection to check.
 * @param item - The item to look for.
 * @returns True if the collection contains the item.
 */
export const hasStateItem = (
  collection: Set<unknown> | unknown[] | null | undefined,
  item: unknown
): boolean => {
  return collection instanceof Set
    ? collection.has(item)
    : (collection || []).includes(item)
}

type SponsorshipDealLike = {
  type?: unknown
  remainingGigs?: unknown
}

/**
 * Checks whether social state contains an unexpired sponsorship deal.
 *
 * @param socialState - Social state slice to inspect.
 * @returns True when at least one sponsorship deal has remaining gigs.
 */
export const hasActiveSponsorship = (
  socialState: { activeDeals?: unknown[] } | null | undefined
): boolean => {
  const activeDeals = socialState?.activeDeals
  if (!Array.isArray(activeDeals)) {
    return false
  }
  // ⚡ BOLT OPTIMIZATION: Replaced Array.some() with procedural loop to avoid intermediate allocations and reduce GC pressure.
  for (let i = 0; i < activeDeals.length; i++) {
    const deal = activeDeals[i]
    if (!isLooseRecord(deal)) continue
    const d: SponsorshipDealLike = deal
    if (
      d.type === 'SPONSORSHIP' &&
      (typeof d.remainingGigs === 'number' ? d.remainingGigs : 1) > 0
    ) {
      return true
    }
  }
  return false
}

/**
 * Checks whether an event id or scoped event key is still on cooldown.
 *
 * @param gameState - State slice containing cooldown entries and the current day.
 * @param eventId - Event id to check.
 * @param contextId - Optional context suffix used for scoped cooldown keys.
 * @returns True when a matching cooldown exists and has not expired.
 */
export const isOnCooldown = (
  gameState: {
    eventCooldowns?: string[] | Set<string>
    player?: { day?: number }
  },
  eventId: string,
  contextId: string = ''
): boolean => {
  if (!gameState.eventCooldowns) return false

  const currentDay = finiteNumberOr(gameState.player?.day, 0)

  const cooldowns = Array.isArray(gameState.eventCooldowns)
    ? gameState.eventCooldowns
    : Array.from(gameState.eventCooldowns)

  for (const cd of cooldowns) {
    const [key, expiryStr] = (typeof cd === 'string' ? cd : '').split(':')
    if (!key) continue

    // Exact match
    const isMatch =
      (contextId && key === `${eventId}_${contextId}`) || key === eventId
    if (isMatch) {
      if (expiryStr) {
        const expiry = parseInt(expiryStr, 10)
        if (!isNaN(expiry) && currentDay < expiry) {
          return true
        }
      } else {
        return true // No expiry means forever or legacy
      }
    }
  }
  return false
}

/**
 * High-performance object key counting.
 * Returns the number of enumerable own properties.
 * Avoids the array allocation of Object.keys().length.
 *
 * @param obj - The object to count keys for
 * @returns The number of keys
 */
export const countKeys = (
  obj: Record<string, unknown> | null | undefined
): number => {
  if (!obj) return 0
  let count = 0
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      count++
    }
  }
  return count
}
