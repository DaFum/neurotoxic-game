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
import { translateLocation } from '../../utils/locationI18n'
import { createTravelCompletedQuestEvent } from '../../quests/producers/travelQuestEvents'
import type { MapNode } from '../../types'
import type { TravelActionsParams } from './types'

const TRAVEL_ANIMATION_TIMEOUT_MS = 1510

export const useTravelActions = ({
  refs,
  state,
  setters,
  params
}: TravelActionsParams) => {
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
        updateBand: params.updateBand,
        updatePlayer: params.updatePlayer,
        triggerEvent: params.triggerEvent,
        startGig: params.startGig,
        addToast: params.addToast,
        onShowHQ: params.onShowHQ,
        onShowSupplyStop: params.onShowSupplyStop,
        eventAlreadyActive: travelEventActive
      })
      if (!result.gigStarted) {
        params.changeScene(result.scene)
      }
    },
    [params, refs.playerRef, refs.bandRef]
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
            addToast: params.addToast,
            fallbackMessage: i18n.t('ui:travel.errors.invalidDestination', {
              defaultValue: 'Error: Invalid destination.'
            })
          }
        )
        return
      }

      const node = target

      try {
        const currentStartNode =
          refs.gameMapRef.current?.nodes[refs.playerRef.current.currentNodeId]
        const { fuelLiters, totalCost } = calculateTravelCostsAndImpact(
          node,
          currentStartNode,
          refs.playerRef.current,
          refs.bandRef.current,
          refs.socialRef.current,
          refs.assetsRef.current,
          refs.liabilitiesRef.current,
          getActiveAssetModifiers(refs.assetsRef.current)
        )

        const updates = getTravelArrivalUpdates({
          player: refs.playerRef.current,
          band: refs.bandRef.current,
          node,
          fuelLiters,
          totalCost,
          assetModifiers: getActiveAssetModifiers(refs.assetsRef.current)
        })

        params.updatePlayer(updates.nextPlayer)
        if (updates.nextBand) {
          params.updateBand(updates.nextBand)
        }
        params.advanceDay()

        const travelEventActive = processTravelEvents(
          node,
          params.triggerEvent,
          {
            includeGigNodes: true
          }
        )

        refs.moveRivalBandRef.current?.()
        refs.checkRivalEncounterRef.current?.()

        handleNodeArrivalCallback(node, travelEventActive)

        if (params.applyQuestEvent) {
          params.applyQuestEvent(
            createTravelCompletedQuestEvent({
              region: refs.playerRef.current.location ?? ''
            })
          )
        }
        params.saveGame(false)
      } catch (error) {
        handleError(error, {
          addToast: params.addToast,
          fallbackMessage: i18n.t('ui:travel.errors.arrivalProcessingFailed', {
            defaultValue: 'An error occurred upon arrival.'
          }),
          context: { targetNodeId: node.id }
        })
      }
    },
    [setters, refs, params, handleNodeArrivalCallback, state.travelTarget]
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
        if (params.onStartTravelMinigame) {
          params.onStartTravelMinigame(node.id)
          return
        }

        refs.travelCompletedRef.current = false
        setters.setIsTraveling(true)
        setters.setTravelTarget(node)

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
          addToast: params.addToast,
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
      params,
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
        params.addToast(
          i18n.t('ui:travel.errors.invalidLocation', {
            defaultValue: 'Error: Invalid location.'
          }),
          'error'
        )
        return
      }

      if (node.id === player.currentNodeId) {
        if (state.pendingTravelNode?.id === node.id) {
          clearPendingTravel()
        }

        if (isGigNode(node)) {
          if (node.id === player.lastGigNodeId) {
            params.addToast(
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
            params.onShowHQ?.()
          } catch (error) {
            handleError(error, {
              addToast: params.addToast,
              fallbackMessage: i18n.t('ui:travel.errors.failedToOpenHq', {
                defaultValue: 'Failed to open HQ.'
              })
            })
          }
        } else {
          params.addToast(
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
        params.addToast(
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
        params.addToast(
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
        params.addToast(
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
      params.addToast(
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
      params,
      refs,
      state,
      startTravelSequence,
      clearPendingTravel,
      getLocationName,
      handleNodeArrivalCallback,
      setters
    ]
  )

  return {
    handleTravel,
    onTravelComplete,
    clearPendingTravel,
    travelCompletedRef: refs.travelCompletedRef
  }
}
