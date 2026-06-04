// Logic for Social Media Virality and Posting
import { secureRandom } from './crypto'
import {
  MAX_RIVAL_DEAL_CHANCE_PENALTY,
  RIVAL_POWER_TO_DEAL_CHANCE_FACTOR,
  RIVAL_NEGOTIATION_PENALTY,
  DEAL_NEGOTIATION_SAFE_CHANCE,
  DEAL_NEGOTIATION_PERSUASIVE_CHANCE,
  DEAL_NEGOTIATION_AGGRESSIVE_CHANCE
} from '../context/gameConstants'
import { POST_OPTIONS } from '../data/postOptions'
import { SOCIAL_PLATFORMS } from '../data/platforms'
import { BRAND_DEALS_BY_ID } from '../data/brandDeals'
import { bandHasTrait } from './traitUtils'
import { clampZealotry } from './gameStateUtils'
import { StateError } from './errorHandler'
import { ALLOWED_TRENDS, ALLOWED_TRENDS_SET } from '../data/socialTrends'
import {
  hasActiveSponsorship,
  clampPlayerMoney,
  clampBandHarmony,
  finiteNumberOr
} from './gameStateUtils'
import { buildBrandOffer } from './brandOfferFlavor'
import type {
  BrandDeal,
  BrandOffer,
  SocialEngineGameState,
  SocialPostOption
} from '../types/social'
import type { RandomFn } from '../types/callbacks'

type AllowedTrend = (typeof ALLOWED_TRENDS)[number]

interface WeightedPostOption extends SocialPostOption {
  _weight: number
  _force?: boolean
}

interface ViralStats {
  accuracy: number
  maxCombo: number
  score?: number
}

interface ViralContext {
  perfScore?: number
  events?: string[] | Set<string>
  venue?: { name?: string; [key: string]: unknown } | null
  band?: Record<string, unknown>
}

interface ViralOptions {
  modifiers?: number
  roll?: number
  context?: ViralContext
}

/**
 * Calculates viral potential based on performance and events.
 *
 * @param performanceScore - Gig performance score from 0 to 100.
 * @param gigEvents - Event ids emitted during the gig.
 * @param venue - Venue context used for location-specific bonuses.
 * @param bandState - Band traits used for social virality bonuses.
 * @returns Viral chance clamped to the engine cap.
 */
export const calculateViralityScore = (
  performanceScore: number,
  gigEvents: string[] | Set<string> | null | undefined,
  venue: { name?: string; [key: string]: unknown } | null | undefined,
  bandState: Record<string, unknown> | undefined
): number => {
  let baseChance = 0.05 // 5%

  // Performance Multiplier
  if (performanceScore > 90) baseChance *= 2.0
  else if (performanceScore > 75) baseChance *= 1.5

  // Venue Multiplier
  if (venue?.name?.includes('Kaminstube')) baseChance *= 1.5 // Historical

  // Event Multiplier (e.g. "Stage Diver", "Influencer")
  if (gigEvents != null) {
    // ⚡ Optimization: Single pass traversal to avoid multiple O(N) lookups and Set allocation overhead
    let hasStageDiver = false
    let hasInfluencer = false
    if (gigEvents instanceof Set) {
      hasStageDiver = gigEvents.has('stage_diver')
      hasInfluencer = gigEvents.has('influencer_spotted')
    } else if (Array.isArray(gigEvents)) {
      for (const e of gigEvents) {
        if (e === 'stage_diver') hasStageDiver = true
        if (e === 'influencer_spotted') hasInfluencer = true
        if (hasStageDiver && hasInfluencer) break
      }
    }
    if (hasStageDiver) baseChance *= 2.0
    if (hasInfluencer) baseChance *= 3.0
  }

  // Social Manager Trait: +15% virality chance
  if (bandHasTrait(bandState, 'social_manager')) {
    baseChance *= 1.15
  }

  // Showman Trait (Marius): +20% virality chance on live shows
  if (bandHasTrait(bandState, 'showman')) {
    baseChance *= 1.2
  }

  // Cap at 90%
  return Math.min(0.9, baseChance)
}

const COOLDOWN_BLOCKED_IDS = new Set([
  'recovery_apology_tour_promo',
  'recovery_leaked_good_deed'
])

/**
 * Generates options for the "Post-Gig Social Media Strategy" phase.
 * It evaluates conditions from POST_OPTIONS, assigns weights, and selects exactly 3.
 *
 * @param gigResult - Reserved gig result input kept for call-site compatibility.
 * @param gameState - Current state used to evaluate option conditions and weights.
 * @param rng - Random number generator used to weight eligible options.
 * @returns Exactly three eligible social post options.
 */
