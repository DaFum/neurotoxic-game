/**
 * Travel Logic Hook
 * Encapsulates all travel-related state and logic for the Overworld scene.
 * @module useTravelLogic
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  calculateTravelExpenses,
  EXPENSE_CONSTANTS
} from '../utils/economyEngine'
import { audioManager } from '../utils/AudioManager'
import { logger } from '../utils/logger'
import { handleError, StateError } from '../utils/errorHandler'

/**
 * Failsafe timeout duration in milliseconds
 * Travel animation duration (1500ms) + buffer (10ms)
 * @constant {number}
 */
const TRAVEL_ANIMATION_TIMEOUT_MS = 1510

/**
 * Custom hook for managing travel state and logic
 * @param {Object} params - Hook parameters
 * @param {Object} params.player - Player state
 * @param {Object} params.band - Band state
 * @param {Object} params.gameMap - Game map data
 * @param {Function} params.updatePlayer - Player update function
 * @param {Function} params.updateBand - Band update function
 * @param {Function} params.saveGame - Function to save game state
 * @param {Function} params.advanceDay - Day advancement function
 * @param {Function} params.triggerEvent - Event trigger function
 * @param {Function} params.startGig - Gig start function
 * @param {Function} params.hasUpgrade - Upgrade check function
 * @param {Function} params.addToast - Toast notification function
 * @param {Function} params.changeScene - Scene change function
 * @param {Function} [params.onShowHQ] - Callback when HQ should be shown
 * @returns {Object} Travel state and handlers
 */
