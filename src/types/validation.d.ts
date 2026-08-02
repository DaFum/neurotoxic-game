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
 * `silent` is the discriminant between the two failure branches. A false
 * result with `silent: false` is the user-facing branch and carries
 * `errorKey` and `defaultMessage`. A false result with `silent: true` is the
 * no-message branch: the caller should stop without showing an error.
 */
export type ValidationResult =
  | {
      isValid: true
    }
  | {
      isValid: false
      silent: false
      errorKey: string
      defaultMessage: string
    }
  | {
      isValid: false
      silent: true
    }
