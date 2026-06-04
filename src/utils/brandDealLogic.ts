import { secureRandom } from './crypto'
import {
  MAX_RIVAL_DEAL_CHANCE_PENALTY,
  RIVAL_POWER_TO_DEAL_CHANCE_FACTOR,
  RIVAL_NEGOTIATION_PENALTY,
  DEAL_NEGOTIATION_SAFE_CHANCE,
  DEAL_NEGOTIATION_PERSUASIVE_CHANCE,
  DEAL_NEGOTIATION_AGGRESSIVE_CHANCE
} from '../context/gameConstants'
import { BRAND_DEALS_BY_ID } from '../data/brandDeals'
import { bandHasTrait } from './traitUtils'
import { ALLOWED_TRENDS, ALLOWED_TRENDS_SET } from '../data/socialTrends'
import { finiteNumberOr } from './gameStateUtils'
import { buildBrandOffer } from './brandOfferFlavor'
import type {
  BrandDeal,
  BrandOffer,
  SocialEngineGameState
} from '../types/social'
import type { RandomFn } from '../types/callbacks'

type AllowedTrend = (typeof ALLOWED_TRENDS)[number]

type EligibilityTier = 0 | 1 | 2

interface DealMatchContext {
  totalFollowers: number
  trendVal: AllowedTrend | undefined
  zealotry: number
  controversy: number
  band: SocialEngineGameState['band']
}

const matchesStrict = (deal: BrandDeal, ctx: DealMatchContext): boolean => {
  if (ctx.totalFollowers < deal.requirements.followers) return false

  if (ctx.trendVal && deal.requirements.trend) {
    if (ALLOWED_TRENDS_SET && !ALLOWED_TRENDS_SET.has(ctx.trendVal))
      return false
    if (deal.requirements.trendSet) {
      if (!deal.requirements.trendSet.has(ctx.trendVal)) return false
    } else if (!deal.requirements.trend.includes(ctx.trendVal)) {
      return false
    }
  }

  if (
    deal.requirements.trait &&
    !bandHasTrait(ctx.band, deal.requirements.trait)
  )
    return false

  if (
    deal.requirements.maxZealotry !== undefined &&
    ctx.zealotry > deal.requirements.maxZealotry
  )
    return false
  if (
    deal.requirements.minZealotry !== undefined &&
    ctx.zealotry < deal.requirements.minZealotry
  )
    return false

  if (
    deal.requirements.maxControversy !== undefined &&
    ctx.controversy > deal.requirements.maxControversy
  )
    return false
  if (
    deal.requirements.minControversy !== undefined &&
    ctx.controversy < deal.requirements.minControversy
  )
    return false

  return true
}

const matchesLoose = (deal: BrandDeal, ctx: DealMatchContext): boolean => {
  // Loose tier: ignore trend / trait / zealotry; reduce follower bar to 70%;
  // grant ±10 slack on controversy bands.
  if (ctx.totalFollowers < deal.requirements.followers * 0.7) return false
  if (
    deal.requirements.maxControversy !== undefined &&
    ctx.controversy > deal.requirements.maxControversy + 10
  )
    return false
  if (
    deal.requirements.minControversy !== undefined &&
    ctx.controversy < deal.requirements.minControversy - 10
  )
    return false
  return true
}

interface PoolEntry {
  deal: BrandDeal
  tier: EligibilityTier
}

const buildEligibilityPool = (ctx: DealMatchContext): PoolEntry[] => {
  const pool: PoolEntry[] = []
  const seen = new Set<string>()

  for (const deal of BRAND_DEALS_BY_ID.values()) {
    if (matchesStrict(deal, ctx)) {
      pool.push({ deal, tier: 0 })
      seen.add(deal.id)
    }
  }
  if (pool.length >= 3) return pool

  for (const deal of BRAND_DEALS_BY_ID.values()) {
    if (seen.has(deal.id)) continue
    if (matchesLoose(deal, ctx)) {
      pool.push({ deal, tier: 1 })
      seen.add(deal.id)
    }
  }
  if (pool.length >= 3) return pool

  // Tier 2: probe sponsoring — lowest-bar deals regardless of trend/trait.
  // Pick the catalog entries with the smallest follower requirement to keep
  // them plausible for a brand-new band.
  const remaining: BrandDeal[] = []
  for (const deal of BRAND_DEALS_BY_ID.values()) {
    if (!seen.has(deal.id)) {
      remaining.push(deal)
    }
  }
  remaining.sort((a, b) => a.requirements.followers - b.requirements.followers)
  for (const deal of remaining) {
    if (pool.length >= 3) break
    pool.push({ deal, tier: 2 })
    seen.add(deal.id)
  }

  return pool
}

