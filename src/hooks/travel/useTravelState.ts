import { useState, useRef, useEffect, useCallback } from 'react'
import type { MapNode } from '../../types'
import type {
  TravelLogicParams,
  TravelPhase,
  TravelRefsBundle,
  TravelStateBundle,
  TravelSettersBundle
} from './types'

/**
 * Owns the travel hook's React state, refs, and setters.
 *
 * @remarks
 * Initializes the `phase` state machine, the timeout refs,
 * and the param-mirror refs (kept in sync via effects).
 * The returned `refs` and `setters` bundles are wrapped in
 * `useRef` so they hold a stable object identity, letting consumer hooks list
 * them in dependency arrays without re-creating their callbacks every render.
 *
 * @param params - Game state slices to mirror into refs.
 * @returns `{ refs, state, setters }` — the shared ref bundle (stable),
 * the reactive state snapshot, and the state setters (stable).
 */
export const useTravelState = (params: TravelLogicParams) => {
  const [phase, setPhase] = useState<TravelPhase>({ status: 'idle' })
  const phaseRef = useRef<TravelPhase>(phase)
  phaseRef.current = phase

  const isTraveling = phase.status === 'traveling'
  const pendingTravelNode = phase.status === 'confirming' ? phase.node : null

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingToastIdRef = useRef<string | null>(null)

  const playerRef = useRef(params.player)
  const bandRef = useRef(params.band)
  const assetsRef = useRef(params.assets)
  const liabilitiesRef = useRef(params.liabilities)
  const socialRef = useRef(params.social)
  const gameMapRef = useRef(params.gameMap)
  const reputationByRegionRef = useRef(params.reputationByRegion)
  const venueBlacklistRef = useRef(params.venueBlacklist ?? [])
  const isTravelingRef = useRef(isTraveling)
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
  }, [
    params.player,
    params.band,
    params.assets,
    params.liabilities,
    params.social,
    params.gameMap,
    params.reputationByRegion,
    params.venueBlacklist
  ])

  const setPhaseWrapper = useCallback<
    React.Dispatch<React.SetStateAction<TravelPhase>>
  >(action => {
    if (typeof action !== 'function') {
      phaseRef.current = action
      isTravelingRef.current = action.status === 'traveling'
      pendingTravelNodeRef.current =
        action.status === 'confirming' ? action.node : null
    }
    setPhase(prev => {
      const next = typeof action === 'function' ? action(prev) : action
      phaseRef.current = next
      isTravelingRef.current = next.status === 'traveling'
      pendingTravelNodeRef.current =
        next.status === 'confirming' ? next.node : null
      return next
    })
  }, [])

  const setIsTraveling = useCallback<
    React.Dispatch<React.SetStateAction<boolean>>
  >(
    action => {
      if (typeof action === 'boolean') {
        isTravelingRef.current = action
      }
      setPhaseWrapper(prev => {
        const nextTraveling =
          typeof action === 'function'
            ? action(prev.status === 'traveling')
            : action
        if (nextTraveling) {
          if (prev.status === 'traveling') {
            return prev
          }
          return {
            status: 'traveling',
            targetNodeId: prev.status === 'confirming' ? prev.node.id : '',
            timeoutId: null
          }
        }
        if (prev.status === 'idle') {
          return prev
        }
        return { status: 'idle' }
      })
    },
    [setPhaseWrapper]
  )

  const setPendingTravelNode = useCallback<
    React.Dispatch<React.SetStateAction<MapNode | null>>
  >(
    action => {
      if (typeof action !== 'function') {
        pendingTravelNodeRef.current = action
      }
      setPhaseWrapper(prev => {
        const prevNode = prev.status === 'confirming' ? prev.node : null
        const nextNode =
          typeof action === 'function' ? action(prevNode) : action
        if (nextNode) {
          return {
            status: 'confirming',
            node: nextNode,
            toastId: prev.status === 'confirming' ? prev.toastId : null,
            timeoutId: prev.status === 'confirming' ? prev.timeoutId : null
          }
        }
        if (prev.status === 'confirming') {
          return { status: 'idle' }
        }
        return prev
      })
    },
    [setPhaseWrapper]
  )

  // Bundle objects must keep a stable identity across renders so consumer
  // hooks (useTravelActions) can list `refs`/`setters` in dependency arrays
  // without churning their callbacks. Every member is itself stable (useRef
  // objects, useState setters), so capturing the bundle once is safe.
  const refs = useRef<TravelRefsBundle>({
    phaseRef,
    isTravelingRef,
    pendingTravelNodeRef,
    pendingTimeoutRef,
    pendingToastIdRef,
    timeoutRef,
    playerRef,
    bandRef,
    assetsRef,
    liabilitiesRef,
    socialRef,
    gameMapRef,
    reputationByRegionRef,
    venueBlacklistRef
  }).current

  const setters = useRef<TravelSettersBundle>({
    setPhase: setPhaseWrapper,
    setIsTraveling,
    setPendingTravelNode
  }).current

  return {
    refs,
    state: {
      phase,
      isTraveling,
      pendingTravelNode
    } as TravelStateBundle,
    setters
  }
}
