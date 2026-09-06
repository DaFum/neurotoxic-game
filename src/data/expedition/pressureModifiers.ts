/**
 * The Tour Pressure modifiers an ascended Career can stack onto a run.
 *
 * @remarks
 * Every modifier is a trade: it raises the run's reward and makes the run
 * harder in one specific, named way. There is no modifier that only pays and
 * none that only hurts, so picking three is a difficulty choice rather than a
 * strictly-better build.
 *
 * The reward half is deliberately *additive* (`1 + Σ bonus`) rather than
 * multiplicative. Three multiplied bonuses compound into a payout the rest of
 * the economy was never balanced against; summed, the ceiling is exactly the
 * three richest bonuses and it is knowable from this table alone.
 */

import type {
  ExpeditionNumericRules,
  ExpeditionRuleFlags
} from '../../types/expedition'

/** Canonical Tour Pressure modifier ids. */
export type ExpeditionPressureModifierId =
  | 'bad_roads'
  | 'media_frenzy'
  | 'no_safety_net'
  | 'union_trouble'
  | 'hostile_territory'

/** One modifier: what it pays and what it costs. */
export interface ExpeditionPressureModifierDefinition {
  id: ExpeditionPressureModifierId
  /** Added to the run's reward multiplier, never multiplied into it. */
  rewardBonus: number
  /** The modifier's cost, composed like every other numeric contribution. */
  numeric: Partial<ExpeditionNumericRules>
  /** Discrete rules the modifier turns on. */
  flags?: Partial<ExpeditionRuleFlags>
}

/** Every Tour Pressure modifier, keyed by its canonical id. */
export const EXPEDITION_PRESSURE_MODIFIERS = {
  bad_roads: {
    id: 'bad_roads',
    rewardBonus: 0.15,
    numeric: { roadWearMultiplier: 1.3 }
  },
  media_frenzy: {
    id: 'media_frenzy',
    rewardBonus: 0.2,
    numeric: { exposureGainMultiplier: 2 }
  },
  no_safety_net: {
    id: 'no_safety_net',
    rewardBonus: 0.25,
    numeric: { extractionRetentionMultiplier: 0.75 },
    // The run stops being cushioned after a severe event. It never *raises*
    // severe weight - it only removes the damping the relief window applies.
    flags: { severeReliefBypass: true }
  },
  union_trouble: {
    id: 'union_trouble',
    rewardBonus: 0.15,
    numeric: { crewStressMultiplier: 1.25 }
  },
  hostile_territory: {
    id: 'hostile_territory',
    rewardBonus: 0.2,
    numeric: { rivalEventWeightMultiplier: 1.5 }
  }
} as const satisfies Record<
  ExpeditionPressureModifierId,
  ExpeditionPressureModifierDefinition
>

/** Every modifier id, for iteration and registry invariants. */
export const EXPEDITION_PRESSURE_MODIFIER_IDS = Object.keys(
  EXPEDITION_PRESSURE_MODIFIERS
) as readonly ExpeditionPressureModifierId[]

/** How many unique modifiers one run may carry. */
export const MAX_EXPEDITION_PRESSURE_MODIFIERS = 3

/**
 * The highest reward multiplier the registry can ever produce.
 *
 * @remarks
 * The three richest bonuses summed. Published so the composition can assert
 * against it rather than against a number written twice.
 */
export const MAX_EXPEDITION_PRESSURE_REWARD_MULTIPLIER =
  1 +
  [...EXPEDITION_PRESSURE_MODIFIER_IDS]
    .map(id => EXPEDITION_PRESSURE_MODIFIERS[id].rewardBonus)
    .sort((a, b) => b - a)
    .slice(0, MAX_EXPEDITION_PRESSURE_MODIFIERS)
    .reduce((sum, bonus) => sum + bonus, 0)

/**
 * Narrows an untrusted value to a known modifier id.
 *
 * @param value - Raw candidate, typically from a payload or a save.
 * @returns True when the id is in the registry.
 */
export const isExpeditionPressureModifierId = (
  value: unknown
): value is ExpeditionPressureModifierId =>
  typeof value === 'string' &&
  Object.hasOwn(EXPEDITION_PRESSURE_MODIFIERS, value)

/**
 * Reads a modifier, or `null` for an id the registry does not have.
 *
 * @param modifierId - Candidate id.
 * @returns The definition, or `null`.
 */
export const getExpeditionPressureModifier = (
  modifierId: unknown
): ExpeditionPressureModifierDefinition | null =>
  isExpeditionPressureModifierId(modifierId)
    ? EXPEDITION_PRESSURE_MODIFIERS[modifierId]
    : null
