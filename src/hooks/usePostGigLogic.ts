import { useState, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { logger } from '../utils/logger'
import { usePostGigHandlers } from './usePostGigHandlers'
import {
  calculatePerformanceScore,
  deriveGigContext,
  deriveFinancials,
  derivePostOptions
} from '../utils/postGigUtils'
import { deriveCityTraits, getCityKeyFromVenueId } from '../utils/mapGenerator'
import type { PostResult } from '../types'
import type { BrandDeal } from '../types/social'

export type PostOptionsErrorState =
  | { kind: 'idle' }
  | { kind: 'pending'; error: unknown }
  | { kind: 'handled' }

const POST_OPTIONS_ERROR_IDLE: PostOptionsErrorState = { kind: 'idle' }

export const usePostGigLogic = () => {
  const { t } = useTranslation(['ui'])
  const currentGig = useGameSelector(state => state.currentGig)
  const player = useGameSelector(state => state.player)
  const gigModifiers = useGameSelector(state => state.gigModifiers)
  const activeEvent = useGameSelector(state => state.activeEvent)
  const band = useGameSelector(state => state.band)
  const social = useGameSelector(state => state.social)
  const lastGigStats = useGameSelector(state => state.lastGigStats)
  const reputationByRegion = useGameSelector(state => state.reputationByRegion)
  const activeStoryFlags = useGameSelector(state => state.activeStoryFlags)
  const cityStates = useGameSelector(state => state.cityStates)
  const setlist = useGameSelector(state => state.setlist)
  const {
    updatePlayer,
    triggerEvent,
    updateBand,
    updateSocial,
    addToast,
    changeScene,
    unlockTrait,
    addQuest
  } = useGameActions()

  const [phase, setPhase] = useState('REPORT') // REPORT, SOCIAL, DEALS, COMPLETE
  const [postResult, setPostResult] = useState<PostResult | null>(null)
  const [brandOffers, setBrandOffers] = useState<BrandDeal[]>([])
  const [postOptionsError, setPostOptionsError] = useState(false)
  const errorHandledRef = useRef<PostOptionsErrorState>(POST_OPTIONS_ERROR_IDLE)

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

  const perfScore = useMemo(
    () => calculatePerformanceScore(lastGigStats?.score ?? 0),
    [lastGigStats]
  )

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
  const financials = useMemo(() => {
    const cityKey = getCityKeyFromVenueId(currentGig?.id ?? '')
    const cityTraits =
      cityKey === ''
        ? undefined
        : (cityStates?.[cityKey] ?? deriveCityTraits(cityKey))

    return deriveFinancials({
      currentGig,
      lastGigStats,
      perfScore,
      gigModifiers,
      bandInventory: band.inventory,
      bandMerchPrices: band.merchPrices,
      player,
      social,
      reputationByRegion,
      activeStoryFlags,
      gigContext: gigContextRef.current,
      cityTraits
    })
  }, [
    currentGig,
    lastGigStats,
    perfScore,
    gigModifiers,
    band.inventory,
    band.merchPrices,
    player,
    social,
    reputationByRegion,
    activeStoryFlags,
    cityStates
  ])

  // Derive post options purely without triggering a re-render loop
  const { options: postOptions, error: postOptionsDerivationError } =
    useMemo(() => {
      return derivePostOptions({
        currentGig,
        lastGigStats,
        player,
        band,
        social,
        activeEvent
      })
    }, [currentGig, lastGigStats, player, band, social, activeEvent])

  // Store the error fact silently inside ref, which we will read in the next useEffect
  useEffect(() => {
    if (postOptionsDerivationError) {
      if (errorHandledRef.current.kind === 'idle') {
        errorHandledRef.current = {
          kind: 'pending',
          error: postOptionsDerivationError
        }
      }
    } else {
      errorHandledRef.current = POST_OPTIONS_ERROR_IDLE
    }
  }, [postOptionsDerivationError])

  // Process any error that happened during post option generation
  useEffect(() => {
    if (errorHandledRef.current.kind === 'pending') {
      logger.error(
        'PostGig',
        'Failed to generate post options',
        errorHandledRef.current.error
      )
      errorHandledRef.current = { kind: 'handled' } // mark handled

      setPostOptionsError(true)
    }
  }, [postOptionsDerivationError])

  // Handle post options generation error side effects purely in an effect
  useEffect(() => {
    if (postOptionsError) {
      const fallbackMsg = t('ui:postGig.socialOptionsUnavailable')

      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setPostResult({
        type: 'ERROR',
        success: false,
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
