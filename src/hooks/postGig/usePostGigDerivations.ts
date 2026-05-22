import { useEffect, useMemo, useRef } from 'react'
import {
  calculatePerformanceScore,
  deriveGigContext,
  deriveFinancials,
  derivePostOptions
} from '../../utils/postGigUtils'
import {
  deriveCityTraits,
  getCityKeyFromVenueId
} from '../../utils/mapGenerator'
import { normalizeVenueId } from '../../utils/mapUtils'
import type {
  GameState,
  Gig,
  PlayerState,
  BandState,
  SocialState,
  GigStats,
  CityState
} from '../../types'

interface UsePostGigDerivationsProps {
  currentGig: Gig | null
  player: PlayerState
  gigModifiers: GameState['gigModifiers']
  activeEvent: GameState['activeEvent']
  band: BandState
  social: SocialState
  lastGigStats: GigStats | null
  reputationByRegion: GameState['reputationByRegion']
  activeStoryFlags: string[]
  cityStates: Record<string, CityState> | undefined
  triggerEvent: (type: string, id: string) => boolean
}

export const usePostGigDerivations = ({
  currentGig,
  player,
  gigModifiers,
  activeEvent,
  band,
  social,
  lastGigStats,
  reputationByRegion,
  activeStoryFlags,
  cityStates,
  triggerEvent
}: UsePostGigDerivationsProps) => {
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

  return {
    perfScore,
    financials,
    postOptions,
    postOptionsDerivationError
  }
}
