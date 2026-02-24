// Logic for Social Media Virality and Posting
import { secureRandom } from './crypto.js'
import { POST_OPTIONS } from '../data/postOptions.js'
import { SOCIAL_PLATFORMS } from '../data/platforms.js'
import { BRAND_DEALS } from '../data/brandDeals.js'
import { bandHasTrait } from './traitLogic.js'
import { StateError } from './errorHandler.js'

/**
 * Calculates viral potential based on performance and events.
 */
export const calculateViralityScore = (
  performanceScore,
  gigEvents,
  venue,
  bandState
) => {
  let baseChance = 0.05 // 5%

  // Performance Multiplier
  if (performanceScore > 90) baseChance *= 2.0
  else if (performanceScore > 75) baseChance *= 1.5

  // Venue Multiplier
  if (venue?.name?.includes('Kaminstube')) baseChance *= 1.5 // Historical

  // Event Multiplier (e.g. "Stage Diver", "Influencer")
  if (gigEvents.includes('stage_diver')) baseChance *= 2.0
  if (gigEvents.includes('influencer_spotted')) baseChance *= 3.0

  // Social Manager Trait: +15% virality chance
  if (bandHasTrait(bandState, 'social_manager')) {
    baseChance *= 1.15
  }

  // Showman Trait (Lars): +20% virality chance on live shows
  if (bandHasTrait(bandState, 'showman')) {
    baseChance *= 1.20
  }

  // Cap at 90%
  return Math.min(0.9, baseChance)
}

// TODO: Influencer System Expansion
// - Add `collaborateWithInfluencer` action type in POST_OPTIONS
// - Track `relationship` score with specific influencers (e.g. `tech_reviewer_01`, `drama_queen_99`)
// - Influencer traits: `Tech Savvy` (boosts gear reviews), `Drama Magnet` (boosts controversy posts)
// - Add `influencerTier`: Micro -> Macro -> Mega (affects cost and reach)

/**
 * Generates options for the "Post-Gig Social Media Strategy" phase.
 * It evaluates conditions from POST_OPTIONS, assigns weights, and selects exactly 3.
 */
export const generatePostOptions = (gigResult, gameState, rng = secureRandom) => {
  // 1. Evaluate and collect eligible options
  let eligibleOptions = POST_OPTIONS.filter(opt => {
    try {
      return opt.condition(gameState)
    } catch (e) {
      throw new StateError(`Condition failed for post option ${opt.id}`, { cause: e, meta: { optId: opt.id, gameState } })
    }
  })

  const results = []

  // 1a. Forced Sponsor Post Override
  if (gameState.social?.sponsorActive) {
    // Force a specific commercial post or synthesize one
    const sponsorOpt = eligibleOptions.find(o => o.id === 'comm_sellout_ad')
    if (sponsorOpt) {
      results.push({ ...sponsorOpt, _force: true })
      // Remove from pool so it's not selected again
      eligibleOptions = eligibleOptions.filter(o => o.id !== 'comm_sellout_ad')
    }
  }

  // 2. Assign weights (optional logic based on game state, basic for now)
  const weightedOptions = eligibleOptions.map(opt => {
    let weight = 1.0
    // Example: If very low money, boost crowdfund weight
    if (opt.id === 'comm_crowdfund' && gameState.player.money < 100) weight += 50

    // Trend Matching Bonus
    const currentTrend = gameState.social?.trend
    if (currentTrend && opt.category) {
      // Map categories to trends if needed, or exact match
      const isMatch =
        (currentTrend === 'DRAMA' && opt.category === 'Drama') ||
        (currentTrend === 'TECH' && opt.category === 'Commercial') || // Tech usually commercial/gear
        (currentTrend === 'MUSIC' && opt.category === 'Performance') ||
        (currentTrend === 'WHOLESOME' && opt.badges?.includes('🛡️')) // Wholesome logic

      if (isMatch) weight += 10.0
    }

    return { ...opt, _weight: weight * rng() }
  })

  // 3. Sort by weight descending
  weightedOptions.sort((a, b) => b._weight - a._weight)

  // 4. Fill remaining slots to reach 3 total
  const needed = 3 - results.length
  const selectedRandom = weightedOptions.slice(0, needed)
  results.push(...selectedRandom)

  // 5. Clean up output
  return results.map(opt => {
    // Strip internal properties before sending to UI
    const { _weight, _force, ...cleanOpt } = opt
    return cleanOpt
  })
}

/**
 * Resolves the outcome of a social media post based on its defined resolver.
 * @param {object} postOption - The selected post option from POST_OPTIONS.
 * @param {object} gameState - Current state required for resolution.
 * @param {number} [diceRoll=secureRandom()] - Random number between 0 and 1.
 * @returns {object} The full resolution map containing success, followers, and side effects.
 */
export const resolvePost = (postOption, gameState, diceRoll = secureRandom()) => {
  if (!postOption.resolve) {
    throw new StateError(`Post option ${postOption.id} is missing a resolve function.`)
  }

  try {
    const result = postOption.resolve({ ...gameState, diceRoll })
    return {
      success: result.success ?? true,
      followers: result.followers ?? 0,
      platform: result.platform || postOption.platform,
      message: result.message || 'Post completed.',
      // Side effects (optional, will be undefined if not provided)
      moneyChange: result.moneyChange,
      moodChange: result.moodChange,
      harmonyChange: result.harmonyChange,
      staminaChange: result.staminaChange,
      controversyChange: result.controversyChange,
      loyaltyChange: result.loyaltyChange,
      targetMember: result.targetMember,
      allMembersMoodChange: result.allMembersMoodChange,
      allMembersStaminaChange: result.allMembersStaminaChange,
      egoDrop: result.egoDrop,
      egoClear: result.egoClear,
      unlockTrait: result.unlockTrait
    }
  } catch (e) {
    throw new StateError(`Resolution failed for post ${postOption.id}`, { cause: e, meta: { optId: postOption.id, gameState } })
  }
}

