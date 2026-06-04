import type { BandState } from '../types'
import { isFiniteNumber } from './finiteNumber'

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