const scoreEntry = (
  entry: PoolEntry,
  gameState: SocialEngineGameState,
  rivalPenalty: number,
  rng: RandomFn
): number => {
  const reputation = gameState.social?.brandReputation ?? {}
  const align = String(entry.deal.alignment)
  const rep = Object.hasOwn(reputation, align)
    ? finiteNumberOr(reputation[align], 0)
    : 0
  const tierPenalty = entry.tier * 30
  const jitter = rng() * 25
  return rep - rivalPenalty - tierPenalty + jitter
}

/**
 * Generates available brand deal offers based on follower reach, trend fit,
 * brand reputation, and nearby rival pressure.
 *
 * @param gameState - Current state containing social metrics, band traits, player location, and rival data.
 * @param rng - Random number generator used for offer scoring jitter.
 * @returns Up to three generated brand offers, or an empty list when a deal is already active.
 */
export const generateBrandOffers = (
  gameState: SocialEngineGameState,
  rng: RandomFn = secureRandom
): BrandOffer[] => {
  const social = gameState?.social ?? {}
  const band = gameState?.band

  // Single-deal invariant: never offer anything while a deal is active.
  if (Array.isArray(social.activeDeals) && social.activeDeals.length > 0) {
    return []
  }

  // Coerce numeric social fields via `finiteNumberOr` so a corrupted /
  // hostile state (NaN / Infinity / non-number) cannot bypass eligibility
  // gates — `NaN < threshold` is false for every threshold, which would
  // otherwise let any deal slip through.
  const totalFollowers =
    finiteNumberOr(social.instagram, 0) +
    finiteNumberOr(social.tiktok, 0) +
    finiteNumberOr(social.youtube, 0)

  const trendVal =
    typeof social.trend === 'string'
      ? (social.trend as AllowedTrend)
      : undefined

  const matchCtx: DealMatchContext = {
    totalFollowers,
    trendVal,
    zealotry: finiteNumberOr(social.zealotry, 0),
    controversy: finiteNumberOr(social.controversyLevel, 0),
    band
  }

  const pool = buildEligibilityPool(matchCtx)
  if (pool.length === 0) return []

  const rivalInLocation =
    gameState.rivalBand != null &&
    gameState.player != null &&
    gameState.rivalBand.currentLocationId === gameState.player.currentNodeId

  const rivalPower =
    rivalInLocation && gameState.rivalBand
      ? Math.min(
          MAX_RIVAL_DEAL_CHANCE_PENALTY * 100,
          (gameState.rivalBand.powerLevel ?? 0) *
            RIVAL_POWER_TO_DEAL_CHANCE_FACTOR *
            100
        )
      : 0

  const scored = pool
    .map(entry => ({
      entry,
      score: scoreEntry(entry, gameState, rivalPower, rng)
    }))
    .sort((a, b) => b.score - a.score)

  // `buildEligibilityPool` is guaranteed to surface ≥ 3 distinct catalog
  // entries when the static `BRAND_DEALS` catalog has ≥ 3 entries (it
  // walks the full catalog at tier 2 without restrictions). We therefore
  // never duplicate offers — duplicate ids would collide on the React key
  // in `DealsPhase`, on the negotiation map (`negotiatedDeals[id]`), and
  // on the i18n + canonical-name lookup in `brandDealI18n`.
  const picked = scored.slice(0, 3).map(({ entry }) => entry)

  return picked.map(entry =>
    buildBrandOffer(entry.deal, {
      tier: entry.tier,
      isStretched: entry.tier > 0,
      gameState,
      rng,
      totalFollowers
    })
  )
}

