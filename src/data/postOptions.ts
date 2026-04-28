import type { BandMember } from '../types/game'
import { hasActiveSponsorship } from '../utils/gameStateUtils'
import { SOCIAL_PLATFORMS } from './platforms'
import i18n from '../i18n'
import { getSafeRandom } from '../utils/crypto'
import { hasTrait } from '../utils/traitLogic'
import { QUEST_APOLOGY_TOUR } from './questsConstants'
import { hasActiveQuest } from '../utils/questUtils'
import type { GameState } from '../types/game'

const getSecureRollOnce = () => {
  return getSafeRandom()
}

const POST_BADGES = {
  RISK: '⚠️',
  SAFE: '🛡️',
  VIRAL: '🔥',
  COMMERCIAL: '💰',
  STORY: '📖'
}

const getCost = (inf: unknown): number => {
  const infObj =
    typeof inf === 'object' && inf !== null
      ? (inf as Record<string, unknown>)
      : null
  if (
    !infObj ||
    typeof infObj.score !== 'number' ||
    !(
      typeof infObj.tier === 'string' &&
      ['Micro', 'Macro', 'Mega'].includes(infObj.tier)
    )
  ) {
    return Number.POSITIVE_INFINITY
  }

  let base = 100
  if (infObj.tier === 'Macro') base = 300
  if (infObj.tier === 'Mega') base = 800
  const discount = Math.min(0.5, (infObj.score || 0) * 0.005)
  return Math.floor(base * (1 - discount))
}

const isValidAndAffordableInfluencer = (
  inf: unknown,
  money: number
): boolean => {
  const cost = getCost(inf)
  return cost <= money
}

/**
 * O(N) over members array with O(1) lookups per member for the first member with a specific trait.
 * N is typically very small (~4).
 * @param {Array} members - The band.members array
 * @param {string} traitId - The ID of the trait
 * @returns {object|undefined} The member object or undefined
 */
function getMemberWithTrait(
  members: unknown,
  traitId: string
): BandMember | undefined {
  if (!Array.isArray(members) || members.length === 0) return undefined
  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    if (hasTrait(m, traitId)) return m as BandMember
  }
  return undefined
}

/**
 * O(N) over members array with O(1) check if any member has a specific trait (or one of two traits).
 * @param {Array} members - The band.members array
 * @param {string} traitId1 - The ID of the primary trait
 * @param {string} [traitId2] - Optional ID of a secondary trait
 * @returns {boolean} True if any member has the trait(s)
 */
function hasMemberWithTrait(
  members: unknown,
  traitId1: string,
  traitId2?: string
): boolean {
  if (!Array.isArray(members) || members.length === 0) return false
  for (let i = 0; i < members.length; i++) {
    const m = members[i]
    if (hasTrait(m, traitId1) || (traitId2 && hasTrait(m, traitId2))) {
      return true
    }
  }
  return false
}

const requireBandMembers = (
  band: GameState['band'],
  postId: string
): BandMember[] => {
  if (Array.isArray(band?.members) && band.members.length > 0) {
    for (let i = 0; i < band.members.length; i++) {
      if (band.members[i] == null) {
        throw new Error(
          i18n.t('ui:postOptions.errors.missingBandMembers', {
            postId,
            defaultValue: `Post option ${postId} requires at least one band member.`
          })
        )
      }
    }
    return band.members
  }
  throw new Error(
    i18n.t('ui:postOptions.errors.missingBandMembers', {
      postId,
      defaultValue: `Post option ${postId} requires at least one band member.`
    })
  )
}

/**
 * Registry of all available social media post options.
 * Each option defines its conditions for appearing, base effects, and RNG logic.
 */