/**
 * Calculates new followers based on platform growth mechanics.
 * @param {string} platform - 'instagram', 'tiktok', 'youtube', 'newsletter'
 * @param {number} performance - Gig performance score (0-100)
 * @param {number} currentFollowers - Existing follower count
 * @param {boolean} [isViral=false] - Whether a viral event occurred
 * @param {number} [controversyLevel=0] - Current shadowban meter
 * @param {number} [loyalty=0] - Buffer against bad growth
 * @returns {number} Net follower growth
 */
export const calculateSocialGrowth = (
  platform,
  performance,
  currentFollowers,
  isViral = false,
  controversyLevel = 0,
  loyalty = 0
) => {
  const platformData = Object.values(SOCIAL_PLATFORMS).find(
    p => p.id === platform
  )
  const multiplier = platformData ? platformData.multiplier : 1.0

  // Loyalty shield: reduces the penalty of low performance
  const effectivePerf = Math.min(100, performance + (loyalty * 0.5))
  let baseGrowth = Math.max(0, effectivePerf - 50) * 0.5 // e.g. 80 score -> 15 base
  
  // Shadowban / Cancel Culture penalty
  if (controversyLevel >= 80) {
    // High controversy leads to negative growth (Cancel Culture)
    // The higher the controversy, the worse it gets.
    const penaltyFactor = (controversyLevel - 70) * 0.05 // e.g. 80 -> 0.5, 100 -> 1.5
    baseGrowth = -Math.abs(baseGrowth * penaltyFactor)
  }

  const viralBonus = isViral ? (currentFollowers * 0.1) + 100 : 0

  return Math.floor((baseGrowth * multiplier) + viralBonus)
}

/**
 * Checks if a viral event triggers based on gig stats.
 * @param {object} stats - { accuracy, maxCombo, score }
 * @param {object|number} [options={}] - Options object OR legacy modifiers number.
 * @param {number} [legacyRoll=secureRandom()] - Legacy roll argument (only used if options is number).
 * @returns {boolean} True if viral event occurs
 */
export const checkViralEvent = (stats, options = {}, legacyRoll = secureRandom()) => {
  // Backwards compatibility handling
  let modifiers = 0
  let roll = legacyRoll
  let context = null

  if (typeof options === 'number') {
    modifiers = options
  } else {
    // New signature usage
    modifiers = options.modifiers || 0
    roll = options.roll !== undefined ? options.roll : secureRandom()
    context = options.context || null
  }

  if (stats.accuracy > 95) return true
  // Combo threshold logic: Assuming 2.5x multiplier roughly correlates to 30-50 combo depending on scaling.
  // Using maxCombo directly.
  if (stats.maxCombo > 50) return true

  let chance = 0.01 // Default low base chance

  // If we have context, use the full virality score logic (which includes traits like social_manager)
  if (context && typeof context.perfScore === 'number') {
    chance = calculateViralityScore(
      context.perfScore,
      context.events || [],
      context.venue,
      context.band
    )
  }

  // Apply modifiers
  chance += modifiers

  return roll < chance
}

/**
 * Applies organic decay to follower counts.
 * @param {number} followers - Current follower count
 * @param {number} daysSinceLastPost - Days since last engagement
 * @returns {number} New follower count (decreased)
 */
export const applyReputationDecay = (followers, daysSinceLastPost) => {
  if (daysSinceLastPost < 3) return followers
  const decayRate = 0.01 * (daysSinceLastPost - 2) // 1% per day after day 2
  return Math.floor(followers * (1 - Math.min(0.5, decayRate)))
}

/**
 * Generates a daily social media trend.
 * @param {Function} rng - Random number generator.
 * @returns {string} One of 'NEUTRAL', 'DRAMA', 'TECH', 'MUSIC', 'WHOLESOME'.
 */
export const generateDailyTrend = (rng = secureRandom) => {
  const trends = ['NEUTRAL', 'DRAMA', 'TECH', 'MUSIC', 'WHOLESOME']
  // Weighted choice could go here, for now uniform random
  const idx = Math.floor(rng() * trends.length)
  return trends[idx]
}

/**
 * Generates available brand deal offers based on band status.
 * @param {object} gameState - Current game state.
 * @param {Function} rng - Random number generator.
 * @returns {Array} List of offer objects.
 */
export const generateBrandOffers = (gameState, rng = secureRandom) => {
  const { social, band } = gameState
  // Filter available deals
  const eligibleDeals = BRAND_DEALS.filter(deal => {
    // Check followers
    const totalFollowers = (social.instagram || 0) + (social.tiktok || 0) + (social.youtube || 0)
    if (totalFollowers < deal.requirements.followers) return false

    // Check trend match
    if (social.trend && !deal.requirements.trend.includes(social.trend)) return false

    // Check trait match (if required trait exists in band)
    if (deal.requirements.trait && !bandHasTrait(band, deal.requirements.trait)) return false

    return true
  })

  // Pick up to 2 random offers
  const offers = []
  const pool = [...eligibleDeals]

  // Chance to generate any offer at all: 30% per eligible deal
  for (const deal of pool) {
    if (rng() < 0.3) {
      offers.push(deal)
    }
  }

  // Fisher-Yates shuffle to ensure random selection if >2 offers
  for (let i = offers.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[offers[i], offers[j]] = [offers[j], offers[i]]
  }

  return offers.slice(0, 2)
}