export const generatePostOptions = (
  gigResult: unknown,
  gameState: SocialEngineGameState,
  rng: RandomFn = secureRandom
): SocialPostOption[] => {
  // 1. Evaluate and collect eligible options
  const isCooldownActive = (gameState.social?.reputationCooldown || 0) > 0

  const eligibleOptions: WeightedPostOption[] = []
  let sponsorIdx = -1
  const currentTrend = gameState.social?.trend

  const postOptions = POST_OPTIONS as unknown as SocialPostOption[]
  for (let i = 0; i < postOptions.length; i++) {
    const opt = postOptions[i]
    if (!opt) continue

    // Filter by cooldown if active
    if (isCooldownActive && COOLDOWN_BLOCKED_IDS.has(opt.id)) {
      continue
    }

    try {
      if (opt.condition(gameState)) {
        let weight = 1.0

        // Example: If very low money, boost crowdfund weight
        if (opt.id === 'comm_crowdfund' && (gameState.player.money ?? 0) < 100)
          weight += 50

        // Trend Matching Bonus
        if (currentTrend && opt.category) {
          const isMatch =
            (currentTrend === 'DRAMA' && opt.category === 'Drama') ||
            (currentTrend === 'TECH' && opt.category === 'Commercial') ||
            (currentTrend === 'MUSIC' && opt.category === 'Performance') ||
            (currentTrend === 'WHOLESOME' &&
              (opt.category === 'Lifestyle' || opt.badges?.includes('🛡️')))

          if (isMatch) weight += 10.0
        }

        eligibleOptions.push({ ...opt, _weight: weight * rng() })
        if (opt.id === 'comm_sellout_ad') {
          sponsorIdx = eligibleOptions.length - 1
        }
      }
    } catch (e) {
      throw new StateError(`Condition failed for post option ${opt.id}`, {
        cause: e,
        meta: {
          optId: opt.id,
          snapshot: {
            day: gameState.player?.day,
            money: gameState.player?.money,
            currentGigId: gameState.currentGig?.id
          }
        }
      })
    }
  }

  const results: WeightedPostOption[] = []

  // 1a. Forced Sponsor Post Override
  // Check if there are active deals of type SPONSORSHIP.
  const socialState = gameState.social
  const hasActiveSponsor = hasActiveSponsorship(socialState)
  if (hasActiveSponsor) {
    // Force a specific commercial post or synthesize one
    if (sponsorIdx !== -1) {
      const sponsorOpt = eligibleOptions[sponsorIdx]
      if (sponsorOpt) {
        sponsorOpt._force = true
        results.push(sponsorOpt)
        // Remove in-place to avoid full array re-allocation
        eligibleOptions.splice(sponsorIdx, 1)
      }
    }
  }

  // 2. Sort by weight descending
  eligibleOptions.sort((a, b) => b._weight - a._weight)

  // 3. Fill remaining slots to reach 3 total
  const needed = 3 - results.length
  for (let i = 0; i < needed && i < eligibleOptions.length; i++) {
    const opt = eligibleOptions[i]
    if (opt) {
      results.push(opt)
    }
  }

  // 3a. Validate that exactly 3 options are available
  if (results.length !== 3) {
    throw new StateError(
      `Insufficient post options: expected 3, got ${results.length}`,
      {
        meta: {
          needed,
          eligibleOptionsCount: eligibleOptions.length,
          resultsCount: results.length,
          isCooldownActive,
          currentTrend,
          snapshot: {
            day: gameState.player?.day,
            money: gameState.player?.money,
            currentGigId: gameState.currentGig?.id
          }
        }
      }
    )
  }

  // 4. Return new array and objects without _weight and _force
  const finalResults: SocialPostOption[] = []
  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    if (result) {
      const { _weight, _force, ...rest } = result
      finalResults.push(rest)
    }
  }

  return finalResults
}

/**
 * Resolves the outcome of a social media post based on its defined resolver.
 *
 * Missing resolver platforms fall back to the option platform. Explicit string
 * platforms are trimmed, while invalid explicit values pass through for the
 * post-gig normalizer to reject.
 *
 * @param postOption - The selected post option from POST_OPTIONS.
 * @param gameState - Current state required for resolution.
 * @param diceRoll - Random number between 0 and 1. Defaults to `secureRandom()`.
 * @returns The full resolution map containing success, followers, and side effects.
 */
