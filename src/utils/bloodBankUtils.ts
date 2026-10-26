import type { BandState } from '../types'
import { GAME_CONSTANTS } from '../context/gameConstants'
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

/** Donation kinds the blood bank offers. */
type BloodBankDonationKind = 'blood' | 'marrow'

/** What a donation costs and pays, as the reducer applies it. */
export interface BloodBankDonation {
  moneyGain: number
  harmonyCost: number
  staminaCost: number
  controversyGain: number
}

const BLOOD_BANK_DONATIONS = {
  blood: {
    baseMoney: GAME_CONSTANTS.BLOOD_BANK.BLOOD_BASE_MONEY,
    harmonyCost: GAME_CONSTANTS.BLOOD_BANK.BLOOD_HARMONY_COST,
    staminaCost: GAME_CONSTANTS.BLOOD_BANK.BLOOD_STAMINA_COST,
    controversyGain: GAME_CONSTANTS.BLOOD_BANK.BLOOD_CONTROVERSY_GAIN
  },
  marrow: {
    baseMoney: GAME_CONSTANTS.BLOOD_BANK.MARROW_BASE_MONEY,
    harmonyCost: GAME_CONSTANTS.BLOOD_BANK.MARROW_HARMONY_COST,
    staminaCost: GAME_CONSTANTS.BLOOD_BANK.MARROW_STAMINA_COST,
    controversyGain: GAME_CONSTANTS.BLOOD_BANK.MARROW_CONTROVERSY_GAIN
  }
} as const

/**
 * The one place a donation's price and payout are decided.
 *
 * @param kind - Untrusted donation kind from the dispatched payload.
 * @param fameLevel - Persisted fame level scaling the payout.
 * @returns The canonical donation for a known kind, otherwise `null`.
 *
 * @remarks
 * The reducer derives every amount from this, so a dispatched payload can only
 * choose a kind, never a payout; the modal derives its display from the same
 * table, so the two cannot drift.
 */
export const getBloodBankDonation = (
  kind: unknown,
  fameLevel: unknown
): BloodBankDonation | null => {
  if (typeof kind !== 'string' || !Object.hasOwn(BLOOD_BANK_DONATIONS, kind)) {
    return null
  }
  const donation = BLOOD_BANK_DONATIONS[kind as BloodBankDonationKind]
  return {
    moneyGain: calculateBloodBankPayout(donation.baseMoney, fameLevel),
    harmonyCost: donation.harmonyCost,
    staminaCost: donation.staminaCost,
    controversyGain: donation.controversyGain
  }
}