export const POST_OPTIONS = [
  // --- CATEGORY: CULT OF THE SCHRANK ---
  {
    id: 'radicalize_fans',
    name: 'Radicalize Fans',
    platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
    category: 'Drama',
    badges: [POST_BADGES.RISK, POST_BADGES.VIRAL],
    condition: ({ social }: GameState) => (social?.instagram || 0) > 2000,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
      followers: -50,
      controversyChange: 5,
      loyaltyChange: 2,
      zealotryChange: 8,
      message: i18n.t('ui:postOptions.radicalize_fans.message', {
        defaultValue: 'Your hardcore fans loved it. Casuals were disturbed.'
      })
    })
  },
  // --- CATEGORY: RECOVERY & CRISIS ---
  {
    id: 'recovery_apology_tour_promo',
    name: 'Apology Tour Promo',
    platform: SOCIAL_PLATFORMS.YOUTUBE.id,
    category: 'Drama',
    badges: [POST_BADGES.RISK, POST_BADGES.STORY],
    condition: ({ social, activeQuests }: GameState) =>
      (social?.reputationCooldown || 0) === 0 &&
      hasActiveQuest(activeQuests, QUEST_APOLOGY_TOUR),
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.YOUTUBE.id,
      followers: 2000,
      controversyChange: -20,
      loyaltyChange: 20,
      harmonyChange: 5,
      reputationCooldownSet: 5,
      message: 'The fans are responding well to your honesty.'
    })
  },
  {
    id: 'recovery_leaked_good_deed',
    name: 'Leaked Good Deed',
    platform: SOCIAL_PLATFORMS.TIKTOK.id,
    category: 'Drama',
    badges: [POST_BADGES.VIRAL, POST_BADGES.STORY],
    condition: ({ social }: GameState) =>
      (social?.controversyLevel || 0) >= 50 &&
      (social?.reputationCooldown || 0) === 0,
    resolve: ({ diceRoll }: GameState & { diceRoll: number }) => {
      if (diceRoll < 0.55) {
        return {
          type: 'RNG_SUCCESS',
          success: true,
          platform: SOCIAL_PLATFORMS.TIKTOK.id,
          followers: 3500,
          controversyChange: -30,
          loyaltyChange: 25,
          reputationCooldownSet: 7,
          message:
            'The leak worked beautifully. People think you are misunderstood.'
        }
      } else {
        return {
          type: 'RNG_FAIL',
          success: false,
          platform: SOCIAL_PLATFORMS.TIKTOK.id,
          followers: -500,
          controversyChange: 15,
          message: 'It looked completely staged. Backlash increased.'
        }
      }
    }
  },
  {
    id: 'recovery_prove_yourself_clip',
    name: 'Gritty Small Venue Clip',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Performance',
    badges: [POST_BADGES.SAFE, POST_BADGES.STORY],
    condition: ({ player }: GameState) =>
      player?.stats?.proveYourselfMode === true,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
      followers: 1500,
      loyaltyChange: 20,
      controversyChange: -10,
      harmonyChange: 5,
      message: 'Back to your roots. The hardcore fans love this energy.'
    })
  },
  {
    id: 'comm_loyalty_merch_drive',
    name: 'Emergency Newsletter Merch Drive',
    platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
    category: 'Commercial',
    badges: [POST_BADGES.COMMERCIAL],
    condition: ({ social }: GameState) =>
      (social?.controversyLevel || 0) >= 40 && (social?.loyalty || 0) >= 20,
    resolve: ({ social }: GameState) => {
      const loyaltyVal = social?.loyalty || 0
      const moneyGain = Math.min(loyaltyVal * 8, 600)
      const loyaltyBurn = Math.floor(loyaltyVal * 0.3)
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
        followers: 0,
        moneyChange: moneyGain,
        loyaltyChange: -loyaltyBurn,
        message: 'You tapped your most loyal fans for cash during the crisis.'
      }
    }
  },

  // --- CATEGORY: PERFORMANCE & STAGE ANTICS ---
  {
    id: 'perf_smashed_gear',
    name: 'Instrument Destruction Clip',
    platform: SOCIAL_PLATFORMS.TIKTOK.id,
    category: 'Performance',
    badges: [POST_BADGES.VIRAL, POST_BADGES.RISK],
    condition: ({ player, band }: GameState) =>
      player &&
      typeof player.money === 'number' &&
      player.money > 500 &&
      Array.isArray(band?.members) &&
      band.members.length > 0,
    resolve: ({ band, diceRoll }: GameState & { diceRoll: number }) => {
      const members = requireBandMembers(band, 'perf_smashed_gear')
      const rawIndex = Math.floor(diceRoll * members.length)
      const safeIndex = Math.min(Math.max(0, rawIndex), members.length - 1)
      const target = members[safeIndex]?.name
      const targetName =
        target ??
        i18n.t('ui:postOptions.errors.unknownMemberFallback', {
          defaultValue: 'Unknown'
        })
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.TIKTOK.id,
        followers: 2500,
        moneyChange: -300,
        targetMember: targetName,
        moodChange: -10,
        message: i18n.t('ui:postOptions.perf_smashed_gear.message', {
          defaultValue:
            "{{member}}'s gear was destroyed! Viral AF but expensive.",
          member: targetName
        })
      }
    }
  },
  {
    id: 'perf_acoustic_cover',
    name: 'Acoustic Backstage Cover',
    platform: SOCIAL_PLATFORMS.YOUTUBE.id,
    category: 'Performance',
    badges: [POST_BADGES.SAFE],
    condition: () => true, // Always available
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.YOUTUBE.id,
      followers: 500,
      harmonyChange: 5,
      egoClear: true,
      message:
        'A beautiful bonding moment caught on tape. Internal tension eased.'
    })
  },
  {
    id: 'perf_ego_flex',
    name: 'Vocalist Ego Flex',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Performance',
    badges: [POST_BADGES.RISK],
    condition: ({ lastGigStats, band }: GameState) =>
      lastGigStats != null &&
      typeof lastGigStats.score === 'number' &&
      lastGigStats.score > 25000 &&
      Array.isArray(band?.members) &&
      band.members.length > 0,
    resolve: ({ band }: GameState) => {
      const members = requireBandMembers(band, 'perf_ego_flex')
      // Dynamically select the lead singer or fallback to index 0
      const vocalistObj =
        getMemberWithTrait(members, 'lead_singer') ?? members[0]
      const vocalist =
        vocalistObj?.name ??
        i18n.t('ui:postOptions.errors.unknownMemberFallback', {
          defaultValue: 'Unknown'
        })
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
        followers: 1200,
        targetMember: vocalist,
        moodChange: 15,
        harmonyChange: -5,
        egoDrop: vocalist, // Triggers ego tracking
        message: i18n.t('ui:postOptions.perf_ego_flex.message', {
          defaultValue:
            '{{member}} is feeling like a rock god. The rest of the band? Not so much.',
          member: vocalist
        })
      }
    }
  },
  {
    id: 'perf_sound_guy_rant',
    name: 'Calling Out the Sound Guy',
    platform: SOCIAL_PLATFORMS.TIKTOK.id,
    category: 'Performance',
    badges: [POST_BADGES.VIRAL, POST_BADGES.RISK],
    condition: ({ lastGigStats }: GameState) =>
      typeof lastGigStats?.accuracy === 'number' && lastGigStats.accuracy < 60,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.TIKTOK.id,
      followers: 1500,
      controversyChange: 10,
      staminaChange: -5,
      allMembersStaminaChange: true,
      message: 'People love drama! But the venue owners are talking...'
    })
  },

  {
    id: 'perf_moshpit_chaos',
    name: 'Moshpit Chaos Clip',
    platform: SOCIAL_PLATFORMS.TIKTOK.id,
    category: 'Performance',
    badges: [POST_BADGES.VIRAL],
    condition: (state: GameState & { gigEvents?: string[] }) =>
      state.activeEvent?.id === 'stage_diver' ||
      (Array.isArray(state.gigEvents) &&
        state.gigEvents.includes('stage_diver')),
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.TIKTOK.id,
      followers: 2000,
      message: 'The wall of death was legendary. TikTok is eating it up!'
    })
  },
  {
    id: 'perf_tech_playthrough',
    name: 'Technical Playthrough',
    platform: SOCIAL_PLATFORMS.YOUTUBE.id,
    category: 'Performance',
    badges: [POST_BADGES.SAFE],
    condition: ({ lastGigStats, social, band }: GameState) => {
      if (!Array.isArray(band?.members) || band.members.length === 0)
        return false
      const isVirtuoso = hasMemberWithTrait(band.members, 'virtuoso')
      return (
        (lastGigStats != null &&
          typeof lastGigStats.score === 'number' &&
          lastGigStats.score > 15000) ||
        social?.egoFocus ||
        isVirtuoso
      )
    },
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.YOUTUBE.id,
      followers: 800,
      message: 'Guitar nerds are dissecting every frame.'
    })
  },
  {
    id: 'perf_band_selfie',
    name: 'Sweaty Band Selfie',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Performance',
    badges: [POST_BADGES.SAFE],
    condition: () => true,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
      followers: 300,
      egoClear: true,
      message: 'A solid, consistent post. The band feels like a team again.'
    })
  },
  {
    id: 'perf_apology_video',
    name: 'Apology Video',
    platform: SOCIAL_PLATFORMS.YOUTUBE.id,
    category: 'Performance',
    badges: [POST_BADGES.RISK],
    condition: ({ lastGigStats }: GameState) =>
      typeof lastGigStats?.score === 'number' && lastGigStats.score < 5000,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.YOUTUBE.id,
      followers: 1200,
      harmonyChange: -5,
      allMembersMoodChange: true,
      moodChange: -5,
      message: 'You got sympathy followers, but the band feels humiliated.'
    })
  },

  {
    id: 'drama_drunk_stream',
    name: 'Drunk Afterparty Stream',
    platform: SOCIAL_PLATFORMS.TIKTOK.id,
    category: 'Drama',
    badges: [POST_BADGES.VIRAL, POST_BADGES.RISK],
    condition: () => true, // Post-gig, always available
    resolve: ({ diceRoll }: GameState & { diceRoll: number }) => {
      // 70% success / 30% disaster
      if (diceRoll <= 0.7) {
        return {
          type: 'RNG_SUCCESS',
          success: true,
          platform: SOCIAL_PLATFORMS.TIKTOK.id,
          followers: 3000,
          moodChange: 10,
          allMembersMoodChange: true,
          message: 'Massive hit! The fans loved the chaotic energy.'
        }
      } else {
        return {
          type: 'RNG_FAIL',
          success: false,
          platform: SOCIAL_PLATFORMS.TIKTOK.id,
          followers: -2000,
          harmonyChange: -20,
          controversyChange: 30, // Big spike towards shadowban
          loyaltyChange: -5, // Hits true fans too
          message: 'CANCELLATION EVENT. Someone said something awful.'
        }
      }
    }
  },
  {
    id: 'drama_political_take',
    name: 'Edgy Political Hot Take',
    platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
    category: 'Drama',
    badges: [POST_BADGES.RISK],
    condition: () => true,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
      followers: -1000, // Alienate mainstream
      loyaltyChange: 20, // Converts casuals to hardcore
      controversyChange: 15,
      message:
        'Mainstream fans bailed, but the hardcore cult just grew stronger.'
    })
  },
  {
    id: 'drama_van_breakdown',
    name: 'Tour Van Breakdown Rant',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Drama',
    badges: [POST_BADGES.STORY],
    condition: ({ activeEvent }: GameState) =>
      activeEvent?.type === 'negative_travel' ||
      activeEvent?.id === 'van_breakdown', // Simplified condition based on recent event
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
      followers: 1500,
      loyaltyChange: 10, // Builds sympathy
      message: '"We\'ll make it no matter what." Fans eat up the struggle.'
    })
  },
  {
    id: 'drama_leak_demo',
    name: 'Leaked Demo Snippet',
    platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
    category: 'Drama',
    badges: [POST_BADGES.VIRAL, POST_BADGES.STORY],
    condition: ({ band }: GameState) => (band?.harmony ?? 0) > 70,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
      followers: 800, // Newsletter spikes don't need to be huge raw numbers, they are high value
      loyaltyChange: 25, // Massive hype
      harmonyChange: -10, // Manager is pissed
      message:
        'The discord is going wild over the new riff. Management is furious.'
    })
  },

  {
    id: 'drama_manufactured',
    name: 'Manufactured Band Drama',
    platform: SOCIAL_PLATFORMS.TIKTOK.id,
    category: 'Drama',
    badges: [POST_BADGES.VIRAL, POST_BADGES.RISK],
    condition: () => true,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.TIKTOK.id,
      followers: 5000,
      harmonyChange: -15,
      controversyChange: 25,
      message:
        'Massive viral hit, but the fake argument felt a little too real.'
    })
  },
  {
    id: 'drama_crowdsurf_fail',
    name: 'Crowd Surfing Fail',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Drama',
    badges: [POST_BADGES.RISK],
    condition: ({ band }: GameState) =>
      Array.isArray(band?.members) && band.members.length > 0,
    resolve: ({ band, diceRoll }: GameState & { diceRoll: number }) => {
      const members = requireBandMembers(band, 'drama_crowdsurf_fail')
      const rawIndex = Math.floor(diceRoll * members.length)
      const safeIndex = Math.min(Math.max(0, rawIndex), members.length - 1)
      const targetObj = members[safeIndex]
      const target =
        targetObj?.name ??
        i18n.t('ui:postOptions.errors.unknownMemberFallback', {
          defaultValue: 'Unknown'
        })
      let successChance = 0.5
      if (hasMemberWithTrait([targetObj], 'clumsy')) {
        successChance = 0.7 // Clumsy requires a higher roll (>0.7) to succeed
      }

      if (diceRoll > successChance) {
        return {
          type: 'RNG_SUCCESS',
          success: true,
          platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
          followers: 1000,
          targetMember: target,
          staminaChange: -5,
          message: i18n.t(
            'ui:postOptions.drama_crowdsurf_fail.successMessage',
            {
              defaultValue:
                '{{member}} ate pavement, but the fans thought it was hilarious.',
              member: target
            }
          )
        }
      } else {
        return {
          type: 'RNG_FAIL',
          success: false,
          platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
          followers: -500,
          targetMember: target,
          staminaChange: -5,
          message: i18n.t('ui:postOptions.drama_crowdsurf_fail.failMessage', {
            defaultValue: '{{member}} got dropped. It was just sad to watch.',
            member: target
          })
        }
      }
    }
  },
  {
    id: 'drama_gear_flex',
    name: 'Gear Flex',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Drama', // or Lifestyle
    badges: [POST_BADGES.SAFE],
    condition: ({ band }: GameState) =>
      Array.isArray(band?.members) && band.members.length > 0,
    resolve: ({ band }: GameState) => {
      const members = requireBandMembers(band, 'drama_gear_flex')
      const gearNerd =
        getMemberWithTrait(members, 'gear_nerd')?.name ??
        members[0]?.name ??
        i18n.t('ui:postOptions.errors.unknownMemberFallback', {
          defaultValue: 'Unknown'
        })
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
        followers: 100, // Safe but low
        targetMember: gearNerd,
        moodChange: 5,
        message: i18n.t('ui:postOptions.drama_gear_flex.message', {
          defaultValue: 'Guitar geeks unite! {{member}} is happy.',
          member: gearNerd
        })
      }
    }
  },
  {
    id: 'drama_cryptic_teaser',
    name: 'Cryptic Teaser',
    platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
    category: 'Drama',
    badges: [POST_BADGES.STORY],
    condition: () => true,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
      followers: 150,
      loyaltyChange: 15,
      message: 'The fans are connecting red string on message boards.'
    })
  },
  {
    id: 'drama_tour_bus_prank',
    name: 'Tour Bus Prank',
    platform: SOCIAL_PLATFORMS.TIKTOK.id,
    category: 'Drama',
    badges: [POST_BADGES.VIRAL, POST_BADGES.RISK],
    condition: ({ band }: GameState) =>
      Array.isArray(band?.members) && band.members.length > 0,
    resolve: ({ band }: GameState) => {
      const members = requireBandMembers(band, 'drama_tour_bus_prank')
      const prankster =
        getMemberWithTrait(members, 'party_animal')?.name ??
        members[1]?.name ??
        members[0]?.name ??
        i18n.t('ui:postOptions.errors.unknownMemberFallback', {
          defaultValue: 'Unknown'
        })
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.TIKTOK.id,
        followers: 2500,
        targetMember: prankster,
        moodChange: 10,
        harmonyChange: -5,
        message: i18n.t('ui:postOptions.drama_tour_bus_prank.message', {
          defaultValue: '{{member}} loved it. The rest of the band is annoyed.',
          member: prankster
        })
      }
    }
  },
  {
    id: 'drama_emotional_interview',
    name: 'Emotional Backstage Interview',
    platform: SOCIAL_PLATFORMS.YOUTUBE.id,
    category: 'Drama',
    badges: [POST_BADGES.STORY, POST_BADGES.SAFE],
    condition: ({ band }: GameState) => (band?.harmony ?? 0) > 60,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.YOUTUBE.id,
      followers: 1000,
      harmonyChange: 5,
      egoClear: true,
      message: 'A deep, vulnerable chat. The fans feel closer to you.'
    })
  },

  // --- CATEGORY: COMMERCIAL & MERCH ---
  {
    id: 'comm_sellout_ad',
    name: i18n.t('ui:postOptions.comm_sellout_ad.name', {
      defaultValue: 'Shameless Sellout Sponsorship'
    }),
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Commercial',
    badges: [POST_BADGES.COMMERCIAL, POST_BADGES.RISK],
    condition: ({ social }: GameState) => hasActiveSponsorship(social),
    resolve: () => {
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
        followers: 0,
        moneyChange: 0,
        loyaltyChange: 0, // Loyalty penalty is now applied dynamically in postGigUtils based on the specific deal
        message: i18n.t('ui:postOptions.selloutMessage', {
          defaultValue: 'You got paid. The fans are calling you sellouts.'
        })
      }
    }
  },
  {
    id: 'comm_tour_merch',
    name: 'Limited "Tour Only" Merch Drop',
    platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
    category: 'Commercial',
    badges: [POST_BADGES.COMMERCIAL],
    condition: ({ lastGigStats }: GameState) =>
      typeof lastGigStats?.score === 'number' && lastGigStats.score > 15000,
    resolve: ({ social }: GameState) => {
      // Hype to Money mechanic (using loyalty as proxy for hype for now)
      const hypeCash = Math.min((social.loyalty || 0) * 10, 1000)
      const hypeBurn = Math.floor((social.loyalty || 0) * 0.5) // Burn only half hype instead of all
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
        followers: 0,
        moneyChange: hypeCash,
        loyaltyChange: -hypeBurn,
        message: `Cashed in on the tour hype! Made ${hypeCash}€.`
      }
    }
  },
  {
    id: 'comm_crowdfund',
    name: 'Crowdfunding Begging',
    platform: SOCIAL_PLATFORMS.YOUTUBE.id,
    category: 'Commercial',
    badges: [POST_BADGES.COMMERCIAL, POST_BADGES.RISK],
    condition: ({ player }: GameState) =>
      player && typeof player.money === 'number' && player.money < 100,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.YOUTUBE.id,
      followers: -500, // Looks desperate
      controversyChange: 5,
      moneyChange: 300,
      message:
        'You got gas money, but you lost some self-respect and followers.'
    })
  },
  {
    id: 'comm_gear_review',
    name: 'Exquisite Gear Review',
    platform: SOCIAL_PLATFORMS.YOUTUBE.id,
    category: 'Commercial',
    badges: [POST_BADGES.SAFE, POST_BADGES.COMMERCIAL],
    condition: ({ band }: GameState) =>
      band?.inventory?.golden_pick === true &&
      Array.isArray(band?.members) &&
      band.members.length > 0,
    resolve: ({ band }: GameState) => {
      const members = requireBandMembers(band, 'comm_gear_review')
      // Find potential gear nerd or fallback to first member
      const member = getMemberWithTrait(members, 'gear_nerd') ?? members[0]
      if (!member) {
        throw new Error('Member is undefined in comm_gear_review resolve')
      }
      const target =
        member?.name ??
        i18n.t('ui:postOptions.errors.unknownMemberFallback', {
          defaultValue: 'Unknown'
        })
      const memberId = member.id ?? member.name

      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.YOUTUBE.id,
        followers: 1500,
        moneyChange: 100,
        targetMember: target,
        moodChange: 20,
        message: i18n.t('ui:postOptions.comm_gear_review.message', {
          defaultValue:
            '{{member}} finally revealed the secret of the tone. Guitar nerds are losing it.',
          member: target
        }),
        unlockTrait: { memberId, traitId: 'gear_nerd' }
      }
    }
  },
  {
    id: 'collab_influencer',
    name: 'Influencer Collaboration',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Commercial',
    badges: [POST_BADGES.VIRAL, POST_BADGES.COMMERCIAL],
    condition: ({ social, player }: GameState) => {
      const influencers = social?.influencers || {}
      if (!player || typeof player.money !== 'number') return false

      // ⚡ Bolt Optimization: Replace Object.values().some() with for...in loop
      // Avoids O(N) array allocation overhead and enables early return when a match is found.
      for (const id in influencers) {
        if (!Object.hasOwn(influencers, id)) continue
        if (isValidAndAffordableInfluencer(influencers[id], player.money)) {
          return true
        }
      }
      return false
    },
    resolve: ({
      social,
      player,
      diceRoll
    }: GameState & { diceRoll: number }) => {
      const influencers = social?.influencers || {}
      const playerMoney = player?.money ?? 0

      // Filter by affordability
      const affordableIds = []
      for (const id in influencers) {
        if (!Object.hasOwn(influencers, id)) continue
        if (isValidAndAffordableInfluencer(influencers[id], playerMoney)) {
          affordableIds.push(id)
        }
      }

      if (affordableIds.length === 0) {
        return {
          type: 'FIXED',
          success: false,
          platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
          message: i18n.t('ui:postOptions.noAffordableInfluencers', {
            defaultValue:
              'You cannot afford any available influencers right now.'
          }),
          moneyChange: 0
        }
      }

      // Pick one from affordable
      let roll = diceRoll
      if (roll == null) {
        roll = getSecureRollOnce()
      }

      const selectedId =
        affordableIds[
          Math.floor(roll * affordableIds.length) % affordableIds.length
        ]
      const instagramPostFailure = {
        type: 'FIXED' as const,
        success: false,
        platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
        followers: 0,
        message: i18n.t('ui:postOptions.failedToPost', {
          defaultValue: 'Failed to post.'
        }),
        moneyChange: 0
      }

      if (!selectedId) return instagramPostFailure

      const influencer = influencers[selectedId]
      if (!influencer) return instagramPostFailure

      const cost = getCost(influencer)
      let followersGain = 1000
      if (influencer.tier === 'Macro') followersGain = 3000
      if (influencer.tier === 'Mega') followersGain = 10000

      // Influencer Traits
      let platform = SOCIAL_PLATFORMS.INSTAGRAM.id
      let controversyChange = 0
      let traitBonusText = ''

      if (influencer.trait === 'tech_savvy') {
        platform = SOCIAL_PLATFORMS.YOUTUBE.id
        traitBonusText =
          ' ' +
          i18n.t('ui:postOptions.influencerTraitTechSavvy', {
            defaultValue: 'The gear nerds loved the technical breakdown.'
          })
      } else if (influencer.trait === 'drama_magnet') {
        platform = SOCIAL_PLATFORMS.TIKTOK.id
        controversyChange = 20
        followersGain = Math.floor(followersGain * 1.5)
        traitBonusText =
          ' ' +
          i18n.t('ui:postOptions.influencerTraitDramaMagnet', {
            defaultValue: 'Massive reach, but it came with some toxic drama.'
          })
      }

      const displayName =
        influencer?.name ??
        (selectedId ? selectedId.replace(/_/g, ' ') : 'Unknown')

      return {
        type: 'FIXED',
        success: true,
        platform: platform,
        followers: followersGain,
        moneyChange: -cost,
        controversyChange,
        influencerUpdate: { id: selectedId, scoreChange: 10 },
        message: i18n.t('ui:postOptions.influencerSuccess', {
          selectedId: displayName,
          cost,
          traitBonusText,
          defaultValue: `Collaborated with {{selectedId}}. Cost {{cost}}€{{traitBonusText}}`
        })
      }
    }
  },

  // --- NEW TREND-ALIGNED POSTS ---

  {
    id: 'tech_rig_rundown',
    name: 'Detailed Rig Rundown',
    platform: SOCIAL_PLATFORMS.YOUTUBE.id,
    category: 'Commercial', // Fits TECH trend
    badges: [POST_BADGES.SAFE, POST_BADGES.STORY],
    condition: ({ band }: GameState) =>
      Array.isArray(band?.members) &&
      hasMemberWithTrait(band.members, 'gear_nerd', 'tech_wizard'),
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.YOUTUBE.id,
      followers: 1200,
      moneyChange: 50, // Ad revenue
      message:
        'The comments section is arguing about cable capacitance. It is glorious.'
    })
  },
  {
    id: 'wholesome_dinner',
    name: 'Wholesome Band Dinner',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Lifestyle', // Fits WHOLESOME trend logic
    badges: [POST_BADGES.SAFE],
    condition: ({ band }: GameState) => band?.harmony > 50,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
      followers: 400,
      harmonyChange: 10,
      moodChange: 5,
      allMembersMoodChange: true,
      message: 'Fans love seeing the band actually getting along.'
    })
  },
  {
    id: 'music_theory_thread',
    name: 'Deep Music Theory Thread',
    platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
    category: 'Performance', // Fits MUSIC trend
    badges: [POST_BADGES.STORY],
    condition: ({ band }: GameState) =>
      Array.isArray(band?.members) &&
      hasMemberWithTrait(band.members, 'melodic_genius', 'virtuoso'),
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
      followers: 300,
      loyaltyChange: 15,
      message:
        'You explained the use of mixolydian b6. The music nerds are ecstatic.'
    })
  },
  {
    id: 'drama_leaked_dms',
    name: '"Accidentally" Leaked DMs',
    platform: SOCIAL_PLATFORMS.TIKTOK.id,
    category: 'Drama', // Fits DRAMA trend
    badges: [POST_BADGES.VIRAL, POST_BADGES.RISK],
    condition: () => true,
    resolve: ({ diceRoll }: GameState & { diceRoll: number }) => {
      if (diceRoll < 0.6) {
        return {
          type: 'RNG_SUCCESS',
          success: true,
          platform: SOCIAL_PLATFORMS.TIKTOK.id,
          followers: 4000,
          controversyChange: 20,
          message:
            'It went viral instantly. The gossip channels are covering it.'
        }
      } else {
        return {
          type: 'RNG_FAIL',
          success: false,
          platform: SOCIAL_PLATFORMS.TIKTOK.id,
          followers: -1000,
          controversyChange: 40,
          harmonyChange: -20,
          message: 'It backfired. You look petty and everyone hates it.'
        }
      }
    }
  }
]