export const resolvePost = (
  postOption: SocialPostOption,
  gameState: SocialEngineGameState,
  diceRoll = secureRandom()
): Record<string, unknown> => {
  if (!postOption.resolve) {
    throw new StateError(
      `Post option ${postOption.id} is missing a resolve function.`
    )
  }

  try {
    const result = postOption.resolve({ ...gameState, diceRoll }) as Record<
      string,
      unknown
    >

    // Safety bounds enforcement for resolved deltas
    // Note: Double-clamping occurs here and in hooks for defense-in-depth, ensuring
    // resolved deltas stay within bounds before applying and displaying correctly.
    let moneyChange =
      typeof result.moneyChange === 'number' ? result.moneyChange : undefined
    if (
      moneyChange !== undefined &&
      Number.isFinite(moneyChange) &&
      gameState.player?.money !== undefined
    ) {
      const prevMoney = gameState.player.money ?? 0
      const nextMoney = clampPlayerMoney(prevMoney + moneyChange)
      moneyChange = nextMoney - prevMoney
    }

    let harmonyChange =
      typeof result.harmonyChange === 'number'
        ? result.harmonyChange
        : undefined
    if (
      harmonyChange !== undefined &&
      Number.isFinite(harmonyChange) &&
      gameState.band?.harmony !== undefined
    ) {
      const prevHarmony = Number(gameState.band.harmony ?? 0)
      const nextHarmony = clampBandHarmony(prevHarmony + harmonyChange)
      harmonyChange = nextHarmony - prevHarmony
    }

    const platform =
      result.platform === undefined || result.platform === null
        ? postOption.platform
        : typeof result.platform === 'string'
          ? result.platform.trim()
          : result.platform

    return {
      success: result.success ?? true,
      followers: result.followers ?? 0,
      platform,
      message: result.message ?? 'Post completed.',
      // Side effects (optional, will be undefined if not provided)
      moneyChange,
      moodChange: result.moodChange,
      harmonyChange,
      staminaChange: result.staminaChange,
      controversyChange: result.controversyChange,
      loyaltyChange: result.loyaltyChange,
      zealotryChange: result.zealotryChange,
      targetMember: result.targetMember,
      allMembersMoodChange: result.allMembersMoodChange,
      allMembersStaminaChange: result.allMembersStaminaChange,
      egoDrop: result.egoDrop,
      egoClear: result.egoClear,
      reputationCooldownSet: result.reputationCooldownSet,
      unlockTrait: result.unlockTrait,
      influencerUpdate: result.influencerUpdate
    }
  } catch (e) {
    throw new StateError(`Resolution failed for post ${postOption.id}`, {
      cause: e,
      meta: {
        optId: postOption.id,
        snapshot: {
          day: gameState.player?.day,
          money: gameState.player?.money,
          currentGigId: gameState.currentGig?.id
        }
      }
    })
  }
}

// ⚡ Bolt: Pre-calculate platform ID map for O(1) lookups instead of O(N) array allocation and search.
// Expected Impact: Reduces GC overhead and CPU cycles during the hot-path calculateSocialGrowth function.
const PLATFORMS_BY_ID: Record<string, { multiplier: number }> =
  Object.create(null)
for (const key in SOCIAL_PLATFORMS) {
  if (Object.hasOwn(SOCIAL_PLATFORMS, key)) {
    const p = SOCIAL_PLATFORMS[key as keyof typeof SOCIAL_PLATFORMS]
    PLATFORMS_BY_ID[p.id] = p
  }
}

/**
 * Calculates net follower growth for a platform after performance, virality,
 * controversy, and loyalty modifiers.
 *
 * @param platform - Platform id such as `instagram`, `tiktok`, `youtube`, or `newsletter`.
 * @param performance - Gig performance score from 0 to 100.
 * @param currentFollowers - Existing follower count for viral bonus scaling.
 * @param isViral - Whether a viral event occurred.
 * @param controversyLevel - Current shadowban meter from 0 to 100.
 * @param loyalty - Buffer that offsets low-performance growth penalties.
 * @returns Net follower delta after platform multiplier and viral bonus.
 */
