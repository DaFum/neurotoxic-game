import { memo, useCallback, useMemo, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent
} from 'react'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { HexNode } from '../ui/shared'
import { FallbackImage } from '../ui/shared/FallbackImage'
import { translateLocation } from '../utils/locationI18n'
import type { MapNode as GameMapNode, CityTraitState } from '../types'
import type { NodeVisibility } from '../types/map'
import type { TranslationCallback } from '../types/callbacks'
import { calcCancellationRisk } from '../utils/gameState'

const VAN_STYLE = { transform: 'translate(0, -50%)' }
const MOTION_INITIAL = { scale: 0 }
const MOTION_ANIMATE = { scale: 1 }
const MOTION_HOVER = { scale: 1.2, zIndex: 60 }
const MOTION_NO_HOVER = {}

/**
 * Represents the data structure of a node on the overworld map.
 */
type MapNodeData = GameMapNode

/**
 * Defines the properties required to render a map node tooltip.
 */
interface MapNodeTooltipProps {
  node: MapNodeData
  isCurrent: boolean
  nodeLocationName: string
  ticketPrice?: number
  t: TranslationCallback
  harmony?: number
  cityTraits?: CityTraitState
  isPendingConfirm?: boolean
}

/**
 * Defines the properties required to render an interactive map node.
 */
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
  harmony?: number
  cityTraits?: CityTraitState
}

/**
 * Generates descriptive alternative text for a map node pin icon.
 * @param t - Localization translation callback
 * @param type - The functional classification of the node
 * @returns The localized alternative text string
 */
const getPinAltText = (t: TranslationCallback, type: string): string => {
  return t('ui:map.pinTypeAlt', {
    type: t('ui:map.nodeType.fallback', {
      type: type.replace('_', ' ')
    })
  })
}

/**
 * Determines the appropriate localized label for a map node type.
 * @param t - Localization translation callback
 * @param type - The functional classification of the node
 * @returns The localized node type label
 */
const getNodeTypeLabel = (t: TranslationCallback, type: string): string => {
  if (type === 'GIG') return t('ui:map.nodeType.gig')
  if (type === 'SUPPLY_STOP')
    return t('ui:map.nodeType.supply_stop', { defaultValue: 'SUPPLY STOP' })
  if (type === 'REST_STOP') return t('ui:map.nodeType.rest')
  return t('ui:map.nodeType.fallback', {
    type: type.substring(0, 3)
  })
}

/**
 * Displays a badge indicating the risk of gig cancellation based on band harmony.
 * @param props - Object containing the current harmony level and translation callback
 */
const CancellationBadge = memo(
  ({ harmony, t }: { harmony: number; t: TranslationCallback }) => {
    const risk = calcCancellationRisk(harmony)
    const pct = (risk * 100).toFixed(1)
    const freqDenom = Math.round(1 / risk)
    const badgeClass =
      risk >= 1
        ? 'text-blood-red font-bold'
        : risk > 0.3
          ? 'text-blood-red'
          : risk > 0.1
            ? 'text-warning-yellow'
            : 'text-toxic-green'

    return (
      <div className={`text-xs font-mono mt-1 ${badgeClass}`}>
        {t('ui:map.cancellationRisk', {
          defaultValue: '⚠ Cancel risk: {{pct}}% (1-in-{{freq}} chance)',
          pct,
          freq: freqDenom
        })}
      </div>
    )
  }
)

/**
 * Renders an informational tooltip for a map node on hover or focus.
 * @remarks
 * Displays node details such as genre bias, capacity, payout, and cancellation risk.
 * Tooltip visibility is controlled by group hover/focus or pending confirmation state.
 * @param props - Tooltip configuration, node data, and display state
 */
