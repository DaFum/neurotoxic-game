import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { calculateGigFinancials } from '../utils/economyEngine'
import { generatePostOptions } from '../utils/socialEngine'
import { logger } from '../utils/logger'
import { usePostGigHandlers } from './usePostGigHandlers'
import { BALANCE_CONSTANTS } from '../utils/gameStateUtils'
import { calculatePerformanceScore, deriveGigContext, deriveFinancials, derivePostOptions } from '../utils/postGigUtils'

export { DEFAULT_POST_FAILED_MSG } from './usePostGigHandlers'

export type PostOptionsErrorState =
  | false
  | { kind: 'pending'; error: unknown }
  | { kind: 'handled' }
export const DEFAULT_SOCIAL_UNAVAILABLE_MSG =
  'Social options are unavailable right now.'

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
  const errorHandledRef = useRef<PostOptionsErrorState>(false)

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

  const perfScore = useMemo(() => calculatePerformanceScore(lastGigStats?.score || 0), [lastGigStats])

  useEffect(() => {
    if (!currentGig) return

    if (!activeEvent) {
      if (!triggerEvent('financial', 'post_gig')) {
        if (!triggerEvent('special', 'post_gig')) {
          triggerEvent('band', 'post_gig')
        }
      }
    }
  }, [currentGig, activeEvent, triggerEvent])

  const gigContextRef = useRef<{
    daysSinceLastGig: number
    lastGigDifficulty: number | null
  } | null>(null)
  if (!gigContextRef.current) {
    gigContextRef.current = deriveGigContext(currentGig, social, player)
  }

  // Derive financials purely without triggering a re-render loop
  const financials = useMemo(() => deriveFinancials({
    currentGig,
    lastGigStats,
    perfScore,
    gigModifiers,
    bandInventory: band.inventory,
    player,
    social,
    reputationByRegion,
    activeStoryFlags,
    gigContext: gigContextRef.current,
    calculateGigFinancials,
    BALANCE_CONSTANTS
  }), [
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
    const { options, error } = derivePostOptions({
      currentGig,
      lastGigStats,
      player,
      band,
      social,
      activeEvent,
      generatePostOptions
    })

    if (error) {
      // Store the error fact silently inside ref,
      // which we will read in the useEffect below.
      if (errorHandledRef.current === false) {
        errorHandledRef.current = { kind: 'pending', error }
      }
      return []
    }

    errorHandledRef.current = false
    return options
  }, [currentGig, lastGigStats, player, band, social, activeEvent])

  // Process any error that happened during post option generation
  useEffect(() => {
    if (
      errorHandledRef.current !== false &&
      errorHandledRef.current.kind === 'pending'
    ) {
      logger.error(
        'PostGig',
        'Failed to generate post options',
        errorHandledRef.current.error
      )
      errorHandledRef.current = { kind: 'handled' } // mark handled

      setPostOptionsError(true)
    }
  }, [postOptions])

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
      })
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
