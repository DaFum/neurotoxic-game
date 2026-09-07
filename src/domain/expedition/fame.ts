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
    {
      minimumFame: 0,
      band: 'unknown',
      accessTier: 0,
      expectationPressure: 0,
      sponsorQualityBias: 0,
      rivalAttentionMultiplier: 1.0,
      highProfileNodeWeightMultiplier: 0.9
    }
  ]

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
  state: GameState
): ExpeditionFameProfile => {
  const fame = Math.max(0, finiteNumberOr(state.player?.fame, 0))
  for (const entry of FAME_BANDS) {
    if (fame >= entry.minimumFame) {
      const { minimumFame: _minimumFame, ...profile } = entry
      return profile
    }
  }
  // Unreachable in practice: the last band starts at 0 and Fame is clamped
  // non-negative. Spelled out rather than asserted so a future table edit that
  // removes the 0 band degrades to the baseline instead of throwing.
  return {
    band: 'unknown',
    accessTier: 0,
    expectationPressure: 0,
    sponsorQualityBias: 0,
    rivalAttentionMultiplier: 1,
    highProfileNodeWeightMultiplier: 1
  }
}
