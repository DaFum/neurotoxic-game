import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'

const LANE_NAMES = ['Guitar', 'Drums', 'Bass']
const LANE_INDICES = [0, 1, 2]

const LaneInputZone = memo(function LaneInputZone({ laneIndex, onLaneInput }) {
  const handleMouseDown = useCallback(
    () => onLaneInput?.(laneIndex, true),
    [laneIndex, onLaneInput]
  )
  const handleMouseUp = useCallback(
    () => onLaneInput?.(laneIndex, false),
    [laneIndex, onLaneInput]
  )
  const handleTouchStart = useCallback(
    e => {
      e.preventDefault()
      onLaneInput?.(laneIndex, true)
    },
    [laneIndex, onLaneInput]
  )
  const handleTouchEnd = useCallback(
    e => {
      e.preventDefault()
      onLaneInput?.(laneIndex, false)
    },
    [laneIndex, onLaneInput]
  )

  return (
    <div
      role='button'
      aria-label={`${LANE_NAMES[laneIndex]} lane`}
      className='flex-1 h-full cursor-pointer hover:bg-(--star-white)/5 active:bg-(--star-white)/10 transition-colors duration-75 pointer-events-auto relative'
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Separator lines between lanes */}
      {laneIndex < 2 && (
        <div className='absolute right-0 top-0 h-full w-[1px] bg-(--toxic-green)/10 pointer-events-none' />
      )}
    </div>
  )
})

LaneInputZone.propTypes = {
  laneIndex: PropTypes.number.isRequired,
  onLaneInput: PropTypes.func
}

export const LaneInputArea = memo(function LaneInputArea({ onLaneInput }) {
  return (
    <div className='absolute inset-0 z-40 flex pb-16 pt-32 pointer-events-none'>
      {LANE_INDICES.map(laneIndex => (
        <LaneInputZone
          key={LANE_NAMES[laneIndex]}
          laneIndex={laneIndex}
          onLaneInput={onLaneInput}
        />
      ))}
    </div>
  )
})

LaneInputArea.propTypes = {
  onLaneInput: PropTypes.func
}
