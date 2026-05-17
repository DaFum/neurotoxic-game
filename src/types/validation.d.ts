/**
 * Canonical result shape for richer validators that surface a translatable
 * error message to the UI when a precondition fails. Use this when a caller
 * needs to display the error to the user; for purely internal gate checks
 * (e.g. `validateBloodBankDonation`, `validatePirateBroadcast`,
 * `validateDarkWebLeak`) a plain `boolean` is preferred — those validators
 * are followed by their own toast/log path and never propagate the rich
 * shape upward.
 */
export type ValidationResult =
  | {
      isValid: true
      errorKey?: undefined
      defaultMessage?: undefined
      silent?: boolean
    }
  | {
      isValid: false
      errorKey: string
      defaultMessage: string
      silent?: boolean
    }
  | {
      isValid: false
      silent: true
      errorKey?: undefined
      defaultMessage?: undefined
    }
