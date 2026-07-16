import React, { useEffect, useMemo, useState } from 'react'
import { MapConnection } from '../MapConnection'
import { MapNodeView } from '../MapNodeView'
import { TravelingVan } from './TravelingVan'
import { calculateEffectiveTicketPrice } from '../../utils/economyEngine'
import { getCityKeyFromVenueId } from '../../utils/mapGenerator'
import { normalizeVenueId } from '../../utils/mapUtils'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { useOverworldUrls } from './hooks'
import { getNodeIconUrl } from './utils'

import type {
  MapNode as GameMapNode,
  GameMap,
  PlayerState,
  RivalBandState,
  BandState
} from '../../types'
import type { TranslationCallback } from '../../types/callbacks'
import type { NodeVisibility } from '../../types/map'

const HARMONY_NODE_TYPES = new Set(['GIG', 'FESTIVAL', 'FINALE'])

interface OverworldMapProps {
  t: TranslationCallback
  gameMap: GameMap | null
  player: PlayerState
  rivalBand: RivalBandState | null
  band: Pick<BandState, 'harmony'>
  currentLayer: number
  isTraveling: boolean
  pendingTravelNode: GameMapNode | null
  getNodeVisibility: (nodeLayer: number, currentLayer: number) => NodeVisibility
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

const RivalMarker = ({
  node,
  rivalVanUrl,
  label
}: {
  node: GameMapNode
  rivalVanUrl: string
  label: string
}) => (
  <div
    className='absolute z-(--z-stage-overlay) pointer-events-none transition-all duration-300'
    style={{
      left: `${node.x}%`,
      top: `${node.y}%`,
      transform: 'translate(-50%, -100%)'
    }}
  >
    <img
      src={rivalVanUrl}
      alt={label}
      crossOrigin={rivalVanUrl.startsWith('data:') ? undefined : 'anonymous'}
      className='w-10 h-8 object-contain drop-shadow-[0_0_8px_var(--color-blood-red-bright)] opacity-90'
    />
  </div>
)

/**
 * Draws the overworld route graph, node markers, rival marker, and animated travel van.
 * @param props - Map state, player state, travel state, node visibility/connectivity helpers, travel handlers, hover state, and visual URL context.
 */
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
    rivalBand,
    band
  }: OverworldMapProps) => {
    const isOnlineNetwork = useNetworkStatus()

    const urls = useOverworldUrls(isOnlineNetwork, t)

    const { mapBgUrl, mapBgFallbackUrl, vanUrl, rivalVanUrl } = urls
    const [mapBackgroundSrc, setMapBackgroundSrc] = useState(mapBgUrl)

    useEffect(() => {
      setMapBackgroundSrc(mapBgUrl)
    }, [mapBgUrl])

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
      const nodes: React.ReactNode[] = []
      const activeStoryFlagsSet = new Set(activeStoryFlags ?? [])
      for (const key in gameMap.nodes) {
        if (!Object.hasOwn(gameMap.nodes, key)) continue
        const node = gameMap.nodes[key as keyof typeof gameMap.nodes]
        if (!node) continue
        const isCurrent = node.id === player.currentNodeId
        const hasRival = rivalBand?.currentLocationId === node.id
        const visibility = getNodeVisibility(node.layer, currentLayer)
        const isReachable = isConnected(node.id) || node.type === 'START'

        const iconUrl = getNodeIconUrl(node.type, urls)

        const nodeVenueId = normalizeVenueId(node.venueId ?? node.venue)
        const cityKey = nodeVenueId ? getCityKeyFromVenueId(nodeVenueId) : ''
        const cityTraits = cityKey ? gameMap?.cityStates?.[cityKey] : undefined

        const effectivePrice = calculateEffectiveTicketPrice(
          node.venue ?? { id: node.id, name: node.id, price: 0 },
          {
            discountedTickets: activeStoryFlagsSet.has(
              'discounted_tickets_active'
            )
          }
        )

        nodes.push(
          <React.Fragment key={node.id}>
            <MapNodeView
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
              harmony={
                HARMONY_NODE_TYPES.has(node.type) ? band.harmony : undefined
              }
              cityTraits={cityTraits}
            />
            {hasRival && visibility !== 'hidden' && (
              <RivalMarker
                node={node}
                rivalVanUrl={rivalVanUrl}
                label={t('ui:overworld.rival_band', {
                  defaultValue: 'Rival Band'
                })}
              />
            )}
          </React.Fragment>
        )
      }
      return nodes
    }, [
      gameMap,
      player.currentNodeId,
      currentLayer,
      isTraveling,
      pendingTravelNode,
      getNodeVisibility,
      isConnected,
      handleTravel,
      urls,
      vanUrl,
      activeStoryFlags,
      setHoveredNode,
      rivalBand?.currentLocationId,
      rivalVanUrl,
      band.harmony,
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
        <img
          src={mapBackgroundSrc}
          alt=''
          aria-hidden='true'
          crossOrigin={
            mapBackgroundSrc.startsWith('data:') ? undefined : 'anonymous'
          }
          className='absolute inset-0 w-full h-full opacity-30 object-cover grayscale invert pointer-events-none'
          onError={() => setMapBackgroundSrc(mapBgFallbackUrl)}
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
