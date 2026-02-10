import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { useTravelLogic } from '../hooks/useTravelLogic'
import { useAudioControl } from '../hooks/useAudioControl'
import { ChatterOverlay } from '../components/ChatterOverlay'
import { BandHQ } from '../ui/BandHQ'
import { ALL_VENUES } from '../data/venues'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen'
import { EXPENSE_CONSTANTS } from '../utils/economyEngine'
import { audioManager } from '../utils/AudioManager'

/**
 * A widget to toggle the ambient radio / music.
 * Polls audioManager state so the button stays in sync even when
 * external code (e.g. gig init) stops or starts ambient playback.
 */
const ToggleRadio = () => {
  const [isPlaying, setIsPlaying] = useState(
    () => audioManager.currentSongId === 'ambient'
  )

  // Poll periodically to catch external audio changes without a global event bus.
  React.useEffect(() => {
    const derive = () => audioManager.currentSongId === 'ambient'
    setIsPlaying(derive())
    const id = setInterval(() => setIsPlaying(derive()), 1000)
    return () => clearInterval(id)
  }, [])

  /**
   * Toggles the radio playback state.
   */
  const toggle = () => {
    if (isPlaying) {
      audioManager.stopMusic()
      setIsPlaying(false)
    } else {
      audioManager
        .resumeMusic()
        .then(started => {
          setIsPlaying(Boolean(started))
        })
        .catch(() => setIsPlaying(false))
    }
  }

  return (
    <button
      onClick={toggle}
      className='bg-(--void-black) border border-(--toxic-green) text-(--toxic-green) px-2 py-1 text-xs uppercase hover:bg-(--toxic-green) hover:text-(--void-black) font-mono'
      title={isPlaying ? 'Stop Radio' : 'Play/Resume Radio'}
      aria-label={isPlaying ? 'Stop Radio' : 'Play/Resume Radio'}
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
    social,
    addToast,
    advanceDay,
    changeScene,
    settings,
    updateSettings,
    deleteSave,
    setlist,
    setSetlist
  } = useGameState()

  const [hoveredNode, setHoveredNode] = useState(null)
  const [showHQ, setShowHQ] = useState(false)
  const [activeHQTab, setActiveHQTab] = useState('STATS')

  const { audioState, handleAudioChange } = useAudioControl()

  const {
    isTraveling,
    travelTarget,
    isConnected,
    getNodeVisibility,
    handleTravel,
    handleRefuel,
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
    onShowHQ: () => setShowHQ(true)
  })

  const currentNode = gameMap?.nodes[player.currentNodeId]
  const currentLayer = currentNode?.layer || 0

  // Resume ambient on mount and retry once on startup failure.
  React.useEffect(() => {
    let cancelled = false
    let retryTimeoutId = null

    const attemptResume = async (attempt = 0) => {
      let started = false
      try {
        started = await audioManager.resumeMusic()
      } catch {
        started = false
      }
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

  return (
    <div
      className={`w-full h-full bg-(--void-black) relative overflow-hidden flex flex-col items-center justify-center p-8 ${isTraveling ? 'pointer-events-none' : ''}`}
    >
      {(settings?.crtEnabled ?? false) && (
        <div className='crt-overlay pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-50' />
      )}

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
            const isReachable = isConnected(node.id) || node.type === 'START'

            if (visibility === 'hidden' && node.type !== 'START') {
              // Render ??? Icon
              return (
                <div
                  key={node.id}
                  className='absolute w-6 h-6 flex items-center justify-center text-(--ash-gray) pointer-events-none'
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
                  <div className='absolute -top-6 left-1/2 -translate-x-1/2 text-(--toxic-green) text-[10px] font-bold animate-bounce whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'>
                    CLICK TO TRAVEL
                  </div>
                )}

                <div className='hidden group-hover:block absolute bottom-8 bg-(--void-black)/90 border border-(--toxic-green) p-2 rounded z-50 whitespace-nowrap pointer-events-none'>
                  <div className='font-bold text-(--toxic-green)'>
                    {node.venue.name}
                  </div>
                  {node.type === 'GIG' && (
                    <div className='text-[10px] text-(--ash-gray) font-mono'>
                      Cap: {node.venue.capacity} | Pay: ~{node.venue.pay}€<br />
                      Ticket: {node.venue.price}€ | Diff:{' '}
                      {'★'.repeat(node.venue.diff)}
                    </div>
                  )}
                  {isCurrent && (
                    <div className='text-(--blood-red) text-xs font-bold'>
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

      {showHQ && (
        <BandHQ
          player={player}
          band={band}
          social={social}
          onClose={() => setShowHQ(false)}
          updatePlayer={updatePlayer}
          updateBand={updateBand}
          addToast={addToast}
          activeTab={activeHQTab}
          onTabChange={setActiveHQTab}
          settings={settings}
          updateSettings={updateSettings}
          deleteSave={deleteSave}
          setlist={setlist}
          setSetlist={setSetlist}
          audioState={audioState}
          onAudioChange={handleAudioChange}
        />
      )}
    </div>
  )
}