export const calculateSocialGrowth = (
  platform: string,
  performance: number,
  currentFollowers: number,
  isViral = false,
  controversyLevel = 0,
  loyalty = 0
): number => {
  const platformData = PLATFORMS_BY_ID[platform]
  const multiplier = platformData ? platformData.multiplier : 1.0

  // Loyalty shield: reduces the penalty of low performance
  const effectivePerf = Math.min(100, performance + loyalty * 0.5)
  let baseGrowth = Math.max(0, effectivePerf - 50) * 0.5 // e.g. 80 score -> 15 base

  // Shadowban / Cancel Culture penalty
  if (controversyLevel >= 80) {
    // High controversy leads to negative growth (Cancel Culture)
    // The higher the controversy, the worse it gets.
    const penaltyFactor = (controversyLevel - 70) * 0.05 // e.g. 80 -> 0.5, 100 -> 1.5
    baseGrowth = -Math.abs(baseGrowth * penaltyFactor)
  }

  const viralBonus = isViral ? currentFollowers * 0.1 + 100 : 0

  return Math.floor(baseGrowth * multiplier + viralBonus)
}

/**
 * Checks if a viral event triggers based on gig stats.
 * @param stats - `accuracy, maxCombo, score`
 * @param options - Options object OR legacy modifiers number. Defaults to `{}`.
 * @param legacyRoll - Legacy roll argument (only used if options is number). Defaults to `secureRandom()`.
 * @returns True if viral event occurs
 */
export const checkViralEvent = (
  stats: ViralStats,
  options: ViralOptions | number = {},
  legacyRoll = secureRandom()
): boolean => {
  // Backwards compatibility handling
  let modifiers: number
  let roll = legacyRoll
  let context: ViralContext | undefined

  if (typeof options === 'number') {
    modifiers = options
  } else {
    // New signature usage
    modifiers = options.modifiers || 0
    roll = options.roll !== undefined ? options.roll : secureRandom()
    context = options.context
  }

  if (stats.accuracy > 95) return true
  // Combo threshold logic: Assuming 2.5x multiplier roughly correlates to 30-50 combo depending on scaling.
  // Using maxCombo directly.
  if (stats.maxCombo > 50) return true

  let chance: number

  // If we have context, use the full virality score logic (which includes traits like social_manager)
  if (context && typeof context.perfScore === 'number') {
    chance = calculateViralityScore(
      context.perfScore,
      context.events || [],
      context.venue,
      context.band
    )
  } else {
    chance = 0.01 // Default low base chance
  }

  // Apply modifiers
  chance += modifiers

  return roll < chance
}

/**
 * Applies organic decay to follower counts.
 * @param followers - Current follower count
 * @param daysSinceLastPost - Days since last engagement
 * @returns New follower count (decreased)
 */
export const applyReputationDecay = (
  followers: number,
  daysSinceLastPost: number
): number => {
  if (daysSinceLastPost < 3) return followers
  const decayRate = 0.01 * (daysSinceLastPost - 2) // 1% per day after day 2
  return Math.floor(followers * (1 - Math.min(0.5, decayRate)))
}

/**
 * Generates a daily social media trend.
 *
 * @param rng - Random number generator.
 * @returns One of 'NEUTRAL', 'DRAMA', 'TECH', 'MUSIC', 'WHOLESOME'.
 */
export const generateDailyTrend = (
  rng: RandomFn = secureRandom
): (typeof ALLOWED_TRENDS)[number] => {
  // Weighted choice could go here, for now uniform random
  const idx = Math.floor(rng() * ALLOWED_TRENDS.length)
  // Ensure valid index even if rng() === 1
  const safeIdx = Math.min(idx, ALLOWED_TRENDS.length - 1)
  const trend = ALLOWED_TRENDS[safeIdx]
  return trend ?? 'NEUTRAL'
}

/**
 * Generates a dynamic brand-style name. Re-exported from `brandOfferFlavor`
 * so existing callers (e.g. `rivalEngine.generateRivalBand`) keep working.
 * Brand-deal offers use `buildBrandOffer()` instead and never overwrite
 * the canonical `deal.name` from the static catalog.
 */
export { generateBrandName } from './brandOfferFlavor'

/**
 * Calculates passive income and raid chance from social zealotry.
 *
 * @param zealotry - Raw zealotry score before clamping.
 * @returns Passive income and raid probability derived from clamped zealotry.
 */
export const calculateZealotryEffects = (
  zealotry: number
): { passiveIncome: number; raidProbability: number } => {
  const z = clampZealotry(Number(zealotry) || 0)
  return {
    passiveIncome: Math.floor(z * 1.2),
    raidProbability: (z / 100) * 0.08
  }
}

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
