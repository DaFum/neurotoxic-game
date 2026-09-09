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
): number =>
  Math.max(
    0,
    Math.min(
      100,
      Math.round(current + (delta > 0 ? delta * positiveMultiplier : delta))
    )
  )

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
