import { useCallback } from 'react'
import i18n from '../../i18n'
import { logger } from '../../utils/logger'
import { formatCurrency } from '../../utils/numberUtils'
import { handleError, StateError } from '../../utils/errorHandler'
import { VENUES_BY_ID } from '../../data/venues'
import {
  handleNodeArrival,
  isGigNode,
  processTravelEvents
} from '../../utils/arrivalUtils'
import {
  resolveTravelVenue,
  checkVenueAccess,
  checkTravelPrerequisites,
  checkTravelResources,
  getLocationName as getLocationNameUtil,
  getTravelArrivalUpdates
} from '../../utils/travelUtils'
import { calculateTravelCostsAndImpact } from '../../utils/travelUtils'
import { getActiveAssetModifiers } from '../../utils/assetSelectors'
import {
  isConnected as isConnectedUtil,
  getNodeVisibility as getNodeVisibilityUtil,
  normalizeVenueId
} from '../../utils/mapUtils'
import { audioService } from '../../utils/audio/audioEngine'
import { translateLocation } from '../../utils/locationI18n'
import { createTravelCompletedQuestEvent } from '../../quests/producers/travelQuestEvents'
import type { MapNode } from '../../types'
import type { TravelActionsParams } from './types'

const TRAVEL_ANIMATION_TIMEOUT_MS = 1510

/**
 * Builds the travel action handlers shared by {@link useTravelLogic}.
 *
 * @remarks
 * Returns three behaviors:
 *
 * - `handleTravel(node)` — validates access, connectivity, and affordability,
 *   then arms a 5s click-to-confirm window; a second call for the same node
 *   starts the trip. Clicking the current node opens HQ, enters a gig, or shows
 *   a location toast instead of traveling.
 * - `startTravelSequence(node)` (internal) — plays the travel SFX and either
 *   delegates to `onStartTravelMinigame` or schedules a failsafe that forces
 *   completion if the travel animation never reports back.
 * - `onTravelComplete(node?)` — the single place arrival costs are applied:
 *   re-checks affordability, deducts money/fuel and regenerates band stats via
 *   `getTravelArrivalUpdates`, advances the day, then runs travel events, rival
 *   movement, and node arrival. Guarded by `travelCompletedRef` so it runs once
 *   per trip.
 *
 * All returned callbacks are referentially stable: the hook destructures the
 * stable callbacks out of `params` and reads live state from `refs`, so it does
 * not depend on the per-render `params`/`state` objects.
 *
 * @returns `{ handleTravel, onTravelComplete, clearPendingTravel, travelCompletedRef }`.
 */
