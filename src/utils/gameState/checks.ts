import { finiteNumberOr, isFiniteNumber } from '../finiteNumber'

import { isForbiddenKey, isLooseRecord } from '../objectUtils'

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
    if (d.type !== 'SPONSORSHIP') return false
    // Only an absent count means "open-ended"; a present malformed count fails closed.
    const remainingGigs = Object.hasOwn(d, 'remainingGigs')
      ? finiteNumberOr(d.remainingGigs, 0)
      : 1
    return remainingGigs > 0
  })
}

/** A cooldown entry's expiry suffix is a whole day number and nothing else. */
const EXPIRY_DAY_PATTERN = /^\d+$/

/**
 * Parses a legacy `key` or `key:expiryDay` cooldown entry. Saves from before
 * `eventCooldowns` became an `eventId -> unlock day` record stored these
 * strings; `sanitizeEventCooldowns` uses this to migrate them on load.
 *
 * @param entry - Untrusted legacy cooldown entry from a persisted save.
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
 * suffix as an expiry.
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
 * Reads one cooldown's unlock day from an untrusted cooldown record.
 *
 * @param cooldowns - Cooldown record (`eventId -> unlock day`).
 * @param key - Cooldown key to read.
 * @returns The unlock day, or `null` when the key is not an own, finite entry.
 */
const readUnlockDay = (
  cooldowns: Readonly<Record<string, unknown>>,
  key: string
): number | null => {
  if (isForbiddenKey(key) || !Object.hasOwn(cooldowns, key)) return null
  const unlockDay = cooldowns[key]
  return isFiniteNumber(unlockDay) ? unlockDay : null
}

/**
 * Checks whether an event id or scoped event key is still on cooldown.
 *
 * @param gameState - State slice with the cooldown record (or the active-id
 * Set event selection builds) and the current day.
 * @param eventId - Event id to check.
 * @param contextId - Optional context suffix used for scoped cooldown keys.
 * @returns True while the current day is before the key's unlock day.
 */
export const isOnCooldown = (
  gameState: {
    eventCooldowns?: Readonly<Record<string, number>> | ReadonlySet<string>
    player?: { day?: number }
  },
  eventId: string,
  contextId: string = ''
): boolean => {
  const cooldowns = gameState.eventCooldowns
  const keys = contextId ? [`${eventId}_${contextId}`, eventId] : [eventId]

  // Event selection hands conditions a Set that already holds only the ids
  // whose cooldown is still running.
  if (cooldowns instanceof Set) return keys.some(key => cooldowns.has(key))
  if (!isLooseRecord(cooldowns)) return false

  const currentDay = finiteNumberOr(gameState.player?.day, 0)
  return keys.some(key => {
    const unlockDay = readUnlockDay(cooldowns, key)
    return unlockDay !== null && currentDay < unlockDay
  })
}

/**
 * Records a cooldown, keeping the later unlock day when one already exists.
 *
 * @param cooldowns - Current cooldown record.
 * @param eventId - Cooldown key to add.
 * @param unlockDay - Day the key unlocks again.
 * @returns A new record, or the same reference when the key is invalid or the
 * existing cooldown already runs at least as long.
 */
export const addEventCooldown = (
  cooldowns: Readonly<Record<string, number>>,
  eventId: unknown,
  unlockDay: unknown
): Record<string, number> => {
  if (
    typeof eventId !== 'string' ||
    eventId === '' ||
    isForbiddenKey(eventId) ||
    !isFiniteNumber(unlockDay)
  ) {
    return cooldowns
  }
  const current = readUnlockDay(cooldowns, eventId)
  if (current !== null && current >= unlockDay) return cooldowns
  return { ...cooldowns, [eventId]: unlockDay }
}

/**
 * Copies the cooldowns that are still running on `currentDay`.
 *
 * @param cooldowns - Untrusted cooldown record.
 * @param currentDay - Day to evaluate against.
 * @returns A new record of own, finite entries whose unlock day is after
 * `currentDay`; forbidden prototype keys are skipped.
 */
export const pruneEventCooldowns = (
  cooldowns: unknown,
  currentDay: number
): Record<string, number> => {
  const active: Record<string, number> = {}
  if (!isLooseRecord(cooldowns)) return active
  for (const key of Object.keys(cooldowns)) {
    const unlockDay = readUnlockDay(cooldowns, key)
    if (unlockDay !== null && currentDay < unlockDay) active[key] = unlockDay
  }
  return active
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
