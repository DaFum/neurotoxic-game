/**
 * Target contract for event effects that write an authored key into the
 * delta (`social_set`, `item`). Shared by `validateEffect` (static) and the
 * effect handlers (runtime), so an effect the validator would reject never
 * reaches the delta either.
 */
import { ALLOWED_TRENDS_SET } from '../../data/socialTrends'
import { DEFAULT_BAND_INVENTORY } from '../../data/bandInventory'
import { isFiniteNumber } from '../finiteNumber'
import { isForbiddenKey } from '../objectUtils'

/** Numeric `SocialState` counters a `social_set` effect may target. */
const NUMERIC_SOCIAL_STATS: ReadonlySet<string> = new Set([
  'controversyLevel',
  'loyalty',
  'zealotry',
  'instagram',
  'tiktok',
  'youtube',
  'newsletter',
  'viral',
  'reputationCooldown',
  'scenePresence'
])

const TRENDS: ReadonlySet<string> = ALLOWED_TRENDS_SET

/**
 * Band inventory ids an `item` effect may grant: the keys of the default band
 * inventory, the same source `DEFAULT_BAND_STATE.inventory` copies.
 */
const EVENT_ITEM_IDS: ReadonlySet<string> = new Set(
  Object.keys(DEFAULT_BAND_INVENTORY)
)

/**
 * Whether a `social_set` effect names a known social field with a value of
 * that field's type.
 *
 * @param stat - The effect's `stat`.
 * @param value - The effect's `value`.
 * @returns True for a numeric counter with a finite number, `egoFocus` with a
 * string or `null`, or `trend` with a canonical trend; false otherwise.
 */
export const isValidSocialSetTarget = (
  stat: unknown,
  value: unknown
): stat is string => {
  if (typeof stat !== 'string' || isForbiddenKey(stat)) return false
  if (NUMERIC_SOCIAL_STATS.has(stat)) return isFiniteNumber(value)
  if (stat === 'egoFocus') return value === null || typeof value === 'string'
  if (stat === 'trend') return typeof value === 'string' && TRENDS.has(value)
  return false
}

/**
 * Whether an `item` effect names a known inventory id with a usable value.
 *
 * @param item - The effect's `item`.
 * @param value - The effect's `value`.
 * @returns True for a known inventory id whose value is a finite number, a
 * boolean or omitted (a grant); false otherwise.
 */
export const isValidItemTarget = (
  item: unknown,
  value: unknown
): item is string => {
  if (typeof item !== 'string' || isForbiddenKey(item)) return false
  if (!EVENT_ITEM_IDS.has(item)) return false
  return (
    value === undefined || typeof value === 'boolean' || isFiniteNumber(value)
  )
}
