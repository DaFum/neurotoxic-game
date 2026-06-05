/**
 * Canonical result shape for richer validators that surface a translatable
 * error message to the UI when a precondition fails. Use this when a caller
 * needs to display the error to the user; for purely internal gate checks
 * (e.g. `validateBloodBankDonation`, `validatePirateBroadcast`,
 * `validateDarkWebLeak`) a plain `boolean` is preferred — those validators
 * are followed by their own toast/log path and never propagate the rich
 * shape upward.
 *
 * @remarks
 * A false result with `silent: true` means the caller should stop without
 * showing an error. A false result with `errorKey` and `defaultMessage` is meant
 * for user-facing feedback.
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
