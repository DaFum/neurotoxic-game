// Logic for Social Media Virality and Posting
import { secureRandom } from './crypto.js'
import { POST_OPTIONS } from '../data/postOptions.js'
import { SOCIAL_PLATFORMS } from '../data/platforms.js'
import { BRAND_DEALS_BY_ID } from '../data/brandDeals.js'
import { bandHasTrait } from './traitLogic.js'
import { StateError } from './errorHandler.js'
import { ALLOWED_TRENDS, ALLOWED_TRENDS_SET } from '../data/socialTrends.js'
import { BRAND_ALIGNMENTS } from '../context/initialState.js'
import { clampPlayerMoney, clampBandHarmony } from './gameStateUtils.js'

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

const COOLDOWN_BLOCKED_IDS = new Set([
  'recovery_apology_tour_promo',
  'recovery_leaked_good_deed'
])

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
  const isCooldownActive = (gameState.social?.reputationCooldown || 0) > 0

  const eligibleOptions = []
  const currentTrend = gameState.social?.trend

  for (let i = 0; i < POST_OPTIONS.length; i++) {
    const opt = POST_OPTIONS[i]

    // Filter by cooldown if active
    if (isCooldownActive && COOLDOWN_BLOCKED_IDS.has(opt.id)) {
      continue
    }

    try {
      if (opt.condition(gameState)) {
        let weight = 1.0

        // Example: If very low money, boost crowdfund weight
        if (opt.id === 'comm_crowdfund' && gameState.player.money < 100)
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

  const results = []

  // 1a. Forced Sponsor Post Override
  // Check if there are active deals of type SPONSORSHIP.
  const hasActiveSponsor =
    gameState.social?.activeDeals &&
    gameState.social.activeDeals.some(d => d.type === 'SPONSORSHIP')
  if (gameState.social?.sponsorActive || hasActiveSponsor) {
    // Force a specific commercial post or synthesize one
    const sponsorIdx = eligibleOptions.findIndex(
      o => o.id === 'comm_sellout_ad'
    )
    if (sponsorIdx !== -1) {
      const sponsorOpt = eligibleOptions[sponsorIdx]
      sponsorOpt._force = true
      results.push(sponsorOpt)
      // Remove in-place to avoid full array re-allocation
      eligibleOptions.splice(sponsorIdx, 1)
    }
  }

  // 2. Sort by weight descending
  eligibleOptions.sort((a, b) => b._weight - a._weight)

  // 3. Fill remaining slots to reach 3 total
  const needed = 3 - results.length
  for (let i = 0; i < needed && i < eligibleOptions.length; i++) {
    results.push(eligibleOptions[i])
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

  // 4. Clean up output directly on the pushed objects (they are already cloned)
  for (let i = 0; i < results.length; i++) {
    delete results[i]._weight
    delete results[i]._force
  }

  return results
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

    // Safety bounds enforcement for resolved deltas
    // Note: Double-clamping occurs here and in hooks for defense-in-depth, ensuring
    // resolved deltas stay within bounds before applying and displaying correctly.
    let moneyChange = result.moneyChange
    if (moneyChange !== undefined && gameState.player?.money !== undefined) {
      const prevMoney = gameState.player.money
      const nextMoney = clampPlayerMoney(prevMoney + moneyChange)
      moneyChange = nextMoney - prevMoney
    }

    let harmonyChange = result.harmonyChange
    if (harmonyChange !== undefined && gameState.band?.harmony !== undefined) {
      const prevHarmony = gameState.band.harmony
      const nextHarmony = clampBandHarmony(prevHarmony + harmonyChange)
      harmonyChange = nextHarmony - prevHarmony
    }

    return {
      success: result.success ?? true,
      followers: result.followers ?? 0,
      platform: result.platform || postOption.platform,
      message: result.message || 'Post completed.',
      // Side effects (optional, will be undefined if not provided)
      moneyChange,
      moodChange: result.moodChange,
      harmonyChange,
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
// ⚡ Bolt: Pre-calculate platform ID map for O(1) lookups instead of O(N) array allocation and search.
// Expected Impact: Reduces GC overhead and CPU cycles during the hot-path calculateSocialGrowth function.
const PLATFORMS_BY_ID = Object.create(null)
for (const key in SOCIAL_PLATFORMS) {
  if (Object.hasOwn(SOCIAL_PLATFORMS, key)) {
    const p = SOCIAL_PLATFORMS[key]
    PLATFORMS_BY_ID[p.id] = p
  }
}

export const calculateSocialGrowth = (
  platform,
  performance,
  currentFollowers,
  isViral = false,
  controversyLevel = 0,
  loyalty = 0
) => {
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
  let modifiers
  let roll = legacyRoll

  if (typeof options === 'number') {
    modifiers = options
  } else {
    // New signature usage
    modifiers = options.modifiers || 0
    roll = options.roll !== undefined ? options.roll : secureRandom()
  }

  if (stats.accuracy > 95) return true
  // Combo threshold logic: Assuming 2.5x multiplier roughly correlates to 30-50 combo depending on scaling.
  // Using maxCombo directly.
  if (stats.maxCombo > 50) return true

  let chance

  const context = options.context

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
 *
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

  // Pre-calculate common checks to avoid redundant computations
  const totalFollowers =
    (social.instagram || 0) + (social.tiktok || 0) + (social.youtube || 0)

  // Create an O(1) set of active deal IDs
  const activeDealIds = new Set()
  if (social.activeDeals) {
    for (const d of social.activeDeals) {
      activeDealIds.add(d.id)
    }
  }

  // Filter available deals
  const eligibleDeals = []
  for (const deal of BRAND_DEALS_BY_ID.values()) {
    // Check followers
    if (totalFollowers < deal.requirements.followers) continue

    // Check trend match using O(1) loop or Set check if available
    if (social.trend && deal.requirements.trend) {
      // Defend against unknown/invalid trend values and avoid runtime errors.
      // We first check if social.trend is valid globally via ALLOWED_TRENDS_SET.
      if (ALLOWED_TRENDS_SET && !ALLOWED_TRENDS_SET.has(social.trend)) continue
      if (!deal.requirements.trend.includes(social.trend)) continue
    }

    // Check trait match (if required trait exists in band)
    if (deal.requirements.trait && !bandHasTrait(band, deal.requirements.trait))
      continue

    // Check if already active
    if (activeDealIds.has(deal.id)) continue

    eligibleDeals.push(deal)
  }

  // Pick up to 2 random offers, weighted by reputation
  const offers = []

  // Logic: Reputation increases the "chance" check.
  // Base chance 30%.
  // Reputation 0-100.
  // Rep 50 -> +15% chance. Rep 100 -> +30% chance.
  // Negative reputation reduces chance? Assuming reputation is 0-100 based on validation, but logic might allow negative?

  const pool = [...eligibleDeals]

  // Partial Fisher-Yates inline to lazily yield random items without a full array shuffle.
  // We only swap elements as we evaluate them, stopping as soon as 2 offers are found.
  let found = 0
  const n = pool.length

  for (let i = n - 1; i >= 0 && found < 2; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
    const deal = pool[i]

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
      found++
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
  let successChance
  let feedback
  let status = 'ACCEPTED'
  let newDeal = structuredClone(deal)

  // Modifiers
  const hasManager = bandHasTrait(band, 'social_manager')
  const isFamous = (gameState.player.fame || 0) > 1000

  // Roll once
  const roll = rng()
  let isSuccess

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