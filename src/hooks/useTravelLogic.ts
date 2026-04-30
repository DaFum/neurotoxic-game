/*
 * (#1) Actual Updates: Refactored logic to reduce cognitive complexity and improve testability. Extracted pure logic to utils.


 */
/**
 * Travel Logic Hook
 * Encapsulates all travel-related state and logic for the Overworld scene.
 * @module useTravelLogic
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  calculateTravelExpenses,
  calculateRefuelCost,
  calculateRepairCost,
  EXPENSE_CONSTANTS
} from '../utils/economyEngine'
import {
  isConnected as isConnectedUtil,
  getNodeVisibility as getNodeVisibilityUtil,
  checkSoftlock,
  normalizeVenueId
} from '../utils/mapUtils'
import {
  resolveVenue,
  getLocationName as getLocationNameUtil,
  checkVenueAccess,
  checkTravelPrerequisites,
  checkTravelResources
} from '../utils/travelUtils'
import {
  handleNodeArrival,
  processTravelEvents,
  isGigNode
} from '../utils/arrivalUtils'
import { audioManager } from '../utils/audio/AudioManager'
import { logger } from '../utils/logger'
import { handleError, StateError } from '../utils/errorHandler'
import { calcBaseBreakdownChance } from '../utils/upgradeUtils'
import i18n from '../i18n'
import { GAME_PHASES } from '../context/gameConstants'
import { clampPlayerMoney } from '../utils/gameStateUtils'
import { translateLocation } from '../utils/locationI18n'
import { ALL_VENUES } from '../data/venues'
import { getTravelArrivalUpdates } from '../utils/travelUtils'

/**
 * Pre-computed map of venues for O(1) lookups during travel logic
 * @constant {Map<string, Object>}
 */
