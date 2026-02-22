import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { useTravelLogic } from '../hooks/useTravelLogic'
import { useBandHQModal } from '../hooks/useBandHQModal'
import { ToggleRadio } from '../components/ToggleRadio'
import { MapConnection } from '../components/MapConnection'
import { MapNode } from '../components/MapNode'
import { BandHQ } from '../ui/BandHQ'
import { ALL_VENUES } from '../data/venues'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { EXPENSE_CONSTANTS } from '../utils/economyEngine'
import { audioManager } from '../utils/AudioManager'
import { ActionTypes } from '../context/gameReducer'

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
    changeScene,
    startTravelMinigame
  } = useGameState()

  const [hoveredNode, setHoveredNode] = useState(null)
  const { showHQ, openHQ, bandHQProps } = useBandHQModal()

  const {
    isTraveling,
    travelTarget,
    pendingTravelNode,
    isConnected,
    getNodeVisibility,
    handleTravel,
    handleRefuel,
    handleRepair,
    onTravelComplete,
    travelCompletedRef
  } = useTravelLogic({
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
    onShowHQ: openHQ,
    onStartTravelMinigame: startTravelMinigame
  })

  const currentNode = gameMap?.nodes[player.currentNodeId]
  const currentLayer = currentNode?.layer || 0

  // Resume ambient on mount and retry once on startup failure.
  useEffect(() => {
    let cancelled = false
    let retryTimeoutId = null

    const attemptResume = async (attempt = 0) => {
      const started = await audioManager.resumeMusic().catch(() => false)
      if (!started && !cancelled && attempt < 1) {
        retryTimeoutId = setTimeout(() => {
          void attemptResume(attempt + 1)
        }, 1200)
      }
    }

    void attemptResume()

    return () => {
      cancelled = true
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId)
      }
    }
  }, [])

  // Memoized URL generators
  const mapBgUrl = useMemo(() => getGenImageUrl(IMG_PROMPTS.OVERWORLD_MAP), [])
  const vanUrl = useMemo(() => getGenImageUrl(IMG_PROMPTS.ICON_VAN), [])
  const pinFestivalUrl = useMemo(
    () => getGenImageUrl(IMG_PROMPTS.ICON_PIN_FESTIVAL),
    []
  )
  const pinHomeUrl = useMemo(
    () => getGenImageUrl(IMG_PROMPTS.ICON_PIN_HOME),
    []
  )
  const pinClubUrl = useMemo(
    () => getGenImageUrl(IMG_PROMPTS.ICON_PIN_CLUB),
    []
  )

  // Memoized connection rendering
  const renderedConnections = useMemo(() => {
    if (!gameMap) return null
    return gameMap.connections.map((conn, i) => {
      const start = gameMap.nodes[conn.from]
      const end = gameMap.nodes[conn.to]
      if (!start || !end) return null

      // Visibility Check - Passed down as simple props
      const startVis = getNodeVisibility(start.layer, currentLayer)
      const endVis = getNodeVisibility(end.layer, currentLayer)

      return (
        <MapConnection
          key={i}
          start={start}
          end={end}
          startVis={startVis}
          endVis={endVis}
        />
      )
    })
  }, [gameMap, currentLayer, getNodeVisibility])

  // Memoized node rendering
  const renderedNodes = useMemo(() => {
    if (!gameMap) return null
    return Object.values(gameMap.nodes).map(node => {
      const isCurrent = node.id === player.currentNodeId
      const visibility = getNodeVisibility(node.layer, currentLayer)
      const isReachable = isConnected(node.id) || node.type === 'START'

      let iconUrl = pinClubUrl
      if (node.type === 'FESTIVAL') iconUrl = pinFestivalUrl
      else if (node.type === 'START') iconUrl = pinHomeUrl

      return (
        <MapNode
          key={node.id}
          node={node}
          isCurrent={isCurrent}
          isTraveling={isTraveling}
          visibility={visibility}
          isReachable={isReachable}
          isPendingConfirm={pendingTravelNode?.id === node.id}
          handleTravel={handleTravel}
          setHoveredNode={setHoveredNode}
          iconUrl={iconUrl}
          vanUrl={vanUrl}
        />
      )
    })
  }, [
    gameMap,
    player.currentNodeId,
    currentLayer,
    isTraveling,
    pendingTravelNode,
    getNodeVisibility,
    isConnected,
    handleTravel,
    pinClubUrl,
    pinFestivalUrl,
    pinHomeUrl,
    vanUrl
  ])

  // Hover connection memo
  const hoverLine = useMemo(() => {
    if (!hoveredNode || !isConnected(hoveredNode.id) || !currentNode)
      return null
    return (
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
    )
  }, [hoveredNode, isConnected, currentNode])

  return (
    <div
      className={`w-full h-full bg-(--void-black) relative overflow-hidden flex flex-col items-center justify-center p-8 ${isTraveling ? 'pointer-events-none' : ''}`}
    >
      <h2 className='absolute top-20 text-4xl text-(--toxic-green) font-[Metal_Mania] z-10 text-shadow-[0_0_10px_var(--toxic-green)] pointer-events-none'>
        TOUR PLAN: {player.location}
      </h2>

      {/* Instructions / Status */}
      <div className='absolute top-32 z-20 bg-(--void-black)/80 border border-(--toxic-green) p-2 text-center pointer-events-none'>
        <div className='text-(--toxic-green) font-bold text-sm uppercase'>
          {isTraveling ? 'TRAVELING...' : 'Next Stop'}
        </div>
        <div className='text-(--star-white) text-xs'>
          {isTraveling ? 'On the road' : 'Select a highlighted location'}
        </div>
      </div>

      {/* Radio Widget */}
      <div className='fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-(--void-black) border border-(--shadow-black) p-2 flex items-center gap-2 rounded shadow-[0_0_10px_var(--toxic-green-20)]'>
        <div className='w-2 h-2 rounded-full bg-(--blood-red) animate-pulse' />
        <span className='text-xs text-(--ash-gray) font-mono'>FM 66.6</span>
        <ToggleRadio />
      </div>

      <div className='absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col gap-2 items-end'>
        <button
          onClick={handleRefuel}
          disabled={
            isTraveling ||
            (player.van?.fuel ?? 0) >= EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL
          }
          className='bg-(--void-black) border border-(--warning-yellow) text-(--warning-yellow) px-4 py-2 hover:bg-(--warning-yellow) hover:text-(--void-black) font-mono text-sm disabled:opacity-50'
        >
          [REFUEL]
        </button>
        <button
          onClick={handleRepair}
          disabled={isTraveling || (player.van?.condition ?? 100) >= 100}
          className='bg-(--void-black) border border-(--toxic-green) text-(--toxic-green) px-4 py-2 hover:bg-(--toxic-green) hover:text-(--void-black) font-mono text-sm disabled:opacity-50'
        >
          [REPAIR]
        </button>
        <button
          onClick={saveGame}
          disabled={isTraveling}
          className='bg-(--void-black) border border-(--toxic-green) text-(--toxic-green) px-4 py-2 hover:bg-(--toxic-green) hover:text-(--void-black) font-mono text-sm disabled:opacity-50'
        >
          [SAVE GAME]
        </button>
      </div>

      <div className='relative w-full h-full max-w-6xl max-h-[80vh] border-4 border-(--toxic-green) bg-(--void-black)/80 rounded-lg shadow-[0_0_50px_var(--toxic-green-20)] overflow-hidden'>
        <div
          className='absolute inset-0 opacity-30 bg-cover bg-center grayscale invert pointer-events-none'
          style={{
            backgroundImage: `url("${mapBgUrl}")`
          }}
        />

        {/* Draw Connections */}
        <svg className='absolute inset-0 w-full h-full pointer-events-none'>
          {renderedConnections}
          {hoverLine}
        </svg>

        {renderedNodes}

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
              src={vanUrl}
              alt='Traveling Van'
              className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--toxic-green)]'
              style={{ transform: 'translate(0, -50%)' }}
            />
          </motion.div>
        )}
      </div>

      <div className='absolute bottom-8 left-8 p-4 border border-(--ash-gray) bg-(--void-black)/90 max-w-sm z-20 pointer-events-none'>
        <h3 className='text-(--toxic-green) font-bold mb-2'>EVENT LOG:</h3>
        <p className='text-xs text-(--ash-gray) font-mono'>
          &gt; Locations loaded: {ALL_VENUES.length}
          <br />
          &gt; {player.day}.01.2026: Tour active.
          <br />
          &gt; {player.location} secured.
        </p>
      </div>

      {showHQ && <BandHQ {...bandHQProps} />}
    </div>
  )
}
