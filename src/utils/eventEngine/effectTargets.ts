/**
 * Target contract for event effects that write an authored key into the
 * delta (`social_set`, `item`). Shared by `validateEffect` (static) and the
 * effect handlers (runtime), so an effect the validator would reject never
 * reaches the delta either.
 */
import { ALLOWED_TRENDS_SET } from '../../data/socialTrends'
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
 * Band inventory ids an `item` effect may grant. Mirrors the keys of the
 * default band inventory in `src/context/initialState.ts`; a test pins that
 * every default key is accepted.
 */
const EVENT_ITEM_IDS: Readonly<Record<string, true>> = Object.freeze({
  shirts: true,
  hoodies: true,
  patches: true,
  cds: true,
  vinyl: true,
  neuro_cutting_board: true,
  neuro_lunchbox: true,
  neuro_mug: true,
  neuro_bowl: true,
  strings: true,
  cables: true,
  drum_parts: true,
  golden_pick: true,
  neurotoxicPedal: true,
  neuroDecimator: true,
  sleeping_bags: true,
  tape_glue: true,
  broken_pedal: true,
  cheap_mics: true,
  diy_patch_kit: true,
  canned_food: true,
  beer_bulk: true,
  lucky_pick: true,
  energy_drink: true
})

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
  if (!Object.hasOwn(EVENT_ITEM_IDS, item)) return false
  return (
    value === undefined || typeof value === 'boolean' || isFiniteNumber(value)
  )
}
