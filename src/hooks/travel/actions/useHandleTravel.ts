import { useCallback } from 'react'
import i18n from '../../../i18n'
import type { MapNode } from '../../../types'
import { logger } from '../../../utils/logger'
import { formatCurrency } from '../../../utils/numberUtils'
import { handleError } from '../../../utils/errorHandler'
import { VENUES_BY_ID } from '../../../data/venues'
import { isGigNode } from '../../../utils/arrivalUtils'
import { getActiveAssetModifiers } from '../../../utils/assetSelectors'
import {
  resolveTravelVenue,
  getNodeAccessStatus,
  checkTravelPrerequisites,
  checkTravelResources,
  calculateTravelCostsAndImpact
} from '../../../utils/travelUtils'
import {
  isConnected as isConnectedUtil,
  getNodeVisibility as getNodeVisibilityUtil,
  normalizeVenueId
} from '../../../utils/mapUtils'
import type { TravelActionsParams } from '../types'

/**
 * Parameters for the useHandleTravel hook.
 *
 * @remarks
 * This interface extends specific properties from the overarching TravelActionsParams
 * and includes callback functions required to execute travel-related logic,
 * formatting, and state synchronization.
 */
interface UseHandleTravelParams extends Pick<
  TravelActionsParams,
  'refs' | 'setters' | 'params'
> {
  /** Retrieves a formatted location string by evaluating venue name and ID. */
  getLocationName: (
    location: string | undefined,
    venueId?: string | null
  ) => string
  /** Invoked upon successful node arrival to process phase transitions or events. */
  handleNodeArrivalCallback: (
    node: MapNode,
    travelEventActive?: boolean
  ) => void
  /** Clears the actively tracked pending travel node state. */
  clearPendingTravel: () => void
  /** Initiates the underlying sequential travel process towards the target node. */
  startTravelSequence: (node: MapNode) => void
}

/**
 * Manages user interactions to initialize, validate, or execute travel onto map nodes.
 *
 * @remarks
 * The travel process incorporates node connectivity verification, financial and fuel
 * requirement checks, and location-specific restrictions (e.g., repeating a gig). When
 * targeting any different accessible node, the user receives an upfront prompt summarizing costs
 * and requires a sequential confirmation click to bypass the pending state, hand off to the tourbus
 * minigame, and defer cost and location finalization until completion.
 *
 * @param params - Configuration mapping for state references, setters, and structural dependencies
 * @returns A memoized callback function receiving a targeted node to process
 */
export const useHandleTravel = ({
  refs,
  setters,
  params,
  getLocationName,
  handleNodeArrivalCallback,
  clearPendingTravel,
  startTravelSequence
}: UseHandleTravelParams) => {
  const { addToast, onShowHQ } = params

  return useCallback(
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

      const accessCheck = getNodeAccessStatus({
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

      const {
        dist,
        totalCost,
        fuelLiters,
        dailyCost,
        totalCashImpact,
        cashRequired
      } = calculateTravelCostsAndImpact(
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
        cashRequired,
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
}
