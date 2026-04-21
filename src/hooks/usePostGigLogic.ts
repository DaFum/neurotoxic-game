import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { calculateGigFinancials } from '../utils/economyEngine'
import { generatePostOptions } from '../utils/socialEngine'
import { logger } from '../utils/logger'
import { usePostGigHandlers, DEFAULT_POST_FAILED_MSG } from './usePostGigHandlers'

export const DEFAULT_SOCIAL_UNAVAILABLE_MSG =
  'Social options are unavailable right now.'

const PERF_SCORE_MIN = 30
const PERF_SCORE_MAX = 100
const PERF_SCORE_SCALER = 500

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

  const gigContextRef = useRef<any>(null)
  if (!gigContextRef.current && currentGig && social && player) {
    gigContextRef.current = {
      daysSinceLastGig: player.day - (social.lastGigDay ?? player.day),
      lastGigDifficulty: social.lastGigDifficulty ?? null
    }
  }

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
        ),
        daysSinceLastGig: gigContextRef.current?.daysSinceLastGig ?? 0,
        lastGigDifficulty: gigContextRef.current?.lastGigDifficulty ?? null,
        social
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
    social,
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
      // Store the error fact silently inside ref,
      // which we will read in the useEffect below.
      if (!errorHandledRef.current) {
        errorHandledRef.current = e as any
      }
      return []
    }
  }, [currentGig, lastGigStats, player, band, social, activeEvent])

  // Process any error that happened during post option generation
  useEffect(() => {
    if (errorHandledRef.current && errorHandledRef.current !== true) {
      logger.error(
        'PostGig',
        'Failed to generate post options',
        errorHandledRef.current
      )
      errorHandledRef.current = true // mark handled
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPostOptionsError(true)
    }
  }, []) // trigger when postOptions updates

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
        totalFollowers: 0,
        followers: 0,
        moneyChange: 0,
        message: fallbackMsg
      } as any)
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPhase('COMPLETE')
      addToast(fallbackMsg, 'error')

      // Reset the error state so it doesn't loop
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPostOptionsError(false)
    }
  }, [postOptionsError, t, addToast])

  const {
    isProcessingAction,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
  } = usePostGigHandlers({
    player,
    band,
    social,
    lastGigStats,
    currentGig,
    perfScore,
    financials,
    activeStoryFlags,
    setlist,
    updatePlayer,
    updateBand,
    updateSocial,
    unlockTrait,
    addToast,
    saveGame,
    changeScene,
    addQuest,
    setPhase,
    setPostResult,
    setBrandOffers,
    t
  })

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
    isProcessingAction,
    handlePostSelection,
    handleAcceptDeal,
    handleRejectDeals,
    handleSpinStory,
    handleContinue,
    handleNextPhase
  }
}
