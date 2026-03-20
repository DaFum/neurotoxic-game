// TODO: Review this file
import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { useTravelLogic } from '../hooks/useTravelLogic'
import { useBandHQModal } from '../hooks/useBandHQModal'
import { useQuestsModal } from '../hooks/useQuestsModal'
import { useContrabandStash } from '../hooks/useContrabandStash'
import { usePirateRadio } from '../hooks/usePirateRadio'
import { ToggleRadio } from '../components/ToggleRadio'
import { MapConnection } from '../components/MapConnection'
import { MapNode } from '../components/MapNode'
import { BandHQ } from '../ui/BandHQ'
import { QuestsModal } from '../ui/QuestsModal'
import { ContrabandStash } from '../ui/ContrabandStash'
import { PirateRadioModal } from '../ui/PirateRadioModal'
import { GlitchButton } from '../ui/GlitchButton'
import { ALL_VENUES } from '../data/venues'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen.js'
import {
  EXPENSE_CONSTANTS,
  calculateEffectiveTicketPrice
} from '../utils/economyEngine'
import { audioManager } from '../utils/AudioManager'
import { translateLocation } from '../utils/locationI18n'
import { GAME_PHASES } from '../context/gameConstants'

/**
 * The map navigation scene where players select their next destination.
 */
