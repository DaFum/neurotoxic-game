import { BALANCE_CONSTANTS } from './gameStateUtils'
import { calculateGigFinancials } from './economyEngine'
import { toFiniteNumber } from './numberUtils'
import { generatePostOptions } from './socialEngine'

import {
  checkViralEvent,
  calculateSocialGrowth,
  resolvePost
} from './socialEngine'
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampMemberStamina,
  clampMemberMood,
  clampControversyLevel,
  clampLoyalty,
  clamp0to100,
  calculateGigFameReward
} from './gameStateUtils'
import { BRAND_ALIGNMENTS } from '../context/initialState'
import { BRAND_DEALS_BY_ID } from '../data/brandDeals'
import { SOCIAL_PLATFORMS } from '../data/platforms'
const SOCIAL_PLATFORMS_VALUES = Object.values(SOCIAL_PLATFORMS)

import type {
  GameState,
  PostGigSummary,
  Venue,
  PostResult,
  UnknownRecord,
  BrandAlignment
} from '../types'
import type { CityTraitState } from '../types/game'
import type { BandMember } from '../types/band'
import type { PostGigFinancials } from '../types/economy'
import type { BrandDeal, Platform, SocialPostOption } from '../types/social'

type ResolvedPostResult = PostResult & {
  platform: Platform
  success: boolean
  followers: number
  message: string
  harmonyChange?: number
  controversyChange?: number
  loyaltyChange?: number
  zealotryChange?: number
  staminaChange?: number
  moodChange?: number
  allMembersMoodChange?: boolean
  allMembersStaminaChange?: boolean
  targetMember?: string
  reputationCooldownSet?: number
  egoClear?: boolean
  egoDrop?: string | null
  influencerUpdate?: { id: string; scoreChange: number }
}

const SOCIAL_PLATFORM_IDS = new Set<Platform>([
  'instagram',
  'tiktok',
  'youtube',
  'newsletter'
])

const isSocialPlatformId = (value: unknown): value is Platform =>
  typeof value === 'string' && SOCIAL_PLATFORM_IDS.has(value as Platform)

const applyClampedMoneyDelta = (
  currentMoney: number,
  delta: number
): { nextMoney: number; appliedDelta: number } => {
  const prevMoney = toFiniteNumber(currentMoney, 0)
  const safeDelta = toFiniteNumber(delta, 0)
  const nextMoney = clampPlayerMoney(prevMoney + safeDelta)
  return { nextMoney, appliedDelta: nextMoney - prevMoney }
}

