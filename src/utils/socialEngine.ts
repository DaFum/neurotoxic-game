// Logic for Social Media Virality and Posting
import { secureRandom } from './crypto'
import { POST_OPTIONS } from '../data/postOptions'
import { SOCIAL_PLATFORMS } from '../data/platforms'
import { bandHasTrait } from './traitUtils'
import { clampZealotry } from './gameStateUtils'
import { StateError } from './errorHandler'
import { ALLOWED_TRENDS } from '../data/socialTrends'
import {
  hasActiveSponsorship,
  clampPlayerMoney,
  clampBandHarmony
} from './gameStateUtils'
import type { SocialEngineGameState, SocialPostOption } from '../types/social'
import type { RandomFn } from '../types/callbacks'

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

export { generateBrandOffers, negotiateDeal } from './brandDealLogic'
