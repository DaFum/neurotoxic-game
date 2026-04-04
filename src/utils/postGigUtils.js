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
  clampControversyLevel
} from './gameStateUtils'
import { BRAND_ALIGNMENTS } from '../context/initialState'

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
      },
      roll: secureRandomValue
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
    loyalty: Math.max(0, (social.loyalty || 0) + (result.loyaltyChange || 0)),
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
    // Unrolled fast-path for cross-posting updates.
    // NOTE: The platforms hardcoded below must stay synchronized with the canonical
    // list in src/data/platforms.js (SOCIAL_PLATFORMS).
    if (result.platform !== 'instagram') {
      updatedSocial.instagram = Math.max(0, (social.instagram || 0) + delta)
    }
    if (result.platform !== 'tiktok') {
      updatedSocial.tiktok = Math.max(0, (social.tiktok || 0) + delta)
    }
    if (result.platform !== 'youtube') {
      updatedSocial.youtube = Math.max(0, (social.youtube || 0) + delta)
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
  [BRAND_ALIGNMENTS.EVIL]: BRAND_ALIGNMENTS.SUSTAINABLE,
  [BRAND_ALIGNMENTS.SUSTAINABLE]: BRAND_ALIGNMENTS.EVIL,
  [BRAND_ALIGNMENTS.CORPORATE]: BRAND_ALIGNMENTS.INDIE,
  [BRAND_ALIGNMENTS.INDIE]: BRAND_ALIGNMENTS.CORPORATE
}

export const getAcceptDealMoneyUpdate = ({ deal, player }) => {
  let appliedMoneyDelta = 0
  let nextMoney = player.money ?? 0

  if (deal.offer.upfront) {
    const prevMoney = player.money ?? 0
    nextMoney = clampPlayerMoney(prevMoney + deal.offer.upfront)
    appliedMoneyDelta = nextMoney - prevMoney
  }

  return { nextMoney, appliedMoneyDelta }
}

export const getAcceptDealBandUpdateFactory = deal => {
  return prevBand => {
    if (!deal.offer.item) return prevBand
    return {
      ...prevBand,
      inventory: { ...prevBand.inventory, [deal.offer.item]: true }
    }
  }
}

export const getAcceptDealSocialUpdateFactory = deal => {
  return prevSocial => {
    const updates = {}

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
      if (opposing) {
        const oppRep = updates.brandReputation[opposing] || 0
        updates.brandReputation[opposing] = Math.max(0, oppRep - 3)
      }
    }

    const prevDeals = prevSocial.activeDeals || []
    updates.activeDeals = [
      ...prevDeals,
      { ...deal, remainingGigs: deal.offer.duration }
    ]

    return updates
  }
}

export const getSpinStoryMoneyUpdate = ({ player }) => {
  if (player.money < 200) {
    return { success: false }
  }

  const prevMoney = player.money ?? 0
  const nextMoney = clampPlayerMoney(prevMoney - 200)
  const appliedDelta = nextMoney - prevMoney

  return {
    success: true,
    nextMoney,
    appliedDelta
  }
}

export const getSpinStorySocialUpdateFactory = () => {
  return prevSocial => ({
    controversyLevel: clampControversyLevel(
      (prevSocial.controversyLevel || 0) - 25
    )
  })
}

export const calculateContinueStats = ({
  player,
  perfScore,
  financials,
  calculateFameGain,
  calculateFameLevel,
  clampPlayerFame,
  clampPlayerMoney,
  BALANCE_CONSTANTS
}) => {
  const prevFame = player.fame ?? 0

  let finalFameGain = -BALANCE_CONSTANTS.FAME_LOSS_BAD_GIG
  if (perfScore >= 62) {
    const rawFameGain = 50 + Math.floor(perfScore * 1.5)
    finalFameGain = calculateFameGain(
      rawFameGain,
      prevFame,
      BALANCE_CONSTANTS.MAX_FAME_GAIN
    )
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
