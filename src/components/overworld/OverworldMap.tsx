import React, { useMemo } from 'react'
import { MapConnection } from '../MapConnection'
import { MapNode } from '../MapNode'
import { TravelingVan } from './TravelingVan'
import { calculateEffectiveTicketPrice } from '../../utils/economyEngine'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import {
  getGenImageUrl,
  IMG_PROMPTS,
  isImageGenerationAvailable,
  getGeneratedImageFallbackUrl
} from '../../utils/imageGen'
import type {
  MapNode as GameMapNode,
  GameMap,
  PlayerState,
  RivalBandState
} from '../../types/game'
import type { TranslationCallback } from '../../types/callbacks'

interface OverworldMapProps {
  t: TranslationCallback
  gameMap: GameMap | null
  player: PlayerState
  rivalBand: RivalBandState | null
  currentLayer: number
  isTraveling: boolean
  pendingTravelNode: GameMapNode | null
  getNodeVisibility: (nodeLayer: number, currentLayer: number) => number
  isConnected: (nodeId: string) => boolean
  handleTravel: (node: GameMapNode) => void
  setHoveredNode: React.Dispatch<React.SetStateAction<GameMapNode | null>>
  hoveredNode: GameMapNode | null
  currentNode: GameMapNode | null
  travelTarget: GameMapNode | null
  travelCompletedRef: React.MutableRefObject<boolean>
  onTravelComplete: (node?: GameMapNode) => void
  activeStoryFlags: string[]
}

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
    activeStoryFlags,
    rivalBand
  }: OverworldMapProps) => {
    const isOnlineNetwork = useNetworkStatus()

    // Memoized URL generators
    const urls = useMemo(() => {
      const isOnline = isImageGenerationAvailable() && isOnlineNetwork
      const createOfflineSvgUrl = (svgMarkup: string) =>
        `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`
      const createOfflinePinUrl = (label: string, symbol: string) =>
        createOfflineSvgUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${label}">
            <circle cx="32" cy="24" r="16" fill="white" stroke="black" stroke-width="3"/>
            <path d="M32 58 21 34h22L32 58Z" fill="white" stroke="black" stroke-width="3" stroke-linejoin="round"/>
            <text x="32" y="29" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="black">${symbol}</text>
          </svg>
        `)
      const createOfflineVanUrl = (label: string, text: string) =>
        createOfflineSvgUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${label}">
            <rect x="10" y="20" width="34" height="20" rx="4" fill="white" stroke="black" stroke-width="3"/>
            <path d="M44 26h10l4 8v6H44Z" fill="white" stroke="black" stroke-width="3" stroke-linejoin="round"/>
            <circle cx="22" cy="44" r="5" fill="white" stroke="black" stroke-width="3"/>
            <circle cx="48" cy="44" r="5" fill="white" stroke="black" stroke-width="3"/>
            <text x="31" y="34" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="700" fill="black">${text}</text>
          </svg>
        `)
      const offlineAssets = {
        mapBgUrl: createOfflineSvgUrl(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" role="img" aria-label="Offline overworld map">
            <rect width="800" height="450" fill="white"/>
            <path d="M40 360C140 320 220 330 320 290S520 210 620 230s100 40 140 20" fill="none" stroke="black" stroke-width="10" stroke-linecap="round"/>
            <path d="M90 110c40 10 70 40 120 30s90-50 150-30 100 70 170 60 110-60 170-50" fill="none" stroke="black" stroke-width="6" stroke-dasharray="18 12" stroke-linecap="round"/>
            <text x="400" y="60" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="700" fill="black">OFFLINE MAP</text>
            <text x="400" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="black">Routes and markers remain distinct while offline</text>
          </svg>
        `),
        vanUrl: createOfflineVanUrl('Player van', 'YOU'),
        rivalVanUrl: createOfflineVanUrl('Rival van', 'RIVAL'),
        pinFestivalUrl: createOfflinePinUrl('Festival node', 'F'),
        pinHomeUrl: createOfflinePinUrl('Home node', 'H'),
        pinClubUrl: createOfflinePinUrl('Club node', 'C'),
        pinRestUrl: createOfflinePinUrl('Rest node', 'R'),
        pinSpecialUrl: createOfflinePinUrl('Special node', 'S'),
        pinFinaleUrl: createOfflinePinUrl('Finale node', '!')
      }
      const fallback = getGeneratedImageFallbackUrl()
      return {
        mapBgUrl: isOnline
          ? getGenImageUrl(IMG_PROMPTS.OVERWORLD_MAP)
          : offlineAssets.mapBgUrl || fallback,
        vanUrl: isOnline
          ? getGenImageUrl(IMG_PROMPTS.ICON_VAN)
          : offlineAssets.vanUrl || fallback,
        rivalVanUrl: isOnline
          ? getGenImageUrl(IMG_PROMPTS.ICON_RIVAL_VAN)
          : offlineAssets.rivalVanUrl || fallback,
        pinFestivalUrl: isOnline
          ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_FESTIVAL)
          : offlineAssets.pinFestivalUrl || fallback,
        pinHomeUrl: isOnline
          ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_HOME)
          : offlineAssets.pinHomeUrl || fallback,
        pinClubUrl: isOnline
          ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_CLUB)
          : offlineAssets.pinClubUrl || fallback,
        pinRestUrl: isOnline
          ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_REST)
          : offlineAssets.pinRestUrl || fallback,
        pinSpecialUrl: isOnline
          ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_SPECIAL)
          : offlineAssets.pinSpecialUrl || fallback,
        pinFinaleUrl: isOnline
          ? getGenImageUrl(IMG_PROMPTS.ICON_PIN_FINALE)
          : offlineAssets.pinFinaleUrl || fallback
      }
    }, [isOnlineNetwork])

    const {
      mapBgUrl,
      vanUrl,
      rivalVanUrl,
      pinFestivalUrl,
      pinHomeUrl,
      pinClubUrl,
      pinRestUrl,
      pinSpecialUrl,
      pinFinaleUrl
    } = urls

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
      return Object.values(gameMap.nodes).map(node => {
        const isCurrent = node.id === player.currentNodeId
        const hasRival = rivalBand?.currentLocationId === node.id
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
          <React.Fragment key={node.id}>
            <MapNode
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
            {hasRival && visibility > 0 && (
              <div
                className='absolute z-30 pointer-events-none transition-all duration-300'
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <img
                  src={rivalVanUrl}
                  alt={t('ui:overworld.rival_band', {
                    defaultValue: 'Rival Band'
                  })}
                  className='w-10 h-8 object-contain drop-shadow-[0_0_8px_var(--color-toxic-red)] opacity-90'
                />
              </div>
            )}
          </React.Fragment>
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
      setHoveredNode,
      rivalBand?.currentLocationId,
      rivalVanUrl,
      t
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
      <div className='map-wrap'>
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
