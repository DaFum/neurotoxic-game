import { EXPENSE_CONSTANTS } from '../economy'
import { finiteNumberOr, isFiniteNumber } from '../finiteNumber'
import {
  RELATIONSHIP_DEFAULT_SCORE,
  RELATIONSHIP_MAX_SCORE,
  RELATIONSHIP_MIN_SCORE
} from './constants'

/**
 * Clamps a value to be at least 0.
 *
 * @param value - Candidate value.
 * @returns Clamped value ensuring non-negative.
 */
export const clampNonNegative = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, value)
}

/**
 * Adds a delta to an unbounded non-negative stat, rejecting a non-finite sum.
 *
 * @param base - Current value; already recovered with `finiteNumberOr`.
 * @param delta - Delta to add.
 * @returns The clamped sum, or the unchanged base when the sum overflows.
 *
 * @remarks
 * Two finite numbers still sum to `Infinity` (`1e308 + 1e308`), and
 * `Math.max(0, Infinity)` is not a finite clamp — the next save serializes the
 * result as `null`. Stats without an upper bound therefore need the *result*
 * validated, not just the operands. An unrepresentable sum leaves the base
 * untouched rather than resetting it, so a hostile addend cannot wipe progress.
 */
export const addClampedNonNegative = (base: number, delta: number): number => {
  const next = Math.max(0, base + delta)
  return Number.isFinite(next) ? next : clampNonNegative(base)
}

/**
 * Normalizes unknown numeric input to a non-negative integer.
 *
 * @param value - Unknown value to normalize; non-numbers are never coerced.
 * @returns Non-negative integer, or 0 for anything but a finite number.
 */
export const clampToNonNegativeInt = (value: unknown): number =>
  isFiniteNumber(value) ? Math.max(0, Math.floor(value)) : 0

const MAX_UNIT_RANDOM_EXCLUSIVE = 0.9999999999999999

/**
 * Clamps unknown random input into the valid 0-inclusive, 1-exclusive range.
 *
 * @param value - Unknown random value to normalize.
 * @returns Clamped random value, or undefined for non-finite input.
 */
export const clampUnitRandom = (value: unknown): number | undefined => {
  if (!isFiniteNumber(value)) return undefined
  const n = value
  if (n < 0) return 0
  if (n >= 1) return MAX_UNIT_RANDOM_EXCLUSIVE
  return n
}

/**
 * Clamps a band member's stamina to be between 0 and their staminaMax (default 100).
 *
 * @param stamina - Candidate stamina value.
 * @param staminaMax - The member's maximum stamina. Defaults to `100`.
 * @returns Clamped stamina value.
 */
export const clampMemberStamina = (
  stamina: number,
  staminaMax = 100
): number => {
  if (!Number.isFinite(stamina)) return 0
  const resolvedStaminaMax = Number.isFinite(staminaMax) ? staminaMax : 100
  return Math.max(0, Math.min(resolvedStaminaMax, Math.floor(stamina)))
}

/**
 * Clamps a band member's mood to be between 0 and 100.
 *
 * @param mood - Candidate mood value.
 * @returns Clamped mood value.
 */
export const clampMemberMood = (mood: number): number => clamp0to100(mood)

/**
 * Maps a 0..100 percentage onto an N-step integer scale (0..steps).
 * Shared by the brutalist HUD meters which all render block-bar gauges.
 *
 * @param value - Percentage value in the 0..100 domain.
 * @param steps - Number of display steps in the target scale.
 * @returns Integer value in the range 0..steps.
 */
export const normalizePercentageToScale = (
  value: number,
  steps: number
): number => {
  if (!Number.isFinite(value) || !Number.isFinite(steps) || steps <= 0) return 0
  const clamped = clamp0to100(value)
  return Math.round((clamped / 100) * steps)
}

/**
 * Clamps player fame to be at least 0.
 *
 * @param fame - Candidate fame value.
 * @returns Clamped non-negative fame value.
 */
export const clampPlayerFame = (fame: number): number => {
  if (!Number.isFinite(fame)) return 0
  return Math.max(0, Math.floor(fame))
}

