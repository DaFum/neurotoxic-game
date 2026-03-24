/*
 * (#1) Actual Updates: Extracted pure logic from usePostGigLogic into utility functions.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
import { checkViralEvent, calculateSocialGrowth, resolvePost } from './socialEngine'
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampMemberStamina,
  clampMemberMood,
  clampControversyLevel
} from './gameStateUtils'

const CROSS_POSTING_PLATFORMS = ['instagram', 'tiktok', 'youtube']

export const calculatePostGigStateUpdates = ({
  option,
  player,
  band,
  social,
  lastGigStats,
  currentGig,
  perfScore,
  secureRandomValue
}) => {
  const gameState = { player, band, social }
  const result = resolvePost(option, gameState, secureRandomValue)

  const isGigViral =
    lastGigStats &&
    checkViralEvent(lastGigStats, {
      context: {
        perfScore,
        band,
        venue: currentGig?.venue,
        events: lastGigStats?.events
      }
    })
  const gigViralBonus = isGigViral ? 1 : 0

  const organicGrowth = calculateSocialGrowth(
    result.platform,
    perfScore,
    social[result.platform] || 0,
    isGigViral,
    social.controversyLevel || 0,
    social.loyalty || 0
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
    newBand.members = newBand.members.map(m => {
      const needsMoodUpdate =
        result.moodChange &&
        (result.allMembersMoodChange || m.name === result.targetMember)
      const needsStaminaUpdate =
        result.staminaChange &&
        (result.allMembersStaminaChange || m.name === result.targetMember)

      if (!needsMoodUpdate && !needsStaminaUpdate) {
        return m
      }

      const updatedM = { ...m }
      if (needsMoodUpdate) {
        updatedM.mood = clampMemberMood(updatedM.mood + result.moodChange)
      }
      if (needsStaminaUpdate) {
        updatedM.stamina = clampMemberStamina(
          updatedM.stamina + result.staminaChange,
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
    const prevMoney = player.money ?? 0
    nextMoney = clampPlayerMoney(prevMoney + result.moneyChange)
    appliedMoneyDelta = nextMoney - prevMoney
  }

  const boundedZealotry = Math.max(
    0,
    Math.min(100, (social.zealotry || 0) + (result.zealotryChange || 0))
  )

  const updatedSocial = {
    [result.platform]: Math.max(
      0,
      (social[result.platform] || 0) + totalFollowers
    ),
    viral: (social.viral || 0) + (result.success ? 1 : 0) + gigViralBonus,
    lastGigDay: player.day,
    controversyLevel: clampControversyLevel(
      (social.controversyLevel || 0) + (result.controversyChange || 0)
    ),
    loyalty: Math.max(
      0,
      (social.loyalty || 0) + (result.loyaltyChange || 0)
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
    sponsorActive:
      option.id === 'comm_sellout_ad' ? false : social.sponsorActive,
    trend: social.trend,
    activeDeals: social.activeDeals,
    influencers: social.influencers
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
            Math.max(0, (currentInfluencer.score || 0) + scoreChange)
          )
        }
      }
    }
  }

  if (result.success && totalFollowers > 0) {
    const delta = Math.floor(totalFollowers * 0.25)
    for (const p of CROSS_POSTING_PLATFORMS) {
      if (p !== result.platform) {
        updatedSocial[p] = Math.max(0, (social[p] || 0) + delta)
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
