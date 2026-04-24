import { memo, useCallback } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import { LANE_INDICES } from '../../utils/rhythmGameScoringUtils'

const LANES = [
  { index: LANE_INDICES.GUITAR, name: 'Guitar' },
  { index: LANE_INDICES.DRUMS, name: 'Drums' },
  { index: LANE_INDICES.BASS, name: 'Bass' }
]

interface LaneInputAreaProps {
  onLaneInput?: (laneIndex: number, isDown: boolean, now?: number) => void
}

interface LaneInputZoneProps extends LaneInputAreaProps {
  laneIndex: number
  laneName: string
}

const LaneInputZone = memo(function LaneInputZone({
  laneIndex,
  laneName,
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
    (e: ReactTouchEvent<HTMLButtonElement>) => {
      e.preventDefault()
      onLaneInput?.(laneIndex, true)
    },
    [laneIndex, onLaneInput]
  )
  const handleTouchEnd = useCallback(
    (e: ReactTouchEvent<HTMLButtonElement>) => {
      e.preventDefault()
      onLaneInput?.(laneIndex, false)
    },
    [laneIndex, onLaneInput]
  )

  return (
    <button
      type='button'
      aria-label={`${laneName} lane`}
      className='flex-1 h-full cursor-pointer hover:bg-star-white/5 active:bg-star-white/10 transition-colors duration-75 pointer-events-auto relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-inset'
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
    </button>
  )
})

export const LaneInputArea = memo(function LaneInputArea({
  onLaneInput
}: LaneInputAreaProps) {
  return (
    <div className='absolute inset-0 z-40 flex pb-16 pt-32 pointer-events-none'>
      {LANES.map(lane => (
        <LaneInputZone
          key={lane.name}
          laneIndex={lane.index}
          laneName={lane.name}
          onLaneInput={onLaneInput}
        />
      ))}
    </div>
  )
})
