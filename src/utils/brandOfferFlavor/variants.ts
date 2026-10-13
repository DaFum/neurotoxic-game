import { isFiniteNumber } from '../finiteNumber'
import type { RandomFn } from '../../types/callbacks'
import type { BrandDealOffer, BrandOfferVariantId } from '../../types/social'
import { roundTo } from './helpers'
import { pickIndex } from '../selectionUtils'

// ─── Variants & Numeric Variance ─────────────────────────────────────────

type VariantMod = {
  upfrontMul: number
  perGigMul: number
  durationDelta: number
  forceDuration?: number
}

/**
 * Lookup table mapping brand offer variants to their specific numerical modifiers.
 *
 * @remarks
 * These modifiers dictate how a variant scales upfront payments, per-gig payouts,
 * and duration constraints relative to the baseline standard deal.
 */
export const VARIANT_MODS: Record<BrandOfferVariantId, VariantMod> = {
  standard: { upfrontMul: 1.0, perGigMul: 1.0, durationDelta: 0 },
  summer_edition: { upfrontMul: 1.0, perGigMul: 1.1, durationDelta: 0 },
  anniversary_push: { upfrontMul: 1.25, perGigMul: 1.0, durationDelta: -1 },
  stealth_drop: { upfrontMul: 0.85, perGigMul: 1.0, durationDelta: 0 },
  viral_comeback: { upfrontMul: 1.0, perGigMul: 1.5, durationDelta: 0 },
  desperate: { upfrontMul: 0.8, perGigMul: 1.0, durationDelta: 0 },
  probe: { upfrontMul: 0.5, perGigMul: 1.0, durationDelta: 0, forceDuration: 1 }
}

/**
 * Lookup table for localized or human-readable presentation names of brand offer variants.
 */
export const VARIANT_LABELS: Record<BrandOfferVariantId, string> = {
  standard: 'Standard Deal',
  summer_edition: 'Summer Edition',
  anniversary_push: 'Anniversary Push',
  stealth_drop: 'Stealth Drop',
  viral_comeback: 'Viral Comeback',
  desperate: 'Last-Minute Pitch',
  probe: 'Probe Sponsoring'
}

const VARIANTS_BY_ALIGNMENT: Record<string, BrandOfferVariantId[]> = {
  EVIL: ['summer_edition', 'viral_comeback', 'standard'],
  CORPORATE: ['anniversary_push', 'standard'],
  INDIE: ['stealth_drop', 'viral_comeback', 'standard'],
  SUSTAINABLE: ['summer_edition', 'standard'],
  GOOD: ['anniversary_push', 'standard'],
  NEUTRAL: ['standard']
}

const DURATION_JITTERS = [-1, 0, 1, 2] as const

/**
 * Selects a flavor variant for a generated brand deal based on the brand's alignment,
 * the band's current financial stress, and the deal's tier.
 *
 * @param alignment - The brand's corporate alignment category used to resolve their unique variant pool.
 * @param isStretched - Whether the receiving band is currently financially stretched or desperate.
 * @param tier - The qualitative tier of the brand deal (0, 1, or 2).
 * @param rng - A pseudo-random number generator function returning values in `[0, 1)`.
 * @returns The chosen variant identifier for the brand deal.
 */
export const pickVariantId = (
  alignment: string,
  isStretched: boolean,
  tier: 0 | 1 | 2,
  rng: RandomFn
): BrandOfferVariantId => {
  if (tier === 2) return 'probe'
  if (isStretched) return 'desperate'
  const fallback: BrandOfferVariantId[] = ['standard']
  const pool = Object.hasOwn(VARIANTS_BY_ALIGNMENT, alignment)
    ? (VARIANTS_BY_ALIGNMENT[alignment] ?? fallback)
    : fallback
  // Bias towards 'standard' (~50%) so flavored variants stay special.
  if (rng() < 0.5) return 'standard'
  const idx = pickIndex(pool, rng)
  return pool[idx] ?? 'standard'
}

/**
 * Applies stochastic jitter and variant-specific multiplicative modifiers to a baseline brand deal offer.
 *
 * @param offer - The baseline, unmodified brand deal offer object.
 * @param rng - A pseudo-random number generator function returning values in `[0, 1)`.
 * @param mods - The variant-specific modifier rules determining how baseline figures are scaled.
 * @returns A new brand deal offer representing the randomized and scaled figures.
 */
export const applyOfferVariance = (
  offer: BrandDealOffer,
  rng: RandomFn,
  mods: VariantMod
): BrandDealOffer => {
  const upfrontJitter = 0.85 + rng() * 0.3 // 0.85..1.15
  const newUpfront = Math.max(
    50,
    roundTo(offer.upfront * upfrontJitter * mods.upfrontMul, 50)
  )

  const { perGig, ...restOffer } = offer
  const rawPerGig = perGig
  const newPerGig = isFiniteNumber(rawPerGig)
    ? Math.max(5, roundTo(rawPerGig * (0.9 + rng() * 0.2) * mods.perGigMul, 5))
    : undefined

  const durationJitter = DURATION_JITTERS[pickIndex(DURATION_JITTERS, rng)] ?? 0
  const newDuration =
    mods.forceDuration !== undefined
      ? mods.forceDuration
      : Math.max(1, offer.duration + durationJitter + mods.durationDelta)

  const result: BrandDealOffer = {
    ...restOffer,
    upfront: newUpfront,
    duration: newDuration
  }
  if (newPerGig !== undefined) {
    result.perGig = newPerGig
  }
  return result
}
