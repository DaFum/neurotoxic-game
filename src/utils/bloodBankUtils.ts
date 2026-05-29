import type { BandState } from '../types'
import { isFiniteNumber } from './finiteNumber'

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
