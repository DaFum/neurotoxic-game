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
export const isEmptyObject = (obj: Record<string, unknown>): boolean => {
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) return false
  }
  return true
}

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

/** A cooldown entry's expiry suffix is a whole day number and nothing else. */
const EXPIRY_DAY_PATTERN = /^\d+$/

/**
 * Parses a persisted `key` or `key:expiryDay` cooldown entry.
 *
 * @param entry - Untrusted cooldown entry from persisted state.
 * @returns The cooldown key with its expiry day (`null` for a permanent legacy
 * entry), or `null` when the entry does not match the grammar.
 *
 * @remarks
 * Only the segment after the LAST colon can be an expiry day, because event
 * ids may themselves contain colons (`namespace:event`) and the writer
 * serializes timed entries as `${eventId}:${expiryDay}`. Splitting on the
 * first colon would leave `namespace:event:42` with the unparseable suffix
 * `event:42` and drop a live cooldown.
 *
 * The whole suffix must be a day number: `parseInt` accepts a valid numeric
 * prefix, so a corrupted or hostile `event_id:999999junk` would otherwise
 * suppress the event until day 999999. Digits alone are not enough either — a
 * 400-digit suffix converts to `Infinity`, which every `currentDay < expiry`
 * reader would treat as a permanent cooldown. An entry whose last segment is
 * not a day number is therefore a key in its own right with no expiry, which
 * keeps untimed colon ids readable while still refusing to honour a corrupted
 * suffix as an expiry. Shared by every cooldown reader so the grammar cannot
 * drift between them.
 */
export const parseCooldownEntry = (
  entry: unknown
): { key: string; expiryDay: number | null } | null => {
  if (typeof entry !== 'string' || entry === '') return null

  const separatorIndex = entry.lastIndexOf(':')
  const expiry = separatorIndex === -1 ? '' : entry.slice(separatorIndex + 1)

  // No parseable expiry: the entry is a bare key (permanent or legacy), which
  // is also how an id ending in a non-numeric `:suffix` stays addressable.
  if (!EXPIRY_DAY_PATTERN.test(expiry)) return { key: entry, expiryDay: null }

  const key = entry.slice(0, separatorIndex)
  if (!key) return null

  const expiryDay = Number(expiry)
  if (!Number.isFinite(expiryDay)) return null
  return { key, expiryDay }
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
    const parsed = parseCooldownEntry(cd)
    if (!parsed) continue
    const { key, expiryDay } = parsed

    // Exact match
    const isMatch =
      (contextId && key === `${eventId}_${contextId}`) || key === eventId
    if (isMatch) {
      if (expiryDay === null) return true
      if (currentDay < expiryDay) return true
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
): number => {
  if (!obj) return 0
  let count = 0
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) count++
  }
  return count
}
