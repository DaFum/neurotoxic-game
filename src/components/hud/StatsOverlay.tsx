import { memo } from 'react'
import { ScoreDisplay } from './ScoreDisplay'
import { ComboDisplay } from './ComboDisplay'
import { OverloadMeter } from './OverloadMeter'
import { CorruptionMeter } from './CorruptionMeter'
import { UIFrameCorner } from '../../ui/shared/Icons'

/**
 * Configuration properties for the StatsOverlay component.
 */
interface StatsOverlayProps {
  /** The current gig score. */
  score: number
  /** The current consecutive hit streak. */
  combo: number
  /** The current hit accuracy percentage for the active gig. */
  accuracy: number
  /** The current stage overload value. */
  overload: number
  /** The current corruption level of the system. */
  corruptionLevel: number
  /** Whether a corruption burst effect is actively happening. */
  isCorruptionBurstActive: boolean
}

/**
 * Renders the primary status tracking overlay for active gigs.
 * It displays the score, combo, accuracy, overload, and corruption meters.
 *
 * @returns A React element rendering the floating status HUD.
 */
export const StatsOverlay = memo(function StatsOverlay({
  score,
  combo,
  accuracy,
  overload,
  corruptionLevel,
  isCorruptionBurstActive
}: StatsOverlayProps) {
  return (
    <div className='absolute top-32 left-4 max-sm:top-48 max-sm:left-2 max-sm:scale-75 max-sm:origin-top-left z-(--z-stage-overlay) text-star-white font-mono pointer-events-none p-4 group bg-void-black/40 backdrop-blur-sm border-l-2 border-toxic-green'>
      <UIFrameCorner className='absolute top-0 left-0 w-4 h-4 text-toxic-green opacity-80' />
      <UIFrameCorner className='absolute top-0 right-0 w-4 h-4 text-ash-gray rotate-90 opacity-50' />
      <UIFrameCorner className='absolute bottom-0 right-0 w-4 h-4 text-ash-gray rotate-180 opacity-50' />
      <UIFrameCorner className='absolute bottom-0 left-0 w-4 h-4 text-ash-gray -rotate-90 opacity-50' />

      <ScoreDisplay score={score} />
      <ComboDisplay combo={combo} accuracy={accuracy} />
      <OverloadMeter overload={overload} />
      <CorruptionMeter
        corruptionLevel={corruptionLevel}
        isCorruptionBurstActive={isCorruptionBurstActive}
      />
    </div>
  )
})
