import PropTypes from 'prop-types'
import { useState, useEffect, useMemo, useCallback, memo } from 'react'
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

import { ReportPhase } from '../components/postGig/ReportPhase'
import { SocialPhase } from '../components/postGig/SocialPhase'
import { DealsPhase } from '../components/postGig/DealsPhase'
import { CompletePhase } from '../components/postGig/CompletePhase'

const PERF_SCORE_MIN = 30
const PERF_SCORE_MAX = 100
const PERF_SCORE_SCALER = 500

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
    unlockTrait
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
      const financialEvent = triggerEvent('financial', 'post_gig')
      if (!financialEvent) {
        const specialEvent = triggerEvent('special', 'post_gig')
        if (!specialEvent) {
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
        gigStats: lastGigStats
      })
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
      setPostOptions(generatePostOptions(currentGig, gameStateForPosts))
    }
  }, [
    financials,
    currentGig?.id,
    lastGigStats?.score,
    gigModifiers,
    perfScore,
    activeEvent?.id
  ])

  const handlePostSelection = useCallback((option) => {
    // We pass gameState into resolvePost to allow for complex RNG derivations if needed
    const gameState = { player, band, social }
    const result = resolvePost(option, gameState, secureRandom())

    // Use checkViralEvent for bonus viral flag based on actual gig stats
    // Pass context so trait bonuses (e.g. social_manager) are applied via calculateViralityScore
    const isGigViral = lastGigStats && checkViralEvent(lastGigStats, {
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
      newBand.harmony = clampBandHarmony(newBand.harmony + result.harmonyChange)
      hasBandUpdates = true
    }
    if (result.allMembersMoodChange || result.allMembersStaminaChange || result.targetMember) {
      newBand.members = newBand.members.map(m => {
        let updatedM = { ...m }
        if (result.allMembersMoodChange || m.name === result.targetMember) {
          if (result.moodChange) updatedM.mood = Math.max(0, Math.min(100, updatedM.mood + result.moodChange))
        }
        if (result.allMembersStaminaChange || m.name === result.targetMember) {
          if (result.staminaChange) updatedM.stamina = Math.max(0, Math.min(100, updatedM.stamina + result.staminaChange))
        }
        return updatedM
      })
      hasBandUpdates = true
    }

    if (hasBandUpdates) {
      updateBand(newBand)
    }

    if (result.moneyChange) {
      updatePlayer({ money: clampPlayerMoney(player.money + result.moneyChange) })
    }

    if (result.unlockTrait) {
      unlockTrait(result.unlockTrait.memberId, result.unlockTrait.traitId)
      const traitName = result.unlockTrait.traitId.replace(/_/g, ' ').toUpperCase()
      addToast(`Trait Unlocked: ${traitName}`, 'success')
    }

    const updatedSocial = {
      [result.platform]: Math.max(0, (social[result.platform] || 0) + totalFollowers),
      viral: social.viral + (result.success ? 1 : 0) + gigViralBonus,
      lastGigDay: player.day,
      controversyLevel: Math.max(0, (social.controversyLevel || 0) + (result.controversyChange || 0)),
      loyalty: Math.max(0, (social.loyalty || 0) + (result.loyaltyChange || 0)),
      egoFocus: result.egoClear ? null : (result.egoDrop ? result.egoDrop : social.egoFocus),
      sponsorActive: option.id === 'comm_sellout_ad' ? false : social.sponsorActive,
      trend: social.trend,
      activeDeals: social.activeDeals
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
  }, [lastGigStats, perfScore, social, player, band, updateSocial, updateBand, updatePlayer, unlockTrait, addToast])

  const handleAcceptDeal = useCallback((deal) => {
    // Apply upfront bonuses
    if (deal.offer.upfront) {
      updatePlayer({ money: clampPlayerMoney(player.money + deal.offer.upfront) })
    }
    if (deal.offer.item) {
      const newInventory = { ...band.inventory, [deal.offer.item]: true }
      updateBand({ inventory: newInventory })
    }

    // Use functional update to ensure fresh state access
    updateSocial((prevSocial) => {
      const updates = {}

      // Apply penalties immediately if defined
      if (deal.penalty) {
        if (deal.penalty.loyalty) updates.loyalty = Math.max(0, (prevSocial.loyalty || 0) + deal.penalty.loyalty)
        if (deal.penalty.controversy) updates.controversyLevel = Math.max(0, (prevSocial.controversyLevel || 0) + deal.penalty.controversy)
      }

      // Store active deal
      const prevDeals = prevSocial.activeDeals || []
      updates.activeDeals = [...prevDeals, { ...deal, remainingGigs: deal.offer.duration }]

      return updates
    })

    addToast(`Accepted deal: ${deal.name}`, 'success')

    // Remove processed deal and check if more remain
    setBrandOffers(prev => {
      const remaining = prev.slice(1) // Remove first
      if (remaining.length === 0) {
        setPhase('COMPLETE')
      }
      return remaining
    })
  }, [player, band, updatePlayer, updateBand, updateSocial, addToast])

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
    updateSocial((prev) => ({ controversyLevel: Math.max(0, (prev.controversyLevel || 0) - 25) }))
    addToast('Story Spun. Controversy reduced.', 'success')
  }, [player, updatePlayer, updateSocial, addToast])

  const handleContinue = useCallback(() => {
    if (!financials) return

    const fameGain = 50 + Math.floor(perfScore * 1.5)
    const newMoney = Math.max(0, player.money + financials.net)

    updatePlayer({
      money: newMoney,
      fame: player.fame + fameGain
    })

    if (shouldTriggerBankruptcy(newMoney, financials.net)) {
      addToast('GAME OVER: BANKRUPT! The tour is over.', 'error')
      changeScene('GAMEOVER')
    } else {
      changeScene('OVERWORLD')
    }
  }, [financials, perfScore, player.money, player.fame, updatePlayer, addToast, changeScene])

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
          <ReportPhase
            financials={financials}
            onNext={handleNextPhase}
          />
        )}

        {phase === 'SOCIAL' && (
          <SocialPhase options={postOptions} onSelect={handlePostSelection} trend={social.trend} />
        )}

        {phase === 'DEALS' && (
          <DealsPhase offers={brandOffers.slice(0, 1)} onAccept={handleAcceptDeal} onSkip={handleRejectDeals} />
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