export const useTravelActions = ({
  refs,
  state,
  setters,
  params
}: TravelActionsParams) => {
  // Destructure the stable callbacks from params. The parent supplies these
  // with stable identities, so depending on them individually (instead of the
  // whole `params` object, which changes reference whenever player/band state
  // updates) keeps the returned handlers referentially stable.
  const {
    updatePlayer,
    updateBand,
    advanceDay,
    triggerEvent,
    startGig,
    addToast,
    changeScene,
    onShowHQ,
    onShowSupplyStop,
    onStartTravelMinigame,
    applyQuestEvent,
    saveGame
  } = params

  const getLocationName = useCallback(
    (location: string | undefined, venueId?: string | null) => {
      return getLocationNameUtil(
        location,
        venueId,
        i18n.t.bind(i18n),
        translateLocation
      )
    },
    []
  )

  const handleNodeArrivalCallback = useCallback(
    (node: MapNode, travelEventActive = false) => {
      const result = handleNodeArrival({
        node,
        band: refs.bandRef.current,
        player: refs.playerRef.current,
        updateBand,
        updatePlayer,
        triggerEvent,
        startGig,
        addToast,
        onShowHQ,
        onShowSupplyStop,
        eventAlreadyActive: travelEventActive
      })
      if (!result.gigStarted) {
        changeScene(result.scene)
      }
    },
    [
      refs,
      updateBand,
      updatePlayer,
      triggerEvent,
      startGig,
      addToast,
      onShowHQ,
      onShowSupplyStop,
      changeScene
    ]
  )

  const onTravelComplete = useCallback(
    (explicitNode: MapNode | null = null) => {
      if (refs.travelCompletedRef.current) return
      refs.travelCompletedRef.current = true

      if (refs.failsafeTimeoutRef.current) {
        clearTimeout(refs.failsafeTimeoutRef.current)
        refs.failsafeTimeoutRef.current = null
      }

      const target =
        explicitNode && explicitNode.id ? explicitNode : state.travelTarget

      setters.setIsTraveling(false)
      setters.setTravelTarget(null)
      refs.isTravelingRef.current = false

      if (!target?.venue) {
        handleError(
          new StateError(
            target
              ? 'Target node has no venue data'
              : 'Travel complete but no target'
          ),
          {
            addToast,
            fallbackMessage: i18n.t('ui:travel.errors.invalidDestination', {
              defaultValue: 'Error: Invalid destination.'
            })
          }
        )
        return
      }

      const node = target

      try {
        const player = refs.playerRef.current
        const assets = refs.assetsRef.current
        const assetModifiers = getActiveAssetModifiers(assets)
        const currentStartNode =
          refs.gameMapRef.current?.nodes[player.currentNodeId]

        // Calculate and validate costs at arrival.
        const { fuelLiters, totalCost, totalCashImpact } =
          calculateTravelCostsAndImpact(
            node,
            currentStartNode,
            player,
            refs.bandRef.current,
            refs.socialRef.current,
            assets,
            refs.liabilitiesRef.current,
            assetModifiers
          )

        const resourceCheck = checkTravelResources(
          totalCashImpact,
          fuelLiters,
          player
        )
        if (!resourceCheck.allowed) {
          handleError(new StateError('Insufficient resources upon arrival'), {
            addToast,
            fallbackMessage: i18n.t(
              resourceCheck.errorKey ?? 'ui:travel.errors.invalidDestination',
              {
                defaultValue: 'Error: Insufficient resources upon arrival.'
              }
            )
          })
          return
        }

        // Apply travel costs and travel-only band changes before the day tick
        // so daily passive stamina/mood updates compose with them instead of
        // being overwritten.
        const updates = getTravelArrivalUpdates({
          player,
          band: refs.bandRef.current,
          node,
          fuelLiters,
          totalCost,
          assetModifiers
        })

        updatePlayer(updates.nextPlayer)
        if (updates.nextBand) {
          updateBand(updates.nextBand)
        }
        advanceDay()

        const travelEventActive = processTravelEvents(node, triggerEvent, {
          includeGigNodes: true
        })

        refs.moveRivalBandRef.current?.()
        refs.checkRivalEncounterRef.current?.()

        handleNodeArrivalCallback(node, travelEventActive)

        if (applyQuestEvent) {
          applyQuestEvent(
            createTravelCompletedQuestEvent({
              region: updates.nextPlayer.location ?? ''
            })
          )
        }
        saveGame(false)
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: i18n.t('ui:travel.errors.arrivalProcessingFailed', {
            defaultValue: 'An error occurred upon arrival.'
          }),
          context: { targetNodeId: node.id }
        })
      }
    },
    [
      setters,
      refs,
      addToast,
      triggerEvent,
      updatePlayer,
      updateBand,
      advanceDay,
      applyQuestEvent,
      saveGame,
      handleNodeArrivalCallback,
      state.travelTarget
    ]
  )

  const clearPendingTravel = useCallback(() => {
    if (refs.pendingTimeoutRef.current) {
      clearTimeout(refs.pendingTimeoutRef.current)
      refs.pendingTimeoutRef.current = null
    }
    setters.setPendingTravelNode(null)
    refs.pendingTravelNodeRef.current = null
  }, [setters, refs])

  const startTravelSequence = useCallback(
    (node: MapNode) => {
      clearPendingTravel()

      if (!refs.gameMapRef.current) return

      try {
        refs.travelCompletedRef.current = false
        setters.setIsTraveling(true)
        setters.setTravelTarget(node)

        audioService
          .ensureAudioContext()
          .then(isReady => {
            if (!isReady) {
              logger.warn('TravelLogic', 'Travel audio context unavailable')
              return
            }
            try {
              audioService.playSFX('travel')
            } catch (error) {
              logger.warn('TravelLogic', 'Travel SFX playback failed', error)
            }
          })
          .catch(error => {
            logger.warn('TravelLogic', 'ensureAudioContext failed', error)
          })

        if (onStartTravelMinigame) {
          onStartTravelMinigame(node.id)
          return
        }

        refs.failsafeTimeoutRef.current = setTimeout(() => {
          if (!refs.travelCompletedRef.current) {
            logger.warn(
              'TravelLogic',
              'Travel animation failsafe triggered. Forcing completion.'
            )
            onTravelComplete(node)
          }
        }, TRAVEL_ANIMATION_TIMEOUT_MS)
      } catch (error) {
        handleError(error, {
          addToast,
          fallbackMessage: i18n.t('ui:travel.errors.startFailed', {
            defaultValue: 'Failed to start travel sequence.'
          }),
          context: { node }
        })
        setters.setIsTraveling(false)
        setters.setTravelTarget(null)
      }
    },
    [
      clearPendingTravel,
      setters,
      refs,
      onStartTravelMinigame,
      addToast,
      onTravelComplete
    ]
  )

  const handleTravel = useCallback(
    (node: MapNode) => {
      if (refs.isTravelingRef.current) return

      const player = refs.playerRef.current
      const band = refs.bandRef.current
      const assets = refs.assetsRef.current
      const liabilities = refs.liabilitiesRef.current
      const assetModifiers = getActiveAssetModifiers(assets)
      const social = refs.socialRef.current
      const gameMap = refs.gameMapRef.current

      if (!node?.venue) {
        addToast(
          i18n.t('ui:travel.errors.invalidLocation', {
            defaultValue: 'Error: Invalid location.'
          }),
          'error'
        )
        return
      }

      if (node.id === player.currentNodeId) {
        if (refs.pendingTravelNodeRef.current?.id === node.id) {
          clearPendingTravel()
        }

        if (isGigNode(node)) {
          if (node.id === player.lastGigNodeId) {
            addToast(
              i18n.t('ui:travel.errors.alreadyPlayedHere', {
                defaultValue:
                  'You just played a gig here! Hit the road and find a new crowd.'
              }),
              'warning'
            )
            return
          }

          const resolvedVenue = resolveTravelVenue(node.venue, VENUES_BY_ID)
          const processedNode = {
            ...node,
            venue: resolvedVenue ?? node.venue
          }
          handleNodeArrivalCallback(processedNode, false)
        } else if (node.type === 'START') {
          try {
            onShowHQ?.()
          } catch (error) {
            handleError(error, {
              addToast,
              fallbackMessage: i18n.t('ui:travel.errors.failedToOpenHq', {
                defaultValue: 'Failed to open HQ.'
              })
            })
          }
        } else {
          addToast(
            i18n.t('ui:travel.currentLocation', {
              defaultValue: 'You are at {{location}}.',
              location: getLocationName(
                node.venue.name,
                normalizeVenueId(node.venue)
              )
            }),
            'info'
          )
        }
        return
      }

      logger.info('TravelLogic', 'handleTravel initiated', {
        target: node.id,
        current: player.currentNodeId
      })

      const currentStartNode = gameMap?.nodes[player.currentNodeId]
      const currentLayer = currentStartNode?.layer ?? 0
      const visibility = getNodeVisibilityUtil(node.layer, currentLayer)

      const accessCheck = checkVenueAccess({
        node,
        player,
        reputationByRegion: refs.reputationByRegionRef.current,
        venueBlacklist: refs.venueBlacklistRef.current,
        venuesMap: VENUES_BY_ID,
        getLocationName
      })

      if (!accessCheck.allowed) {
        addToast(
          i18n.t(accessCheck.errorKey ?? 'ui:travel.errors.invalidLocation', {
            defaultValue:
              accessCheck.defaultMessage ?? 'Error: Invalid location.',
            ...accessCheck.errorContext
          }),
          'error'
        )
        if (refs.pendingTravelNodeRef.current?.id === node.id)
          clearPendingTravel()
        return
      }

      const preCheck = checkTravelPrerequisites(
        node,
        visibility,
        isConnectedUtil(gameMap, player.currentNodeId, node.id)
      )
      if (!preCheck.allowed) {
        addToast(
          i18n.t(preCheck.errorKey ?? 'ui:travel.errors.locationNotConnected', {
            defaultValue:
              preCheck.defaultMessage ?? 'Cannot travel: location not connected'
          }),
          'warning'
        )
        return
      }

      const { dist, totalCost, fuelLiters, dailyCost, totalCashImpact } =
        calculateTravelCostsAndImpact(
          node,
          currentStartNode,
          player,
          band,
          social,
          assets,
          liabilities,
          assetModifiers
        )

      const resourceCheck = checkTravelResources(
        totalCashImpact,
        fuelLiters,
        player
      )
      if (!resourceCheck.allowed) {
        addToast(
          i18n.t(
            resourceCheck.errorKey ??
              'ui:travel.errors.notEnoughMoneyForTravel',
            {
              defaultValue:
                resourceCheck.defaultMessage ??
                'Not enough money for gas and food!'
            }
          ),
          'error'
        )
        if (refs.pendingTravelNodeRef.current?.id === node.id)
          clearPendingTravel()
        return
      }

      if (refs.pendingTravelNodeRef.current?.id === node.id) {
        startTravelSequence(node)
        return
      }

      clearPendingTravel()
      setters.setPendingTravelNode(node)
      refs.pendingTravelNodeRef.current = node
      addToast(
        i18n.t('ui:travel.confirmTravelPrompt', {
          defaultValue:
            '{{location}} ({{distance}}km) | Travel Costs: {{travelCost}} | Daily Upkeep: {{dailyCost}} | Total Cash Impact: {{totalCost}} | Fuel: {{fuelLiters}}L — Click again to confirm',
          location: getLocationName(
            node.venue.name,
            normalizeVenueId(node.venue)
          ),
          distance: dist,
          travelCost: formatCurrency(totalCost, i18n.language),
          dailyCost: formatCurrency(dailyCost, i18n.language),
          totalCost: formatCurrency(totalCashImpact, i18n.language),
          fuelLiters: fuelLiters.toFixed(1)
        }),
        'warning'
      )

      refs.pendingTimeoutRef.current = setTimeout(() => {
        setters.setPendingTravelNode(null)
        refs.pendingTravelNodeRef.current = null
        refs.pendingTimeoutRef.current = null
      }, 5000)
    },
    [
      refs,
      setters,
      addToast,
      onShowHQ,
      startTravelSequence,
      clearPendingTravel,
      getLocationName,
      handleNodeArrivalCallback
    ]
  )

  return {
    handleTravel,
    onTravelComplete,
    clearPendingTravel,
    travelCompletedRef: refs.travelCompletedRef
  }
}