/**
 * Clamps finite numeric input to an integer percentage range.
 *
 * @param value - Candidate percentage value.
 * @returns Integer clamped to the range 0..100.
 */
export const clamp0to100 = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.floor(value)))
}

/**
 * Clamps unknown input to the 0..100 percentage range without rounding.
 *
 * @remarks
 * Unlike {@link clamp0to100}, this keeps fractional values (e.g. condition,
 * pressure or tempo that accumulate in sub-integer steps) and never coerces:
 * only finite numbers are accepted, so booleans, numeric strings and arrays
 * resolve to `fallback`.
 *
 * @param value - Unknown value crossing a state, storage, or payload boundary.
 * @param fallback - Value used when `value` is not a finite number. Defaults to `0`.
 * @returns The value clamped to `0..100`, or `fallback` for non-finite input.
 */
export const clampPercent = (value: unknown, fallback = 0): number =>
  Math.max(0, Math.min(100, finiteNumberOr(value, fallback)))

/**
 * Adds a delta to a stored 0..100 percentage and range-clamps the sum.
 *
 * @remarks
 * Use this instead of `clampPercent(base + delta)`. Two finite numbers still
 * sum to `±Infinity` (`Number.MAX_VALUE * 2`), and `clampPercent` treats a
 * non-finite value as malformed input and returns its fallback, so an
 * overflowing gain would reset the stat to `0` instead of capping at `100`.
 * `clampPercent` itself keeps rejecting `Infinity`, because for a loaded save
 * that value is corruption rather than "very large".
 *
 * @param base - Stored percentage; recovered with `finiteNumberOr` first.
 * @param delta - Finite delta, possibly the result of an overflowing product.
 * @returns The sum clamped to `0..100`; `+Infinity` caps at `100`, `-Infinity`
 * floors at `0`.
 */
export const addClampedPercent = (base: unknown, delta: number): number => {
  const sum = finiteNumberOr(base, 0) + delta
  return Number.isNaN(sum) ? 0 : Math.max(0, Math.min(100, sum))
}

/**
 * Clamps unknown input to the band-member skill range 1..10 without flooring.
 *
 * @remarks
 * Skill rewards and event skill deltas add whole or fractional steps to
 * `baseStats.skill`, and the load sanitizer keeps the stored value as-is, so
 * flooring here would silently discard a fractional increment. Only finite
 * numbers are accepted; everything else resolves to `fallback`.
 *
 * @param value - Unknown value crossing a state, storage, or payload boundary.
 * @param fallback - Value used when `value` is not a finite number. Defaults to `1`.
 * @returns The value clamped to `1..10`, or the clamped `fallback`.
 */
export const clampMemberSkill = (value: unknown, fallback = 1): number =>
  Math.max(1, Math.min(10, finiteNumberOr(value, fallback)))

/**
 * Clamps finite numeric input to the reputation range.
 *
 * @param value - Candidate reputation value.
 * @returns Integer clamped to the range -100..100.
 */
export const clampReputation = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(-100, Math.min(100, Math.floor(value)))
}

/**
 * Clamps an amp-calibration dial value to its valid 0..1000 range.
 *
 * Non-finite inputs collapse to 0. The result is kept as a floating-point
 * number to preserve sub-integer dial precision.
 *
 * @param value - Candidate dial value.
 * @returns Value clamped to the amp dial range.
 */
export const clampAmpDial = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1000, value))
}

/**
 * Clamps a social controversy level to be between 0 and 100.
 *
 * @param level - Candidate controversy level.
 * @returns Clamped controversy level in range [0, 100].
 */
export const clampControversyLevel = (level: number): number =>
  clamp0to100(level)

/**
 * Clamps player money to a safe, non-negative integer.
 * Prevents negative balances and ensures integer boundaries.
 *
 * @param money - Candidate money value.
 * @returns Clamped money value ensuring non-negative integer.
 */
export const clampPlayerMoney = (money: number): number => {
  if (!Number.isFinite(money)) return 0
  return Math.floor(Math.max(0, money))
}

/**
 * Clamps relationship score to the canonical gameplay range.
 *
 * @param score - Candidate relationship score.
 * @returns Clamped relationship value in range [0, 100].
 */
