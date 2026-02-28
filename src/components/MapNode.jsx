import { memo, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'
import { HexNode } from '../ui/shared'

const VAN_STYLE = { transform: 'translate(0, -50%)' }
const MOTION_INITIAL = { scale: 0 }
const MOTION_ANIMATE = { scale: 1 }
const MOTION_HOVER = { scale: 1.2, zIndex: 60 }
const MOTION_NO_HOVER = {}

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
  }) => {
    const { t } = useTranslation(['venues', 'ui'])
    const [isHoveredLocal, setIsHoveredLocal] = useState(false)

    const positionStyle = useMemo(
      () => ({ left: `${node.x}%`, top: `${node.y}%` }),
      [node.x, node.y]
    )

    // Determine visuals based on props
    if (visibility === 'hidden' && node.type !== 'START') {
      return (
        <div
          className='absolute w-6 h-6 flex items-center justify-center text-(--ash-gray) pointer-events-none'
          style={positionStyle}
        >
          ?
        </div>
      )
    }

    return (
      <div
        className={`absolute flex flex-col items-center justify-center w-32 h-40 -ml-16 -mt-20 group
          ${isCurrent ? 'z-50' : 'z-10'}
          ${!isReachable && !isCurrent ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}
          ${isReachable ? 'cursor-pointer' : ''}
      `}
        style={positionStyle}
        onClick={() => handleTravel(node)}
        onMouseEnter={() => {
          setHoveredNode(node)
          setIsHoveredLocal(true)
        }}
        onMouseLeave={() => {
          setHoveredNode(null)
          setIsHoveredLocal(false)
        }}
        onFocus={() => {
          if (isReachable) {
            setHoveredNode(node)
            setIsHoveredLocal(true)
          }
        }}
        onBlur={() => {
          if (isReachable) {
            setHoveredNode(null)
          }
          setIsHoveredLocal(false)
        }}
        role={isReachable ? 'button' : undefined}
        aria-label={
          isReachable
            ? t('ui:map.travel_to', {
                name: t(node.venue?.name)
              }) +
              (isPendingConfirm
                ? t('ui:map.click_to_confirm')
                : '')
            : undefined
        }
        tabIndex={isReachable ? 0 : undefined}
        onKeyDown={
          isReachable
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleTravel(node)
                }
              }
            : undefined
        }
      >
        {/* Target Crosshairs (appear on hover/focus) */}
        <div className={`absolute inset-0 border border-(--toxic-green)/30 transition-all duration-300 pointer-events-none z-0 ${isHoveredLocal || isPendingConfirm ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
          <div className="absolute top-0 left-1/2 w-[1px] h-4 bg-(--toxic-green) -translate-x-1/2 -translate-y-2"></div>
          <div className="absolute bottom-0 left-1/2 w-[1px] h-4 bg-(--toxic-green) -translate-x-1/2 translate-y-2"></div>
          <div className="absolute left-0 top-1/2 w-4 h-[1px] bg-(--toxic-green) -translate-y-1/2 -translate-x-2"></div>
          <div className="absolute right-0 top-1/2 w-4 h-[1px] bg-(--toxic-green) -translate-y-1/2 translate-x-2"></div>
        </div>

        {isCurrent && !isTraveling && (
          <div className='absolute pointer-events-none z-50' style={VAN_STYLE}>
            <img
              src={vanUrl}
              alt={t('ui:map.vanAlt')}
              className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--toxic-green)]'
            />
          </div>
        )}

        <motion.div
          initial={MOTION_INITIAL}
          animate={MOTION_ANIMATE}
          whileHover={isReachable ? MOTION_HOVER : MOTION_NO_HOVER}
          whileFocus={isReachable ? MOTION_HOVER : MOTION_NO_HOVER}
          className="relative z-10 flex items-center justify-center"
        >
           <HexNode className={`w-12 h-12 transition-all duration-200 ${isHoveredLocal || isPendingConfirm ? 'text-(--star-white) drop-shadow-[0_0_15px_var(--toxic-green)]' : 'text-(--toxic-green)'}`} />
           {/* Center icon overlay if needed, or replace HexNode entirely based on type */}
           <div className="absolute inset-0 flex items-center justify-center mix-blend-difference pointer-events-none">
             <span className="text-(--void-black) font-bold text-[10px]">
               {node.type === 'GIG' ? t('ui:map.nodeType.gig') : node.type === 'REST_STOP' ? t('ui:map.nodeType.rest') : t('ui:map.nodeType.fallback', { type: node.type.substring(0,3) })}
             </span>
           </div>
        </motion.div>

        {/* Pending confirmation label */}
        {isPendingConfirm && (
          <div className='absolute top-0 left-1/2 -translate-x-1/2 text-(--warning-yellow) text-[10px] font-bold whitespace-nowrap pointer-events-none animate-pulse bg-(--void-black)/80 px-1.5 py-0.5 border border-(--warning-yellow) z-20'>
            {t('ui:map.confirm_q')}
          </div>
        )}

        {/* Node Label (Always visible, matching BrutalistUI style) */}
        <div className="mt-2 flex flex-col items-center z-10 pointer-events-none">
          <span className={`text-[10px] font-bold tracking-widest uppercase text-center transition-colors ${isHoveredLocal || isPendingConfirm ? 'text-(--star-white)' : 'text-(--toxic-green)'}`}>
            {t(node.venue?.name) || t('ui:map.unknown')}
          </span>
        </div>

        <div className='hidden group-hover:block group-focus:block absolute top-full mt-2 bg-(--void-black)/90 border border-(--toxic-green) p-2 z-50 whitespace-nowrap pointer-events-none'>
          <div className='font-bold text-(--toxic-green)'>
            {t(node.venue?.name) ||
              t('ui:map.unknown')}
          </div>
          {(node.type === 'GIG' ||
            node.type === 'FESTIVAL' ||
            node.type === 'FINALE') && (
            <div className='text-[10px] text-(--ash-gray) font-mono'>
              {node.type === 'FESTIVAL' && (
                <div className='text-(--warning-yellow) font-bold mb-1'>
                  {t('ui:map.festival')}
                </div>
              )}
              {t('ui:map.cap')}: {node.venue?.capacity}{' '}
              | {t('ui:map.pay')}: ~{node.venue?.pay}
              {'\u20AC'}
              <br />
              {t('ui:map.ticket')}:{' '}
              {ticketPrice ?? node.venue?.price}
              {'\u20AC'} | {t('ui:map.diff')}:{' '}
              {'\u2605'.repeat(node.venue?.diff || 0)}
            </div>
          )}
          {node.type === 'REST_STOP' && (
            <div className='text-[10px] text-(--warning-yellow) font-mono'>
              {t('ui:map.rest_stop_desc')}
            </div>
          )}
          {node.type === 'SPECIAL' && (
            <div className='text-[10px] text-(--purple-glow) font-mono'>
              {t('ui:map.mystery_desc')}
            </div>
          )}
          {node.type === 'FINALE' && (
            <div className='text-[10px] text-(--warning-yellow) font-mono font-bold'>
              {t('ui:map.finale_desc')}
            </div>
          )}
          {isCurrent && (
            <div className='text-(--blood-red) text-xs font-bold'>
              {t('ui:map.current_location')}
            </div>
          )}
        </div>
      </div>
    )
  },
  (prev, next) => {
    return (
      prev.node.id === next.node.id &&
      prev.isCurrent === next.isCurrent &&
      prev.isTraveling === next.isTraveling &&
      prev.visibility === next.visibility &&
      prev.isReachable === next.isReachable &&
      prev.isPendingConfirm === next.isPendingConfirm &&
      prev.iconUrl === next.iconUrl &&
      prev.vanUrl === next.vanUrl &&
      prev.handleTravel === next.handleTravel &&
      prev.setHoveredNode === next.setHoveredNode &&
      prev.ticketPrice === next.ticketPrice
    )
  }
)

MapNode.displayName = 'MapNode'
MapNode.propTypes = {
  node: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    venue: PropTypes.shape({
      name: PropTypes.string,
      capacity: PropTypes.number,
      pay: PropTypes.number,
      price: PropTypes.number,
      diff: PropTypes.number
    })
  }).isRequired,
  isCurrent: PropTypes.bool.isRequired,
  isTraveling: PropTypes.bool.isRequired,
  visibility: PropTypes.string.isRequired,
  isReachable: PropTypes.bool.isRequired,
  isPendingConfirm: PropTypes.bool,
  handleTravel: PropTypes.func.isRequired,
  setHoveredNode: PropTypes.func.isRequired,
  iconUrl: PropTypes.string.isRequired,
  vanUrl: PropTypes.string.isRequired,
  ticketPrice: PropTypes.number
}
