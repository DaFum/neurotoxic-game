import { SOCIAL_PLATFORMS } from './platforms.js'

const POST_BADGES = {
  RISK: '⚠️',
  SAFE: '🛡️',
  VIRAL: '🔥',
  COMMERCIAL: '💰',
  STORY: '📖'
}

/**
 * Registry of all available social media post options.
 * Each option defines its conditions for appearing, base effects, and RNG logic.
 */
export const POST_OPTIONS = [
  // --- CATEGORY: PERFORMANCE & STAGE ANTICS ---
  {
    id: 'perf_smashed_gear',
    name: 'Instrument Destruction Clip',
    platform: SOCIAL_PLATFORMS.TIKTOK.id,
    category: 'Performance',
    badges: [POST_BADGES.VIRAL, POST_BADGES.RISK],
    condition: ({ player }) => player.money > 500,
    resolve: ({ band, diceRoll }) => {
      // Pick a random member
      const memberNames = band.members.map(m => m.name)
      const target = memberNames[Math.floor(diceRoll * memberNames.length)]
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.TIKTOK.id,
        followers: 2500,
        moneyChange: -300,
        targetMember: target,
        moodChange: -10,
        message: `${target}'s gear was destroyed! Viral AF but expensive.`
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
      message: 'A beautiful bonding moment caught on tape. Internal tension eased.'
    })
  },
  {
    id: 'perf_ego_flex',
    name: 'Vocalist Ego Flex',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Performance',
    badges: [POST_BADGES.RISK],
    condition: ({ lastGigStats }) => lastGigStats && lastGigStats.score > 25000,
    resolve: ({ band }) => {
      // Dynamically select the lead singer or fallback to index 0
      const vocalistObj = band.members.find(m => m.traits?.some(t => t.id === 'lead_singer')) || band.members[0]
      const vocalist = vocalistObj.name
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
        followers: 1200,
        targetMember: vocalist,
        moodChange: 15,
        harmonyChange: -5,
        egoDrop: vocalist, // Triggers ego tracking
        message: `${vocalist} is feeling like a rock god. The rest of the band? Not so much.`
      }
    }
  },
  {
    id: 'perf_sound_guy_rant',
    name: 'Calling Out the Sound Guy',
    platform: SOCIAL_PLATFORMS.TIKTOK.id,
    category: 'Performance',
    badges: [POST_BADGES.VIRAL, POST_BADGES.RISK],
    condition: ({ lastGigStats }) => lastGigStats && lastGigStats.accuracy < 60,
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
    condition: ({ activeEvent, gigEvents }) => 
      activeEvent?.id === 'stage_diver' || (gigEvents && gigEvents.includes('stage_diver')),
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
    condition: ({ lastGigStats, social, band }) => {
      const isVirtuoso = band.members.some(m => m.traits?.some(t => t.id === 'virtuoso'))
      return (lastGigStats && lastGigStats.score > 15000) || social.egoFocus || isVirtuoso
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
    condition: ({ lastGigStats }) => lastGigStats && lastGigStats.score < 5000,
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
    resolve: ({ diceRoll }) => {
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
      message: 'Mainstream fans bailed, but the hardcore cult just grew stronger.'
    })
  },
  {
    id: 'drama_van_breakdown',
    name: 'Tour Van Breakdown Rant',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Drama',
    badges: [POST_BADGES.STORY],
    condition: ({ activeEvent }) => activeEvent?.type === 'negative_travel' || activeEvent?.id === 'van_breakdown', // Simplified condition based on recent event
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
    condition: ({ band }) => band.harmony > 70,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
      followers: 800, // Newsletter spikes don't need to be huge raw numbers, they are high value
      loyaltyChange: 25, // Massive hype
      harmonyChange: -10, // Manager is pissed
      message: 'The discord is going wild over the new riff. Management is furious.'
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
      message: 'Massive viral hit, but the fake argument felt a little too real.'
    })
  },
  {
    id: 'drama_crowdsurf_fail',
    name: 'Crowd Surfing Fail',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Drama',
    badges: [POST_BADGES.RISK],
    condition: () => true,
    resolve: ({ band, diceRoll }) => {
      const memberNames = band.members.map(m => m.name)
      const target = memberNames[Math.floor(diceRoll * memberNames.length)]
      if (diceRoll > 0.5) {
        return {
          type: 'RNG_SUCCESS',
          success: true,
          platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
          followers: 1000,
          targetMember: target,
          staminaChange: -5,
          message: `${target} ate pavement, but the fans thought it was hilarious.`
        }
      } else {
        return {
           type: 'RNG_FAIL',
           success: false,
           platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
           followers: -500,
           targetMember: target,
           staminaChange: -5,
           message: `${target} got dropped. It was just sad to watch.`
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
    condition: () => true,
    resolve: ({ band }) => {
      const gearNerd = band.members.find(m => m.traits?.some(t => t.id === 'gear_nerd'))?.name || band.members[0].name
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
        followers: 100, // Safe but low
        targetMember: gearNerd,
        moodChange: 5,
        message: `Guitar geeks unite! ${gearNerd} is happy.`
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
    condition: () => true,
    resolve: ({ band }) => {
      const prankster = band.members.find(m => m.traits?.some(t => t.id === 'party_animal'))?.name || band.members[1]?.name || band.members[0].name
      return {
        type: 'FIXED',
        success: true,
        platform: SOCIAL_PLATFORMS.TIKTOK.id,
        followers: 2500,
        targetMember: prankster, 
        moodChange: 10,
        harmonyChange: -5,
        message: `${prankster} loved it. The rest of the band is annoyed.`
      }
    }
  },
  {
    id: 'drama_emotional_interview',
    name: 'Emotional Backstage Interview',
    platform: SOCIAL_PLATFORMS.YOUTUBE.id,
    category: 'Drama',
    badges: [POST_BADGES.STORY, POST_BADGES.SAFE],
    condition: ({ band }) => band.harmony > 60,
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
    name: 'Shameless Sellout Sponsorship',
    platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
    category: 'Commercial',
    badges: [POST_BADGES.COMMERCIAL, POST_BADGES.RISK],
    condition: ({ social }) => social.instagram > 5000,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.INSTAGRAM.id,
      followers: 0,
      moneyChange: 500,
      loyaltyChange: -10,
      message: 'You got paid. The fans are calling you sellouts.'
    })
  },
  {
    id: 'comm_tour_merch',
    name: 'Limited "Tour Only" Merch Drop',
    platform: SOCIAL_PLATFORMS.NEWSLETTER.id,
    category: 'Commercial',
    badges: [POST_BADGES.COMMERCIAL],
    condition: ({ lastGigStats }) => lastGigStats && lastGigStats.score > 15000,
    resolve: ({ social }) => {
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
    condition: ({ player }) => player.money < 100,
    resolve: () => ({
      type: 'FIXED',
      success: true,
      platform: SOCIAL_PLATFORMS.YOUTUBE.id,
      followers: -500, // Looks desperate
      controversyChange: 5,
      moneyChange: 300,
      message: 'You got gas money, but you lost some self-respect and followers.'
    })
  },
  {
    id: 'comm_gear_review',
    name: 'Exquisite Gear Review',
    platform: SOCIAL_PLATFORMS.YOUTUBE.id,
    category: 'Commercial',
    badges: [POST_BADGES.SAFE, POST_BADGES.COMMERCIAL],
    condition: ({ band }) => band.inventory.golden_pick === true,
    resolve: ({ band }) => {
        // Matze is the guitarist usually.
        const target = band.members[0].name // Matze
        return {
            type: 'FIXED',
            success: true,
            platform: SOCIAL_PLATFORMS.YOUTUBE.id,
            followers: 1500,
            moneyChange: 100,
            targetMember: target,
            moodChange: 20,
            message: `${target} finally revealed the secret of the tone. Guitar nerds are losing it.`,
            unlockTrait: { memberId: 'matze', traitId: 'gear_nerd' }
        }
    }
  }
]
