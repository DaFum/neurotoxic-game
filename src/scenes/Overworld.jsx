// TODO: Extract complex UI sub-components into standalone files for better maintainability
import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { useTravelLogic } from '../hooks/useTravelLogic'
import { useBandHQModal } from '../hooks/useBandHQModal'
import { useQuestsModal } from '../hooks/useQuestsModal'
import { useContrabandStash } from '../hooks/useContrabandStash'
import { usePirateRadio } from '../hooks/usePirateRadio'

import { OverworldHeader } from '../components/overworld/OverworldHeader'
import { OverworldMenu } from '../components/overworld/OverworldMenu'
import { TravelingVan } from '../components/overworld/TravelingVan'
import { EventLog } from '../components/overworld/EventLog'
import { MapConnection } from '../components/MapConnection'
import { MapNode } from '../components/MapNode'
import { BandHQ } from '../ui/BandHQ'
import { QuestsModal } from '../ui/QuestsModal'
import { ContrabandStash } from '../ui/ContrabandStash'
import { PirateRadioModal } from '../ui/PirateRadioModal'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen.js'
import { calculateEffectiveTicketPrice } from '../utils/economyEngine'
import { audioManager } from '../utils/AudioManager'
import { translateLocation } from '../utils/locationI18n'

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
    const result = []

    for (const key in nodes) {
      if (!Object.hasOwn(nodes, key)) continue

      const node = nodes[key]
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

      result.push(
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
      <OverworldHeader t={t} locationName={locationName} isTraveling={isTraveling} />

      <OverworldMenu
        t={t}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        isTraveling={isTraveling}
        player={player}
        isSaving={isSaving}
        openStash={openStash}
        openQuests={openQuests}
        openPirateRadio={openPirateRadio}
        openHQ={openHQ}
        handleRefuel={handleRefuel}
        handleRepair={handleRepair}
        handleSaveWithDelay={handleSaveWithDelay}
        changeScene={changeScene}
      />

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

        <TravelingVan
          isTraveling={isTraveling}
          currentNode={currentNode}
          travelTarget={travelTarget}
          vanUrl={vanUrl}
          travelCompletedRef={travelCompletedRef}
          onTravelComplete={onTravelComplete}
        />
      </div>

      <EventLog t={t} player={player} locationName={locationName} />

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