export const Overworld = () => {
  const { t } = useTranslation(['ui', 'venues'])
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
    reputationByRegion,
    venueBlacklist,
    addToast,
    advanceDay,
    changeScene,
    startTravelMinigame,
    activeStoryFlags
  } = useGameState()

  const [hoveredNode, setHoveredNode] = useState(null)
  const { showHQ, openHQ, bandHQProps } = useBandHQModal()
  const { showQuests, openQuests, questsProps } = useQuestsModal()
  const { showStash, openStash, stashProps } = useContrabandStash()
  const {
    showPirateRadio,
    openPirateRadio,
    closePirateRadio,
    triggerBroadcast,
    canBroadcast,
    hasBroadcastedToday,
    PIRATE_RADIO_CONFIG
  } = usePirateRadio()

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
    reputationByRegion,
    venueBlacklist,
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

  const [isSaving, setIsSaving] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const locationName = translateLocation(t, player.location, player.location)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleSaveWithDelay = () => {
    if (isSaving) return
    setIsSaving(true)
    setTimeout(() => {
      if (isMountedRef.current) {
        saveGame()
        setIsSaving(false)
      }
    }, 500)
  }

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
  const pinRestUrl = useMemo(
    () => getGenImageUrl(IMG_PROMPTS.ICON_PIN_REST),
    []
  )
  const pinSpecialUrl = useMemo(
    () => getGenImageUrl(IMG_PROMPTS.ICON_PIN_SPECIAL),
    []
  )
  const pinFinaleUrl = useMemo(
    () => getGenImageUrl(IMG_PROMPTS.ICON_PIN_FINALE),
    []
  )

  // Memoized connection rendering
  const renderedConnections = useMemo(() => {
    if (!gameMap) return null
    return gameMap.connections.map(conn => {
      const start = gameMap.nodes[conn.from]
      const end = gameMap.nodes[conn.to]
      if (!start || !end) return null

      // Visibility Check - Passed down as simple props
      const startVis = getNodeVisibility(start.layer, currentLayer)
      const endVis = getNodeVisibility(end.layer, currentLayer)

      return (
        <MapConnection
          key={`${conn.from}-${conn.to}`}
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
    const nodes = gameMap.nodes
    const keys = Object.keys(nodes)
    const result = new Array(keys.length)

    for (let i = 0; i < keys.length; i++) {
      const node = nodes[keys[i]]
      const isCurrent = node.id === player.currentNodeId
      const visibility = getNodeVisibility(node.layer, currentLayer)
      const isReachable = isConnected(node.id) || node.type === 'START'

      let iconUrl = pinClubUrl
      if (node.type === 'FESTIVAL') iconUrl = pinFestivalUrl
      else if (node.type === 'START') iconUrl = pinHomeUrl
      else if (node.type === 'REST_STOP') iconUrl = pinRestUrl
      else if (node.type === 'SPECIAL') iconUrl = pinSpecialUrl
      else if (node.type === 'FINALE') iconUrl = pinFinaleUrl

      const effectivePrice = calculateEffectiveTicketPrice(node.venue || {}, {
        discountedTickets: activeStoryFlags?.includes(
          'discounted_tickets_active'
        )
      })

      result[i] = (
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
          ticketPrice={effectivePrice}
        />
      )
    }

    return result
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
    pinRestUrl,
    pinSpecialUrl,
    pinFinaleUrl,
    vanUrl,
    activeStoryFlags
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
        stroke='var(--color-toxic-green)'
        strokeWidth='2'
        strokeDasharray='5,5'
        opacity='0.8'
      />
    )
  }, [hoveredNode, isConnected, currentNode])

  return (
    <div
      className={`w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center p-8 ${isTraveling ? 'pointer-events-none' : ''}`}
    >
      <h2 className='absolute top-20 text-4xl text-toxic-green font-[Metal_Mania] z-10 text-shadow-[0_0_10px_var(--color-toxic-green)] pointer-events-none'>
        {t('ui:overworld.header.tourPlan', { defaultValue: 'TOUR PLAN' })}:{' '}
        {locationName}
      </h2>

      {/* Instructions / Status */}
      <div className='absolute top-32 z-20 bg-void-black/80 border border-toxic-green p-2 text-center pointer-events-none'>
        <div className='text-toxic-green font-bold text-sm uppercase'>
          {isTraveling
            ? t('ui:overworld.status.traveling', {
                defaultValue: 'TRAVELING...'
              })
            : t('ui:overworld.status.nextStop', { defaultValue: 'Next Stop' })}
        </div>
        <div className='text-star-white text-xs'>
          {isTraveling
            ? t('ui:overworld.status.onRoad', { defaultValue: 'On the road' })
            : t('ui:overworld.status.selectLocation', {
                defaultValue: 'Select a highlighted location'
              })}
        </div>
      </div>

      {/* Radio Widget */}
      <div className='fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-void-black border border-shadow-black p-2 flex items-center gap-2 rounded shadow-[0_0_10px_var(--color-toxic-green-20)]'>
        <div className='w-2 h-2 rounded-full bg-blood-red animate-pulse' />
        <span className='text-xs text-ash-gray font-mono'>
          {t('ui:overworld.radio_station', { defaultValue: 'FM 66.6' })}
        </span>
        <ToggleRadio />
      </div>

      <div className='absolute bottom-8 right-8 z-50 pointer-events-auto flex flex-col gap-2 items-end'>
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className='flex flex-col gap-2 items-end mb-2'
            >
              <GlitchButton
                onClick={openStash}
                disabled={isTraveling}
                variant='primary'
                size='sm'
              >
                [{t('ui:contraband.button', { defaultValue: 'STASH' })}]
              </GlitchButton>
              <GlitchButton
                onClick={openQuests}
                disabled={isTraveling}
                variant='primary'
                size='sm'
              >
                [{t('ui:quests.button')}]
              </GlitchButton>
              <GlitchButton
                onClick={openPirateRadio}
                disabled={isTraveling}
                variant='warning'
                size='sm'
              >
                [{t('ui:pirate_radio.button', { defaultValue: 'PIRATE RADIO' })}
                ]
              </GlitchButton>
              <GlitchButton
                onClick={openHQ}
                disabled={isTraveling}
                variant='primary'
                size='sm'
              >
                [{t('ui:overworld.band_hq_button', { defaultValue: 'BAND HQ' })}
                ]
              </GlitchButton>
              <GlitchButton
                onClick={handleRefuel}
                disabled={
                  isTraveling ||
                  (player.van?.fuel ?? 0) >=
                    EXPENSE_CONSTANTS.TRANSPORT.MAX_FUEL
                }
                variant='warning'
                size='sm'
              >
                [REFUEL]
              </GlitchButton>
              <GlitchButton
                onClick={() => changeScene(GAME_PHASES.CLINIC)}
                disabled={isTraveling}
                variant='warning'
                size='sm'
              >
                [
                {t('ui:overworld.void_clinic_button', {
                  defaultValue: 'VOID CLINIC'
                })}
                ]
              </GlitchButton>
              <GlitchButton
                onClick={handleRepair}
                disabled={isTraveling || (player.van?.condition ?? 100) >= 100}
                variant='primary'
                size='sm'
              >
                [REPAIR]
              </GlitchButton>
              <GlitchButton
                onClick={handleSaveWithDelay}
                disabled={isTraveling}
                isLoading={isSaving}
                variant='primary'
                size='sm'
              >
                [SAVE GAME]
              </GlitchButton>
            </motion.div>
          )}
        </AnimatePresence>

        <GlitchButton
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          disabled={isTraveling}
          variant='primary'
          size='sm'
        >
          {isMenuOpen ? `[${t('ui:menu.close')}]` : `[${t('ui:menu.open')}]`}
        </GlitchButton>
      </div>

      <div className='relative w-full h-full max-w-6xl max-h-[80vh] border-4 border-toxic-green bg-void-black/80 rounded-lg shadow-[0_0_50px_var(--color-toxic-green-20)] overflow-hidden'>
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
              className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--color-toxic-green)]'
              style={{ transform: 'translate(0, -50%)' }}
            />
          </motion.div>
        )}
      </div>

      <div className='absolute bottom-8 left-8 p-4 border border-ash-gray bg-void-black/90 max-w-sm z-20 pointer-events-none'>
        <h3 className='text-toxic-green font-bold mb-2'>
          {t('ui:overworld.event_log', { defaultValue: 'EVENT LOG:' })}
        </h3>
        <p className='text-xs text-ash-gray font-mono'>
          &gt;{' '}
          {t('ui:overworld.locations_loaded', {
            count: ALL_VENUES.length,
            defaultValue: `Locations loaded: ${ALL_VENUES.length}`
          })}
          <br />
          &gt;{' '}
          {t('ui:overworld.tour_active', {
            date: `${player.day}.01.2026`,
            defaultValue: `${player.day}.01.2026: Tour active.`
          })}
          <br />
          &gt;{' '}
          {t('ui:overworld.location_secured', {
            location: locationName,
            defaultValue: `${locationName} secured.`
          })}
        </p>
      </div>

      {showHQ && <BandHQ {...bandHQProps} />}
      {showQuests && <QuestsModal {...questsProps} />}
      {showStash && <ContrabandStash {...stashProps} />}
      {showPirateRadio && (
        <PirateRadioModal
          onClose={closePirateRadio}
          onBroadcast={triggerBroadcast}
          canBroadcast={canBroadcast}
          hasBroadcastedToday={hasBroadcastedToday}
          config={PIRATE_RADIO_CONFIG}
        />
      )}
    </div>
  )
}
