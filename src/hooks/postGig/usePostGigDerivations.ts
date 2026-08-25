import { useEffect, useMemo, useRef } from 'react'
import {
  calculatePerformanceScore,
  deriveGigContext,
  deriveFinancials,
  derivePostOptions
} from '../../utils/postGig'
import {
  deriveCityTraits,
  getCityKeyFromVenueId
} from '../../utils/mapGenerator'
import { getRegionKeyForLocation, normalizeVenueId } from '../../utils/mapUtils'
import { finiteNumberOr } from '../../utils/finiteNumber'
import { getActiveAssetModifiers } from '../../utils/assetSelectors'
import type {
  GameState,
  Venue,
  PlayerState,
  BandState,
  SocialState,
  GigStats,
  CityTraitState
} from '../../types'

interface UsePostGigDerivationsProps {
  currentGig: Venue | null
  player: PlayerState
  gigModifiers: GameState['gigModifiers']
  activeEvent: GameState['activeEvent']
  band: BandState
  assets: GameState['assets']
  social: SocialState
  lastGigStats: GigStats | null
  reputationByRegion: GameState['reputationByRegion']
  activeStoryFlags: string[]
  activeQuests: GameState['activeQuests']
  cityStates: Record<string, CityTraitState> | undefined
  triggerEvent: (type: string, id: string) => boolean
  isScreenshotMode: boolean
}

/**
 * Derives post-gig performance, financial, and social-post option data.
 *
 * @param props - Completed gig state, reputation context, city traits, assets, and event trigger callback.
 * @returns Performance score, gig context, financial report, social options, and derivation error.
 */
export const usePostGigDerivations = ({
  currentGig,
  player,
  gigModifiers,
  activeEvent,
  band,
  assets,
  social,
  lastGigStats,
  reputationByRegion,
  activeStoryFlags,
  activeQuests,
  cityStates,
  triggerEvent,
  isScreenshotMode
}: UsePostGigDerivationsProps) => {
  const perfScore = useMemo(
    () => calculatePerformanceScore(lastGigStats?.score ?? 0),
    [lastGigStats]
  )

  useEffect(() => {
    if (!currentGig) return

    // `isScreenshotMode` suppresses the roll the same way `usePreGigLogic`
    // does. Without it POSTGIG could never be captured cleanly: entering the
    // scene always drew a random event modal over the report.
    if (!activeEvent && !isScreenshotMode) {
      if (!triggerEvent('financial', 'post_gig')) {
        if (!triggerEvent('special', 'post_gig')) {
          triggerEvent('band', 'post_gig')
        }
      }
    }
  }, [currentGig, activeEvent, triggerEvent, isScreenshotMode])

  const gigContext = useMemo(() => {
    return deriveGigContext(currentGig, social, player)
  }, [currentGig, social, player])

  const assetModifiers = useMemo(
    () => getActiveAssetModifiers(assets),
    [assets]
  )

  const financialSnapshotRef = useRef<{
    currentGig: Venue | null
    lastGigStats: GigStats | null
    financials: ReturnType<typeof deriveFinancials>
  } | null>(null)

  // Freeze the report for this completed gig. Resolving a parallel post-gig
  // event can change player, band, or social state, but must not rewrite the
  // already presented financial result.
  const financials = useMemo(() => {
    const snapshot = financialSnapshotRef.current
    if (
      snapshot?.currentGig === currentGig &&
      snapshot.lastGigStats === lastGigStats
    ) {
      return snapshot.financials
    }

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

    const nextFinancials = deriveFinancials({
      currentGig,
      lastGigStats,
      perfScore,
      gigModifiers,
      bandInventory: band.inventory,
      bandMerchPrices: band.merchPrices,
      bandGigModifier: finiteNumberOr(band.gigModifier, 0),
      player,
      social,
      reputationByRegion,
      activeStoryFlags,
      gigContext,
      cityTraits,
      assetModifiers,
      repeatDemandContext: {
        day: player.day,
        regionId: getRegionKeyForLocation(player.location) ?? 'Unknown',
        regionalGigHistory: social.regionalGigHistory
      }
    })
    return nextFinancials
  }, [
    currentGig,
    lastGigStats,
    perfScore,
    gigModifiers,
    band.inventory,
    band.merchPrices,
    band.gigModifier,
    player,
    social,
    reputationByRegion,
    activeStoryFlags,
    cityStates,
    gigContext,
    assetModifiers
  ])

  useEffect(() => {
    financialSnapshotRef.current = {
      currentGig,
      lastGigStats,
      financials
    }
  }, [currentGig, lastGigStats, financials])

  // Derive post options purely without triggering a re-render loop
  const { options: postOptions, error: postOptionsDerivationError } =
    useMemo(() => {
      return derivePostOptions({
        currentGig,
        lastGigStats,
        player,
        band,
        social,
        activeEvent,
        activeQuests
      })
    }, [
      currentGig,
      lastGigStats,
      player,
      band,
      social,
      activeEvent,
      activeQuests
    ])

  return {
    perfScore,
    financials,
    postOptions,
    postOptionsDerivationError
  }
}