export const clampRelationship = (score: number): number => {
  if (!Number.isFinite(score)) return RELATIONSHIP_DEFAULT_SCORE
  return Math.max(
    RELATIONSHIP_MIN_SCORE,
    Math.min(RELATIONSHIP_MAX_SCORE, Math.round(score))
  )
}

/**
 * Clamps band harmony to the canonical gameplay range.
 *
 * @param harmony - Candidate harmony value.
 * @returns Clamped harmony value in range [1, 100].
 */
export const clampBandHarmony = (harmony: number): number => {
  if (!Number.isFinite(harmony)) return 1
  const safeHarmony = Math.floor(harmony)
  return Math.max(1, Math.min(100, safeHarmony))
}

/**
 * Clamps social loyalty to the canonical gameplay range.
 *
 * @param loyalty - Candidate loyalty value.
 * @returns Clamped loyalty value in range [0, 100].
 */
export const clampLoyalty = (loyalty: number): number => clamp0to100(loyalty)

/**
 * Clamps band stress to the canonical 0-100 range.
 *
 * @param stress - Candidate stress value.
 * @returns Stress clamped to the range 0..100.
 */
export const clampBandStress = (stress: number): number => clamp0to100(stress)

/**
 * Clamps social zealotry to the canonical gameplay range.
 *
 * @param zealotry - Candidate zealotry value.
 * @returns Clamped zealotry value in range [0, 100].
 */
export const clampZealotry = (zealotry: number): number => clamp0to100(zealotry)

/**
 * Clamps van condition to the allowed percentage (0-100).
 *
 * @param condition - Candidate condition value.
 * @returns Clamped condition value.
 */
export const clampVanCondition = (condition: number): number =>
  clamp0to100(condition)

/**
 * Clamps the van's persisted breakdown probability to its gameplay range.
 * @param chance - Candidate breakdown probability.
 * @returns Breakdown probability in the inclusive range 0..0.5.
 */
export const clampVanBreakdownChance = (chance: number): number =>
  Math.max(0, Math.min(0.5, finiteNumberOr(chance, 0)))

/**
 * Wraps a flavor-clock hour into the 0..23 day range.
 *
 * @remarks
 * `player.time` is a cosmetic time-of-day clock that event "lost hours"
 * effects move. It must stay a sane hour — historically it accumulated
 * unbounded (negative) values because deltas were applied without wrapping.
 *
 * @param hour - Candidate hour value.
 * @returns The hour wrapped into 0..23; non-finite input falls back to 12.
 */
export const wrapClockHour = (hour: number): number => {
  if (!Number.isFinite(hour)) return 12
  return ((hour % 24) + 24) % 24
}

/**
 * Clamps van fuel to the allowed capacity.
 *
 * @param fuel - Candidate fuel value.
 * @param maxFuel - Maximum capacity.
 * @returns Clamped fuel value.
 */
export const clampVanFuel = (
  fuel: number,
  maxFuel = EXPENSE_CONSTANTS.transport.maxFuel
): number => {
  if (!Number.isFinite(fuel)) return 0
  return Math.max(0, Math.min(maxFuel, fuel))
}

/**
 * Truncates an unknown numerical input into a safe, bounded non-negative integer.
 *
 * @param value - Unknown value to coerce.
 * @param max - Maximum allowed value.
 * @returns Non-negative integer between 0 and max, or 0 for non-finite input.
 */
export const toBoundedNonNegativeInteger = (
  value: unknown,
  max: number
): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    return 0
  // `-0` passes `value < 0` and survives `Math.floor`/`Math.min` as `-0`, which
  // renders with a leading minus and flips `signDisplay`. Normalize it here so
  // the sanitizer's output is genuinely non-negative.
  const bounded = Math.min(Math.floor(value), Math.floor(max))
  return bounded === 0 ? 0 : bounded
}

/**
 * Clamps band luck to be non-negative. Preserves values above 100 to allow
 * equipment bonuses and accumulated effects to stack properly.
 *
 * @param luck - Candidate luck value.
 * @returns Luck clamped to a minimum of 0.
 */
export const clampLuck = (luck: number): number => {
  const val = Number.isFinite(luck) ? luck : 0
  return Math.max(0, Math.floor(val))
}
