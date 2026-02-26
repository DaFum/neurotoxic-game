import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { secureRandom } from '../utils/crypto'
import {
  calculateGigFinancials,
  shouldTriggerBankruptcy
} from '../utils/economyEngine'
import {
  generatePostOptions,
  resolvePost,
  checkViralEvent,
  calculateSocialGrowth,
  generateBrandOffers
} from '../utils/socialEngine'
import { clampPlayerMoney, clampBandHarmony } from '../utils/gameStateUtils'
import { BRAND_ALIGNMENTS } from '../context/initialState'

import { ReportPhase } from '../components/postGig/ReportPhase'
import { SocialPhase } from '../components/postGig/SocialPhase'
import { DealsPhase } from '../components/postGig/DealsPhase'
import { CompletePhase } from '../components/postGig/CompletePhase'

const PERF_SCORE_MIN = 30
const PERF_SCORE_MAX = 100
const PERF_SCORE_SCALER = 500
const MAX_FAME_GAIN = 500

export const PostGig = () => {
  const {
    currentGig,
    player,
    updatePlayer,
    gigModifiers,
    triggerEvent,
    activeEvent,
    band,
    updateBand,
    updateSocial,
    social,
    lastGigStats,
    addToast,
    changeScene,
    unlockTrait,
    reputationByRegion,
    activeStoryFlags,
    addQuest
  } = useGameState()
  const [phase, setPhase] = useState('REPORT') // REPORT, SOCIAL, DEALS, COMPLETE
  const [financials, setFinancials] = useState(null)
  const [postOptions, setPostOptions] = useState([])
  const [postResult, setPostResult] = useState(null)
  const [brandOffers, setBrandOffers] = useState([])

  const perfScore = useMemo(() => {
    const rawScore = lastGigStats?.score || 0
    return Math.min(
      PERF_SCORE_MAX,
      Math.max(PERF_SCORE_MIN, rawScore / PERF_SCORE_SCALER)
    )
  }, [lastGigStats])

  useEffect(() => {
    if (!currentGig) return

    if (!activeEvent) {
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      const financialEvent = triggerEvent('financial', 'post_gig')
      if (!financialEvent) {
        // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
        const specialEvent = triggerEvent('special', 'post_gig')
        if (!specialEvent) {
          // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
          triggerEvent('band', 'post_gig')
        }
      }
    }
  }, [currentGig, activeEvent, triggerEvent])

  // Initialize Results once (simulated)
  useEffect(() => {
    if (!financials && currentGig && lastGigStats) {
      const result = calculateGigFinancials({
        gigData: currentGig,
        performanceScore: perfScore,
        modifiers: gigModifiers,
        bandInventory: band.inventory,
        playerState: player,
        gigStats: lastGigStats,
        context: {
          controversyLevel: social?.controversyLevel || 0,
          regionRep: reputationByRegion?.[player?.location] || 0,
          loyalty: social?.loyalty || 0,
          discountedTickets: activeStoryFlags?.includes(
            'discounted_tickets_active'
          )
        }
      })
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setFinancials(result)

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
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
      setPostOptions(generatePostOptions(currentGig, gameStateForPosts))
    }
  }, [
    financials,
    currentGig,
    lastGigStats,
    gigModifiers,
    perfScore,
    activeEvent,
    activeStoryFlags,
    band,
    player,
    social,
    reputationByRegion
  ])

  const handlePostSelection = useCallback(
    option => {
      // We pass gameState into resolvePost to allow for complex RNG derivations if needed
      const gameState = { player, band, social }
      const result = resolvePost(option, gameState, secureRandom())

      // Use checkViralEvent for bonus viral flag based on actual gig stats
      // Pass context so trait bonuses (e.g. social_manager) are applied via calculateViralityScore
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

      // Use calculateSocialGrowth for platform-aware organic growth on top of post
      const organicGrowth = calculateSocialGrowth(
        result.platform,
        perfScore,
        social[result.platform] || 0,
        isGigViral, // Use actual gig viral status, not post result.success
        social.controversyLevel || 0,
        social.loyalty || 0
      )
      const totalFollowers = result.followers + organicGrowth

      const finalResult = { ...result, totalFollowers }
      setPostResult(finalResult)

      // Prepare updated state objects
      const newBand = { ...band }
      let hasBandUpdates = false

      if (result.harmonyChange) {
        newBand.harmony = clampBandHarmony(
          newBand.harmony + result.harmonyChange
        )
        hasBandUpdates = true
      }
      if (
        result.allMembersMoodChange ||
        result.allMembersStaminaChange ||
        result.targetMember
      ) {
        newBand.members = newBand.members.map(m => {
          let updatedM = { ...m }
          if (result.allMembersMoodChange || m.name === result.targetMember) {
            if (result.moodChange)
              updatedM.mood = Math.max(
                0,
                Math.min(100, updatedM.mood + result.moodChange)
              )
          }
          if (
            result.allMembersStaminaChange ||
            m.name === result.targetMember
          ) {
            if (result.staminaChange)
              updatedM.stamina = Math.max(
                0,
                Math.min(100, updatedM.stamina + result.staminaChange)
              )
          }
          return updatedM
        })
        hasBandUpdates = true
      }

      if (hasBandUpdates) {
        updateBand(newBand)
      }

      if (result.moneyChange) {
        updatePlayer({
          money: clampPlayerMoney(player.money + result.moneyChange)
        })
      }

      if (result.unlockTrait) {
        unlockTrait(result.unlockTrait.memberId, result.unlockTrait.traitId)
        const traitName = result.unlockTrait.traitId
          .replace(/_/g, ' ')
          .toUpperCase()
        addToast(`Trait Unlocked: ${traitName}`, 'success')
      }

      const updatedSocial = {
        [result.platform]: Math.max(
          0,
          (social[result.platform] || 0) + totalFollowers
        ),
        viral: (social.viral || 0) + (result.success ? 1 : 0) + gigViralBonus,
        lastGigDay: player.day,
        controversyLevel: Math.max(
          0,
          (social.controversyLevel || 0) + (result.controversyChange || 0)
        ),
        loyalty: Math.max(
          0,
          (social.loyalty || 0) + (result.loyaltyChange || 0)
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
        sponsorActive:
          option.id === 'comm_sellout_ad' ? false : social.sponsorActive,
        trend: social.trend,
        activeDeals: social.activeDeals,
        influencers: social.influencers
      }

      // Handle Influencer Update
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

      // Cross-posting Logic: 25% diminishing returns across other main platforms
      if (result.success && totalFollowers > 0) {
        const otherPlatforms = ['instagram', 'tiktok', 'youtube'].filter(
          p => p !== result.platform
        )
        otherPlatforms.forEach(p => {
          updatedSocial[p] = Math.max(
            0,
            (social[p] || 0) + Math.floor(totalFollowers * 0.25)
          )
        })
      }

      updateSocial(updatedSocial)

      // Generate brand offers with UPDATED state (Post-Social-Update)
      const updatedGameState = {
        player, // Money update handled separately but not critical for offer generation
        band: hasBandUpdates ? newBand : band,
        social: { ...social, ...updatedSocial }
      }

      const offers = generateBrandOffers(updatedGameState, secureRandom)
      setBrandOffers(offers)

      // If there are brand offers, go to DEALS phase, else COMPLETE
      if (offers.length > 0) {
        setPhase('DEALS')
      } else {
        setPhase('COMPLETE')
      }
    },
    [
      lastGigStats,
      perfScore,
      social,
      player,
      band,
      updateSocial,
      updateBand,
      updatePlayer,
      unlockTrait,
      addToast,
      currentGig
    ]
  )

  const handleAcceptDeal = useCallback(
    deal => {
      // Apply upfront bonuses
      if (deal.offer.upfront) {
        updatePlayer(prev => ({
          money: clampPlayerMoney(prev.money + deal.offer.upfront)
        }))
      }
      if (deal.offer.item) {
        updateBand(prev => ({
          inventory: { ...prev.inventory, [deal.offer.item]: true }
        }))
      }

      // Use functional update to ensure fresh state access
      updateSocial(prevSocial => {
        const updates = {}

        // Apply penalties immediately if defined
        if (deal.penalty) {
          if (deal.penalty.loyalty)
            updates.loyalty = Math.max(
              0,
              (prevSocial.loyalty || 0) + deal.penalty.loyalty
            )
          if (deal.penalty.controversy)
            updates.controversyLevel = Math.max(
              0,
              (prevSocial.controversyLevel || 0) + deal.penalty.controversy
            )
        }

        // Update Brand Reputation
        if (deal.alignment) {
          updates.brandReputation = { ...(prevSocial.brandReputation || {}) }
          const currentRep = updates.brandReputation[deal.alignment] || 0
          updates.brandReputation[deal.alignment] = Math.min(
            100,
            currentRep + 5
          )

          // Opposing alignments logic
          const opposingMap = {
            [BRAND_ALIGNMENTS.EVIL]: BRAND_ALIGNMENTS.SUSTAINABLE,
            [BRAND_ALIGNMENTS.SUSTAINABLE]: BRAND_ALIGNMENTS.EVIL,
            [BRAND_ALIGNMENTS.CORPORATE]: BRAND_ALIGNMENTS.INDIE,
            [BRAND_ALIGNMENTS.INDIE]: BRAND_ALIGNMENTS.CORPORATE
          }

          const opposing = opposingMap[deal.alignment]
          if (opposing) {
            const oppRep = updates.brandReputation[opposing] || 0
            updates.brandReputation[opposing] = Math.max(0, oppRep - 3)
          }
        }

        // Store active deal
        const prevDeals = prevSocial.activeDeals || []
        updates.activeDeals = [
          ...prevDeals,
          { ...deal, remainingGigs: deal.offer.duration }
        ]

        return updates
      })

      addToast(`Accepted deal: ${deal.name}`, 'success')

      // Remove processed deal and check if more remain
      setBrandOffers(prev => {
        const remaining = prev.filter(o => o.id !== deal.id)
        if (remaining.length === 0) {
          setPhase('COMPLETE')
        }
        return remaining
      })
    },
    [updatePlayer, updateBand, updateSocial, addToast]
  )

  const handleRejectDeals = useCallback(() => {
    // Clears all remaining offers (Reject All / Skip Phase)
    setBrandOffers([])
    setPhase('COMPLETE')
    addToast('Skipped brand deals.', 'info')
  }, [addToast])

  const handleSpinStory = useCallback(() => {
    if (player.money < 200) {
      addToast('Not enough cash for PR!', 'error')
      return
    }

    updatePlayer({ money: clampPlayerMoney(player.money - 200) })
    updateSocial(prev => ({
      controversyLevel: Math.max(0, (prev.controversyLevel || 0) - 25)
    }))
    addToast('Story Spun. Controversy reduced.', 'success')
  }, [player, updatePlayer, updateSocial, addToast])

  const handleContinue = useCallback(() => {
    if (!financials) return

    const fameGain = Math.min(
      MAX_FAME_GAIN,
      50 + Math.floor(perfScore * 1.5)
    )
    const newMoney = Math.max(0, player.money + financials.net)

    updatePlayer({
      money: newMoney,
      fame: player.fame + fameGain
    })

    if (activeStoryFlags?.includes('cancel_quest_active')) {
      addQuest({
        id: 'quest_apology_tour',
        label: 'APOLOGY TOUR',
        deadline: player.day + 14,
        progress: 0,
        required: 3,
        rewardFlag: 'apology_tour_complete',
        failurePenalty: {
          social: { controversyLevel: 25 },
          band: { harmony: -20 }
        }
      })
    }

    if (activeStoryFlags?.includes('breakup_quest_active')) {
      addQuest({
        id: 'quest_ego_management',
        label: 'SAVE THE BAND',
        deadline: player.day + 5,
        progress: 0,
        required: 1,
        rewardFlag: 'ego_crisis_resolved',
        failurePenalty: { type: 'game_over' }
      })
    }

    // Leaderboard Song Score Submission
    if (player.playerId && player.playerName && currentGig?.songId) {
      fetch('/api/leaderboard/song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.playerId,
          playerName: player.playerName,
          songId: currentGig.songId,
          score: lastGigStats?.score || 0
        })
      }).catch(err => console.error('Score submit failed', err))
    }

    if (shouldTriggerBankruptcy(newMoney, financials.net)) {
      addToast('GAME OVER: BANKRUPT! The tour is over.', 'error')
      changeScene('GAMEOVER')
    } else {
      changeScene('OVERWORLD')
    }
  }, [
    financials,
    perfScore,
    player.money,
    player.fame,
    updatePlayer,
    addToast,
    changeScene,
    activeStoryFlags,
    addQuest,
    player.day
  ])

  const handleNextPhase = useCallback(() => {
    setPhase('SOCIAL')
  }, [])

  if (!financials)
    return (
      <div className='w-full h-full flex flex-col items-center justify-center bg-(--void-black)'>
        <div className="text-3xl text-(--toxic-green) font-['Metal_Mania'] animate-pulse tracking-widest">
          TALLYING RECEIPTS...
        </div>
      </div>
    )

  return (
    <div className='w-full h-full flex flex-col items-center justify-center p-8 bg-(--void-black) text-(--star-white) relative'>
      <div
        className='absolute inset-0 opacity-20 bg-cover bg-center'
        style={{
          backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.POST_GIG_BG)}")`
        }}
      />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className='max-w-4xl w-full border-4 border-(--toxic-green) p-8 bg-(--void-black) relative z-10 shadow-[0_0_50px_var(--toxic-green-glow)] flex flex-col gap-6'
      >
        <h2 className="text-5xl text-center font-['Metal_Mania'] text-(--toxic-green) mb-2 text-shadow-[0_0_10px_var(--toxic-green)]">
          {phase === 'REPORT'
            ? 'GIG REPORT'
            : phase === 'SOCIAL'
              ? 'SOCIAL MEDIA STRATEGY'
              : phase === 'DEALS'
                ? 'BRAND OFFERS'
                : 'TOUR UPDATE'}
        </h2>

        {phase === 'REPORT' && (
          <ReportPhase financials={financials} onNext={handleNextPhase} />
        )}

        {phase === 'SOCIAL' && (
          <SocialPhase
            options={postOptions}
            onSelect={handlePostSelection}
            trend={social.trend}
          />
        )}

        {phase === 'DEALS' && (
          <DealsPhase
            offers={brandOffers}
            onAccept={handleAcceptDeal}
            onSkip={handleRejectDeals}
          />
        )}

        {phase === 'COMPLETE' && (
          <CompletePhase
            result={postResult}
            onContinue={handleContinue}
            onSpinStory={handleSpinStory}
            player={player}
            social={social}
          />
        )}
      </motion.div>
    </div>
  )
}
