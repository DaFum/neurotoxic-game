import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'

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
        className={`absolute flex flex-col items-center group
          ${isCurrent ? 'z-50' : 'z-10'}
          ${!isReachable && !isCurrent ? 'opacity-30 grayscale pointer-events-none' : 'opacity-100'}
          ${isReachable ? 'cursor-pointer' : ''}
      `}
        style={positionStyle}
        onClick={() => handleTravel(node)}
        onMouseEnter={() => setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
        role={isReachable ? 'button' : undefined}
        aria-label={
          isReachable
            ? t('map.travel_to', {
                name: t(node.venue?.name),
                defaultValue: `Travel to ${t(node.venue?.name)}`
              }) +
              (isPendingConfirm
                ? t('map.click_to_confirm', {
                    defaultValue: ' - click to confirm'
                  })
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
        {isCurrent && !isTraveling && (
          <div className='absolute pointer-events-none z-50' style={VAN_STYLE}>
            <img
              src={vanUrl}
              alt='Van'
              className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--toxic-green)]'
            />
          </div>
        )}

        <motion.div
          initial={MOTION_INITIAL}
          animate={MOTION_ANIMATE}
          whileHover={isReachable ? MOTION_HOVER : MOTION_NO_HOVER}
        >
          <img
            src={iconUrl}
            alt='Pin'
            className={`w-6 h-6 md:w-8 md:h-8 object-contain drop-shadow-md
                  ${isPendingConfirm ? 'drop-shadow-[0_0_14px_var(--warning-yellow)] animate-confirm-pulse' : ''}
                  ${isReachable && !isPendingConfirm ? 'drop-shadow-[0_0_10px_var(--toxic-green)] animate-pulse' : ''}`}
          />
        </motion.div>

        {/* Pending confirmation label */}
        {isPendingConfirm && (
          <div className='absolute -top-7 left-1/2 -translate-x-1/2 text-(--warning-yellow) text-[10px] font-bold whitespace-nowrap pointer-events-none animate-pulse bg-(--void-black)/80 px-1.5 py-0.5 border border-(--warning-yellow)'>
            {t('map.confirm_q', { defaultValue: 'CONFIRM?' })}
          </div>
        )}

        {/* Default hover label */}
        {isReachable && !isPendingConfirm && (
          <div className='absolute -top-6 left-1/2 -translate-x-1/2 text-(--toxic-green) text-[10px] font-bold animate-bounce whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none'>
            {t('map.click_to_travel', { defaultValue: 'CLICK TO TRAVEL' })}
          </div>
        )}

        <div className='hidden group-hover:block absolute bottom-8 bg-(--void-black)/90 border border-(--toxic-green) p-2 rounded z-50 whitespace-nowrap pointer-events-none'>
          <div className='font-bold text-(--toxic-green)'>
            {t(node.venue?.name) || t('map.unknown', { defaultValue: 'Unknown' })}
          </div>
          {(node.type === 'GIG' ||
            node.type === 'FESTIVAL' ||
            node.type === 'FINALE') && (
            <div className='text-[10px] text-(--ash-gray) font-mono'>
              {node.type === 'FESTIVAL' && (
                <div className='text-(--warning-yellow) font-bold mb-1'>
                  {t('map.festival', { defaultValue: 'FESTIVAL' })}
                </div>
              )}
              {t('map.cap', { defaultValue: 'Cap' })}: {node.venue?.capacity} |{' '}
              {t('map.pay', { defaultValue: 'Pay' })}: ~{node.venue?.pay}
              {'\u20AC'}
              <br />
              {t('map.ticket', { defaultValue: 'Ticket' })}:{' '}
              {ticketPrice ?? node.venue?.price}
              {'\u20AC'} | {t('map.diff', { defaultValue: 'Diff' })}:{' '}
              {'\u2605'.repeat(node.venue?.diff || 0)}
            </div>
          )}
          {node.type === 'REST_STOP' && (
            <div className='text-[10px] text-(--warning-yellow) font-mono'>
              {t('map.rest_stop_desc', {
                defaultValue: 'REST STOP — Recover Stamina & Mood'
              })}
            </div>
          )}
          {node.type === 'SPECIAL' && (
            <div className='text-[10px] text-(--purple-glow,#a855f7) font-mono'>
              {t('map.mystery_desc', {
                defaultValue: 'MYSTERY — Unknown Encounter'
              })}
            </div>
          )}
          {node.type === 'FINALE' && (
            <div className='text-[10px] text-(--warning-yellow) font-mono font-bold'>
              {t('map.finale_desc', {
                defaultValue: '★ FINALE — The Final Show ★'
              })}
            </div>
          )}
          {isCurrent && (
            <div className='text-(--blood-red) text-xs font-bold'>
              {t('map.current_location', { defaultValue: '[CURRENT LOCATION]' })}
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