const MapNodeTooltip = memo(
  ({
    node,
    isCurrent,
    nodeLocationName,
    ticketPrice,
    t,
    harmony,
    cityTraits,
    isPendingConfirm
  }: MapNodeTooltipProps) => {
    return (
      <div
        className={`${isPendingConfirm ? 'block' : 'hidden group-hover:block group-focus:block'} absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-void-black/90 border border-toxic-green p-2 z-50 w-max max-w-[min(18rem,calc(100vw-2rem))] whitespace-normal break-words text-left pointer-events-none`}
      >
        <div className='font-bold text-toxic-green'>{nodeLocationName}</div>

        {cityTraits && (
          <div className='mt-1 mb-2 pt-1 border-t border-toxic-green/30 text-xs text-ash-gray font-mono flex flex-col gap-0.5'>
            <div className='text-toxic-green/80 font-bold uppercase tracking-wider text-xxs mb-0.5'>
              {t('ui:map.intel.title')}
            </div>
            <div>
              <span className='text-star-white'>
                {t('ui:map.intel.genreBias')}
              </span>{' '}
              {t(`ui:map.intel.genres.${cityTraits.genreBias}`, {
                defaultValue: cityTraits.genreBias
              })}
            </div>
            <div>
              <span className='text-star-white'>
                {t('ui:map.intel.attentionSpan')}
              </span>{' '}
              {cityTraits.attentionSpan}m
            </div>
            <div>
              <span className='text-star-white'>
                {t('ui:map.intel.barSpendingProfile')}
              </span>{' '}
              {t(`ui:map.intel.spending.${cityTraits.barSpendingProfile}`, {
                defaultValue: cityTraits.barSpendingProfile
              })}
            </div>
          </div>
        )}

        {(node.type === 'GIG' ||
          node.type === 'FESTIVAL' ||
          node.type === 'FINALE') && (
          <div className='text-xs text-ash-gray font-mono'>
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
            {'\u2605'.repeat(node.venue?.diff ?? 0)}
          </div>
        )}
        {(node.type === 'GIG' ||
          node.type === 'FESTIVAL' ||
          node.type === 'FINALE') &&
          harmony !== undefined &&
          calcCancellationRisk(harmony) > 0 && (
            <CancellationBadge harmony={harmony} t={t} />
          )}
        {node.type === 'REST_STOP' && (
          <div className='text-xs text-warning-yellow font-mono'>
            {t('ui:map.rest_stop_desc')}
          </div>
        )}
        {node.type === 'SPECIAL' && (
          <div className='text-xs text-void-purple font-mono'>
            {t('ui:map.mystery_desc')}
          </div>
        )}
        {node.type === 'FINALE' && (
          <div className='text-xs text-warning-yellow font-mono font-bold'>
            {t('ui:map.finale_desc')}
          </div>
        )}
        {node.type === 'SUPPLY_STOP' && (
          <div className='text-xs text-toxic-green font-mono'>
            {t('ui:map.supply_stop_desc', { defaultValue: 'Supply Stop' })}
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

/**
 * Displays one overworld map node with state-dependent styling and travel handlers.
 * @param props - Map node configuration, travel state, and interaction handlers
 */
export const MapNodeView = memo(
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
    ticketPrice,
    harmony,
    cityTraits
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
      node.venue?.name ?? '',
      t('ui:map.unknown')
    )

    const positionStyle = useMemo(
      () => ({ left: `${node.x}%`, top: `${node.y}%` }),
      [node.x, node.y]
    )

    // On the cramped mobile map, labels for distant/unreachable nodes pile up
    // and collide. Show labels only for actionable nodes there; desktop keeps
    // all labels. Applied via `max-sm:hidden` so only the small breakpoint hides.
    const labelMobileHiddenClass =
      isCurrent || isReachable || isHoveredLocal || isPendingConfirm
        ? ''
        : 'max-sm:hidden'

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
          ${isCurrent || isHoveredLocal || isPendingConfirm ? 'z-(--z-stage-controls)' : 'z-(--z-stage-bg)'}
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
          <div className='absolute left-0 top-1/2 w-4 h-px bg-toxic-green -translate-y-1/2 -translate-x-2'></div>
          <div className='absolute right-0 top-1/2 w-4 h-px bg-toxic-green -translate-y-1/2 translate-x-2'></div>
        </div>

        {isCurrent && !isTraveling && (
          <div className='absolute pointer-events-none z-50' style={VAN_STYLE}>
            <FallbackImage
              src={vanUrl}
              alt={t('ui:map.vanAlt')}
              className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--color-toxic-green)]'
            />
          </div>
        )}

        <m.div
          initial={MOTION_INITIAL}
          animate={MOTION_ANIMATE}
          whileHover={isReachable ? MOTION_HOVER : MOTION_NO_HOVER}
          whileFocus={isReachable ? MOTION_HOVER : MOTION_NO_HOVER}
          className='relative z-(--z-stage-bg) flex items-center justify-center'
        >
          <HexNode
            className={`w-12 h-12 transition-all duration-200 ${isHoveredLocal || isPendingConfirm ? 'text-star-white drop-shadow-[0_0_15px_var(--color-toxic-green)]' : 'text-toxic-green'}`}
          />

          <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
            <FallbackImage
              src={iconUrl}
              alt={getPinAltText(t, node.type)}
              className='w-6 h-6 object-contain drop-shadow-[0_0_8px_var(--color-void-black)]'
            />
          </div>
        </m.div>

        <div
          className={`text-xxs font-bold uppercase tracking-wide text-ash-gray mt-1 px-1 bg-void-black/90 pointer-events-none ${labelMobileHiddenClass}`}
        >
          {getNodeTypeLabel(t, node.type)}
        </div>

        {/* Pending confirmation label */}
        {isPendingConfirm && (
          <div className='absolute top-0 left-1/2 -translate-x-1/2 text-warning-yellow text-xs font-bold whitespace-nowrap pointer-events-none animate-pulse bg-void-black/80 px-1.5 py-0.5 border border-warning-yellow z-(--z-stage)'>
            {t('ui:map.confirm_q')}
          </div>
        )}

        {/* Node Label (Always visible, matching BrutalistUI style). Opaque chip
            so overlapping labels in dense map clusters occlude cleanly instead
            of blending; the hovered/current node raises its z-index (above) so
            its label reads on top. */}
        <div
          className={`mt-2 flex flex-col items-center z-(--z-stage-bg) pointer-events-none ${labelMobileHiddenClass}`}
        >
          <span
            className={`text-xs font-bold tracking-widest uppercase text-center transition-colors px-1.5 py-0.5 bg-void-black/90 border ${isHoveredLocal || isPendingConfirm ? 'text-star-white border-toxic-green' : 'text-toxic-green border-toxic-green/20'}`}
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
          harmony={harmony}
          cityTraits={cityTraits}
          isPendingConfirm={isPendingConfirm}
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
      prev.node.venue?.price === next.node.venue?.price &&
      prev.harmony === next.harmony &&
      // cityTraits entries are stable references owned by gameMap.cityStates,
      // so reference equality covers all current and future trait fields.
      prev.cityTraits === next.cityTraits
    )
  }
)

MapNodeView.displayName = 'MapNodeView'
