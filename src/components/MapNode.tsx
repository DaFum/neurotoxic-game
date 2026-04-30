import { memo, useCallback, useMemo, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent
} from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { HexNode } from '../ui/shared'
import { translateLocation } from '../utils/locationI18n'
import type { MapNode as GameMapNode } from '../types/game'
import type { TranslationCallback } from '../types/callbacks'

const VAN_STYLE = { transform: 'translate(0, -50%)' }
const MOTION_INITIAL = { scale: 0 }
const MOTION_ANIMATE = { scale: 1 }
const MOTION_HOVER = { scale: 1.2, zIndex: 60 }
const MOTION_NO_HOVER = {}
type NodeVisibility = 'visible' | 'dimmed' | 'hidden'

interface MapVenueData {
  id?: string
  name?: string
  capacity?: number
  pay?: number
  price?: number
  diff?: number
  [key: string]: unknown
}

interface MapNodeData extends GameMapNode {
  type: string
  venue?: MapVenueData
}

interface MapNodeTooltipProps {
  node: MapNodeData
  isCurrent: boolean
  nodeLocationName: string
  ticketPrice?: number
  t: TranslationCallback
}

interface MapNodeProps {
  node: MapNodeData
  isCurrent: boolean
  isTraveling: boolean
  visibility: NodeVisibility
  isReachable: boolean
  isPendingConfirm?: boolean
  handleTravel: (node: MapNodeData) => void
  setHoveredNode: (node: MapNodeData | null) => void
  iconUrl: string
  vanUrl: string
  ticketPrice?: number
}

const getPinAltText = (t: TranslationCallback, type: string): string => {
  return t('ui:map.pinTypeAlt', {
    type: t('ui:map.nodeType.fallback', {
      type: type.replace('_', ' ')
    })
  })
}

const getNodeTypeLabel = (t: TranslationCallback, type: string): string => {
  if (type === 'GIG') return t('ui:map.nodeType.gig')
  if (type === 'REST_STOP') return t('ui:map.nodeType.rest')
  return t('ui:map.nodeType.fallback', {
    type: type.substring(0, 3)
  })
}

const MapNodeTooltip = memo(
  ({
    node,
    isCurrent,
    nodeLocationName,
    ticketPrice,
    t
  }: MapNodeTooltipProps) => {
    return (
      <div className='hidden group-hover:block group-focus:block absolute top-full mt-2 bg-void-black/90 border border-toxic-green p-2 z-50 whitespace-nowrap pointer-events-none'>
        <div className='font-bold text-toxic-green'>{nodeLocationName}</div>
        {(node.type === 'GIG' ||
          node.type === 'FESTIVAL' ||
          node.type === 'FINALE') && (
          <div className='text-[10px] text-ash-gray font-mono'>
            {node.type === 'FESTIVAL' && (
              <div className='text-warning-yellow font-bold mb-1'>
                {t('ui:map.festival')}
              </div>
            )}
            {t('ui:map.cap')}: {node.venue?.capacity} | {t('ui:map.pay')}: ~
            {node.venue?.pay}
            {'\u20AC'}
            <br />
            {t('ui:map.ticket')}: {ticketPrice ?? node.venue?.price}
            {'\u20AC'} | {t('ui:map.diff')}:{' '}
            {'\u2605'.repeat(node.venue?.diff || 0)}
          </div>
        )}
        {node.type === 'REST_STOP' && (
          <div className='text-[10px] text-warning-yellow font-mono'>
            {t('ui:map.rest_stop_desc')}
          </div>
        )}
        {node.type === 'SPECIAL' && (
          <div className='text-[10px] text-purple-glow font-mono'>
            {t('ui:map.mystery_desc')}
          </div>
        )}
        {node.type === 'FINALE' && (
          <div className='text-[10px] text-warning-yellow font-mono font-bold'>
            {t('ui:map.finale_desc')}
          </div>
        )}
        {isCurrent && (
          <div className='text-blood-red text-xs font-bold'>
            {t('ui:map.current_location')}
          </div>
        )}
      </div>
    )
  }
)