export const useTravelLogic = ({
  player,
  band,
  gameMap,
  updatePlayer,
  updateBand,
  saveGame,
  advanceDay,
  triggerEvent,
  startGig,
  hasUpgrade,
  addToast,
  changeScene,
  onShowHQ
}) => {
  const [isTraveling, setIsTraveling] = useState(false)
  const [travelTarget, setTravelTarget] = useState(null)
  const travelCompletedRef = useRef(false)
  const timeoutRef = useRef(null)
  const failsafeTimeoutRef = useRef(null)

  /**
   * Gets the current node from the map
   * @returns {Object|null} Current node or null
   */
  const getCurrentNode = useCallback(() => {
    return gameMap?.nodes[player.currentNodeId] ?? null
  }, [gameMap, player.currentNodeId])

  /**
   * Checks if a target node is connected to the current node
   * @param {string} targetNodeId - Target node ID
   * @returns {boolean} True if connected
   */
  const isConnected = useCallback(
    targetNodeId => {
      if (!gameMap) return false
      const connections = gameMap.connections.filter(
        c => c.from === player.currentNodeId
      )
      return connections.some(c => c.to === targetNodeId)
    },
    [gameMap, player.currentNodeId]
  )

  /**
   * Determines the visibility state of a node based on its layer
   * @param {number} nodeLayer - Target node layer
   * @param {number} currentLayer - Current player layer
   * @returns {string} 'visible', 'dimmed', or 'hidden'
   */
  const getNodeVisibility = useCallback((nodeLayer, currentLayer) => {
    if (nodeLayer <= currentLayer + 1) return 'visible'
    if (nodeLayer === currentLayer + 2) return 'dimmed'
    return 'hidden'
  }, [])

  /**
   * Handles logic when arriving at a node
   * @param {Object} node - Arrived node
   */
  const handleNodeArrival = useCallback(
    node => {
      switch (node.type) {
        case 'REST_STOP': {
          const newMembers = (band?.members ?? []).map(m => ({
            ...m,
            stamina: Math.min(100, Math.max(0, m.stamina + 20)),
            mood: Math.min(100, Math.max(0, m.mood + 10))
          }))
          updateBand({ members: newMembers })
          addToast('Rested at stop. Band feels better.', 'success')
          break
        }
        case 'SPECIAL': {
          const specialEvent = triggerEvent('special')
          if (!specialEvent) {
            addToast('A mysterious place, but nothing happened.', 'info')
          }
          break
        }
        case 'START': {
          onShowHQ?.()
          addToast('Home Sweet Home.', 'success')
          break
        }
        default: {
          // GIG node
          if ((band?.harmony ?? 0) <= 0) {
            addToast("Band's harmony too low to perform!", 'warning')
            return
          }
          logger.info('TravelLogic', 'Starting Gig at destination', {
            venue: node.venue.name
          })
          try {
            startGig(node.venue)
          } catch (error) {
            handleError(error, {
              addToast,
              fallbackMessage: 'Failed to start Gig.'
            })
          }
        }
      }
    },
    [band, updateBand, triggerEvent, startGig, addToast, onShowHQ]
  )

  /**
   * Callback executed when travel animation completes
   * @param {Object} [explicitNode] - Explicit target node (bypasses state)
   */
  const onTravelComplete = useCallback(
    (explicitNode = null) => {
      const target =
        explicitNode && explicitNode.id ? explicitNode : travelTarget

      logger.info('TravelLogic', 'onTravelComplete triggered', {
        travelCompleted: travelCompletedRef.current,
        hasTarget: !!target,
        targetId: target?.id
      })

      if (travelCompletedRef.current) return
      travelCompletedRef.current = true

      if (!target) {
        handleError(new StateError('Travel complete but no target'), {
          addToast,
          fallbackMessage: 'Error: Invalid destination.'
        })
        setIsTraveling(false)
        return
      }

      if (!target.venue) {
        handleError(new StateError('Target node has no venue data'), {
          addToast,
          fallbackMessage: 'Error: Invalid destination.'
        })
        setIsTraveling(false)
        return
      }

      const node = target
      const currentStartNode = gameMap?.nodes[player.currentNodeId]

      // Calculate and validate costs
      const { fuelLiters, totalCost } = calculateTravelExpenses(
        node,
        currentStartNode,
        { van: player.van }
      )

      // Affordability check
      if (
        (player.money ?? 0) < totalCost ||
        (player.van?.fuel ?? 0) < fuelLiters
      ) {
        addToast('Error: Insufficient resources upon arrival.', 'error')
        setIsTraveling(false)
        setTravelTarget(null)
        return
      }

      // Apply travel costs
      updatePlayer({
        money: Math.max(0, (player.money ?? 0) - totalCost),
        van: {
          ...player.van,
          fuel: Math.max(0, (player.van?.fuel ?? 0) - fuelLiters)
        },
        location: node.venue.name,
        currentNodeId: node.id
      })
      advanceDay()

      // Autosave
      if (saveGame) {
        saveGame()
      }

      // Sound system upgrade bonus
      if (hasUpgrade('van_sound_system')) {
        updateBand({ harmony: Math.min(100, (band?.harmony ?? 0) + 5) })
      }

      setIsTraveling(false)
      setTravelTarget(null)

      // Trigger events and handle node types
      const eventHappened = triggerEvent('transport', 'travel')
      if (!eventHappened) {
        const bandEvent = triggerEvent('band', 'travel')
        if (!bandEvent) {
          handleNodeArrival(node)
        }
      }
    },
    [
      travelTarget,
      player,
      band,
      gameMap,
      hasUpgrade,
      updatePlayer,
      updateBand,
      saveGame,
      triggerEvent,
      advanceDay,
      addToast,
      handleNodeArrival
    ]
  )

  /**
   * Initiates travel to a selected node
   * @param {Object} node - Target node
   */
  const handleTravel = useCallback(
    node => {
      // Early interaction block if already traveling
      if (isTraveling) return

      if (!node?.venue) {
        addToast('Error: Invalid location.', 'error')
        return
      }

      if (node.id === player.currentNodeId) {
        logger.info(
          'TravelLogic',
          'Ignoring redundant travel to current node',
          {
            target: node.id
          }
        )

        // If it's the current node, trigger the interaction logic but DO NOT start travel
        if (node.type === 'GIG') {
          if ((band?.harmony ?? 0) <= 0) {
            addToast("Band's harmony too low to perform!", 'warning')
            return
          }
          logger.info('TravelLogic', 'Entering current node Gig', {
            venue: node.venue.name
          })
          try {
            startGig(node.venue)
          } catch (error) {
            handleError(error, {
              addToast,
              fallbackMessage: 'Failed to enter Gig.'
            })
          }
        } else if (node.type === 'START') {
          try {
            onShowHQ?.()
          } catch (error) {
            handleError(error, {
              addToast,
              fallbackMessage: 'Failed to open HQ.'
            })
          }
        } else {
          addToast(`You are at ${node.venue.name}.`, 'info')
        }
        return
      }

      logger.info('TravelLogic', 'handleTravel initiated', {
        target: node.id,
        current: player.currentNodeId
      })

      const currentStartNode = gameMap?.nodes[player.currentNodeId]
      const currentLayer = currentStartNode?.layer || 0
      const visibility = getNodeVisibility(node.layer, currentLayer)

      // Allow travel to START node from anywhere if connected, bypassing standard layer/visibility rules if needed.
      // This ensures "Return to HQ" is possible if valid connection exists, even if layer logic implies "forward only".
      if (node.type === 'START') {
        // Always allow returning to HQ regardless of connections or visibility
      } else if (visibility !== 'visible' || !isConnected(node.id)) {
        addToast(
          visibility !== 'visible'
            ? 'Cannot travel: location not visible'
            : 'Cannot travel: location not connected',
          'warning'
        )
        return
      }

      // Calculate costs
      const { dist, totalCost, fuelLiters } = calculateTravelExpenses(
        node,
        currentStartNode,
        { van: player.van }
      )

      addToast(
        `Travel to ${node.venue.name} (${dist}km)? Cost: ${totalCost}€`,
        'info'
      )

      if (Math.max(0, player.money ?? 0) < totalCost) {
        addToast('Not enough money for gas and food!', 'error')
        return
      }

      if (Math.max(0, player.van?.fuel ?? 0) < fuelLiters) {
        addToast('Not enough fuel in the tank!', 'error')
        return
      }

      // Start travel sequence
      travelCompletedRef.current = false
      setTravelTarget(node)
      setIsTraveling(true)

      try {
        audioManager.playSFX('travel')
      } catch (e) {
        // Ignore audio errors
      }

      // Failsafe timeout - store in ref for cleanup
      if (failsafeTimeoutRef.current) {
        clearTimeout(failsafeTimeoutRef.current)
      }
      failsafeTimeoutRef.current = window.setTimeout(() => {
        if (!travelCompletedRef.current) {
          onTravelComplete(node)
        }
        failsafeTimeoutRef.current = null
      }, TRAVEL_ANIMATION_TIMEOUT_MS)
    },
    [
      player,
      gameMap,
      isTraveling,
      isConnected,
      getNodeVisibility,
      startGig,
      addToast,
      onShowHQ,
      onTravelComplete,
      band?.harmony
    ]
  )

  /**
   * Handles refueling the van
   */
  const handleRefuel = useCallback(() => {
    if (isTraveling) return

    const currentFuel = player.van?.fuel ?? 0
    const missing = EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL - currentFuel

    if (missing <= 0) {
      addToast('Tank is already full!', 'info')
      return
    }

    const cost = Math.ceil(missing * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE)

    if ((player.money ?? 0) < cost) {
      addToast(`Not enough money! Need ${cost}€ to fill up.`, 'error')
      return
    }

    updatePlayer({
      money: Math.max(0, (player.money ?? 0) - cost),
      van: { ...player.van, fuel: EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL }
    })
    addToast(`Refueled: -${cost}€`, 'success')

    try {
      audioManager.playSFX('cash')
    } catch (e) {
      // Ignore audio errors
    }
  }, [player, isTraveling, updatePlayer, addToast])

  /**
   * Handles repairing the van
   */
  const handleRepair = useCallback(() => {
    if (isTraveling) return

    const currentCondition = player.van?.condition ?? 100
    const missing = 100 - currentCondition

    if (missing <= 0) {
      addToast('Van is already in perfect condition!', 'info')
      return
    }

    const cost = Math.ceil(
      missing * EXPENSE_CONSTANTS.TRANSPORT.REPAIR_COST_PER_UNIT
    )

    if ((player.money ?? 0) < cost) {
      addToast(`Not enough money! Need ${cost}€ to repair.`, 'error')
      return
    }

    updatePlayer({
      money: Math.max(0, (player.money ?? 0) - cost),
      van: { ...player.van, condition: 100 }
    })
    addToast(`Repaired: -${cost}€`, 'success')

    try {
      audioManager.playSFX('cash')
    } catch (e) {
      // Ignore audio errors
    }
  }, [player, isTraveling, updatePlayer, addToast])

  // Softlock detection effect
  useEffect(() => {
    if (!gameMap || isTraveling || !player.currentNodeId) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    const currentFuel = player.van?.fuel ?? 0
    const currentNode = gameMap.nodes[player.currentNodeId]
    const neighbors = gameMap.connections
      .filter(c => c.from === player.currentNodeId)
      .map(c => gameMap.nodes[c.to])

    const canReachAny = neighbors.some(n => {
      if (!n) return false
      const { fuelLiters } = calculateTravelExpenses(
        n,
        gameMap.nodes[player.currentNodeId],
        { van: player.van }
      )
      return currentFuel >= fuelLiters
    })

    if (!canReachAny && currentNode?.type !== 'GIG') {
      const currentFuelClamped = Math.max(0, currentFuel)
      const missingFuel =
        EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL - currentFuelClamped
      const refuelCost = Math.ceil(
        missingFuel * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE
      )
      const playerMoneyClamped = Math.max(0, player.money ?? 0)

      if (playerMoneyClamped < refuelCost) {
        if (!timeoutRef.current) {
          logger.error('TravelLogic', 'GAME OVER: Stranded')
          addToast(
            'GAME OVER: Stranded! Cannot travel and cannot afford fuel.',
            'error'
          )
          timeoutRef.current = setTimeout(() => changeScene('GAMEOVER'), 3000)
        }
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [player, gameMap, isTraveling, changeScene, addToast])

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (failsafeTimeoutRef.current) {
        clearTimeout(failsafeTimeoutRef.current)
        failsafeTimeoutRef.current = null
      }
    }
  }, [])

  return {
    // State
    isTraveling,
    travelTarget,

    // Computed
    getCurrentNode,
    isConnected,
    getNodeVisibility,

    // Actions
    handleTravel,
    handleRefuel,
    handleRepair,
    onTravelComplete,
    travelCompletedRef
  }
}
