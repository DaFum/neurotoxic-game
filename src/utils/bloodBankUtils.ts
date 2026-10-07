import type { BandState } from '../types'
import { finiteNumberOr, isFiniteNumber } from './finiteNumber'

/**
 * Validates whether the band can pay the harmony and stamina cost for a blood-bank donation.
 *
 * @param band - Band state slice to validate.
 * @param config - Donation harmony and stamina costs.
 * @returns True when harmony is above cost and every member can survive the stamina drain.
 */
export const validateBloodBankDonation = (
  band: Partial<BandState> | undefined | null,
  config: { harmonyCost: number; staminaCost: number }
) => {
  if (!band || !band.members || band.members.length === 0) return false
  if (!isFiniteNumber(band.harmony)) return false
  const hasEnoughHarmony = band.harmony > config.harmonyCost
  // Need enough stamina to survive the drain
  const minStaminaRequired = config.staminaCost + 10
  const allMembersHaveStamina = band.members.every(
    m => isFiniteNumber(m.stamina) && m.stamina >= minStaminaRequired
  )
  return hasEnoughHarmony && allMembersHaveStamina
}

/** Extra payout fraction a blood-bank donation earns per fame level. */
const FAME_PAYOUT_STEP = 0.2

/**
 * Computes the cash a blood-bank donation pays at the player's fame level.
 *
 * @param baseMoney - Variant base payout (blood or marrow).
 * @param fameLevel - Persisted fame level; non-finite values count as `0` so a
 * corrupted level cannot poison the payout with `NaN`.
 * @returns Whole-euro payout, `floor(baseMoney * (1 + fameLevel * 0.2))`.
 */
export const calculateBloodBankPayout = (
  baseMoney: number,
  fameLevel: unknown
): number =>
  Math.floor(baseMoney * (1 + finiteNumberOr(fameLevel, 0) * FAME_PAYOUT_STEP))