MapNodeTooltip.displayName = 'MapNodeTooltip'

export const MapNode = memo(
  ({
    node,
    isCurrent,
    isTraveling,
    visibility,
    isReachable,
    isPendingConfirm,
    handleTravel,
    setHoveredNode,
    iconUrl,
    vanUrl,
    ticketPrice
  }: MapNodeProps) => {
    const { t } = useTranslation(['venues', 'ui'])
    const [isHoveredLocal, setIsHoveredLocal] = useState(false)

    const handleClick = useCallback(
      () => handleTravel(node),
      [handleTravel, node]
    )

    const handleKeyDown = useCallback(
      (e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleTravel(node)
        }
      },
      [handleTravel, node]
    )

    const handleMouseEnter = useCallback(() => {
      setHoveredNode(node)
      setIsHoveredLocal(true)
    }, [setHoveredNode, node])

    const handleMouseLeave = useCallback(() => {
      setHoveredNode(null)
      setIsHoveredLocal(false)
    }, [setHoveredNode, setIsHoveredLocal])

    const handlePointerDown = useCallback(() => {
      if (isReachable) {
        setHoveredNode(node)
        setIsHoveredLocal(true)
      }
    }, [isReachable, setHoveredNode, node])

    const handlePointerCancel = useCallback(() => {
      setHoveredNode(null)
      setIsHoveredLocal(false)
    }, [setHoveredNode, setIsHoveredLocal])

    const handlePointerEnd = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>) => {
        if (e.pointerType !== 'mouse') {
          setHoveredNode(null)
          setIsHoveredLocal(false)
        }
      },
      [setHoveredNode, setIsHoveredLocal]
    )

    const handleFocus = useCallback(() => {
      if (isReachable) {
        setHoveredNode(node)
        setIsHoveredLocal(true)
      }
    }, [isReachable, setHoveredNode, node])

    const handleBlur = useCallback(() => {
      if (isReachable) {
        setHoveredNode(null)
      }
      setIsHoveredLocal(false)
    }, [isReachable, setHoveredNode])

    const nodeLocationName = translateLocation(
      t,
      node.venue?.name,
      t('ui:map.unknown')
    )

    const positionStyle = useMemo(
      () => ({ left: `${node.x}%`, top: `${node.y}%` }),
      [node.x, node.y]
    )

    // Determine visuals based on props
    if (visibility === 'hidden' && node.type !== 'START') {
      return (
        <div
          className='absolute w-6 h-6 flex items-center justify-center text-ash-gray pointer-events-none'
          style={positionStyle}
        >
          ?
        </div>
      )
    }

    return (
      <div
        className={`map-node ${isReachable ? 'clickable' : ''} absolute flex flex-col items-center justify-center w-16 h-20 -ml-8 -mt-10 group
          ${isCurrent ? 'z-50' : 'z-10'}
          ${!isReachable && !isCurrent ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}
          ${isReachable ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black' : ''}
      `}
        style={positionStyle}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        onPointerCancel={handlePointerCancel}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-label={
          isReachable
            ? t('ui:map.travel_to', {
                name: nodeLocationName
              }) + (isPendingConfirm ? t('ui:map.click_to_confirm') : '')
            : undefined
        }
        role={isReachable ? 'button' : undefined}
        tabIndex={isReachable ? 0 : -1}
        onKeyDown={isReachable ? handleKeyDown : undefined}
      >
        {/* Target Crosshairs (appear on hover/focus) */}
        <div
          className={`absolute inset-0 border border-toxic-green/30 transition-all duration-300 pointer-events-none z-0 ${isHoveredLocal || isPendingConfirm ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
        >
          <div className='absolute top-0 left-1/2 w-[1px] h-4 bg-toxic-green -translate-x-1/2 -translate-y-2'></div>
          <div className='absolute bottom-0 left-1/2 w-[1px] h-4 bg-toxic-green -translate-x-1/2 translate-y-2'></div>
          <div className='absolute left-0 top-1/2 w-4 h-[1px] bg-toxic-green -translate-y-1/2 -translate-x-2'></div>
          <div className='absolute right-0 top-1/2 w-4 h-[1px] bg-toxic-green -translate-y-1/2 translate-x-2'></div>
        </div>

        {isCurrent && !isTraveling && (
          <div className='absolute pointer-events-none z-50' style={VAN_STYLE}>
            <img
              src={vanUrl}
              alt={t('ui:map.vanAlt')}
              className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--color-toxic-green)]'
            />
          </div>
        )}

        <motion.div
          initial={MOTION_INITIAL}
          animate={MOTION_ANIMATE}
          whileHover={isReachable ? MOTION_HOVER : MOTION_NO_HOVER}
          whileFocus={isReachable ? MOTION_HOVER : MOTION_NO_HOVER}
          className='relative z-10 flex items-center justify-center'
        >
          <HexNode
            className={`w-12 h-12 transition-all duration-200 ${isHoveredLocal || isPendingConfirm ? 'text-star-white drop-shadow-[0_0_15px_var(--color-toxic-green)]' : 'text-toxic-green'}`}
          />

          <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
            <img
              src={iconUrl}
              alt={getPinAltText(t, node.type)}
              className='w-6 h-6 object-contain drop-shadow-[0_0_8px_var(--color-void-black)]'
            />
          </div>
        </motion.div>

        <div className='text-[9px] font-bold uppercase tracking-wide text-ash-gray mt-1 pointer-events-none'>
          {getNodeTypeLabel(t, node.type)}
        </div>

        {/* Pending confirmation label */}
        {isPendingConfirm && (
          <div className='absolute top-0 left-1/2 -translate-x-1/2 text-warning-yellow text-[10px] font-bold whitespace-nowrap pointer-events-none animate-pulse bg-void-black/80 px-1.5 py-0.5 border border-warning-yellow z-20'>
            {t('ui:map.confirm_q')}
          </div>
        )}

        {/* Node Label (Always visible, matching BrutalistUI style) */}
        <div className='mt-2 flex flex-col items-center z-10 pointer-events-none'>
          <span
            className={`text-[10px] font-bold tracking-widest uppercase text-center transition-colors ${isHoveredLocal || isPendingConfirm ? 'text-star-white' : 'text-toxic-green'}`}
          >
            {nodeLocationName}
          </span>
        </div>

        <MapNodeTooltip
          node={node}
          isCurrent={isCurrent}
          nodeLocationName={nodeLocationName}
          ticketPrice={ticketPrice}
          t={t}
        />
      </div>
    )
  },
  (prev: Readonly<MapNodeProps>, next: Readonly<MapNodeProps>) => {
    return (
      prev.node.id === next.node.id &&
      prev.node.x === next.node.x &&
      prev.node.y === next.node.y &&
      prev.isCurrent === next.isCurrent &&
      prev.isTraveling === next.isTraveling &&
      prev.visibility === next.visibility &&
      prev.isReachable === next.isReachable &&
      prev.isPendingConfirm === next.isPendingConfirm &&
      prev.iconUrl === next.iconUrl &&
      prev.vanUrl === next.vanUrl &&
      prev.handleTravel === next.handleTravel &&
      prev.setHoveredNode === next.setHoveredNode &&
      prev.ticketPrice === next.ticketPrice &&
      prev.node.type === next.node.type &&
      prev.node.venue?.capacity === next.node.venue?.capacity &&
      prev.node.venue?.name === next.node.venue?.name &&
      prev.node.venue?.pay === next.node.venue?.pay &&
      prev.node.venue?.diff === next.node.venue?.diff &&
      prev.node.venue?.price === next.node.venue?.price
    )
  }
)

MapNode.displayName = 'MapNode'
