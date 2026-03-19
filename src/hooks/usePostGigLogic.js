// TODO: Review this file
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
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
import {
  clampPlayerMoney,
  clampBandHarmony,
  clampMemberStamina,
  clampMemberMood,
  clampPlayerFame,
  calculateFameLevel
} from '../utils/gameStateUtils'
import { BRAND_ALIGNMENTS } from '../context/initialState'
import { SONGS_BY_ID } from '../data/songs'
import { logger } from '../utils/logger.js'

export const DEFAULT_SOCIAL_UNAVAILABLE_MSG =
  'Social options are unavailable right now.'
export const DEFAULT_POST_FAILED_MSG = 'Post failed. Try another option.'

const PERF_SCORE_MIN = 30
const PERF_SCORE_MAX = 100
const PERF_SCORE_SCALER = 500
const MAX_FAME_GAIN = 500

const CROSS_POSTING_PLATFORMS = ['instagram', 'tiktok', 'youtube']
const OPPOSING_ALIGNMENT_MAP = {
  [BRAND_ALIGNMENTS.EVIL]: BRAND_ALIGNMENTS.SUSTAINABLE,
  [BRAND_ALIGNMENTS.SUSTAINABLE]: BRAND_ALIGNMENTS.EVIL,
  [BRAND_ALIGNMENTS.CORPORATE]: BRAND_ALIGNMENTS.INDIE,
  [BRAND_ALIGNMENTS.INDIE]: BRAND_ALIGNMENTS.CORPORATE
}

