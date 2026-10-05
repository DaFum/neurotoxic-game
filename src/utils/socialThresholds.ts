import { BALANCE_CONFIG } from '../config/balance'
import { finiteNumberOr } from './finiteNumber'

/** Controversy level at which the audience counts as scandal-hit. */
export const HIGH_CONTROVERSY_THRESHOLD =
  BALANCE_CONFIG.social.highControversyThreshold

/** Loyalty a scandal-hit audience still needs to rally behind the band. */
const CULT_LOYALTY_THRESHOLD = BALANCE_CONFIG.social.cultLoyaltyThreshold

/**
 * Whether controversy has crossed the shared high-controversy gate.
 *
 * @param controversyLevel - Persisted controversy; non-finite counts as `0`.
 * @returns True at or above {@link HIGH_CONTROVERSY_THRESHOLD}.
 */
export const isHighControversy = (controversyLevel: unknown): boolean =>
  finiteNumberOr(controversyLevel, 0) >= HIGH_CONTROVERSY_THRESHOLD

/**
 * Whether a scandal-hit audience still has enough loyalty to rally (the "cult"
 * gate shared by merch demand and the emergency merch-drive post).
 *
 * @param controversyLevel - Persisted controversy; non-finite counts as `0`.
 * @param loyalty - Persisted loyalty; non-finite counts as `0`.
 * @returns True when both the controversy and loyalty gates are met.
 */
export const isCultAudience = (
  controversyLevel: unknown,
  loyalty: unknown
): boolean =>
  isHighControversy(controversyLevel) &&
  finiteNumberOr(loyalty, 0) >= CULT_LOYALTY_THRESHOLD
