import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { ChatterOverlay } from '../components/ChatterOverlay'
import { BandHQ } from '../ui/BandHQ'
import { ALL_VENUES } from '../data/venues'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import {
  calculateTravelExpenses,
  EXPENSE_CONSTANTS
} from '../utils/economyEngine'
import { audioManager } from '../utils/AudioManager'
import { logger } from '../utils/logger'

/**
 * A widget to toggle the ambient radio / music.
 */
const ToggleRadio = () => {
  const [isPlaying, setIsPlaying] = useState(false)

  React.useEffect(() => {
    if (audioManager.music && audioManager.music.playing()) {
      setIsPlaying(true)
    }
  }, [])

  /**
   * Toggles the radio playback state.
   */
  const toggle = () => {
    if (isPlaying) {
      audioManager.stopMusic()
      setIsPlaying(false)
    } else {
      audioManager.resumeMusic()
      setIsPlaying(true)
    }
  }

  return (
    <button
      onClick={toggle}
      className='text-[var(--toxic-green)] hover:text-white text-xs'
      title={isPlaying ? 'Stop Radio' : 'Play/Resume Radio'}
    >
      {isPlaying ? '■' : '▶'}
    </button>
  )
}

/**
 * The map navigation scene where players select their next destination.
 */
export const Overworld = () => {
  const {
    startGig,
    player,
    updatePlayer,
    triggerEvent,
    saveGame,
    gameMap,
    hasUpgrade,
    updateBand,
    band,
    addToast,
    advanceDay,
    changeScene
  } = useGameState()

  const [isTraveling, setIsTraveling] = useState(false)
  const [travelTarget, setTravelTarget] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [showHQ, setShowHQ] = useState(false)
  const [activeHQTab, setActiveHQTab] = useState('STATS')
  const travelCompletedRef = useRef(false)

  /**
   * Checks if a target node is connected to the current node.
   * @param {string} targetNodeId - The destination node ID.
   * @returns {boolean} True if connected.
   */
  const isConnected = targetNodeId => {
    if (!gameMap) return false
    const connections = gameMap.connections.filter(
      c => c.from === player.currentNodeId
    )
    return connections.some(c => c.to === targetNodeId)
  }

  /**
   * Determines the visibility state of a node based on its layer.
   * @param {number} nodeLayer - The layer of the target node.
   * @param {number} currentLayer - The current layer of the player.
   * @returns {string} 'visible', 'dimmed', or 'hidden'.
   */
  const getNodeVisibility = (nodeLayer, currentLayer) => {
    if (nodeLayer <= currentLayer + 1) return 'visible' // 1 (Interactive)
    if (nodeLayer === currentLayer + 2) return 'dimmed' // 0.5 (Grayscale, Non-interactive)
    return 'hidden' // Hidden
  }

  /**
   * Callback executed when the travel animation finishes.
   * Updates state, costs, and triggers arrival logic.
   * Accepts an optional explicitNode to bypass state latency issues.
   */
  const onTravelComplete = useCallback(
    (explicitNode = null) => {
      // If explicitNode is event (from motion), ignore it.
      const target =
        explicitNode && explicitNode.id ? explicitNode : travelTarget

      logger.info('Overworld', 'onTravelComplete triggered', {
        travelCompleted: travelCompletedRef.current,
        hasTarget: !!target,
        targetId: target?.id
      })

      if (travelCompletedRef.current) return
      travelCompletedRef.current = true

      if (!target) {
        logger.error(
          'Overworld',
          'Travel complete but no target! Resetting state.'
        )
        setIsTraveling(false)
        return
      }

      if (!target.venue) {
        logger.error('Overworld', 'Target node has no venue data!', target)
        setIsTraveling(false)
        addToast('Error: Invalid destination.', 'error')
        return
      }

      const node = target
      const currentStartNode = gameMap?.nodes[player.currentNodeId]

      // Re-calculate and re-validate costs before deducting
      const { fuelLiters, totalCost } = calculateTravelExpenses(
        node,
        currentStartNode,
        player
      )

      // Check affordability again (safeguard)
      if (player.money < totalCost || (player.van?.fuel ?? 0) < fuelLiters) {
        addToast('Error: Insufficient resources upon arrival.', 'error')
        setIsTraveling(false)
        setTravelTarget(null)
        return
      }

      updatePlayer({
        money: Math.max(0, player.money - totalCost),
        van: {
          ...player.van,
          fuel: Math.max(0, (player.van?.fuel ?? 0) - fuelLiters)
        },
        location: node.venue.name,
        currentNodeId: node.id
      })
      advanceDay()

      if (hasUpgrade('van_sound_system')) {
        updateBand({ harmony: Math.min(100, band.harmony + 5) })
      }

      setIsTraveling(false)
      setTravelTarget(null)

      // Trigger Events
      const eventHappened = triggerEvent('transport', 'travel')
      if (!eventHappened) {
        const bandEvent = triggerEvent('band', 'travel')
        if (!bandEvent) {
          // Node Type Handling
          if (node.type === 'REST_STOP') {
            const newMembers = band.members.map(m => ({
              ...m,
              stamina: Math.min(100, Math.max(0, m.stamina + 20)),
              mood: Math.min(100, Math.max(0, m.mood + 10))
            }))
            updateBand({
              members: newMembers
            })
            addToast('Rested at stop. Band feels better.', 'success')
          } else if (node.type === 'SPECIAL') {
            const specialEvent = triggerEvent('special')
            if (!specialEvent) {
              addToast('A mysterious place, but nothing happened.', 'info')
            }
          } else if (node.type === 'START') {
            setShowHQ(true)
            addToast('Home Sweet Home.', 'success')
          } else {
            // Default: GIG
            if (band.harmony <= 0) {
              addToast("Band's harmony too low to perform!", 'warning')
              return
            }
            logger.info('Overworld', 'Starting Gig at destination', {
              venue: node.venue.name
            })
            startGig(node.venue)
          }
        }
      }
    },
    [
      travelTarget,
      player.money,
      player.van,
      player.day,
      band,
      hasUpgrade,
      updatePlayer,
      updateBand,
      triggerEvent,
      startGig,
      addToast,
      advanceDay,
      gameMap,
      player.currentNodeId
    ]
  )

  /**
   * Initiates the travel sequence to a selected node.
   * @param {object} node - The target node object.
   */
  const handleTravel = node => {
    if (!node?.venue) {
      addToast('Error: Invalid location.', 'error')
      return
    }

    logger.info('Overworld', 'handleTravel initiated', {
      target: node.id,
      current: player.currentNodeId
    })

    if (isTraveling) return

    // Allow interaction with current node (Enter Gig)
    if (node.id === player.currentNodeId) {
      if (node.type === 'GIG') {
        logger.info('Overworld', 'Entering current node Gig', {
          venue: node.venue.name
        })
        startGig(node.venue)
      } else if (node.type === 'START') {
        setShowHQ(true)
      } else {
        addToast(`You are at ${node.venue.name}.`, 'info')
      }
      return
    }

    const currentStartNode = gameMap?.nodes[player.currentNodeId]

    // Check connectivity and layer
    const currentLayer = currentStartNode?.layer || 0
    const visibility = getNodeVisibility(node.layer, currentLayer)

    if (visibility !== 'visible' || !isConnected(node.id)) {
      return
    }

    // Calculate Costs
    const { dist, totalCost, fuelLiters } = calculateTravelExpenses(
      node,
      currentStartNode,
      player
    )

    addToast(
      `Travel to ${node.venue.name} (${dist}km)? Cost: ${totalCost}€`,
      'info'
    )

    if (player.money < totalCost) {
      addToast('Not enough money for gas and food!', 'error')
      return
    }

    if ((player.van?.fuel ?? 0) < fuelLiters) {
      addToast('Not enough fuel in the tank!', 'error')
      return
    }

    // Start Travel Sequence
    travelCompletedRef.current = false
    setTravelTarget(node)
    setIsTraveling(true)

    try {
      audioManager.playSFX('travel')
    } catch (e) {
      console.error('SFX Error:', e)
    }

    // Direct Timeout Failsafe - bypasses React state lag or useEffect timing issues
    // We pass 'node' explicitly to onTravelComplete to ensure it has the data
    // Executing immediately via minimal timeout to ensure state update but prevent freeze
    window.setTimeout(() => {
      if (!travelCompletedRef.current) {
        onTravelComplete(node)
      }
    }, 1510)
  }

  // Keep a ref to the latest onTravelComplete (still useful for future logic)
  const onTravelCompleteLatest = useRef(onTravelComplete)
  useEffect(() => {
    onTravelCompleteLatest.current = onTravelComplete
  }, [onTravelComplete])

  const currentNode = gameMap?.nodes[player.currentNodeId]
  const currentLayer = currentNode?.layer || 0

  /**
   * Refuels the van to 100% capacity if affordable.
   */
  const handleRefuel = () => {
    if (isTraveling) return

    const currentFuel = player.van?.fuel ?? 0
    const missing = 100 - currentFuel
    if (missing <= 0) {
      addToast('Tank is already full!', 'info')
      return
    }

    const cost = Math.ceil(missing * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE)

    if (player.money < cost) {
      addToast(`Not enough money! Need ${cost}€ to fill up.`, 'error')
      return
    }

    updatePlayer({
      money: Math.max(0, player.money - cost),
      van: { ...player.van, fuel: 100 }
    })
    addToast(`Refueled: -${cost}€`, 'success')
    try {
      audioManager.playSFX('cash')
    } catch (e) {
      // ignore
    }
  }

  // Softlock Check: Stranded logic
  const timeoutRef = useRef(null)

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

    // Can we reach ANY neighbor?
    const canReachAny = neighbors.some(n => {
      if (!n) return false
      const { fuelLiters } = calculateTravelExpenses(
        n,
        gameMap.nodes[player.currentNodeId],
        player
      )
      return currentFuel >= fuelLiters
    })

    // If we cannot reach any neighbor AND we are not at a gig (money source)
    if (!canReachAny && currentNode?.type !== 'GIG') {
      // Check if we can afford a FULL refuel (since partial is not implemented)
      const missingFuel = 100 - currentFuel
      const refuelCost = Math.ceil(
        missingFuel * EXPENSE_CONSTANTS.TRANSPORT.FUEL_PRICE
      )

      if (player.money < refuelCost) {
        if (!timeoutRef.current) {
          logger.error('Overworld', 'GAME OVER: Stranded (No fuel, no money)')
          addToast(
            'GAME OVER: Stranded! Cannot travel and cannot afford full tank.',
            'error'
          )
          timeoutRef.current = setTimeout(() => changeScene('GAMEOVER'), 3000)
        }
      } else {
        // Has enough money to refuel
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
      }
    } else {
      // Can reach neighbor
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
  }, [
    player.van,
    player.money,
    player.currentNodeId,
    gameMap,
    isTraveling,
    changeScene,
    addToast
  ])

  return (
    <div
      className={`w-full h-full bg-[var(--void-black)] relative overflow-hidden flex flex-col items-center justify-center p-8 ${isTraveling ? 'pointer-events-none' : ''}`}
    >
      <h2 className='absolute top-20 text-4xl text-[var(--toxic-green)] font-[Metal_Mania] z-10 text-shadow-[0_0_10px_var(--toxic-green)] pointer-events-none'>
        TOUR PLAN: {player.location}
      </h2>

      {/* Instructions / Status */}
      <div className='absolute top-32 z-20 bg-black/80 border border-[var(--toxic-green)] p-2 text-center pointer-events-none'>
        <div className='text-[var(--toxic-green)] font-bold text-sm uppercase'>
          {isTraveling ? 'TRAVELING...' : 'Next Stop'}
        </div>
        <div className='text-white text-xs'>
          {isTraveling ? 'On the road' : 'Select a highlighted location'}
        </div>
      </div>

      {/* Radio Widget */}
      <div className='fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-black border border-[var(--shadow-black)] p-2 flex items-center gap-2 rounded shadow-lg'>
        <div className='w-2 h-2 rounded-full bg-[var(--blood-red)] animate-pulse' />
        <span className='text-xs text-[var(--ash-gray)] font-mono'>
          FM 66.6
        </span>
        <ToggleRadio />
      </div>

      <div className='absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col gap-2 items-end'>
        <button
          onClick={handleRefuel}
          disabled={isTraveling || (player.van?.fuel ?? 0) >= 99}
          className='bg-[var(--void-black)] border border-[var(--warning-yellow)] text-[var(--warning-yellow)] px-4 py-2 hover:bg-[var(--warning-yellow)] hover:text-[var(--void-black)] font-mono text-sm disabled:opacity-50'
        >
          [REFUEL]
        </button>
        <button
          onClick={saveGame}
          disabled={isTraveling}
          className='bg-black border border-[var(--toxic-green)] text-[var(--toxic-green)] px-4 py-2 hover:bg-[var(--toxic-green)] hover:text-black font-mono text-sm disabled:opacity-50'
        >
          [SAVE GAME]
        </button>
      </div>

      <div className='relative w-full h-full max-w-6xl max-h-[80vh] border-4 border-[var(--toxic-green)] bg-black/80 rounded-lg shadow-[0_0_50px_rgba(0,255,65,0.2)] overflow-hidden'>
        <div
          className='absolute inset-0 opacity-30 bg-cover bg-center grayscale invert'
          style={{
            backgroundImage: `url("${getGenImageUrl(IMG_PROMPTS.OVERWORLD_MAP)}")`
          }}
        />

        {/* Draw Connections */}
        <svg className='absolute inset-0 w-full h-full pointer-events-none'>
          {/* Existing Connections */}
          {gameMap &&
            gameMap.connections.map((conn, i) => {
              const start = gameMap.nodes[conn.from]
              const end = gameMap.nodes[conn.to]
              if (!start || !end) return null

              // Visibility Check
              const startVis = getNodeVisibility(start.layer, currentLayer)
              const endVis = getNodeVisibility(end.layer, currentLayer)
              if (startVis === 'hidden' || endVis === 'hidden') return null

              return (
                <line
                  key={i}
                  x1={`${start.x}%`}
                  y1={`${start.y}%`}
                  x2={`${end.x}%`}
                  y2={`${end.y}%`}
                  stroke='var(--toxic-green)'
                  strokeWidth='1'
                  opacity={
                    startVis === 'dimmed' || endVis === 'dimmed' ? 0.2 : 0.5
                  }
                />
              )
            })}

          {/* Dynamic Hover Connection */}
          {hoveredNode && isConnected(hoveredNode.id) && (
            <line
              x1={`${currentNode.x}%`}
              y1={`${currentNode.y}%`}
              x2={`${hoveredNode.x}%`}
              y2={`${hoveredNode.y}%`}
              stroke='var(--toxic-green)'
              strokeWidth='2'
              strokeDasharray='5,5'
              opacity='0.8'
            />
          )}
        </svg>

        {gameMap &&
          Object.values(gameMap.nodes).map(node => {
            const isCurrent = node.id === player.currentNodeId
            const visibility = getNodeVisibility(node.layer, currentLayer)
            const isReachable = isConnected(node.id)

            if (visibility === 'hidden') {
              // Render ??? Icon
              return (
                <div
                  key={node.id}
                  className='absolute w-6 h-6 flex items-center justify-center text-gray-700 pointer-events-none'
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  ?
                </div>
              )
            }

            const iconUrl =
              node.type === 'FESTIVAL'
                ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_FESTIVAL)
                : node.type === 'START'
                  ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_HOME)
                  : getGenImageUrl(IMG_PROMPTS.ICON_PIN_CLUB)
            const vanUrl = getGenImageUrl(IMG_PROMPTS.ICON_VAN)

            return (
              <div
                key={node.id}
                className={`absolute flex flex-col items-center group
                ${isCurrent ? 'z-50' : 'z-10'} 
                ${!isReachable && !isCurrent ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}
                ${isReachable ? 'cursor-pointer' : ''}
            `}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                onClick={() => handleTravel(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {isCurrent && !isTraveling && (
                  <div
                    className='absolute pointer-events-none z-50'
                    style={{ transform: 'translate(0, -50%)' }}
                  >
                    <img
                      src={vanUrl}
                      alt='Van'
                      className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--toxic-green)]'
                    />
                    <ChatterOverlay />
                  </div>
                )}

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: isCurrent ? 1 : 1 }}
                  whileHover={isReachable ? { scale: 1.2, zIndex: 60 } : {}}
                >
                  <img
                    src={iconUrl}
                    alt='Pin'
                    className={`w-6 h-6 md:w-8 md:h-8 object-contain drop-shadow-md
                        ${isReachable ? 'drop-shadow-[0_0_10px_var(--toxic-green)] animate-pulse' : ''}`}
                  />
                </motion.div>

                {isReachable && (
                  <div className='absolute -top-6 left-1/2 -translate-x-1/2 text-[var(--toxic-green)] text-[10px] font-bold animate-bounce whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity'>
                    CLICK TO TRAVEL
                  </div>
                )}

                <div className='hidden group-hover:block absolute bottom-8 bg-black/90 border border-[var(--toxic-green)] p-2 rounded z-50 whitespace-nowrap pointer-events-none'>
                  <div className='font-bold text-[var(--toxic-green)]'>
                    {node.venue.name}
                  </div>
                  {node.type === 'GIG' && (
                    <div className='text-[10px] text-gray-400 font-mono'>
                      Cap: {node.venue.capacity} | Pay: ~{node.venue.pay}€<br />
                      Ticket: {node.venue.price}€ | Diff:{' '}
                      {'★'.repeat(node.venue.diff)}
                    </div>
                  )}
                  {isCurrent && (
                    <div className='text-[var(--blood-red)] text-xs font-bold'>
                      [CURRENT LOCATION]
                    </div>
                  )}
                </div>
              </div>
            )
          })}

        {/* Animated Van (Global Overlay) - Refactored to motion.div */}
        {isTraveling && currentNode && travelTarget && (
          <motion.div
            className='absolute z-[60] pointer-events-none'
            initial={{
              left: `${currentNode.x}%`,
              top: `${currentNode.y}%`
            }}
            animate={{
              left: `${travelTarget.x}%`,
              top: `${travelTarget.y}%`
            }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            onAnimationComplete={() => {
              if (!travelCompletedRef.current) {
                onTravelComplete(travelTarget)
              }
            }}
          >
            <img
              src={getGenImageUrl(IMG_PROMPTS.ICON_VAN)}
              alt='Traveling Van'
              className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--toxic-green)]'
              style={{ transform: 'translate(0, -50%)' }}
            />
          </motion.div>
        )}
      </div>

      <div className='absolute bottom-8 left-8 p-4 border border-(--ash-gray) bg-black/90 max-w-sm z-20 pointer-events-none'>
        <h3 className='text-(--toxic-green) font-bold mb-2'>EVENT LOG:</h3>
        <p className='text-xs text-(--ash-gray) font-mono'>
          &gt; Locations loaded: {ALL_VENUES.length}
          <br />
          &gt; {player.day}.01.2026: Tour active.
          <br />
          &gt; {player.location} secured.
        </p>
      </div>

      {showHQ && (
        <BandHQ
          player={player}
          band={band}
          social={player.social || { instagram: 0, tiktok: 0 }} // Fallback if social not directly on player but context
          onClose={() => setShowHQ(false)}
          updatePlayer={updatePlayer}
          updateBand={updateBand}
          addToast={addToast}
          activeTab={activeHQTab}
          onTabChange={setActiveHQTab}
        />
      )}
    </div>
  )
}