export const usePostGigLogic = () => {
  const { t } = useTranslation(['ui'])
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
    saveGame,
    changeScene,
    unlockTrait,
    reputationByRegion,
    activeStoryFlags,
    addQuest,
    setlist
  } = useGameState()

  const [phase, setPhase] = useState('REPORT') // REPORT, SOCIAL, DEALS, COMPLETE
  const [financials, setFinancials] = useState(null)
  const [postOptions, setPostOptions] = useState([])
  const [postResult, setPostResult] = useState(null)
  const [brandOffers, setBrandOffers] = useState([])
  const errorHandledRef = useRef(false)

  const phaseTitleKey =
    {
      REPORT: 'ui:postGig.phaseReport',
      SOCIAL: 'ui:postGig.phaseSocialStrategy',
      DEALS: 'ui:postGig.phaseBrandOffers',
      COMPLETE: 'ui:postGig.phaseTourUpdate'
    }[phase] ?? 'ui:postGig.phaseTourUpdate'
  const phaseTitleDefault =
    {
      REPORT: 'GIG REPORT',
      SOCIAL: 'SOCIAL MEDIA STRATEGY',
      DEALS: 'BRAND OFFERS',
      COMPLETE: 'TOUR UPDATE'
    }[phase] ?? 'TOUR UPDATE'

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
      triggerEvent('financial', 'post_gig') ||
        // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
        triggerEvent('special', 'post_gig') ||
        // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
        triggerEvent('band', 'post_gig')
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
          zealotry: social?.zealotry || 0,
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
      try {
        // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
        setPostOptions(generatePostOptions(currentGig, gameStateForPosts))
      } catch (e) {
        if (!errorHandledRef.current) {
          errorHandledRef.current = true
          logger.error('PostGig', 'Failed to generate post options', e)
          // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
          setPostOptions([])
          const fallbackMsg = t('ui:postGig.socialOptionsUnavailable', {
            defaultValue: DEFAULT_SOCIAL_UNAVAILABLE_MSG
          })
          // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
          setPostResult({
            type: 'ERROR',
            success: false,
            platform: 'none',
            followers: 0,
            moneyChange: 0,
            message: fallbackMsg
          })
          // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
          setPhase('COMPLETE')
          // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
          addToast(fallbackMsg, 'error')
        }
      }
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
    reputationByRegion,
    addToast,
    t
  ])

  const handlePostSelection = useCallback(
    option => {
      // We pass gameState into resolvePost to allow for complex RNG derivations if needed
      const gameState = { player, band, social }
      let result
      try {
        result = resolvePost(option, gameState, secureRandom())
      } catch (e) {
        logger.error('PostGig', 'Failed to resolve selected post', e)
        addToast(
          t('ui:postGig.postResolutionFailed', {
            defaultValue: DEFAULT_POST_FAILED_MSG
          }),
          'error'
        )
        return
      }

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
        const prevHarmony = newBand.harmony ?? 1
        const nextHarmony = clampBandHarmony(prevHarmony + result.harmonyChange)
        const appliedDelta = nextHarmony - prevHarmony
        newBand.harmony = nextHarmony
        hasBandUpdates = true

        if (appliedDelta !== 0) {
          const sign = appliedDelta > 0 ? '+' : ''
          addToast(
            `${t('ui:postGig.harmony', { defaultValue: 'Harmony' })} ${sign}${appliedDelta}`,
            appliedDelta > 0 ? 'success' : 'error'
          )
        }
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

      if (hasBandUpdates) {
        updateBand(newBand)
      }

      if (result.moneyChange) {
        const prevMoney = player.money ?? 0
        const nextMoney = clampPlayerMoney(prevMoney + result.moneyChange)
        const appliedDelta = nextMoney - prevMoney

        updatePlayer({ money: nextMoney })

        if (appliedDelta !== 0) {
          const sign = appliedDelta > 0 ? '+' : ''
          addToast(
            `${t('ui:postGig.money', { defaultValue: 'Money' })} ${sign}${appliedDelta}€`,
            appliedDelta > 0 ? 'success' : 'error'
          )
        }
      }

      if (result.unlockTrait) {
        unlockTrait(result.unlockTrait.memberId, result.unlockTrait.traitId)
        const traitName = result.unlockTrait.traitId
          .replace(/_/g, ' ')
          .toUpperCase()
        addToast(
          t('ui:postGig.traitUnlocked', {
            traitName,
            defaultValue: 'Trait Unlocked: {{traitName}}'
          }),
          'success'
        )
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
        controversyLevel: Math.max(
          0,
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
        const otherPlatforms = CROSS_POSTING_PLATFORMS.filter(
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
      currentGig,
      t
    ]
  )

  const handleAcceptDeal = useCallback(
    deal => {
      try {
        let appliedMoneyDelta = 0
        // Apply upfront bonuses
        if (deal.offer.upfront) {
          const prevMoney = player.money ?? 0
          const nextMoney = clampPlayerMoney(prevMoney + deal.offer.upfront)
          appliedMoneyDelta = nextMoney - prevMoney
          updatePlayer({ money: nextMoney })
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
            const opposing = OPPOSING_ALIGNMENT_MAP[deal.alignment]
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

        const moneyText =
          appliedMoneyDelta !== 0 ? ` (+${appliedMoneyDelta}€)` : ''
        addToast(
          t('ui:postGig.acceptedDeal', {
            dealName: deal.name,
            moneyText,
            defaultValue: 'Accepted deal: {{dealName}}{{moneyText}}'
          }),
          'success'
        )

        // Remove processed deal and check if more remain
        setBrandOffers(prev => {
          const remaining = prev.filter(o => o.id !== deal.id)
          if (remaining.length === 0) {
            setPhase('COMPLETE')
          }
          return remaining
        })
      } catch (e) {
        logger.error('PostGig', 'Failed to accept deal', e)
        addToast(
          t('ui:postGig.dealFailed', {
            defaultValue: 'Deal failed'
          }),
          'error'
        )
      }
    },
    [player, updatePlayer, updateBand, updateSocial, addToast, t]
  )

  const handleRejectDeals = useCallback(() => {
    // Clears all remaining offers (Reject All / Skip Phase)
    setBrandOffers([])
    setPhase('COMPLETE')
    addToast(
      t('ui:postGig.skippedBrandDeals', {
        defaultValue: 'Skipped brand deals.'
      }),
      'info'
    )
  }, [addToast, t])

  const handleSpinStory = useCallback(() => {
    if (player.money < 200) {
      addToast(
        t('ui:postGig.notEnoughCashForPr', {
          defaultValue: 'Not enough cash for PR!'
        }),
        'error'
      )
      return
    }

    const prevMoney = player.money ?? 0
    const nextMoney = clampPlayerMoney(prevMoney - 200)
    const appliedDelta = nextMoney - prevMoney

    updatePlayer({ money: nextMoney })
    updateSocial(prev => ({
      controversyLevel: Math.max(0, (prev.controversyLevel || 0) - 25)
    }))

    const moneyText = appliedDelta !== 0 ? ` (${appliedDelta}€)` : ''
    addToast(
      t('ui:postGig.storySpunControversyReduced', {
        moneyText,
        defaultValue: `Story Spun. Controversy reduced.${moneyText}`
      }),
      'success'
    )
  }, [player, updatePlayer, updateSocial, addToast, t])

  const handleContinue = useCallback(() => {
    if (!financials) return

    let fameGain = Math.min(MAX_FAME_GAIN, 50 + Math.floor(perfScore * 1.5))
    const prevFame = player.fame ?? 0

    // Diminishing returns: It gets exponentially harder to gain fame once established
    if (fameGain > 0 && prevFame > 50) {
      const diminishingMultiplier = Math.exp(-(prevFame - 50) * 0.01)
      fameGain = Math.max(1, Math.round(fameGain * diminishingMultiplier))
    }

    const prevMoney = player.money ?? 0
    const newMoney = clampPlayerMoney(prevMoney + financials.net)

    const newFame = clampPlayerFame(prevFame + fameGain)

    updatePlayer({
      money: newMoney,
      fame: newFame,
      fameLevel: calculateFameLevel(newFame),
      lastGigNodeId: player.currentNodeId
    })

    if (activeStoryFlags?.includes('cancel_quest_active')) {
      addQuest({
        id: 'quest_apology_tour',
        label: 'ui:quests.postgig.apologyTour.title',
        description: 'ui:quests.postgig.apologyTour.description',
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
        label: 'ui:quests.postgig.saveTheBand.title',
        description: 'ui:quests.postgig.saveTheBand.description',
        deadline: player.day + 5,
        progress: 0,
        required: 1,
        rewardFlag: 'ego_crisis_resolved',
        failurePenalty: { type: 'game_over' }
      })
    }

    // Leaderboard Song Score Submission
    if (player.playerId && player.playerName) {
      // Create a unified list of song stats to submit
      let songsToSubmit

      if (lastGigStats?.songStats && lastGigStats.songStats.length > 0) {
        // Use the detailed per-song stats generated during the gig
        songsToSubmit = lastGigStats.songStats.map(stat => ({
          songId: stat.songId,
          score: stat.score,
          accuracy: stat.accuracy
        }))
      } else {
        // Fallback for legacy saves or early aborted gigs without per-song stats
        const setlistFirstId =
          typeof setlist?.[0] === 'string' ? setlist[0] : setlist?.[0]?.id
        const playedSongId = currentGig?.songId || setlistFirstId
        songsToSubmit = [
          {
            songId: playedSongId,
            score: lastGigStats?.score || 0,
            accuracy: lastGigStats?.accuracy || 0
          }
        ]
      }

      // Submit each song individually
      songsToSubmit.forEach(songData => {
        // Resolve to leaderboardId (API-safe slug) — currentGig.songId is the raw
        // JSON key which may contain spaces the API rejects (^[a-zA-Z0-9_-]+$).
        const leaderboardSongId = SONGS_BY_ID.get(
          songData.songId
        )?.leaderboardId

        if (leaderboardSongId) {
          fetch('/api/leaderboard/song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId: player.playerId,
              playerName: player.playerName,
              songId: leaderboardSongId,
              score: songData.score,
              accuracy: songData.accuracy
            })
          })
            .then(async res => {
              if (!res.ok) {
                const err = await res.text()
                throw new Error(`HTTP ${res.status}: ${err}`)
              }
            })
            .catch(err =>
              logger.error(
                'PostGig',
                `Score submit failed for ${leaderboardSongId}`,
                err
              )
            )
        }
      })
    }

    if (shouldTriggerBankruptcy(newMoney, financials.net)) {
      addToast(
        t('ui:postGig.gameOverBankrupt', {
          defaultValue: 'GAME OVER: BANKRUPT! The tour is over.'
        }),
        'error'
      )
      changeScene(GAME_PHASES.GAMEOVER)
    } else {
      window.setTimeout(() => {
        saveGame(false)
        changeScene(GAME_PHASES.OVERWORLD)
      }, 0)
    }
  }, [
    financials,
    perfScore,
    player,
    currentGig,
    lastGigStats,
    updatePlayer,
    addToast,
    saveGame,
    changeScene,
    activeStoryFlags,
    addQuest,
    setlist,
    t
  ])

  const handleNextPhase = useCallback(() => {
    setPhase('SOCIAL')
  }, [])

  return {
    t,
    phase,
    financials,
    postOptions,
    postResult,
    brandOffers,
    phaseTitleKey,
    phaseTitleDefault,
    social,
    player,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
  }
}
