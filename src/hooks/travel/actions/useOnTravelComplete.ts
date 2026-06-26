import { useCallback } from 'react'
import i18n from '../../../i18n'
import type { MapNode } from '../../../types'
import { handleError, StateError } from '../../../utils/errorHandler'
import { getActiveAssetModifiers } from '../../../utils/assetSelectors'
import {
  calculateTravelCostsAndImpact,
  getTravelArrivalUpdates,
  checkTravelResources
} from '../../../utils/travelUtils'
import { processTravelEvents } from '../../../utils/arrivalUtils'
import type { TravelActionsParams } from '../types'

interface UseOnTravelCompleteParams extends TravelActionsParams {
  handleNodeArrivalCallback: (
    node: MapNode,
    travelEventActive?: boolean
  ) => void
}

export const useOnTravelComplete = ({
  refs,
  state,
  setters,
  params,
  handleNodeArrivalCallback
}: UseOnTravelCompleteParams) => {
  const {
    addToast,
    updatePlayer,
    updateBand,
    advanceDay,
    triggerEvent,
    saveGame
  } = params

  return useCallback(
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

        // Use the same default gig-node policy as the production arrival path
        // (`useArrivalLogic`): skip travel events on GIG/FESTIVAL/FINALE nodes so
        // gig destinations surface their events in PreGig instead. Keep both
        // paths aligned — do not reintroduce `{ includeGigNodes: true }` here.
        const travelEventActive = processTravelEvents(node, triggerEvent)

        refs.moveRivalBandRef.current?.()
        refs.checkRivalEncounterRef.current?.()

        handleNodeArrivalCallback(node, travelEventActive)

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
      saveGame,
      handleNodeArrivalCallback,
      state.travelTarget
    ]
  )
}
