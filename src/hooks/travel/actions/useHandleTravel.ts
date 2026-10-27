import { useCallback } from 'react'
import i18n from '../../../i18n'
import type { MapNode } from '../../../types'
import { logger } from '../../../utils/logger'
import { formatCurrency, formatNumber } from '../../../utils/numberUtils'
import { handleError } from '../../../utils/errorHandler'
import { VENUES_BY_ID } from '../../../data/venues'
import { isGigNode, resolveArrivalNode } from '../../../utils/arrivalUtils'
import { finiteNumberOr } from '../../../utils/gameState'
import { getActiveAssetModifiers } from '../../../utils/assets/assetSelectors'
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
  const { addToast, onShowHQ, onShowSupplyStop } = params

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

      // A reloaded save keeps only `venueId`. Expedition supply, rest and
      // special stops host no gig and carry no venue at all, so only a node
      // that books a gig needs one.
      const venue = node
        ? (node.venue ??
          resolveTravelVenue(node.venueId, VENUES_BY_ID) ??
          undefined)
        : undefined
      if (!node || (!venue && isGigNode(node))) {
        addToast(
          i18n.t('ui:travel.errors.invalidLocation', {
            defaultValue: 'Error: Invalid location.'
          }),
          'error'
        )
        return
      }
      const locationName = venue
        ? getLocationName(venue.name, normalizeVenueId(venue))
        : i18n.t(`ui:expedition.node.class.${node.type}`, {
            defaultValue: i18n.t('ui:map.unknown')
          })

      if (node.id === player.currentNodeId) {
        if (refs.pendingTravelNodeRef.current?.id === node.id) {
          clearPendingTravel()
        }

        // A node a Legendary converted on the move that reached it is not a
        // gig, exactly as arrival treated it; re-entry must not book the show.
        const arrivalNode = resolveArrivalNode(node, node.id, {
          arrivedOverlay: params.expeditionArrivedOverlay
        })
        if (isGigNode(arrivalNode)) {
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

          const resolvedVenue = resolveTravelVenue(venue, VENUES_BY_ID)
          const processedNode = {
            ...node,
            venue: resolvedVenue ?? venue
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
        } else if (node.type === 'SUPPLY_STOP' && onShowSupplyStop) {
          // Arrival opens the shop from transient state a reload drops, and the
          // stock is the node's own persisted `shopInventory`, so reopening it
          // here neither rerolls offers nor replays the arrival day tick.
          onShowSupplyStop(
            Array.isArray(node.shopInventory) ? node.shopInventory : []
          )
        } else {
          addToast(
            i18n.t('ui:travel.currentLocation', {
              defaultValue: 'You are at {{location}}.',
              location: locationName
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
      // The route refuses every move while a Run Draft offer is pending, so
      // starting the leg would only latch `isTraveling` with no scene change.
      if (params.expeditionDraftPending) {
        addToast(
          i18n.t('ui:travel.errors.draftPending', {
            defaultValue: 'Pick a Run Draft trait before hitting the road.'
          }),
          'warning'
        )
        return
      }

      const connected = isConnectedUtil(gameMap, player.currentNodeId, node.id)
      // An Expedition overlay edge (the Nemesis Key's two-step jump) reaches a
      // node the layer rule would still dim; the route authorizes the move, so
      // a connected node is travelable in a run.
      const visibility =
        connected && params.expeditionStatus === 'active'
          ? 'visible'
          : getNodeVisibilityUtil(node.layer, currentLayer)

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

      // `checkTravelPrerequisites` always allows a START node, but during a run
      // the route refuses any move it does not offer, so an unconnected START
      // would latch `isTraveling` with no scene change.
      const preCheck =
        params.expeditionStatus === 'active' && !connected
          ? {
              allowed: false,
              errorKey: 'ui:travel.errors.locationNotConnected',
              defaultMessage: 'Cannot travel: location not connected'
            }
          : checkTravelPrerequisites(node, visibility, connected)
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
        fuelLiters: baseFuelLiters,
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

      // Quote the litres `resolveExpeditionTravelCost` will settle (zero
      // pickups), so the gate neither blocks a feasible leg nor approves one
      // the chassis rules make unaffordable.
      const fuelLiters =
        params.expeditionStatus === 'active'
          ? baseFuelLiters *
            Math.max(0, finiteNumberOr(params.expeditionFuelMultiplier, 1))
          : baseFuelLiters

      // Quoted against spendable cash: the settlement debit cannot cross the
      // run's protected Career Cash, so admitting a leg on the full wallet
      // would start a trip the cash floor then refuses.
      const resourceCheck = checkTravelResources(
        cashRequired,
        fuelLiters,
        player,
        params.expeditionProtectedCash
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
          location: locationName,
          distance: dist,
          travelCost: formatCurrency(totalCost, i18n.language),
          dailyCost: formatCurrency(dailyCost, i18n.language),
          totalCost: formatCurrency(totalCashImpact, i18n.language),
          fuelLiters: formatNumber(fuelLiters, i18n.language, 1)
        }),
        'warning'
      )

      refs.pendingTimeoutRef.current = setTimeout(clearPendingTravel, 5000)
    },
    [
      refs,
      setters,
      addToast,
      params.expeditionStatus,
      params.expeditionDraftPending,
      params.expeditionFuelMultiplier,
      params.expeditionProtectedCash,
      params.expeditionArrivedOverlay,
      onShowHQ,
      onShowSupplyStop,
      startTravelSequence,
      clearPendingTravel,
      getLocationName,
      handleNodeArrivalCallback
    ]
  )
}
