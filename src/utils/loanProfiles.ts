export type LoanProfileId =
  | 'shortTerm'
  | 'mediumTerm'
  | 'longTerm'
  | 'loanShark'
  | 'coop'

export interface LoanProfile {
  id: LoanProfileId
  termDays: number
  /**
   * Annual interest rate (e.g., 0.08 = 8%/year). `computeAmortization` divides
   * by 365 internally to derive the daily rate.
   */
  interestRate: number
  labelKey: string
  minFameRequired?: number
  minScenePresenceRequired?: number
}

export const LOAN_PROFILES: Record<LoanProfileId, LoanProfile> = {
  shortTerm: {
    id: 'shortTerm',
    termDays: 60,
    interestRate: 0.08,
    labelKey: 'assets:loan.profile.shortTerm'
  },
  mediumTerm: {
    id: 'mediumTerm',
    termDays: 120,
    interestRate: 0.06,
    labelKey: 'assets:loan.profile.mediumTerm'
  },
  longTerm: {
    id: 'longTerm',
    termDays: 180,
    interestRate: 0.04,
    labelKey: 'assets:loan.profile.longTerm'
  },
  loanShark: {
    id: 'loanShark',
    termDays: 30,
    interestRate: 0.2,
    labelKey: 'assets:loan.profile.loanShark'
  },
  coop: {
    id: 'coop',
    termDays: 240,
    interestRate: 0.02,
    labelKey: 'assets:loan.profile.coop',
    minScenePresenceRequired: 50
  }
}

export const REFINANCE_FEE_RATE = 0.02

export const isLoanProfileEligible = (
  profile: LoanProfile,
  values: { fame: number; scenePresence: number }
): boolean => {
  if (!Number.isFinite(values.fame) || !Number.isFinite(values.scenePresence)) {
    return false
  }
  if (
    profile.minFameRequired !== undefined &&
    values.fame < profile.minFameRequired
  ) {
    return false
  }
  if (
    profile.minScenePresenceRequired !== undefined &&
    values.scenePresence < profile.minScenePresenceRequired
  ) {
    return false
  }
  return true
}

export const calculateRefinanceFee = (principal: number): number => {
  if (!Number.isFinite(principal) || principal <= 0) return 0
  return Math.ceil(principal * REFINANCE_FEE_RATE)
}

/**
 * Computes the fixed daily payment for an amortizing loan.
 *
 * @param principal - Principal in EUR.
 * @param annualInterestRate - Annual interest rate (e.g., 0.08 = 8%/year).
 *   The function divides by 365 to derive the daily compounding rate.
 * @param termDays - Loan term in days.
 *
 * Zero-interest loans return `principal / termDays` exactly. Otherwise uses
 * the standard amortization formula:
 *
 *   p = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
 *
 * where r = annualRate / 365, n = termDays.
 */
export const computeAmortization = (
  principal: number,
  annualInterestRate: number,
  termDays: number
): number => {
  // Guard the formula's failure modes (NaN/Infinity from zero-term or
  // non-finite inputs). Returning 0 is the safest fallback — the caller
  // turns it into a no-op daily payment rather than a crash.
  if (
    !Number.isFinite(principal) ||
    !Number.isFinite(annualInterestRate) ||
    !Number.isFinite(termDays) ||
    termDays <= 0
  ) {
    return 0
  }
  if (annualInterestRate === 0) return principal / termDays
  const r = annualInterestRate / 365
  return (principal * (r * (1 + r) ** termDays)) / ((1 + r) ** termDays - 1)
}