// OPTIMIZATION: Use for...of to populate Map instead of new Map(array.map(...))
// This avoids intermediate array allocation, reducing memory usage and garbage collection overhead.
const VENUES_MAP = new Map<string, (typeof ALL_VENUES)[number]>()
for (const v of ALL_VENUES) {
  VENUES_MAP.set(v.id, v)
}

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
  addToast,
  changeScene,
  reputationByRegion,
  venueBlacklist = [],
  onShowHQ,
  onStartTravelMinigame
}) => {
  const [isTraveling, setIsTraveling] = useState(false)
  const [travelTarget, setTravelTarget] = useState(null)
  const [pendingTravelNode, setPendingTravelNode] = useState(null)
  const travelCompletedRef = useRef(false)
  const timeoutRef = useRef(null)
  const failsafeTimeoutRef = useRef(null)
  const pendingTimeoutRef = useRef(null)

  // Optimization: Use refs for frequently changing state to prevent handler recreation
  const playerRef = useRef(player)
  const bandRef = useRef(band)
  const gameMapRef = useRef(gameMap)
  const reputationByRegionRef = useRef(reputationByRegion)
  const venueBlacklistRef = useRef(venueBlacklist)
  const isTravelingRef = useRef(isTraveling)
  const pendingTravelNodeRef = useRef(pendingTravelNode)

  // Synchronously update control flow refs to ensure handlers see latest state immediately
  isTravelingRef.current = isTraveling
  pendingTravelNodeRef.current = pendingTravelNode

  useEffect(() => {
    playerRef.current = player
    bandRef.current = band
    gameMapRef.current = gameMap
    reputationByRegionRef.current = reputationByRegion
    venueBlacklistRef.current = venueBlacklist
  }, [player, band, gameMap, reputationByRegion, venueBlacklist])

  const getLocationName = useCallback((location, venueId) => {
    return getLocationNameUtil(
      location,
      venueId,
      i18n.t.bind(i18n),
      translateLocation
    )
  }, [])

  /**
   * Checks if a target node is connected to the current node
   * @param {string} targetNodeId - Target node ID
   * @returns {boolean} True if connected
   */
  const isConnected = useCallback(
    targetNodeId => {
      return isConnectedUtil(gameMap, player.currentNodeId, targetNodeId)
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
    return getNodeVisibilityUtil(nodeLayer, currentLayer)
  }, [])

  /**
   * Handles logic when arriving at a node
   * @param {Object} node - Arrived node
   */
  const handleNodeArrivalCallback = useCallback(
    (node, eventAlreadyActive = false) => {
      handleNodeArrival({
        node,
        band: bandRef.current,
        player: playerRef.current,
        updateBand,
        updatePlayer,
        triggerEvent,
        startGig,
        addToast,
        changeScene,
        onShowHQ,
        eventAlreadyActive
      })
    },
    [
      updateBand,
      updatePlayer,
      triggerEvent,
      startGig,
      addToast,
      onShowHQ,
      changeScene
    ]
  )

  /**
   * Callback executed when travel animation completes
   * @param {Object} [explicitNode] - Explicit target node (bypasses state)
   */
  const onTravelComplete = useCallback(
    (explicitNode = null) => {
      const player = playerRef.current
      const band = bandRef.current
      const gameMap = gameMapRef.current

      const target =
        explicitNode && explicitNode.id ? explicitNode : travelTarget

      logger.info('TravelLogic', 'onTravelComplete triggered', {
        travelCompleted: travelCompletedRef.current,
        hasTarget: !!target,
        targetId: target?.id
      })

      if (travelCompletedRef.current) return
      travelCompletedRef.current = true

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
        setIsTraveling(false)
        isTravelingRef.current = false
        return
      }

      const node = target
      const currentStartNode = gameMap?.nodes[player.currentNodeId]

      // Calculate and validate costs
      const { fuelLiters, totalCost } = calculateTravelExpenses(
        node,
        currentStartNode,
        player,
        band
      )

      // Affordability check
      const resourceCheck = checkTravelResources(totalCost, fuelLiters, player)
      if (!resourceCheck.allowed) {
        addToast(
          i18n.t(resourceCheck.errorKey, {
            defaultValue: 'Error: Insufficient resources upon arrival.'
          }),
          'error'
        )
        setIsTraveling(false)
        isTravelingRef.current = false
        setTravelTarget(null)
        return
      }

      // Apply travel costs
      const updates = getTravelArrivalUpdates({
        player,
        band,
        node,
        fuelLiters,
        totalCost
      })

      updatePlayer(updates.nextPlayer)
      advanceDay()

      // Autosave
      if (saveGame) {
        saveGame()
      }

      // Harmony regen while traveling (enabled by Mobile Studio / van_sound_system)
      if (updates.nextBand) {
        updateBand(updates.nextBand)
      }

      setIsTraveling(false)
      isTravelingRef.current = false
      setTravelTarget(null)

      // Trigger travel events (shown as global modal overlay).
      // Keep legacy behavior: overworld travel to performance nodes still rolls
      // transport/band travel events before node arrival handling.
      let travelEventActive
      if (isGigNode(node)) {
        travelEventActive = triggerEvent('transport', 'travel')
        if (!travelEventActive) {
          travelEventActive = triggerEvent('band', 'travel')
        }
      } else {
        travelEventActive = processTravelEvents(node, triggerEvent)
      }

      // Always handle node arrival regardless of events —
      // gigs must start even when a travel event pops up.
      // Pass flag so SPECIAL nodes don't overwrite an active travel event.
      handleNodeArrivalCallback(node, travelEventActive)
    },
    [
      travelTarget,
      updatePlayer,
      updateBand,
      saveGame,
      triggerEvent,
      advanceDay,
      addToast,
      handleNodeArrivalCallback
    ]
  )

  /**
   * Clears the pending travel confirmation state
   */
  const clearPendingTravel = useCallback(() => {
    setPendingTravelNode(null)
    pendingTravelNodeRef.current = null
    if (pendingTimeoutRef.current) {
      clearTimeout(pendingTimeoutRef.current)
      pendingTimeoutRef.current = null
    }
  }, [])

  /**
   * Starts the actual travel sequence (called after confirmation)
   * @param {Object} node - Target node
   */
  const startTravelSequence = useCallback(
    node => {
      if (isTravelingRef.current) return
      isTravelingRef.current = true
      setIsTraveling(true)

      travelCompletedRef.current = false
      setTravelTarget(node)
      setPendingTravelNode(null)
      pendingTravelNodeRef.current = null

      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current)
        pendingTimeoutRef.current = null
      }

      audioManager
        .ensureAudioContext()
        .then(isReady => {
          if (!isReady) {
            logger.warn('useTravelLogic', 'Travel audio context unavailable')
            return
          }
          try {
            audioManager.playSFX('travel')
          } catch (error) {
            logger.warn('useTravelLogic', 'Travel SFX playback failed', error)
          }
        })
        .catch(error => {
          logger.warn('useTravelLogic', 'ensureAudioContext failed', error)
        })

      // Dispatch Minigame Start
      if (onStartTravelMinigame) {
        onStartTravelMinigame(node.id)
      } else {
        // Fallback for tests or missing dispatch
        logger.warn(
          'useTravelLogic',
          'Missing onStartTravelMinigame, using legacy travel'
        )
        setIsTraveling(true)
        if (failsafeTimeoutRef.current) {
          clearTimeout(failsafeTimeoutRef.current)
        }
        failsafeTimeoutRef.current = window.setTimeout(() => {
          if (!travelCompletedRef.current) {
            onTravelComplete(node)
          }
          failsafeTimeoutRef.current = null
        }, TRAVEL_ANIMATION_TIMEOUT_MS)
      }
    },
    [onTravelComplete, onStartTravelMinigame]
  )

  /**
   * Initiates travel to a selected node.
   * First click shows cost and sets pending confirmation.
   * Second click on the same node confirms and starts travel.
   * @param {Object} node - Target node
   */
  const handleTravel = useCallback(
    node => {
      // Early interaction block if already traveling
      if (isTravelingRef.current) return

      const player = playerRef.current
      const band = bandRef.current
      const gameMap = gameMapRef.current

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
        logger.info(
          'TravelLogic',
          'Ignoring redundant travel to current node',
          {
            target: node.id
          }
        )

        // If it's the current node, trigger the interaction logic but DO NOT start travel
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

          // We can reuse the standardized arrival logic which handles
          // harmony checks, show cancellations, and routing safely.
          const venueId = normalizeVenueId(node.venue)
          const processedNode = {
            ...node,
            venue: resolveVenue(node.venue, venueId, VENUES_MAP) || node.venue
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
      const currentLayer = currentStartNode?.layer || 0
      const visibility = getNodeVisibilityUtil(node.layer, currentLayer)

      const accessCheck = checkVenueAccess({
        node,
        player,
        reputationByRegion: reputationByRegionRef.current,
        venueBlacklist: venueBlacklistRef.current,
        venuesMap: VENUES_MAP,
        getLocationName
      })

      if (!accessCheck.allowed) {
        addToast(
          i18n.t(accessCheck.errorKey, {
            defaultValue: accessCheck.defaultMessage,
            ...accessCheck.errorContext
          }),
          'error'
        )
        if (pendingTravelNodeRef.current?.id === node.id) clearPendingTravel()
        return
      }

      const preCheck = checkTravelPrerequisites(
        node,
        visibility,
        isConnectedUtil(gameMap, player.currentNodeId, node.id)
      )
      if (!preCheck.allowed) {
        addToast(
          i18n.t(preCheck.errorKey, {
            defaultValue: preCheck.defaultMessage
          }),
          'warning'
        )
        return
      }

      // Calculate costs
      const { dist, totalCost, fuelLiters } = calculateTravelExpenses(
        node,
        currentStartNode,
        player,
        band
      )

      const resourceCheck = checkTravelResources(totalCost, fuelLiters, player)
      if (!resourceCheck.allowed) {
        addToast(
          i18n.t(resourceCheck.errorKey, {
            defaultValue: resourceCheck.defaultMessage
          }),
          'error'
        )
        if (pendingTravelNodeRef.current?.id === node.id) clearPendingTravel()
        return
      }

      // Two-click confirmation: if this node is already pending, confirm and travel
      if (pendingTravelNodeRef.current?.id === node.id) {
        startTravelSequence(node)
        return
      }

      // First click: show cost and set pending state
      clearPendingTravel()
      setPendingTravelNode(node)
      pendingTravelNodeRef.current = node
      addToast(
        i18n.t('ui:travel.confirmTravelPrompt', {
          defaultValue:
            '{{location}} ({{distance}}km) | Food: {{totalCost}}€ | Fuel: {{fuelLiters}}L — Click again to confirm',
          location: getLocationName(
            node.venue.name,
            normalizeVenueId(node.venue)
          ),
          distance: dist,
          totalCost,
          fuelLiters: fuelLiters.toFixed(1)
        }),
        'warning'
      )

      // Auto-cancel pending after 5 seconds
      pendingTimeoutRef.current = setTimeout(() => {
        setPendingTravelNode(null)
        pendingTravelNodeRef.current = null
        pendingTimeoutRef.current = null
      }, 5000)
    },
    [
      addToast,
      onShowHQ,
      startTravelSequence,
      clearPendingTravel,
      getLocationName,
      handleNodeArrivalCallback
    ]
  )

  /**
   * Handles refueling the van
   */
  const handleRefuel = useCallback(() => {
    if (isTravelingRef.current) return

    const currentFuel = player.van?.fuel ?? 0
    const cost = calculateRefuelCost(currentFuel)

    if (cost <= 0) {
      addToast(
        i18n.t('ui:travel.refuel.tankAlreadyFull', {
          defaultValue: 'Tank is already full!'
        }),
        'info'
      )
      return
    }

    if ((player.money ?? 0) < cost) {
      addToast(
        i18n.t('ui:travel.refuel.notEnoughMoney', {
          defaultValue: 'Not enough money! Need {{cost}}€ to fill up.',
          cost
        }),
        'error'
      )
      return
    }

    updatePlayer({
      money: clampPlayerMoney((player.money ?? 0) - cost),
      van: { ...player.van, fuel: EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL }
    })
    addToast(
      i18n.t('ui:travel.refuel.refueled', {
        defaultValue: 'Refueled: -{{cost}}€',
        cost
      }),
      'success'
    )

    try {
      audioManager.playSFX('cash')
    } catch (_e) {
      // Ignore audio errors
    }
  }, [player, updatePlayer, addToast])

  /**
   * Handles repairing the van
   */
  const handleRepair = useCallback(() => {
    if (isTravelingRef.current) return

    const currentCondition = player.van?.condition ?? 100
    const cost = calculateRepairCost(currentCondition)

    if (cost <= 0) {
      addToast(
        i18n.t('ui:travel.repair.vanAlreadyPerfect', {
          defaultValue: 'Van is already in perfect condition!'
        }),
        'info'
      )
      return
    }

    if ((player.money ?? 0) < cost) {
      addToast(
        i18n.t('ui:travel.repair.notEnoughMoney', {
          defaultValue: 'Not enough money! Need {{cost}}€ to repair.',
          cost
        }),
        'error'
      )
      return
    }

    // Recalculate breakdown chance at full condition (multiplier 1.0)
    const repairedBreakdown = calcBaseBreakdownChance(
      player.van?.upgrades ?? []
    )

    updatePlayer({
      money: clampPlayerMoney((player.money ?? 0) - cost),
      van: {
        ...player.van,
        condition: 100,
        breakdownChance: Math.round(repairedBreakdown * 100) / 100
      }
    })

    addToast(
      i18n.t('ui:travel.repair.repaired', {
        defaultValue: 'Repaired: -{{cost}}€',
        cost
      }),
      'success'
    )

    try {
      audioManager.playSFX('cash')
    } catch (_e) {
      // Ignore audio errors
    }
  }, [player, updatePlayer, addToast])

  // Softlock detection effect
  useEffect(() => {
    if (!gameMap || isTraveling || !player.currentNodeId) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    if (checkSoftlock(gameMap, player, band)) {
      if (!timeoutRef.current) {
        logger.error('TravelLogic', 'GAME OVER: Stranded')
        addToast(
          i18n.t('ui:travel.errors.gameOverStranded', {
            defaultValue:
              'GAME OVER: Stranded! Cannot travel and cannot afford fuel.'
          }),
          'error'
        )
        timeoutRef.current = setTimeout(() => {
          saveGame(false)
          changeScene(GAME_PHASES.GAMEOVER)
        }, 3000)
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
  }, [player, band, gameMap, isTraveling, changeScene, addToast, saveGame])

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
      if (pendingTimeoutRef.current) {
        clearTimeout(pendingTimeoutRef.current)
        pendingTimeoutRef.current = null
      }
    }
  }, [])

  return {
    // State
    isTraveling,
    travelTarget,
    pendingTravelNode,

    // Computed
    isConnected,
    getNodeVisibility,

    // Actions
    handleTravel,
    handleRefuel,
    handleRepair,
    onTravelComplete,
    clearPendingTravel,
    travelCompletedRef
  }
}
