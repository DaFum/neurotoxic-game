import { finiteNumberOr } from './finiteNumber'
import type { BandMember, BandState } from '../types'

/**
 * Effect types that simply add `value` to a numeric band property
 * (defaulting to 0 when missing). Keys must match BandState fields.
 */
export const ADDITIVE_BAND_EFFECT_FIELDS = {
  luck: 'luck',
  crit: 'crit',
  crowd_control: 'crowdControl',
  affinity: 'affinity',
  style: 'style',
  tour_success: 'tourSuccess',
  gig_modifier: 'gigModifier',
  tempo: 'tempo',
  practice_gain: 'practiceGain'
} as const

/**
 * Effect types historically supported by the equipment apply-on-add path.
 * The contraband consumable path supports a superset; equipment must remain
 * restricted to this list to preserve prior behavior.
 */
export const EQUIPMENT_APPLY_ON_ADD_EFFECTS: ReadonlySet<string> = new Set([
  'luck',
  'stamina_max',
  'guitar_difficulty',
  'crit',
  'crowd_control',
  'affinity',
  'style',
  'tour_success'
])

/**
 * Applies a single equipment/contraband numeric effect to the band, mutating
 * the supplied `newBand` reference. Returns true when a recognized effect was
 * applied; false otherwise (caller may then fall through to specialized paths).
 *
 * @remarks
 * Passing a negated `value` reverts a previously applied effect — the math is
 * an exact additive inverse of the forward application (no floor; the
 * `stamina_max` per-member fan-out is mirrored), which the contraband
 * confiscation and effect-expiry paths rely on.
 *
 * @param newBand - Band reference to mutate in place (caller owns cloning).
 * @param effectType - Contraband effect type to apply.
 * @param value - Signed magnitude to add (negate to revert).
 * @param allowedEffectTypes - When provided, unrecognized-by-set effect types
 * are skipped (used to preserve the equipment apply-on-add allowlist).
 * @returns True when a recognized effect was applied.
 */
export const applySharedBandEffect = (
  newBand: BandState,
  effectType: unknown,
  value: number,
  allowedEffectTypes?: ReadonlySet<string>
): boolean => {
  if (typeof effectType !== 'string') return false
  if (allowedEffectTypes && !allowedEffectTypes.has(effectType)) return false
  if (Object.hasOwn(ADDITIVE_BAND_EFFECT_FIELDS, effectType)) {
    const field =
      ADDITIVE_BAND_EFFECT_FIELDS[
        effectType as keyof typeof ADDITIVE_BAND_EFFECT_FIELDS
      ]
    const band = newBand as unknown as Record<string, number | undefined>
    band[field] = finiteNumberOr(band[field], 0) + finiteNumberOr(value, 0)
    return true
  }
  if (effectType === 'stamina_max') {
    if (!newBand.members || newBand.members.length === 0) return false
    const updatedMembers = [...newBand.members]
    for (let i = 0; i < updatedMembers.length; i++) {
      const currentMember = updatedMembers[i]
      if (currentMember) {
        updatedMembers[i] = {
          ...currentMember,
          staminaMax:
            finiteNumberOr(currentMember.staminaMax, 100) +
            finiteNumberOr(value, 0)
        } as BandMember
      }
    }
    newBand.members = updatedMembers
    return true
  }
  if (effectType === 'guitar_difficulty') {
    // No floor here: apply/revert must be exact additive inverses so a
    // confiscated/expired effect reverts to the original value. The rhythm
    // game clamps the divisor to GUITAR_MIN_DIFFICULTY at read time.
    newBand.performance = {
      ...newBand.performance,
      guitarDifficulty:
        finiteNumberOr(newBand.performance?.guitarDifficulty, 1) +
        finiteNumberOr(value, 0)
    }
    return true
  }
  return false
}
