// Logic for Social Media Virality and Posting
import { secureRandom } from './crypto.js'

// Platform metadata used internally by calculateSocialGrowth.
// Not exported — UI consumers should use the social engine functions directly.
const SOCIAL_PLATFORMS = {
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
 */
export const generatePostOptions = gigResult => {
  const options = []

  // Option 1: Moshpit Chaos (High Viral, TikTok)
  options.push({
    id: 'clip_mosh',
    title: 'Moshpit Chaos Clip',
    platform: 'TIKTOK',
    description: 'Short, chaotic clip of the wall of death.',
    viralChance: gigResult.viralityScore * 1.5,
    quality: 'Rough',
    cost: 0,
    effect: { followers: 50, platform: 'tiktok' }
  })

  // Option 2: Technical Breakdown (YouTube, Quality)
  options.push({
    id: 'clip_tech',
    title: 'Technical Playthrough',
    platform: 'YOUTUBE',
    description: "Focus on Matze's solo. Musicians love this.",
    viralChance: gigResult.viralityScore * 0.8, // Niche
    quality: 'High',
    cost: 0,
    effect: { followers: 10, platform: 'youtube' } // Loyal fans
  })

  // Option 3: Band Pic (Instagram, Safe)
  options.push({
    id: 'pic_group',
    title: 'Sweaty Band Selfie',
    platform: 'INSTAGRAM',
    description: 'Classic "Thank you [City]!" post.',
    viralChance: 0.2, // Low viral but consistent
    quality: 'Medium',
    cost: 0,
    effect: { followers: 20, platform: 'instagram' }
  })

  return options
}

/**
 * Resolves the outcome of a social media post based on a random roll.
 * @param {object} postOption - The selected post option.
 * @param {number} diceRoll - A random number between 0 and 1.
 * @returns {object} The result containing success status, follower gain, and message.
 */
export const resolvePost = (postOption, diceRoll) => {
  const viralChance = postOption?.viralChance ?? 0
  const baseFollowers = postOption?.effect?.followers ?? 0
  const platform = postOption?.effect?.platform ?? 'unknown'

  const isViral = diceRoll < viralChance
  const followerGain = isViral ? baseFollowers * 10 : baseFollowers

  return {
    success: isViral,
    followers: followerGain,
    platform,
    message: isViral
      ? 'IT WENT VIRAL! Notifications exploding!'
      : 'Solid engagement. Fans are happy.'
  }
}

/**
 * Calculates new followers based on platform growth mechanics.
 * @param {string} platform - 'instagram', 'tiktok', 'youtube', 'newsletter'
 * @param {number} performance - Gig performance score (0-100)
 * @param {number} currentFollowers - Existing follower count
 * @param {boolean} [isViral=false] - Whether a viral event occurred
 * @returns {number} Net follower growth
 */
export const calculateSocialGrowth = (
  platform,
  performance,
  currentFollowers,
  isViral = false
) => {
  const platformData = Object.values(SOCIAL_PLATFORMS).find(
    p => p.id === platform
  )
  const multiplier = platformData ? platformData.multiplier : 1.0

  const baseGrowth = Math.max(0, performance - 50) * 0.5 // e.g. 80 score -> 15 base
  const viralBonus = isViral ? currentFollowers * 0.1 + 100 : 0

  return Math.floor(baseGrowth * multiplier + viralBonus)
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