const normalizeNumericDelta = (
  value: unknown,
  fieldName: string
): number | undefined => {
  if (typeof value !== 'number') return undefined
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid post result ${fieldName}: ${String(value)}`)
  }
  return value
}

const normalizeInfluencerUpdate = (
  value: unknown
): ResolvedPostResult['influencerUpdate'] => {
  if (value == null) {
    return undefined
  }

  if (typeof value !== 'object') {
    throw new Error('Invalid influencerUpdate: expected an object')
  }

  if (!Object.hasOwn(value, 'id')) {
    throw new Error('Invalid influencerUpdate: id must be a string')
  }

  if (!Object.hasOwn(value, 'scoreChange')) {
    throw new Error('Invalid influencerUpdate: scoreChange is required')
  }

  const update = value as { id?: unknown; scoreChange?: unknown }
  if (typeof update.id !== 'string') {
    throw new Error('Invalid influencerUpdate: id must be a string')
  }

  const scoreChange = toFiniteNumber(update.scoreChange, Number.NaN)
  if (!Number.isFinite(scoreChange)) {
    throw new Error(
      `Invalid influencerUpdate scoreChange for ${update.id}: ${String(
        update.scoreChange
      )}`
    )
  }

  return {
    id: update.id,
    scoreChange
  }
}

const getDealIdentifier = (deal: UnknownRecord): string => {
  const id = deal.id
  return typeof id === 'string' || typeof id === 'number'
    ? String(id)
    : 'unknown'
}

const normalizeRemainingGigs = (deal: UnknownRecord): number => {
  const remainingGigs = deal.remainingGigs
  if (
    typeof remainingGigs !== 'number' ||
    !Number.isFinite(remainingGigs) ||
    !Number.isInteger(remainingGigs) ||
    remainingGigs < 0
  ) {
    throw new Error(
      `Invalid remainingGigs for active deal ${getDealIdentifier(
        deal
      )}: ${String(remainingGigs)}`
    )
  }
  return remainingGigs
}

const normalizeResolvedPost = (
  raw: Record<string, unknown>
): ResolvedPostResult => {
  if (!isSocialPlatformId(raw.platform)) {
    throw new Error(
      `Invalid social post platform: ${String(raw.platform ?? 'missing')}`
    )
  }
  const platform = raw.platform
  const influencerUpdate = normalizeInfluencerUpdate(raw.influencerUpdate)

  return {
    ...raw,
    platform,
    success: raw.success === true,
    followers: toFiniteNumber(raw.followers),
    message: typeof raw.message === 'string' ? raw.message : '',
    moneyChange: normalizeNumericDelta(raw.moneyChange, 'moneyChange'),
    harmonyChange: normalizeNumericDelta(raw.harmonyChange, 'harmonyChange'),
    controversyChange: normalizeNumericDelta(
      raw.controversyChange,
      'controversyChange'
    ),
    loyaltyChange: normalizeNumericDelta(raw.loyaltyChange, 'loyaltyChange'),
    zealotryChange: normalizeNumericDelta(raw.zealotryChange, 'zealotryChange'),
    staminaChange: normalizeNumericDelta(raw.staminaChange, 'staminaChange'),
    moodChange: normalizeNumericDelta(raw.moodChange, 'moodChange'),
    allMembersMoodChange: raw.allMembersMoodChange === true,
    allMembersStaminaChange: raw.allMembersStaminaChange === true,
    targetMember:
      typeof raw.targetMember === 'string' ? raw.targetMember : undefined,
    reputationCooldownSet: normalizeNumericDelta(
      raw.reputationCooldownSet,
      'reputationCooldownSet'
    ),
    egoClear: raw.egoClear === true,
    egoDrop:
      typeof raw.egoDrop === 'string' || raw.egoDrop === null
        ? raw.egoDrop
        : undefined,
    influencerUpdate
  }
}
export type CalculatePostGigStateParams = {
  option: SocialPostOption
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  lastGigStats?: PostGigSummary | null
  currentGig?: Venue | null
  perfScore?: number
  secureRandomValue?: number
}

export const calculatePostGigStateUpdates = (
  params: CalculatePostGigStateParams
) => {
  const {
    option,
    player,
    band,
    social,
    lastGigStats,
    currentGig,
    perfScore,
    secureRandomValue
  } = params
  const gameState = { player, band, social }
  const result = normalizeResolvedPost(
    resolvePost(option, gameState, secureRandomValue)
  )

  const isGigViral = Boolean(
    lastGigStats &&
    checkViralEvent(
      {
        accuracy: lastGigStats.accuracy ?? 0,
        maxCombo: lastGigStats.maxCombo ?? lastGigStats.combo ?? 0,
        score: lastGigStats.score ?? 0
      },
      {
        context: {
          perfScore,
          band,
          venue: currentGig,
          events: Array.isArray(lastGigStats?.events)
            ? lastGigStats.events
            : undefined
        },
        roll: secureRandomValue
      }
    )
  )
  const gigViralBonus = isGigViral ? 1 : 0

  const organicGrowth = calculateSocialGrowth(
    result.platform,
    perfScore ?? 0,
    toFiniteNumber(social[result.platform], 0),
    isGigViral,
    toFiniteNumber(social.controversyLevel, 0),
    toFiniteNumber(social.loyalty, 0)
  )
  const totalFollowers = result.followers + organicGrowth
  const finalResult = { ...result, totalFollowers }

  const newBand = { ...band }
  let hasBandUpdates = false
  let appliedHarmonyDelta = 0

  if (result.harmonyChange) {
    const prevHarmony = newBand.harmony ?? 1
    const nextHarmony = clampBandHarmony(prevHarmony + result.harmonyChange)
    appliedHarmonyDelta = nextHarmony - prevHarmony
    newBand.harmony = nextHarmony
    hasBandUpdates = true
  }

  if (
    result.allMembersMoodChange ||
    result.allMembersStaminaChange ||
    result.targetMember
  ) {
    newBand.members = newBand.members.map((m: BandMember) => {
      const moodChange = result.moodChange
      const staminaChange = result.staminaChange
      const needsMoodUpdate =
        typeof moodChange === 'number' &&
        (result.allMembersMoodChange || m.name === result.targetMember)
      const needsStaminaUpdate =
        typeof staminaChange === 'number' &&
        (result.allMembersStaminaChange || m.name === result.targetMember)

      if (!needsMoodUpdate && !needsStaminaUpdate) {
        return m
      }

      const updatedM = { ...m }
      if (needsMoodUpdate) {
        updatedM.mood = clampMemberMood(updatedM.mood + moodChange)
      }
      if (needsStaminaUpdate) {
        updatedM.stamina = clampMemberStamina(
          updatedM.stamina + staminaChange,
          updatedM.staminaMax
        )
      }
      return updatedM
    })
    hasBandUpdates = true
  }

  let nextMoney = player.money ?? 0
  let appliedMoneyDelta = 0
  if (result.moneyChange) {
    const applied = applyClampedMoneyDelta(
      player.money ?? 0,
      result.moneyChange
    )
    nextMoney = applied.nextMoney
    appliedMoneyDelta = applied.appliedDelta
  }

  const boundedZealotry = clamp0to100(
    toFiniteNumber(social.zealotry, 0) + (result.zealotryChange ?? 0)
  )

  const updatedSocial: Partial<GameState['social']> = {
    [result.platform]: Math.max(
      0,
      toFiniteNumber(social[result.platform], 0) + totalFollowers
    ),
    viral: Math.max(
      0,
      toFiniteNumber(social.viral, 0) + (result.success ? 1 : 0) + gigViralBonus
    ),
    lastGigDay: player.day,
    lastGigDifficulty: currentGig?.diff ?? currentGig?.difficulty ?? 1,
    controversyLevel: clampControversyLevel(
      toFiniteNumber(social.controversyLevel, 0) +
        (result.controversyChange ?? 0)
    ),
    loyalty: clampLoyalty(
      toFiniteNumber(social.loyalty, 0) + (result.loyaltyChange ?? 0)
    ),
    zealotry: boundedZealotry,
    reputationCooldown:
      result.reputationCooldownSet !== undefined
        ? result.reputationCooldownSet
        : social.reputationCooldown,
    egoFocus: result.egoClear
      ? null
      : result.egoDrop
        ? result.egoDrop
        : social.egoFocus,
    trend: social.trend,
    activeDeals: social.activeDeals,
    influencers: social.influencers
  }

  // Automatically decrement all active deals every gig
  if (updatedSocial.activeDeals && updatedSocial.activeDeals.length > 0) {
    const nextDeals: UnknownRecord[] = []
    for (let i = 0; i < updatedSocial.activeDeals.length; i++) {
      const deal = updatedSocial.activeDeals[i]
      if (!deal || typeof deal !== 'object') continue
      const dealRecord = deal as UnknownRecord
      const nextRemainingGigs = normalizeRemainingGigs(dealRecord) - 1
      if (nextRemainingGigs > 0) {
        nextDeals.push({ ...deal, remainingGigs: nextRemainingGigs })
      }
    }
    updatedSocial.activeDeals = nextDeals
  }

  // Handle comm_sellout_ad
  if (
    option.id === 'comm_sellout_ad' &&
    social.activeDeals &&
    social.activeDeals.length > 0
  ) {
    // Apply penalty from the sponsorship deal
    let deal: BrandDeal | undefined = undefined
    for (let i = 0; i < social.activeDeals.length; i++) {
      const d = social.activeDeals[i]
      if (
        d !== null &&
        typeof d === 'object' &&
        'type' in d &&
        d.type === 'SPONSORSHIP' &&
        'offer' in d
      ) {
        deal = d as BrandDeal
        break
      }
    }
    if (!deal)
      return {
        finalResult,
        newBand,
        hasBandUpdates,
        appliedHarmonyDelta,
        nextMoney,
        appliedMoneyDelta,
        updatedSocial
      }

    const template = BRAND_DEALS_BY_ID.get(deal.id)
    if (template && template.penalty) {
      if (template.penalty.controversy) {
        updatedSocial.controversyLevel = clampControversyLevel(
          (updatedSocial.controversyLevel || 0) + template.penalty.controversy
        )
      }
      if (template.penalty.loyalty) {
        updatedSocial.loyalty = Math.max(
          0,
          (updatedSocial.loyalty || 0) + template.penalty.loyalty
        )
      }
    }
  }

  if (result.influencerUpdate) {
    const { id, scoreChange } = result.influencerUpdate
    const currentInfluencer = social.influencers?.[id]
    if (currentInfluencer) {
      updatedSocial.influencers = {
        ...social.influencers,
        [id]: {
          ...currentInfluencer,
          score: Math.min(
            100,
            Math.max(0, toFiniteNumber(currentInfluencer.score) + scoreChange)
          )
        }
      }
    }
  }

  if (result.success && totalFollowers > 0) {
    const delta = Math.floor(totalFollowers * 0.25)

    for (const platformConfig of SOCIAL_PLATFORMS_VALUES) {
      const platformId = platformConfig.id as Platform

      // Do not cross-post to the platform that triggered the update,
      // and do not cross-post to the newsletter, which is treated differently.
      if (
        platformId !== result.platform &&
        platformId !== SOCIAL_PLATFORMS.NEWSLETTER.id
      ) {
        updatedSocial[platformId] = Math.max(
          0,
          toFiniteNumber(social[platformId]) + delta
        )
      }
    }
  }

  return {
    finalResult,
    newBand,
    hasBandUpdates,
    appliedHarmonyDelta,
    nextMoney,
    appliedMoneyDelta,
    updatedSocial
  }
}

const OPPOSING_ALIGNMENT_MAP = {
  [BRAND_ALIGNMENTS.EVIL]: BRAND_ALIGNMENTS.GOOD, // EVIL opposes GOOD (was SUSTAINABLE)
  [BRAND_ALIGNMENTS.SUSTAINABLE]: BRAND_ALIGNMENTS.EVIL, // SUSTAINABLE still opposes EVIL
  [BRAND_ALIGNMENTS.CORPORATE]: BRAND_ALIGNMENTS.INDIE,
  [BRAND_ALIGNMENTS.INDIE]: BRAND_ALIGNMENTS.CORPORATE,
  [BRAND_ALIGNMENTS.GOOD]: BRAND_ALIGNMENTS.EVIL,
  [BRAND_ALIGNMENTS.NEUTRAL]: BRAND_ALIGNMENTS.NEUTRAL
} as const satisfies Record<BrandAlignment, BrandAlignment>

export const getAcceptDealMoneyUpdate = ({
  deal,
  player
}: {
  deal: BrandDeal
  player: GameState['player']
}) => {
  let appliedMoneyDelta = 0
  let nextMoney = player.money ?? 0

  if (deal.offer.upfront) {
    const applied = applyClampedMoneyDelta(
      player.money ?? 0,
      deal.offer.upfront
    )
    nextMoney = applied.nextMoney
    appliedMoneyDelta = applied.appliedDelta
  }

  return { nextMoney, appliedMoneyDelta }
}

export const getAcceptDealBandUpdateFactory = (deal: BrandDeal) => {
  return (prevBand: GameState['band']): GameState['band'] => {
    if (!deal.offer.item) return prevBand
    return {
      ...prevBand,
      inventory: { ...prevBand.inventory, [deal.offer.item]: true }
    }
  }
}

export const getAcceptDealSocialUpdateFactory = (deal: BrandDeal) => {
  return (prevSocial: GameState['social']): Partial<GameState['social']> => {
    const updates: Partial<GameState['social']> = {}

    if (deal.penalty) {
      if (deal.penalty.loyalty) {
        updates.loyalty = Math.max(
          0,
          (prevSocial.loyalty || 0) + deal.penalty.loyalty
        )
      }
      if (deal.penalty.controversy) {
        updates.controversyLevel = clampControversyLevel(
          (prevSocial.controversyLevel || 0) + deal.penalty.controversy
        )
      }
    }

    if (deal.alignment) {
      updates.brandReputation = { ...(prevSocial.brandReputation || {}) }
      const currentRep = updates.brandReputation[deal.alignment] || 0
      updates.brandReputation[deal.alignment] = Math.min(100, currentRep + 5)

      const opposing = OPPOSING_ALIGNMENT_MAP[deal.alignment]
      if (opposing !== deal.alignment) {
        const oppRep = updates.brandReputation[opposing] || 0
        updates.brandReputation[opposing] = Math.max(0, oppRep - 3)
      }
    }

    updates.activeDeals = [{ ...deal, remainingGigs: deal.offer.duration }]

    return updates
  }
}

export const SPIN_STORY_MONEY_COST = 200
export const SPIN_STORY_CONTROVERSY_REDUCTION = 25

export type SpinStoryMoneyUpdate =
  | { success: false }
  | { success: true; nextMoney: number; appliedDelta: number }

export const getSpinStoryMoneyUpdate = ({
  player
}: {
  player: GameState['player']
}): SpinStoryMoneyUpdate => {
  if ((player.money ?? 0) < SPIN_STORY_MONEY_COST) {
    return { success: false }
  }

  const { nextMoney, appliedDelta } = applyClampedMoneyDelta(
    player.money ?? 0,
    -SPIN_STORY_MONEY_COST
  )

  return {
    success: true,
    nextMoney,
    appliedDelta
  }
}

export const getSpinStorySocialUpdateFactory = () => {
  return (prevSocial: GameState['social']) => ({
    controversyLevel: clampControversyLevel(
      (prevSocial.controversyLevel || 0) - SPIN_STORY_CONTROVERSY_REDUCTION
    )
  })
}

const assertFiniteIntegerAtLeastZero = (value: unknown, label: string) => {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${label} must be a finite integer >= 0`)
  }
}

