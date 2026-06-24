import { memo, useCallback } from 'react'
import type { TouchEvent as ReactTouchEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { LANE_INDICES } from '../../utils/rhythmGameScoringUtils'

const LANES = [
  { index: LANE_INDICES.GUITAR, id: 'guitar' },
  { index: LANE_INDICES.DRUMS, id: 'drums' },
  { index: LANE_INDICES.BASS, id: 'bass' }
]

/**
 * Defines the props for the lane input area container.
 */
interface LaneInputAreaProps {
  /**
   * Callback triggered when a lane input starts or stops.
   */
  onLaneInput?: (laneIndex: number, isDown: boolean, now?: number) => void
}

/**
 * Defines the properties for an individual lane input zone.
 */
interface LaneInputZoneProps extends LaneInputAreaProps {
  /**
   * The numerical index of the rhythm lane.
   */
  laneIndex: number
  /**
   * The accessible label for the input zone button.
   */
  ariaLabel: string
}

/**
 * Renders an individual, interactive input zone for a specific rhythm lane.
 * @param props - The properties for the lane input zone.
 * @returns The rendered lane input zone button element.
 */
const LaneInputZone = memo(function LaneInputZone({
  laneIndex,
  ariaLabel,
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
      aria-label={ariaLabel}
      className='flex-1 h-full cursor-pointer hover:bg-toxic-green/10 hover:border-b-toxic-green active:bg-toxic-green/30 border-b-8 border-transparent active:border-b-blood-red transition-all duration-75 pointer-events-auto relative focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-toxic-green focus-visible:ring-inset motion-safe:hover:scale-[1.01]'
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Separator lines between lanes */}
      {laneIndex < 2 && (
        <div className='absolute right-0 top-0 h-full w-1 bg-ash-gray/20 pointer-events-none group-hover:bg-toxic-green/50' />
      )}
    </button>
  )
})

/**
 * Provides the pointer input surface for rhythm lane press/release events.
 * @param props - Props containing the `onLaneInput` callback used by rhythm controls.
 * @returns The rendered container wrapping all lane input zones.
 */
export const LaneInputArea = memo(function LaneInputArea({
  onLaneInput
}: LaneInputAreaProps) {
  const { t } = useTranslation(['ui'])

  return (
    <div className='absolute inset-0 z-(--z-stage-controls) flex pb-20 sm:pb-16 pt-28 sm:pt-32 pointer-events-none'>
      {LANES.map(lane => (
        <LaneInputZone
          key={lane.id}
          laneIndex={lane.index}
          ariaLabel={t('ui:rhythm.hit_lane', {
            lane: t(`ui:rhythm.lane_${lane.id}`),
            defaultValue: 'Hit {{lane}} lane'
          })}
          onLaneInput={onLaneInput}
        />
      ))}
    </div>
  )
})
