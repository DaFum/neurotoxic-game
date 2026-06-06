/**
 * Fame reward tuning constants.
 * GIG_BASE_REWARD      – Flat fame awarded for any passing gig (perfScore ≥ 31).
 * GIG_SCORE_MULTIPLIER – Additional fame per perfScore point on top of the base.
 */
export const FAME_PROGRESS_CONSTANTS = Object.freeze({
  GIG_BASE_REWARD: 100,
  GIG_SCORE_MULTIPLIER: 10,
  DIMINISHING_RETURNS_START: 30000,
  DIMINISHING_RETURNS_RATE: 0.0001
})

// Shared Balance Constants
/**
 * Shared balance constants for fame loss, cancellations, sponsorships, and drains.
 */
export const BALANCE_CONSTANTS = {
  FAME_LOSS_BAD_GIG: 9,
  MAX_FAME_GAIN: 2000,
  LOW_HARMONY_THRESHOLD: 15,
  LOW_HARMONY_CANCELLATION_CHANCE: 0.2,
  // Miss-penalty on bad gigs (perfScore < 62)
  MISS_TOLERANCE: 8,
  MISS_PENALTY_RATE: 1.2, // fame loss per excess miss (was 0.5)
  MISS_MONEY_PENALTY: 12, // €12 per excess miss (direct money deduction)
  // Sponsor daily payout range (fame-scaled)
  SPONSORSHIP_PAYOUT_FLOOR: 200,
  SPONSORSHIP_PAYOUT_CAP: 380,
  // Wealth-scaled daily drain thresholds
  WEALTH_DRAIN_THRESHOLD: 2000,
  WEALTH_DRAIN_CHANCE: 0.12,
  WEALTH_DRAIN_MIN_RATE: 0.015,
  WEALTH_DRAIN_MAX_RATE: 0.05
}

/**
 * Relationship-loss multiplier applied by grudge-holder traits.
 */
export const RELATIONSHIP_GRUDGE_HOLDER_MULTIPLIER = 1.5

/**
 * Relationship-gain multiplier applied by peacemaker traits.
 */
export const RELATIONSHIP_PEACEMAKER_POSITIVE_MULTIPLIER = 1.5

/**
 * Relationship-loss multiplier applied by peacemaker traits.
 */
export const RELATIONSHIP_PEACEMAKER_NEGATIVE_MULTIPLIER = 0.5

/**
 * Default relationship score for missing relationship entries.
 */
export const RELATIONSHIP_DEFAULT_SCORE = 50

/**
 * Lower bound for persisted relationship scores after normalization.
 */
export const RELATIONSHIP_MIN_SCORE = 0

/**
 * Upper bound for persisted relationship scores after normalization.
 */
export const RELATIONSHIP_MAX_SCORE = 100
