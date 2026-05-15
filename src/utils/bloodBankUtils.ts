import type { BandState } from '../types'

export const validateBloodBankDonation = (
  band: Partial<BandState> | undefined | null,
  config: { harmonyCost: number; staminaCost: number }
) => {
  if (!band || !band.members || band.members.length === 0) return false
  const hasEnoughHarmony = (band.harmony ?? 0) > config.harmonyCost
  // Need enough stamina to survive the drain
  const minStaminaRequired = config.staminaCost + 10
  const allMembersHaveStamina = band.members.every(
    m => (m.stamina || 0) >= minStaminaRequired
  )
  return hasEnoughHarmony && allMembersHaveStamina
}