/**
 * Negotiates a brand deal with risk/reward mechanics.
 * @param deal - The original deal object.
 * @param strategy - 'AGGRESSIVE', 'PERSUASIVE', 'SAFE'.
 * @param gameState - Current game state.
 * @param rng - Random number generator.
 * @returns `success: boolean, deal: object, feedback: string, status: 'ACCEPTED'|'REVOKED'|'FAILED'`
 */
export const negotiateDeal = <TDeal extends BrandDeal>(
  deal: TDeal,
  strategy: 'AGGRESSIVE' | 'PERSUASIVE' | 'SAFE',
  gameState: SocialEngineGameState,
  rng: RandomFn = secureRandom
): {
  success: boolean
  deal: TDeal | null
  feedback: string
  status: 'ACCEPTED' | 'REVOKED' | 'FAILED'
} => {
  const band = gameState.band
  let successChance
  let feedback
  let status: 'ACCEPTED' | 'REVOKED' | 'FAILED' = 'ACCEPTED'

  // Rival Penalty for Negotiations
  const rivalPenalty =
    gameState.rivalBand &&
    gameState.player &&
    gameState.rivalBand.currentLocationId === gameState.player.currentNodeId
      ? RIVAL_NEGOTIATION_PENALTY
      : 0

  // Optimization: structuredClone is slow for hot paths. Manual shallow copy
  // with nested offer copy is ~98% faster.
  const newDeal: TDeal = {
    ...deal,
    offer: { ...deal.offer }
  }

  // Modifiers
  const hasManager = bandHasTrait(band, 'social_manager')
  const isFamous = (gameState.player?.fame ?? 0) > 1000

  // Roll once
  const roll = rng()
  let isSuccess

  switch (strategy) {
    case 'SAFE':
      successChance = DEAL_NEGOTIATION_SAFE_CHANCE - rivalPenalty / 2
      if (hasManager) successChance += 0.1

      if (roll < successChance) {
        newDeal.offer.upfront = Math.floor(newDeal.offer.upfront * 1.1) // +10%
        feedback = 'Modest increase secured.'
        isSuccess = true
      } else {
        feedback = 'They refused to budge.'
        // No change, but not revoked
        status = 'FAILED'
        isSuccess = false
      }
      break

    case 'PERSUASIVE':
      successChance = DEAL_NEGOTIATION_PERSUASIVE_CHANCE - rivalPenalty
      if (hasManager) successChance += 0.2
      if (isFamous) successChance += 0.1

      if (roll < successChance) {
        newDeal.offer.upfront = Math.floor(newDeal.offer.upfront * 1.2) // +20%
        if (newDeal.offer.perGig) {
          newDeal.offer.perGig = Math.floor(newDeal.offer.perGig * 1.1) // +10%
        }
        feedback = 'Great negotiation! Terms improved.'
        isSuccess = true
      } else {
        newDeal.offer.upfront = Math.floor(newDeal.offer.upfront * 0.9) // -10%
        feedback = 'They were annoyed. Offer reduced.'
        status = 'ACCEPTED' // Still accepted, but worse
        isSuccess = false
      }
      break

    case 'AGGRESSIVE':
      successChance = DEAL_NEGOTIATION_AGGRESSIVE_CHANCE - rivalPenalty
      if (isFamous) successChance += 0.2 // Fame helps aggression

      if (roll < successChance) {
        newDeal.offer.upfront = Math.floor(newDeal.offer.upfront * 1.5) // +50%
        feedback = 'You dominated the room. Massive payout!'
        isSuccess = true
      } else {
        feedback = 'They walked out. Deal revoked.'
        status = 'REVOKED'
        isSuccess = false
      }
      break

    default:
      throw new Error(`Unknown strategy: ${strategy}`)
  }

  return {
    success: isSuccess,
    deal: status === 'REVOKED' ? null : newDeal,
    feedback,
    status
  }
}