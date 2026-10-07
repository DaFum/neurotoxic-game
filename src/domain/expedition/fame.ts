/**
 * Fame read as a Career and pressure signal.
 *
 * @remarks
 * Fame is deliberately not a currency here. It buys no permanent Expedition
 * capability — the Career rank does that, from accomplishments. What Fame does
 * is change what the world expects of the band and how it reacts to them:
 * which content is open at all, how much the Director leans on expectation,
 * how good the Sponsor pool is, and how much attention a Rival pays.
 */

import type { GameState } from '../../types'
import type { ExpeditionContractTemplate } from '../../types/expedition'
import { finiteNumberOr } from '../../utils/finiteNumber'

/** One Fame band and everything it changes. */
export interface ExpeditionFameProfile {
  band: 'unknown' | 'local' | 'underground' | 'rising' | 'touring' | 'headliner'
  accessTier: 0 | 1 | 2 | 3 | 4 | 5
  expectationPressure: number
  sponsorQualityBias: 0 | 1 | 2
  rivalAttentionMultiplier: number
  highProfileNodeWeightMultiplier: number
}

/** The baseline band, which is also the lookup's fallback. */
const UNKNOWN_FAME_PROFILE: ExpeditionFameProfile = {
  band: 'unknown',
  accessTier: 0,
  expectationPressure: 0,
  sponsorQualityBias: 0,
  rivalAttentionMultiplier: 1.0,
  highProfileNodeWeightMultiplier: 0.9
}

/**
 * The bands in descending order of the Fame they need.
 *
 * @remarks
 * Descending so the lookup returns the first band the value clears, which
 * makes the thresholds readable as the table the plan states them in.
 */
const FAME_BANDS: readonly (ExpeditionFameProfile & { minimumFame: number })[] =
  [
    {
      minimumFame: 10000,
      band: 'headliner',
      accessTier: 5,
      expectationPressure: 80,
      sponsorQualityBias: 2,
      rivalAttentionMultiplier: 1.5,
      highProfileNodeWeightMultiplier: 1.3
    },
    {
      minimumFame: 5000,
      band: 'touring',
      accessTier: 4,
      expectationPressure: 60,
      sponsorQualityBias: 2,
      rivalAttentionMultiplier: 1.35,
      highProfileNodeWeightMultiplier: 1.2
    },
    {
      minimumFame: 2500,
      band: 'rising',
      accessTier: 3,
      expectationPressure: 40,
      sponsorQualityBias: 1,
      rivalAttentionMultiplier: 1.2,
      highProfileNodeWeightMultiplier: 1.1
    },
    {
      minimumFame: 1000,
      band: 'underground',
      accessTier: 2,
      expectationPressure: 25,
      sponsorQualityBias: 1,
      rivalAttentionMultiplier: 1.1,
      highProfileNodeWeightMultiplier: 1.05
    },
    {
      minimumFame: 250,
      band: 'local',
      accessTier: 1,
      expectationPressure: 10,
      sponsorQualityBias: 0,
      rivalAttentionMultiplier: 1.05,
      highProfileNodeWeightMultiplier: 1.0
    },
    { minimumFame: 0, ...UNKNOWN_FAME_PROFILE }
  ]

/** One rung of the Fame access ladder. */
export type ExpeditionAccessTier = ExpeditionFameProfile['accessTier']

/**
 * The minimum `accessTier` each piece of high-profile content requires.
 *
 * @remarks
 * The one place the access gates are tuned. Two kinds of content are gated,
 * both identified by data the game already carries rather than a new
 * per-item flag:
 *
 * - `festivalBooking` (tier 1, `local`, 250 Fame): booking the gig on an
 *   Expedition `FESTIVAL` node. The table's own `highProfileNodeWeightMultiplier`
 *   is below neutral (0.9) only for `unknown`, so `local` is the first band
 *   the world stops discounting for high-profile stops. Fame rises with every
 *   Gig of a run, so a fresh band (Fame 0) is turned away only until its first
 *   club shows carry it past 250. The gate refuses the *booking*, never the
 *   travel: the band still arrives and the route continues. A locked Festival
 *   is not an in-place gig escape, so a band that also cannot afford any
 *   onward leg raises the `fuel_stranded` crisis
 *   (`getExpeditionMobilityFailureSignal`), whose unconditional
 *   `accept_failure` keeps the run from soft-locking. `START`, `GIG` and
 *   `FINALE` nodes are never gated.
 * - `showcaseContract` (tier 2, `underground`, 1,000 Fame): a native Contract
 *   whose constraints force a special Finale (`special_finale`, today
 *   `contract_all_in`). It books the run's biggest stage - the
 *   `contract_special` Finale at x1.35 reward and a Tour-ending failure - so it
 *   needs the first band the table actively courts: sponsor quality +1 and
 *   high-profile weight 1.05.
 *
 * Measured pacing (fresh-Career balance sequences): a band leaves its first
 * Tour with roughly 4,000-15,000 Fame, so both gates bind on the very first
 * Tour and again only after heavy Fame loss. Regions, Tour Types and unlock
 * sets are deliberately *not* gated: they are permanent Career capabilities,
 * and Fame never buys or withholds one of those.
 */
