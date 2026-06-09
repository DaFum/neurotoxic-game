import { useState, useRef, useEffect } from 'react'
import type { MapNode } from '../../types'
import type {
  TravelLogicParams,
  TravelRefsBundle,
  TravelStateBundle,
  TravelSettersBundle
} from './types'

export const useTravelState = (params: TravelLogicParams) => {
  const [isTraveling, setIsTraveling] = useState(false)
  const [travelTarget, setTravelTarget] = useState<MapNode | null>(null)
  const [pendingTravelNode, setPendingTravelNode] = useState<MapNode | null>(
    null
  )

  const travelCompletedRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failsafeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const playerRef = useRef(params.player)
  const bandRef = useRef(params.band)
  const assetsRef = useRef(params.assets)
  const liabilitiesRef = useRef(params.liabilities)
  const socialRef = useRef(params.social)
  const gameMapRef = useRef(params.gameMap)
  const reputationByRegionRef = useRef(params.reputationByRegion)
  const venueBlacklistRef = useRef(params.venueBlacklist ?? [])
  const isTravelingRef = useRef(isTraveling)
  const moveRivalBandRef = useRef(params.moveRivalBand)
  const checkRivalEncounterRef = useRef(params.checkRivalEncounter)
  const pendingTravelNodeRef = useRef(pendingTravelNode)

  isTravelingRef.current = isTraveling
  pendingTravelNodeRef.current = pendingTravelNode

  useEffect(() => {
    playerRef.current = params.player
    bandRef.current = params.band
    assetsRef.current = params.assets
    liabilitiesRef.current = params.liabilities
    socialRef.current = params.social
    gameMapRef.current = params.gameMap
    reputationByRegionRef.current = params.reputationByRegion
    venueBlacklistRef.current = params.venueBlacklist ?? []
    moveRivalBandRef.current = params.moveRivalBand
    checkRivalEncounterRef.current = params.checkRivalEncounter
  }, [
    params.player,
    params.band,
    params.assets,
    params.liabilities,
    params.social,
    params.gameMap,
    params.reputationByRegion,
    params.venueBlacklist,
    params.moveRivalBand,
    params.checkRivalEncounter
  ])

  // Bundle objects must keep a stable identity across renders so consumer
  // hooks (useTravelActions) can list `refs`/`setters` in dependency arrays
  // without churning their callbacks. Every member is itself stable (useRef
  // objects, useState setters), so capturing the bundle once is safe.
  const refs = useRef<TravelRefsBundle>({
    isTravelingRef,
    travelCompletedRef,
    pendingTravelNodeRef,
    pendingTimeoutRef,
    failsafeTimeoutRef,
    timeoutRef,
    playerRef,
    bandRef,
    assetsRef,
    liabilitiesRef,
    socialRef,
    gameMapRef,
    reputationByRegionRef,
    venueBlacklistRef,
    moveRivalBandRef,
    checkRivalEncounterRef
  }).current

  const setters = useRef<TravelSettersBundle>({
    setIsTraveling,
    setTravelTarget,
    setPendingTravelNode
  }).current

  return {
    refs,
    state: {
      isTraveling,
      travelTarget,
      pendingTravelNode
    } as TravelStateBundle,
    setters
  }
}
