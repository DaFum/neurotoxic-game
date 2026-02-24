// Logic for Social Media Virality and Posting
import { secureRandom } from './crypto.js'
import { POST_OPTIONS } from '../data/postOptions.js'

// Platform metadata used internally by calculateSocialGrowth.
// Not exported — UI consumers should use the social engine functions directly.
export const SOCIAL_PLATFORMS = {
  INSTAGRAM: { id: 'instagram', label: 'Instagram', multiplier: 1.2 },
  TIKTOK: { id: 'tiktok', label: 'TikTok', multiplier: 1.5 }, // Volatile
  YOUTUBE: { id: 'youtube', label: 'YouTube', multiplier: 0.8 },
  NEWSLETTER: { id: 'newsletter', label: 'Newsletter', multiplier: 0.5 }
}

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
  if (
    bandState?.members?.some(m =>
      m.traits?.some(t => t.id === 'social_manager')
    )
  ) {
    baseChance *= 1.15
  }

  // Cap at 90%
  return Math.min(0.9, baseChance)
}

/**
 * Generates options for the "Post-Gig Social Media Strategy" phase.
 * It evaluates conditions from POST_OPTIONS, assigns weights, and selects exactly 3.
 */
export const generatePostOptions = (gigResult, gameState) => {
  // 1. Evaluate and collect eligible options
  let eligibleOptions = POST_OPTIONS.filter(opt => {
    try {
      return opt.condition(gameState)
    } catch (e) {
      console.warn(`Condition failed for post option ${opt.id}:`, e)
      return false
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
    return { ...opt, _weight: weight * secureRandom() }
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
    console.error(`Post option ${postOption.id} is missing a resolve function.`)
    return { success: false, followers: 0, platform: postOption.platform || 'unknown', message: 'Failed to post.' }
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
      egoDrop: result.egoDrop
    }
  } catch (e) {
    console.error(`Resolution failed for post ${postOption.id}:`, e)
    return { success: false, followers: 0, platform: postOption.platform, message: 'An error occurred while posting.' }
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
  
  // Shadowban penalty
  if (controversyLevel >= 100) {
    baseGrowth *= 0.25 // 75% reduction in organic growth
  }

  const viralBonus = isViral ? (currentFollowers * 0.1) + 100 : 0

  return Math.floor((baseGrowth * multiplier) + viralBonus)
}

/**
 * Checks if a viral event triggers based on gig stats.
 * @param {object} stats - { accuracy, maxCombo, score }
 * @param {number} [modifiers=0] - Additional probability boost (0-1)
 * @param {number} [roll=secureRandom()] - Deterministic roll (0-1)
 * @returns {boolean} True if viral event occurs
 */
export const checkViralEvent = (stats, modifiers = 0, roll = secureRandom()) => {
  if (stats.accuracy > 95) return true
  // Combo threshold logic: Assuming 2.5x multiplier roughly correlates to 30-50 combo depending on scaling.
  // Using maxCombo directly.
  if (stats.maxCombo > 50) return true
  const chance = 0.01 + modifiers
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
