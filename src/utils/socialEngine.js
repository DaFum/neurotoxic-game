// Logic for Social Media Virality and Posting
import { secureRandom } from './crypto.js'
import { POST_OPTIONS } from '../data/postOptions.js'
import { SOCIAL_PLATFORMS } from '../data/platforms.js'
import { BRAND_DEALS } from '../data/brandDeals.js'
import { bandHasTrait } from './traitLogic.js'
import { StateError } from './errorHandler.js'
import { ALLOWED_TRENDS } from '../data/socialTrends.js'
import { BRAND_ALIGNMENTS } from '../context/initialState.js'

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

  // Showman Trait (Marius): +20% virality chance on live shows
  if (bandHasTrait(bandState, 'showman')) {
    baseChance *= 1.2
  }

  // Cap at 90%
  return Math.min(0.9, baseChance)
}

/**
 * Generates options for the "Post-Gig Social Media Strategy" phase.
 * It evaluates conditions from POST_OPTIONS, assigns weights, and selects exactly 3.
 */
export const generatePostOptions = (
  gigResult,
  gameState,
  rng = secureRandom
) => {
  // 1. Evaluate and collect eligible options
  let eligibleOptions = POST_OPTIONS.filter(opt => {
    try {
      return opt.condition(gameState)
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
  })

  const cooldownBlockedIds = [
    'recovery_apology_tour_promo',
    'recovery_leaked_good_deed'
  ]
  if ((gameState.social?.reputationCooldown || 0) > 0) {
    eligibleOptions = eligibleOptions.filter(
      opt => !cooldownBlockedIds.includes(opt.id)
    )
  }

  const results = []

  // 1a. Forced Sponsor Post Override
  // Check if there are active deals of type SPONSORSHIP.
  const hasActiveSponsor =
    gameState.social?.activeDeals &&
    gameState.social.activeDeals.some(d => d.type === 'SPONSORSHIP')
  if (gameState.social?.sponsorActive || hasActiveSponsor) {
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
    if (opt.id === 'comm_crowdfund' && gameState.player.money < 100)
      weight += 50

    // Trend Matching Bonus
    const currentTrend = gameState.social?.trend
    if (currentTrend && opt.category) {
      // Map categories to trends if needed, or exact match
      const isMatch =
        (currentTrend === 'DRAMA' && opt.category === 'Drama') ||
        (currentTrend === 'TECH' && opt.category === 'Commercial') || // Tech usually commercial/gear
        (currentTrend === 'MUSIC' && opt.category === 'Performance') ||
        (currentTrend === 'WHOLESOME' &&
          (opt.category === 'Lifestyle' || opt.badges?.includes('🛡️'))) // Wholesome logic

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
export const resolvePost = (
  postOption,
  gameState,
  diceRoll = secureRandom()
) => {
  if (!postOption.resolve) {
    throw new StateError(
      `Post option ${postOption.id} is missing a resolve function.`
    )
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
 * @param {object} stats - { accuracy, maxCombo, score }
 * @param {object|number} [options={}] - Options object OR legacy modifiers number.
 * @param {number} [legacyRoll=secureRandom()] - Legacy roll argument (only used if options is number).
 * @returns {boolean} True if viral event occurs
 */
export const checkViralEvent = (
  stats,
  options = {},
  legacyRoll = secureRandom()
) => {
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
  // Weighted choice could go here, for now uniform random
  const idx = Math.floor(rng() * ALLOWED_TRENDS.length)
  // Ensure valid index even if rng() === 1
  const safeIdx = Math.min(idx, ALLOWED_TRENDS.length - 1)
  return ALLOWED_TRENDS[safeIdx]
}

/**
 * Generates a dynamic brand name based on alignment.
 * @param {string} baseName - Fallback or base name.
 * @param {string} alignment - Brand alignment (EVIL, CORPORATE, INDIE, SUSTAINABLE).
 * @param {Function} rng - Random number generator.
 * @returns {string} Generated brand name.
 */
export const generateBrandName = (baseName, alignment, rng = secureRandom) => {
  const pick = arr => arr[Math.floor(rng() * arr.length)]

  if (alignment === BRAND_ALIGNMENTS.EVIL) {
    const prefixes = [
      'Toxic',
      'Neon',
      'Quantum',
      'Hyper',
      'Radioactive',
      'Cyber',
      'Acid',
      'Vile'
    ]
    const suffixes = [
      'Rush',
      'Blast',
      'Surge',
      'Core',
      'Sludge',
      'Venom',
      'Waste',
      'X'
    ]
    const types = ['Energy', 'Systems', 'Labs', 'Corp', 'Chemicals']
    return `${pick(prefixes)} ${pick(suffixes)} ${pick(types)}`
  }

  if (alignment === BRAND_ALIGNMENTS.CORPORATE) {
    const prefixes = [
      'Global',
      'United',
      'Apex',
      'Summit',
      'Prime',
      'Omni',
      'Macro',
      'Elite'
    ]
    const suffixes = [
      'Dynamics',
      'Solutions',
      'Holdings',
      'Ventures',
      'Capital',
      'Industries',
      'Group'
    ]
    return `${pick(prefixes)} ${pick(suffixes)}`
  }

  if (alignment === BRAND_ALIGNMENTS.INDIE) {
    const prefixes = [
      'Void',
      'Abyss',
      'Shadow',
      'Underground',
      'Basement',
      'Garage',
      'Lo-Fi',
      'Raw'
    ]
    const suffixes = [
      'Records',
      'Audio',
      'Tapes',
      'Sound',
      'Collective',
      'Zine',
      'Press'
    ]
    return `${pick(prefixes)} ${pick(suffixes)}`
  }

  if (alignment === BRAND_ALIGNMENTS.SUSTAINABLE) {
    const prefixes = [
      'Green',
      'Eco',
      'Pure',
      'Nature',
      'Gaia',
      'Solar',
      'Bio',
      'Earth'
    ]
    const suffixes = [
      'Path',
      'Roots',
      'Harvest',
      'Bloom',
      'Cycle',
      'Life',
      'Leaf'
    ]
    const types = ['Snacks', 'Wear', 'Gear', 'Organics', 'Co-op']
    return `${pick(prefixes)}${pick(suffixes)} ${pick(types)}`
  }

  return baseName
}

/**
 * Generates available brand deal offers based on band status and reputation.
 * @param {object} gameState - Current game state.
 * @param {Function} rng - Random number generator.
 * @returns {Array} List of offer objects.
 */
export const generateBrandOffers = (gameState, rng = secureRandom) => {
  const social = gameState?.social || {}
  const band = gameState?.band || {}
  const reputation = social.brandReputation || {}

  // Filter available deals
  const eligibleDeals = BRAND_DEALS.filter(deal => {
    // Check followers
    const totalFollowers =
      (social.instagram || 0) + (social.tiktok || 0) + (social.youtube || 0)
    if (totalFollowers < deal.requirements.followers) return false

    // Check trend match
    if (social.trend && !deal.requirements.trend.includes(social.trend))
      return false

    // Check trait match (if required trait exists in band)
    if (deal.requirements.trait && !bandHasTrait(band, deal.requirements.trait))
      return false

    // Check if already active
    if (social.activeDeals?.some(d => d.id === deal.id)) return false

    return true
  })

  // Pick up to 2 random offers, weighted by reputation
  const offers = []

  // Logic: Reputation increases the "chance" check.
  // Base chance 30%.
  // Reputation 0-100.
  // Rep 50 -> +15% chance. Rep 100 -> +30% chance.
  // Negative reputation reduces chance? Assuming reputation is 0-100 based on validation, but logic might allow negative?

  const pool = [...eligibleDeals]

  // Shuffle pool first to avoid bias if we just iterate
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  for (const deal of pool) {
    if (offers.length >= 2) break

    const align = deal.alignment
    const rep = reputation[align] || 0

    // Base chance 0.3
    // Rep bonus: 0.003 per point (100 rep = +0.3)
    let chance = 0.3 + rep * 0.003

    // Penalty for negative rep if we allow it, or just 0
    if (rep < 0) chance += rep * 0.005 // Higher penalty for bad rep

    if (rng() < chance) {
      // Generate dynamic name
      const dynamicName = generateBrandName(deal.name, align, rng)
      offers.push({ ...deal, name: dynamicName })
    }
  }

  return offers
}

/**
 * Negotiates a brand deal with risk/reward mechanics.
 * @param {object} deal - The original deal object.
 * @param {string} strategy - 'AGGRESSIVE', 'PERSUASIVE', 'SAFE'.
 * @param {object} gameState - Current game state.
 * @param {Function} rng - Random number generator.
 * @returns {object} { success: boolean, deal: object, feedback: string, status: 'ACCEPTED'|'REVOKED'|'FAILED' }
 */
export const negotiateDeal = (
  deal,
  strategy,
  gameState,
  rng = secureRandom
) => {
  const band = gameState.band
  let successChance = 0.5
  let feedback = ''
  let status = 'ACCEPTED'
  let newDeal = structuredClone(deal)

  // Modifiers
  const hasManager = bandHasTrait(band, 'social_manager')
  const isFamous = (gameState.player.fame || 0) > 1000

  // Roll once
  const roll = rng()
  let isSuccess = false

  switch (strategy) {
    case 'SAFE':
      successChance = 0.8
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
      successChance = 0.5
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
      successChance = 0.3
      if (isFamous) successChance += 0.2 // Fame helps aggression

      if (roll < successChance) {
        newDeal.offer.upfront = Math.floor(newDeal.offer.upfront * 1.5) // +50%
        feedback = 'You dominated the room. Massive payout!'
        isSuccess = true
      } else {
        feedback = 'They walked out. Deal revoked.'
        status = 'REVOKED'
        newDeal = null
        isSuccess = false
      }
      break

    default:
      throw new Error(`Unknown strategy: ${strategy}`)
  }

  return {
    success: isSuccess,
    deal: newDeal,
    feedback,
    status
  }
}
