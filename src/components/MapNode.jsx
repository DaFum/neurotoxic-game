import { memo } from 'react'
import PropTypes from 'prop-types'
import { motion } from 'framer-motion'

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
    vanUrl
  }) => {
    // Determine visuals based on props
    if (visibility === 'hidden' && node.type !== 'START') {
      return (
        <div
          className='absolute w-6 h-6 flex items-center justify-center text-(--ash-gray) pointer-events-none'
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
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
        style={{ left: `${node.x}%`, top: `${node.y}%` }}
        onClick={() => handleTravel(node)}
        onMouseEnter={() => setHoveredNode(node)}
        onMouseLeave={() => setHoveredNode(null)}
        role={isReachable ? 'button' : undefined}
        aria-label={
          isReachable
            ? `Travel to ${node.venue?.name}${isPendingConfirm ? ' - click to confirm' : ''}`
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
          <div
            className='absolute pointer-events-none z-50'
            style={{ transform: 'translate(0, -50%)' }}
          >
            <img
              src={vanUrl}
              alt='Van'
              className='w-12 h-8 object-contain drop-shadow-[0_0_10px_var(--toxic-green)]'
            />
          </div>
        )}

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={isReachable ? { scale: 1.2, zIndex: 60 } : {}}
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
            CONFIRM?
          </div>
        )}

        {/* Default hover label */}
        {isReachable && !isPendingConfirm && (
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
              Cap: {node.venue?.capacity} | Pay: ~{node.venue?.pay}
              {'\u20AC'}
              <br />
              Ticket: {node.venue?.price}
              {'\u20AC'} | Diff: {'\u2605'.repeat(node.venue?.diff || 0)}
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
      prev.setHoveredNode === next.setHoveredNode
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
  vanUrl: PropTypes.string.isRequired
}
