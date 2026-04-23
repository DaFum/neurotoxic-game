import React, { useMemo } from 'react'
import { MapConnection } from '../MapConnection'
import { MapNode } from '../MapNode'
import { TravelingVan } from './TravelingVan'
import { calculateEffectiveTicketPrice } from '../../utils/economyEngine'
import { getGenImageUrl, IMG_PROMPTS } from '../../utils/imageGen'

export const OverworldMap = React.memo(
  ({
    t,
    gameMap,
    player,
    currentLayer,
    isTraveling,
    pendingTravelNode,
    getNodeVisibility,
    isConnected,
    handleTravel,
    setHoveredNode,
    hoveredNode,
    currentNode,
    travelTarget,
    travelCompletedRef,
    onTravelComplete,
    activeStoryFlags
}: OverworldMapProps) => {
    // Memoized URL generators
    const mapBgUrl = useMemo(
      () => getGenImageUrl(IMG_PROMPTS.OVERWORLD_MAP),
      []
    )
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
      return Object.values(nodes as Record<string, unknown>).map((node: unknown) => {
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
            ticketPrice={effectivePrice}
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
      pinRestUrl,
      pinSpecialUrl,
      pinFinaleUrl,
      vanUrl,
      activeStoryFlags,
      setHoveredNode
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
          t={t}
          isTraveling={isTraveling}
          currentNode={currentNode}
          travelTarget={travelTarget}
          vanUrl={vanUrl}
          travelCompletedRef={travelCompletedRef}
          onTravelComplete={onTravelComplete}
        />
      </div>
    )
  }
)

OverworldMap.displayName = 'OverworldMap'
