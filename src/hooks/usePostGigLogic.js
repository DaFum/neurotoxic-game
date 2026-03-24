/*
 * (#1) Actual Updates: Refactored handlePostSelection by extracting state manipulation to utils/postGigUtils.js.
 * (#2) Next Steps: N/A
 * (#3) Found Errors + Solutions: N/A
 */
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
  generateBrandOffers
} from '../utils/socialEngine'
import {
  clampPlayerMoney,
  clampPlayerFame,
  calculateFameLevel,
  calculateFameGain,
  clampControversyLevel,
  BALANCE_CONSTANTS
} from '../utils/gameStateUtils'
import { BRAND_ALIGNMENTS } from '../context/initialState'
import { SONGS_BY_ID } from '../data/songs'
import { logger } from '../utils/logger.js'
import { calculatePostGigStateUpdates } from '../utils/postGigUtils'

export const DEFAULT_SOCIAL_UNAVAILABLE_MSG =
  'Social options are unavailable right now.'
export const DEFAULT_POST_FAILED_MSG = 'Post failed. Try another option.'

const PERF_SCORE_MIN = 30
const PERF_SCORE_MAX = 100
const PERF_SCORE_SCALER = 500

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
  const [postResult, setPostResult] = useState(null)
  const [brandOffers, setBrandOffers] = useState([])
  const [postOptionsError, setPostOptionsError] = useState(false)
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
      triggerEvent('financial', 'post_gig') ||
        triggerEvent('special', 'post_gig') ||
        triggerEvent('band', 'post_gig')
    }
  }, [currentGig, activeEvent, triggerEvent])

  // Derive financials purely without triggering a re-render loop
  const financials = useMemo(() => {
    if (!currentGig || !lastGigStats) return null

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
    return result
  }, [
    currentGig,
    lastGigStats,
    perfScore,
    gigModifiers,
    band.inventory,
    player,
    social?.controversyLevel,
    social?.loyalty,
    social?.zealotry,
    reputationByRegion,
    activeStoryFlags
  ])

  // Derive post options purely without triggering a re-render loop
  const postOptions = useMemo(() => {
    if (!currentGig || !lastGigStats) return []

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
      return generatePostOptions(currentGig, gameStateForPosts)
    } catch (e) {
      if (!errorHandledRef.current) {
        errorHandledRef.current = true
        logger.error('PostGig', 'Failed to generate post options', e)
        setPostOptionsError(true)
      }
      return []
    }
  }, [currentGig, lastGigStats, player, band, social, activeEvent])

  // Handle post options generation error side effects purely in an effect
  useEffect(() => {
    if (postOptionsError) {
      const fallbackMsg = t('ui:postGig.socialOptionsUnavailable', {
        defaultValue: DEFAULT_SOCIAL_UNAVAILABLE_MSG
      })

      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPostResult({
        type: 'ERROR',
        success: false,
        platform: 'none',
        followers: 0,
        moneyChange: 0,
        message: fallbackMsg
      })
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPhase('COMPLETE')
      addToast(fallbackMsg, 'error')

      // Reset the error state so it doesn't loop
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPostOptionsError(false)
    }
  }, [postOptionsError, t, addToast])

  const handlePostSelection = useCallback(
    option => {
      let updates;
      try {
        updates = calculatePostGigStateUpdates({
          option,
          player,
          band,
          social,
          lastGigStats,
          currentGig,
          perfScore,
          secureRandomValue: secureRandom()
        })
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

      const {
        finalResult,
        newBand,
        hasBandUpdates,
        appliedHarmonyDelta,
        nextMoney,
        appliedMoneyDelta,
        updatedSocial
      } = updates

      setPostResult(finalResult)

      if (hasBandUpdates) {
        updateBand(newBand)
      }

      if (appliedHarmonyDelta !== 0) {
        const sign = appliedHarmonyDelta > 0 ? '+' : ''
        addToast(
          `${t('ui:postGig.harmony', { defaultValue: 'Harmony' })} ${sign}${appliedHarmonyDelta}`,
          appliedHarmonyDelta > 0 ? 'success' : 'error'
        )
      }

      if (appliedMoneyDelta !== 0) {
        updatePlayer({ money: nextMoney })
        const sign = appliedMoneyDelta > 0 ? '+' : ''
        addToast(
          `${t('ui:postGig.money', { defaultValue: 'Money' })} ${sign}${appliedMoneyDelta}€`,
          appliedMoneyDelta > 0 ? 'success' : 'error'
        )
      } else if (finalResult.moneyChange) {
        updatePlayer({ money: nextMoney })
      }

      if (finalResult.unlockTrait) {
        unlockTrait(finalResult.unlockTrait.memberId, finalResult.unlockTrait.traitId)
        const traitName = finalResult.unlockTrait.traitId
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
              updates.controversyLevel = clampControversyLevel(
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
      controversyLevel: clampControversyLevel((prev.controversyLevel || 0) - 25)
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
