import type { RandomFn } from '../../types/callbacks'
import type {
  BrandAlignment,
  BrandDeal,
  BrandOffer,
  BrandOfferFlavor,
  SocialEngineGameState
} from '../../types/social'
import { generateCampaignCodename } from './brandNames'
import { buildRep } from './reps'
import { pickTagline } from './taglines'
import { pickContextualHook } from './hooks'
import {
  pickVariantId,
  applyOfferVariance,
  VARIANT_LABELS,
  VARIANT_MODS
} from './variants'

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Context used to add procedural flavor and variance to a brand deal offer.
 */
export interface BuildBrandOfferContext {
  tier: 0 | 1 | 2
  isStretched: boolean
  gameState: SocialEngineGameState
  rng: RandomFn
  totalFollowers: number
}

/**
 * Builds a flavored brand offer from a catalog deal and current social context.
 *
 * @param deal - Base brand deal definition.
 * @param ctx - Offer tier, stretched-state flag, game state, RNG, and follower total.
 * @returns Brand offer with varied payouts and generated flavor metadata.
 */
export const buildBrandOffer = (
  deal: BrandDeal,
  ctx: BuildBrandOfferContext
): BrandOffer => {
  const alignment = String(deal.alignment) as BrandAlignment

  const variant = pickVariantId(alignment, ctx.isStretched, ctx.tier, ctx.rng)
  const mods = VARIANT_MODS[variant]
  const variedOffer = applyOfferVariance(deal.offer, ctx.rng, mods)

  const campaignCodename = generateCampaignCodename(alignment, ctx.rng)
  const rep = buildRep(alignment, ctx.rng)
  const tagline = pickTagline(alignment, ctx.rng)
  const hook = pickContextualHook(
    ctx.gameState,
    ctx.isStretched,
    ctx.totalFollowers,
    ctx.rng
  )

  const flavor: BrandOfferFlavor = {
    campaignCodename,
    rep,
    taglineKey: tagline.key,
    taglineDefault: tagline.default,
    hookKey: hook.key,
    hookDefault: hook.default,
    variant,
    variantLabelKey: `economy:brandFlavor.variant.${variant}`,
    variantLabelDefault: VARIANT_LABELS[variant],
    urgency: hook.urgency,
    isStretched: ctx.isStretched
  }

  return {
    ...deal,
    offer: variedOffer,
    flavor
  }
}
