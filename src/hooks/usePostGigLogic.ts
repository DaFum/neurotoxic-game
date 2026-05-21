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
import { normalizeVenueId } from '../utils/mapUtils'
import type { PostResult } from '../types'
import type { BrandDeal } from '../types/social'

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
  const cityStates = useGameSelector(state => state.gameMap?.cityStates)
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
    // Normalize first — legacy/saved venues can carry namespaced IDs like
    // `venues:berlin_so36`, but `gameMap.cityStates` is keyed by the normalized
    // form. Skipping this step misses saved entries on those venues.
    const normalizedVenueId =
      normalizeVenueId(currentGig?.id) ?? currentGig?.id ?? ''
    const cityKey = getCityKeyFromVenueId(normalizedVenueId)
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
    postOptionsDerivationError,
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
