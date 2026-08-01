import { finiteNumberOr } from '../finiteNumber'

import { isLooseRecord } from '../objectUtils'

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
    (obj.stacks === null ||
      (typeof obj.stacks === 'number' &&
        Number.isInteger(obj.stacks) &&
        obj.stacks > 0))
  )
}

/**
 * Checks whether an object has no own enumerable properties.
 *
 * @param obj - The object to check
 * @returns True if empty, false otherwise
 */
export const isEmptyObject = (obj: Record<string, unknown>): boolean =>
  Object.keys(obj).length === 0

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
  return activeDeals.some(deal => {
    if (!isLooseRecord(deal)) return false
    const d: SponsorshipDealLike = deal
    return (
      d.type === 'SPONSORSHIP' &&
      (typeof d.remainingGigs === 'number' ? d.remainingGigs : 1) > 0
    )
  })
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

  // Arrays and Sets share the iterable interface, so no conversion is needed.
  for (const cd of gameState.eventCooldowns) {
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
 * Counts an object's own enumerable properties.
 *
 * @param obj - The object to count keys for
 * @returns The number of keys
 */
export const countKeys = (
  obj: Record<string, unknown> | null | undefined
): number => (obj ? Object.keys(obj).length : 0)
