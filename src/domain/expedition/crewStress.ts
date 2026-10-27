import { finiteNumberOr } from '../../utils/finiteNumber'
import { clampPercentRounded } from '../../utils/gameState/clamps'
import type { ExpeditionCrewStressSourceType } from '../../types/expedition'

export const CREW_STRESS_SOURCE_DELTAS: Readonly<
  Record<ExpeditionCrewStressSourceType, number>
> = {
  travel: 5,
  poor_gig: 10,
  crew_event: 8,
  authority_event: 12,
  rest: -15,
  successful_gig: -5
}

/**
 * Extra Stress a rest recovers when the visit spends one packed supply.
 *
 * @remarks
 * Provisional balance value pending review: it is the only number supplies
 * contribute, and it was chosen small so packing supplies is a modest trade
 * against the cargo slots they occupy.
 */
export const EXPEDITION_SUPPLY_REST_STRESS_BONUS = 10

export const applyCrewStressDelta = (
  current: number,
  delta: number,
  positiveMultiplier: number
): number => {
  // Persisted stress and the rule multiplier are untrusted: a NaN in either
  // would otherwise survive `Math.max`/`Math.min` and be written back.
  const safeCurrent = finiteNumberOr(current, 0)
  const safeDelta = finiteNumberOr(delta, 0)
  const scaled =
    safeDelta > 0
      ? safeDelta * finiteNumberOr(positiveMultiplier, 1)
      : safeDelta
  return clampPercentRounded(safeCurrent + scaled)
}

export const getCrewStressBand = (
  stress: number
): 'stable' | 'tense' | 'crisis' | 'severe' =>
  stress >= 90
    ? 'severe'
    : stress >= 70
      ? 'crisis'
      : stress >= 40
        ? 'tense'
        : 'stable'

/**
 * Classifies a finished gig's Crew stress consequence.
 *
 * @remarks
 * A failed or forfeited gig never earns the successful-gig relief, however
 * accurate the notes played before it ended: it counts as a poor gig. Between
 * 60 and 80 accuracy a completed gig has no Crew consequence.
 *
 * @param stats - Terminal gig flag and accuracy (0-100).
 * @returns The stress source type, or `null` when the gig has no consequence.
 */
export const classifyGigCrewStress = (stats: {
  accuracy?: unknown
  failed?: unknown
}): 'poor_gig' | 'successful_gig' | null => {
  if (stats.failed === true) return 'poor_gig'
  const accuracy = stats.accuracy
  if (typeof accuracy !== 'number' || !Number.isFinite(accuracy)) return null
  if (accuracy < 60) return 'poor_gig'
  return accuracy >= 80 ? 'successful_gig' : null
}