const assertFiniteNumberAtLeastZero = (value: unknown, label: string) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite number >= 0`)
  }
}

export const calculateExcessMissMoneyPenalty = ({
  misses = 0,
  missTolerance,
  missMoneyPenalty
}: {
  misses?: number
  missTolerance: number
  missMoneyPenalty?: number
}) => {
  assertFiniteIntegerAtLeastZero(misses, 'misses')
  assertFiniteIntegerAtLeastZero(missTolerance, 'missTolerance')
  if (missMoneyPenalty !== undefined) {
    assertFiniteNumberAtLeastZero(missMoneyPenalty, 'missMoneyPenalty')
  }

  const excessMisses = Math.max(0, misses - missTolerance)
  return {
    excessMisses,
    penalty: excessMisses * (missMoneyPenalty ?? 0)
  }
}

export const applyPostGigPerformancePenalty = ({
  financials,
  misses = 0,
  missTolerance,
  missMoneyPenalty
}: {
  financials: PostGigFinancials
  misses?: number
  missTolerance: number
  missMoneyPenalty?: number
}) => {
  const { excessMisses, penalty } = calculateExcessMissMoneyPenalty({
    misses,
    missTolerance,
    missMoneyPenalty
  })

  if (penalty <= 0) return financials

  const newExpensesTotal = financials.expenses.total + penalty

  return {
    ...financials,
    expenses: {
      total: newExpensesTotal,
      breakdown: [
        ...financials.expenses.breakdown,
        {
          labelKey: 'economy:gigExpenses.performancePenalty.label',
          value: penalty,
          detailKey: 'economy:gigExpenses.performancePenalty.detail',
          detailParams: { misses: excessMisses }
        }
      ]
    },
    net: financials.income.total - newExpensesTotal
  }
}

/**
 * Calculates post-gig player stat changes for money and fame.
 *
 * @param params.player             - Current player state.
 * @param params.perfScore          - Gig performance score (0–100).
 * @param params.financials         - Post-gig financial breakdown.
 * @param params.misses             - Total missed notes.
 * @param params.calculateFameGain  - Applies diminishing returns to raw fame gain.
 * @param params.calculateFameLevel - Maps total fame to a fame level.
 * @param params.clampPlayerFame    - Clamps fame to valid range.
 * @param params.clampPlayerMoney   - Clamps money to valid range.
 * @param params.BALANCE_CONSTANTS  - Shared balance tuning values.
 * @returns {{ newMoney, newFame, fameLevel }}
 */
export const calculateContinueStats = ({
  player,
  perfScore,
  financials,
  misses,
  calculateFameGain,
  calculateFameLevel,
  clampPlayerFame,
  clampPlayerMoney,
  BALANCE_CONSTANTS
}: {
  player: GameState['player']
  perfScore: number
  financials: PostGigFinancials
  misses?: number
  calculateFameGain: (a: number, b: number, c: number) => number
  calculateFameLevel: (fame: number) => number
  clampPlayerFame: (n: number) => number
  clampPlayerMoney: (n: number) => number
  BALANCE_CONSTANTS: typeof import('./gameStateUtils').BALANCE_CONSTANTS
}) => {
  const prevFame = player.fame ?? 0

  let finalFameGain = -BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG
  if (perfScore >= 31) {
    const rawFameGain = calculateGigFameReward(perfScore)
    finalFameGain = calculateFameGain(
      rawFameGain,
      prevFame,
      BALANCE_CONSTANTS.MAX_FAME_GAIN
    )
  } else {
    // Progressive miss-penalty on bad gigs
    const missCount = misses ?? 0
    if (missCount > BALANCE_CONSTANTS.MISS_TOLERANCE) {
      const excessMisses = missCount - BALANCE_CONSTANTS.MISS_TOLERANCE
      const missPenalty = Math.round(
        excessMisses * BALANCE_CONSTANTS.MISS_PENALTY_RATE
      )
      finalFameGain -= missPenalty
    }
  }

  const prevMoney = player.money ?? 0
  const newMoney = clampPlayerMoney(prevMoney + financials.net)
  const newFame = clampPlayerFame(prevFame + finalFameGain)

  return {
    newMoney,
    newFame,
    fameLevel: calculateFameLevel(newFame)
  }
}

const PERF_SCORE_MIN = 30
const PERF_SCORE_MAX = 100
const PERF_SCORE_SCALER = 150

export const calculatePerformanceScore = (rawScore: number): number => {
  return Math.min(
    PERF_SCORE_MAX,
    Math.max(PERF_SCORE_MIN, rawScore / PERF_SCORE_SCALER)
  )
}

export const deriveGigContext = (
  currentGig: GameState['currentGig'],
  social: GameState['social'],
  player: GameState['player']
) => {
  if (!currentGig || !social || !player) return null

  return {
    daysSinceLastGig: player.day - (social.lastGigDay ?? player.day),
    lastGigDifficulty: social.lastGigDifficulty ?? null
  }
}

export const deriveFinancials = ({
  currentGig,
  lastGigStats,
  perfScore,
  gigModifiers,
  bandInventory,
  bandMerchPrices,
  player,
  social,
  reputationByRegion,
  activeStoryFlags,
  gigContext,
  cityTraits
}: {
  currentGig: GameState['currentGig']
  lastGigStats: GameState['lastGigStats']
  perfScore: number
  gigModifiers: GameState['gigModifiers']
  bandInventory: GameState['band']['inventory']
  bandMerchPrices?: GameState['band']['merchPrices']
  player: GameState['player']
  social: GameState['social']
  reputationByRegion: GameState['reputationByRegion']
  activeStoryFlags: GameState['activeStoryFlags']
  gigContext: {
    daysSinceLastGig: number
    lastGigDifficulty: number | null
  } | null
  cityTraits?: CityTraitState
}) => {
  if (!currentGig || !lastGigStats) return null

  const result = calculateGigFinancials({
    gigData: currentGig,
    performanceScore: perfScore,
    modifiers: gigModifiers,
    bandInventory: bandInventory,
    playerState: player,
    gigStats: lastGigStats,
    context: {
      controversyLevel: social?.controversyLevel || 0,
      regionRep: reputationByRegion?.[player?.location] || 0,
      loyalty: social?.loyalty || 0,
      zealotry: social?.zealotry || 0,
      discountedTickets: activeStoryFlags?.includes(
        'discounted_tickets_active'
      ),
      daysSinceLastGig: gigContext?.daysSinceLastGig ?? 0,
      lastGigDifficulty: gigContext?.lastGigDifficulty ?? undefined,
      merchPrices: bandMerchPrices,
      social,
      cityTraits
    }
  })

  return applyPostGigPerformancePenalty({
    financials: result,
    misses: lastGigStats.misses ?? 0,
    missTolerance: BALANCE_CONSTANTS.MISS_TOLERANCE,
    missMoneyPenalty: BALANCE_CONSTANTS.MISS_MONEY_PENALTY
  })
}

export const derivePostOptions = ({
  currentGig,
  lastGigStats,
  player,
  band,
  social,
  activeEvent
}: {
  currentGig: GameState['currentGig']
  lastGigStats: GameState['lastGigStats']
  player: GameState['player']
  band: GameState['band']
  social: GameState['social']
  activeEvent: GameState['activeEvent']
}) => {
  if (!currentGig || !lastGigStats) return { options: [], error: null }

  // Pass the necessary game state to evaluate post conditions
  const gameStateForPosts = {
    player,
    band,
    social,
    lastGigStats,
    activeEvent,
    currentGig,
    gigEvents: lastGigStats?.events || []
  }

  try {
    const options = generatePostOptions(currentGig, gameStateForPosts)
    return { options, error: null }
  } catch (e) {
    return { options: [], error: e }
  }
}