export const EXPEDITION_ACCESS_TIER_REQUIREMENTS = {
  festivalBooking: 1,
  showcaseContract: 2
} as const satisfies Record<string, ExpeditionAccessTier>

/** A refused access check: the tier the content needs and its Fame floor. */
export interface ExpeditionAccessLock {
  requiredTier: ExpeditionAccessTier
  minimumFame: number
}

/**
 * Resolves the Fame profile for the current state.
 *
 * @param state - Current game state.
 * @returns The band the canonical `player.fame` falls in.
 *
 * @remarks
 * Reads `state.player.fame` and nothing else, so every consumer sees the same
 * signal and a test can move one number and watch them all react.
 */
export const getExpeditionFameProfile = (
  state: Pick<GameState, 'player'>
): ExpeditionFameProfile => {
  const fame = Math.max(0, finiteNumberOr(state.player?.fame, 0))
  for (const entry of FAME_BANDS) {
    if (fame >= entry.minimumFame) {
      const { minimumFame: _minimumFame, ...profile } = entry
      return profile
    }
  }
  // Unreachable in practice: the last band starts at 0 and Fame is clamped
  // non-negative. Falls back to the table's own baseline row rather than
  // asserting, so a future table edit that removes the 0 band degrades to the
  // baseline instead of throwing.
  return { ...UNKNOWN_FAME_PROFILE }
}

/**
 * The lowest Fame that reaches an access tier.
 *
 * @param tier - Required tier.
 * @returns The Fame floor of the lowest band at or above it.
 */
const getMinimumFameForAccessTier = (tier: ExpeditionAccessTier): number => {
  let minimum = Number.POSITIVE_INFINITY
  for (const entry of FAME_BANDS) {
    if (entry.accessTier >= tier) minimum = Math.min(minimum, entry.minimumFame)
  }
  return minimum
}

/**
 * Checks the band's Fame against a required access tier.
 *
 * @param state - State carrying the canonical `player.fame`.
 * @param requiredTier - Tier the content needs.
 * @returns `null` when the band clears it, otherwise the lock to explain.
 */
export const getExpeditionAccessLock = (
  state: Pick<GameState, 'player'>,
  requiredTier: ExpeditionAccessTier
): ExpeditionAccessLock | null =>
  getExpeditionFameProfile(state).accessTier >= requiredTier
    ? null
    : { requiredTier, minimumFame: getMinimumFameForAccessTier(requiredTier) }

/**
 * The booking lock on an Expedition map node of the given type.
 *
 * @param state - State carrying the run status and `player.fame`.
 * @param nodeType - The node's map type.
 * @returns The lock, or `null` when the booking is open. Always `null`
 * outside an active run, so the Career map is never gated.
 */
export const getExpeditionNodeBookingLock = (
  state: Pick<GameState, 'player'> & {
    expedition?: Pick<GameState['expedition'], 'status'> | null
  },
  nodeType: unknown
): ExpeditionAccessLock | null =>
  state.expedition?.status === 'active' && nodeType === 'FESTIVAL'
    ? getExpeditionAccessLock(
        state,
        EXPEDITION_ACCESS_TIER_REQUIREMENTS.festivalBooking
      )
    : null

/**
 * The access lock on one native Contract template.
 *
 * @param state - State carrying `player.fame`.
 * @param template - The registry template, if any.
 * @returns The lock, or `null` when the template is ungated or cleared.
 */
export const getExpeditionContractAccessLock = (
  state: Pick<GameState, 'player'>,
  template: Pick<ExpeditionContractTemplate, 'constraints'> | undefined
): ExpeditionAccessLock | null =>
  template?.constraints.some(constraint => constraint.kind === 'special_finale')
    ? getExpeditionAccessLock(
        state,
        EXPEDITION_ACCESS_TIER_REQUIREMENTS.showcaseContract
      )
    : null
