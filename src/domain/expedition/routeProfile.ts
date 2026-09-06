/**
 * The one owner of a run's route and content weighting.
 *
 * @remarks
 * Numeric rules decide how much a thing is worth; these weights decide how
 * often the route offers it at all. Both axes are needed for a Region or Tour
 * to feel different, and both have exactly one composition path — this module
 * is the second one. Every consumer imports
 * {@link getExpeditionRoutePressureProfile}; none of them branches on a Region
 * or Tour id of its own.
 */

import type { GameState } from '../../types'
import type {
  ExpeditionRoutePressureProfile,
  ExpeditionRouteProfile
} from '../../types/expedition'
import { getExpeditionRegion } from '../../data/expedition/regions'
import { getExpeditionTourType } from '../../data/expedition/tourTypes'
import { getExpeditionFameProfile } from './fame'
import { NEUTRAL_EXPEDITION_ROUTE_PROFILE } from './defaults'
import { finiteNumberOr, isFiniteNumber } from '../../utils/finiteNumber'

/** Baseline weighting: every category as likely as the route builder makes it. */
export const BASE_EXPEDITION_ROUTE_PRESSURE_PROFILE: Readonly<ExpeditionRoutePressureProfile> =
  {
    supplyNodeWeightMultiplier: 1,
    technicalNodeWeightMultiplier: 1,
    festivalHighProfileNodeWeightMultiplier: 1,
    sponsorContractEventWeightMultiplier: 1,
    undergroundNodeWeightMultiplier: 1,
    rivalNodeWeightMultiplier: 1,
    gigNodeWeightMultiplier: 1,
    recoveryNodeWeightMultiplier: 1,
    forcedRival: false
  }

/**
 * Weights stay inside this band however many stages multiply into them.
 *
 * @remarks
 * Composition is multiplicative across five stages, so without a clamp a
 * Rival-hunt Tour in an underground Region against a high Nemesis could push a
 * category far enough to crowd every other one out of the route.
 */
const MIN_WEIGHT = 0.25
const MAX_WEIGHT = 3.0

const clampWeight = (value: number): number =>
  Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, value))

/** The weight keys, so composition never misses one a type later adds. */
const WEIGHT_KEYS = [
  'supplyNodeWeightMultiplier',
  'technicalNodeWeightMultiplier',
  'festivalHighProfileNodeWeightMultiplier',
  'sponsorContractEventWeightMultiplier',
  'undergroundNodeWeightMultiplier',
  'rivalNodeWeightMultiplier',
  'gigNodeWeightMultiplier',
  'recoveryNodeWeightMultiplier'
] as const satisfies readonly (keyof Omit<
  ExpeditionRoutePressureProfile,
  'forcedRival'
>)[]

/**
 * The run-stable half: Region and Tour only.
 *
 * @param regionId - Committed Region id.
 * @param tourTypeId - Committed Tour Type id.
 * @returns The composed, clamped profile with no live signals in it.
 *
 * @remarks
 * Both inputs are frozen at START, so this is safe for anything the run
 * commits once and must keep — the route and the staged Sponsor offers.
 */
export const getExpeditionStaticRoutePressureProfile = (
  regionId: unknown,
  tourTypeId: unknown
): ExpeditionRoutePressureProfile => {
  const region = getExpeditionRegion(regionId)
  const tour = getExpeditionTourType(tourTypeId)
  const composed = {} as ExpeditionRoutePressureProfile
  for (const key of WEIGHT_KEYS) {
    composed[key] = clampWeight(
      BASE_EXPEDITION_ROUTE_PRESSURE_PROFILE[key] *
        finiteNumberOr(region?.route?.[key], 1) *
        finiteNumberOr(tour?.route?.[key], 1)
    )
  }
  composed.forcedRival = tour?.forcedRival ?? false
  return composed
}

