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
