import {
  checkViralEvent,
  calculateSocialGrowth,
  resolvePost
} from '../socialEngine'
import {
  clampControversyLevel,
  finiteNumberOr,
  clampLoyalty,
  clamp0to100,
  clampPlayerMoney,
  clampMemberMood,
  clampMemberStamina,
  clampBandHarmony
} from '../gameState'
import { SOCIAL_PLATFORM_IDS, SOCIAL_PLATFORMS } from '../../data/platforms'
import { BRAND_DEALS_BY_ID } from '../../data/brandDeals'

const SOCIAL_PLATFORMS_VALUES = Object.values(SOCIAL_PLATFORMS)

import type { GameState, UnknownRecord } from '../../types'
import type { Platform } from '../../types/social'
import type { BandMember } from '../../types/band'
import type { BrandDeal } from '../../types/social'
import type { CalculatePostGigStateParams, ResolvedPostResult } from './types'

const isSocialPlatformId = (value: unknown): value is Platform =>
  typeof value === 'string' && SOCIAL_PLATFORM_IDS.has(value as Platform)

export const applyClampedMoneyDelta = (
  currentMoney: number,
  delta: number
): { nextMoney: number; appliedDelta: number } => {
  const prevMoney = finiteNumberOr(currentMoney, 0)
  const safeDelta = finiteNumberOr(delta, 0)
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

  const scoreChange = finiteNumberOr(update.scoreChange, Number.NaN)
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
    followers: finiteNumberOr(raw.followers, 0),
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
          events: Array.isArray(lastGigStats.events)
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
    finiteNumberOr(social[result.platform], 0),
    isGigViral,
    finiteNumberOr(social.controversyLevel, 0),
    finiteNumberOr(social.loyalty, 0)
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
        Number.isFinite(moodChange) &&
        (result.allMembersMoodChange || m.name === result.targetMember)
      const needsStaminaUpdate =
        Number.isFinite(staminaChange) &&
        (result.allMembersStaminaChange || m.name === result.targetMember)

      if (!needsMoodUpdate && !needsStaminaUpdate) {
        return m
      }

      const updatedM = { ...m }
      if (needsMoodUpdate) {
        updatedM.mood = clampMemberMood(
          finiteNumberOr(updatedM.mood, 0) + finiteNumberOr(moodChange, 0)
        )
      }
      if (needsStaminaUpdate) {
        updatedM.stamina = clampMemberStamina(
          finiteNumberOr(updatedM.stamina, 0) +
            finiteNumberOr(staminaChange, 0),
          finiteNumberOr(updatedM.staminaMax, 100)
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
    finiteNumberOr(social.zealotry, 0) + (result.zealotryChange ?? 0)
  )
  const scenePresenceGain = Math.max(
    1,
    Math.floor(finiteNumberOr(perfScore, 0) / 20) +
      (result.success ? 1 : 0) +
      gigViralBonus
  )

  const updatedSocial: Partial<GameState['social']> = {
    [result.platform]: Math.max(
      0,
      finiteNumberOr(social[result.platform], 0) + totalFollowers
    ),
    viral: Math.max(
      0,
      finiteNumberOr(social.viral, 0) + (result.success ? 1 : 0) + gigViralBonus
    ),
    lastGigDay: player.day,
    lastGigDifficulty: currentGig?.diff ?? currentGig?.difficulty ?? 1,
    controversyLevel: clampControversyLevel(
      finiteNumberOr(social.controversyLevel, 0) +
        (result.controversyChange ?? 0)
    ),
    loyalty: clampLoyalty(
      finiteNumberOr(social.loyalty, 0) + (result.loyaltyChange ?? 0)
    ),
    zealotry: boundedZealotry,
    scenePresence: clamp0to100(
      finiteNumberOr(social.scenePresence, 0) + scenePresenceGain
    ),
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
        Object.hasOwn(d, 'type') &&
        d.type === 'SPONSORSHIP' &&
        Object.hasOwn(d, 'offer')
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
          finiteNumberOr(updatedSocial.controversyLevel, 0) +
            template.penalty.controversy
        )
      }
      if (template.penalty.loyalty) {
        updatedSocial.loyalty = clampLoyalty(
          (updatedSocial.loyalty ?? 0) + template.penalty.loyalty
        )
      }
    }
  }

  if (result.influencerUpdate) {
    const { id, scoreChange } = result.influencerUpdate
    const currentInfluencer = social.influencers[id]
    if (currentInfluencer) {
      updatedSocial.influencers = {
        ...social.influencers,
        [id]: {
          ...currentInfluencer,
          score: clamp0to100(
            finiteNumberOr(currentInfluencer.score, 0) + scoreChange
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
          finiteNumberOr(social[platformId], 0) + delta
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
