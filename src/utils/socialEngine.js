// Logic for Social Media Virality and Posting
export const SOCIAL_PLATFORMS = {
  INSTAGRAM: { id: 'instagram', label: 'Instagram', multiplier: 1.0 },
  TIKTOK: { id: 'tiktok', label: 'TikTok', multiplier: 1.5 }, // Volatile
  YOUTUBE: { id: 'youtube', label: 'YouTube', multiplier: 0.8 }
}

/**
 * Calculates viral potential based on performance and events.
 */
export const calculateViralityScore = (performanceScore, gigEvents, venue) => {
  let baseChance = 0.05 // 5%

  // Performance Multiplier
  if (performanceScore > 90) baseChance *= 2.0
  else if (performanceScore > 75) baseChance *= 1.5

  // Venue Multiplier
  if (venue.name.includes('Kaminstube')) baseChance *= 1.5 // Historical

  // Event Multiplier (e.g. "Stage Diver", "Influencer")
  if (gigEvents.includes('stage_diver')) baseChance *= 2.0
  if (gigEvents.includes('influencer_spotted')) baseChance *= 3.0

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