/**
 * The full profile, including the signals that move during a run.
 *
 * @param state - Current game state.
 * @returns The composed, clamped profile.
 *
 * @remarks
 * Composition order is Base -\> Region -\> Tour Type -\> Fame -\> Nemesis, which
 * is the order the design reads them in: where the run is, what kind of Tour it
 * is, how much attention the band draws, and how personal the feud has become.
 * Fame contributes only the high-profile signal — it is an attention signal,
 * not a route editor — and the Nemesis contributes only Rival weighting.
 *
 * A Region may also declare a Heat ceiling above which corporate Sponsors stop
 * signing its runs. That is a hard eligibility rule rather than a weight, so it
 * bypasses the clamp: a floored multiplier would still offer the family.
 *
 * Use this for anything evaluated live during a run. Anything the run
 * *commits* — the route itself, the staged Sponsor offers — must use
 * {@link getExpeditionStaticRoutePressureProfile} instead, because Fame and the
 * Nemesis both move and a committed thing that silently re-derives differently
 * later is a route or an offer set that changes under the player.
 */
export const getExpeditionRoutePressureProfile = (
  state: GameState
): ExpeditionRoutePressureProfile => {
  const loadout = state.expedition?.loadout ?? null
  const stable = getExpeditionStaticRoutePressureProfile(
    loadout?.regionId,
    loadout?.tourTypeId
  )
  const fame = getExpeditionFameProfile(state)

  // The Region's own rule, read as data: no Region id appears here.
  const heatCeiling = getExpeditionRegion(
    loadout?.regionId
  )?.corporateSponsorHeatCeiling
  const corporateSponsorsRefuse =
    isFiniteNumber(heatCeiling) &&
    finiteNumberOr(state.expedition?.pressure?.heat, 0) >= heatCeiling

  const rivalRecord = state.rivalBand
    ? state.career?.rivalsById?.[state.rivalBand.id]
    : undefined
  const nemesisLevel = finiteNumberOr(rivalRecord?.history?.nemesisLevel, 0)
  // A feud the Career has actually driven pulls the route toward the Rival,
  // one tenth per tier, rather than switching to a different route shape.
  const nemesisRivalWeight = 1 + Math.max(0, Math.min(4, nemesisLevel)) * 0.1

  return {
    ...stable,
    sponsorContractEventWeightMultiplier: corporateSponsorsRefuse
      ? 0
      : stable.sponsorContractEventWeightMultiplier,
    festivalHighProfileNodeWeightMultiplier: clampWeight(
      stable.festivalHighProfileNodeWeightMultiplier *
        fame.highProfileNodeWeightMultiplier
    ),
    rivalNodeWeightMultiplier: clampWeight(
      stable.rivalNodeWeightMultiplier * nemesisRivalWeight
    ),
    // A Tour that hunts the Rival forces the encounter; a Nemesis the Career
    // has driven to the top tier does the same, because at that point the feud
    // is the run whatever Tour was booked.
    forcedRival: stable.forcedRival || nemesisLevel >= 4
  }
}

/**
 * Derives the route profile the map is built from.
 *
 * @param regionId - Committed Region id.
 * @param tourTypeId - Committed Tour Type id.
 * @returns The G1 route profile those two produce.
 *
 * @remarks
 * The map's own contract is unchanged — it still takes an
 * `ExpeditionRouteProfile` — but the values now come from the Region and Tour
 * registries instead of a neutral constant. That is what makes a Region change
 * the route rather than only the numbers, and it is why this reads the
 * run-stable half: the route is committed once and re-derived on every load,
 * so a live signal in here would move the map under an in-flight run.
 */
export const deriveExpeditionRouteProfile = (
  regionId: unknown,
  tourTypeId: unknown
): ExpeditionRouteProfile => {
  const weights = getExpeditionStaticRoutePressureProfile(regionId, tourTypeId)
  const tour = getExpeditionTourType(tourTypeId)
  return {
    meaningfulNodeCount:
      tour?.depth ?? NEUTRAL_EXPEDITION_ROUTE_PROFILE.meaningfulNodeCount,
    undergroundWeight: weights.undergroundNodeWeightMultiplier,
    rivalWeight: weights.rivalNodeWeightMultiplier,
    festivalWeight: weights.festivalHighProfileNodeWeightMultiplier,
    restWeight: weights.recoveryNodeWeightMultiplier,
    supplyWeight: weights.supplyNodeWeightMultiplier,
    gigWeight: weights.gigNodeWeightMultiplier,
    extractionWindowRange:
      tour?.extractionWindowRange ??
      NEUTRAL_EXPEDITION_ROUTE_PROFILE.extractionWindowRange,

    // A Tour that hunts the Rival guarantees one; everything else takes the
    // weighted chance its Region and Tour add up to.
    forcedRival: weights.forcedRival
  }
}
