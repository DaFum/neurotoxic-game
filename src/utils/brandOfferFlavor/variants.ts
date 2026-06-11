import { isFiniteNumber } from '../finiteNumber'
import type { RandomFn } from '../../types/callbacks'
import type { BrandDealOffer, BrandOfferVariantId } from '../../types/social'
import { roundTo } from './helpers'

// ─── Variants & Numeric Variance ─────────────────────────────────────────

type VariantMod = {
  upfrontMul: number
  perGigMul: number
  durationDelta: number
  forceDuration?: number
}

export const VARIANT_MODS: Record<BrandOfferVariantId, VariantMod> = {
  standard: { upfrontMul: 1.0, perGigMul: 1.0, durationDelta: 0 },
  summer_edition: { upfrontMul: 1.0, perGigMul: 1.1, durationDelta: 0 },
  anniversary_push: { upfrontMul: 1.25, perGigMul: 1.0, durationDelta: -1 },
  stealth_drop: { upfrontMul: 0.85, perGigMul: 1.0, durationDelta: 0 },
  viral_comeback: { upfrontMul: 1.0, perGigMul: 1.5, durationDelta: 0 },
  desperate: { upfrontMul: 0.8, perGigMul: 1.0, durationDelta: 0 },
  probe: { upfrontMul: 0.5, perGigMul: 1.0, durationDelta: 0, forceDuration: 1 }
}

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
  const idx = Math.max(
    0,
    Math.min(pool.length - 1, Math.floor(rng() * pool.length))
  )
  return pool[idx] ?? 'standard'
}

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

  const durationJitter = Math.floor(rng() * 4) - 1 // -1..+2
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
