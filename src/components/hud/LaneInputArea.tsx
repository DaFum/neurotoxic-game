import { memo, useCallback } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import { LANE_INDICES } from '../../utils/rhythmGameScoringUtils'

const LANE_NAMES = ['Guitar', 'Drums', 'Bass']

interface LaneInputAreaProps {
  onLaneInput?: (laneIndex: number, isDown: boolean, now?: number) => void
}

interface LaneInputZoneProps extends LaneInputAreaProps {
  laneIndex: number
}

const LaneInputZone = memo(function LaneInputZone({
  laneIndex,
  onLaneInput
}: LaneInputZoneProps) {
  const handleMouseDown = useCallback(
    () => onLaneInput?.(laneIndex, true),
    [laneIndex, onLaneInput]
  )
  const handleMouseUp = useCallback(
    () => onLaneInput?.(laneIndex, false),
    [laneIndex, onLaneInput]
  )
  const handleTouchStart = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      e.preventDefault()
      onLaneInput?.(laneIndex, true)
    },
    [laneIndex, onLaneInput]
  )
  const handleTouchEnd = useCallback(
    (e: ReactTouchEvent<HTMLDivElement>) => {
      e.preventDefault()
      onLaneInput?.(laneIndex, false)
    },
    [laneIndex, onLaneInput]
  )

  return (
    <div
      role='button'
      aria-label={`${LANE_NAMES[laneIndex]} lane`}
      className='flex-1 h-full cursor-pointer hover:bg-star-white/5 active:bg-star-white/10 transition-colors duration-75 pointer-events-auto relative'
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Separator lines between lanes */}
      {laneIndex < 2 && (
        <div className='absolute right-0 top-0 h-full w-[1px] bg-toxic-green/10 pointer-events-none' />
      )}
    </div>
  )
})

export const LaneInputArea = memo(function LaneInputArea({
  onLaneInput
}: LaneInputAreaProps) {
  return (
    <div className='absolute inset-0 z-40 flex pb-16 pt-32 pointer-events-none'>
      {Object.values(LANE_INDICES).map(laneIndex => (
        <LaneInputZone
          key={LANE_NAMES[laneIndex]}
          laneIndex={laneIndex}
          onLaneInput={onLaneInput}
        />
      ))}
    </div>
  )
})
