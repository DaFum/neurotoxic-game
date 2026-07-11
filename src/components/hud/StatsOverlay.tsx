import { memo } from 'react'
import { ScoreDisplay } from './ScoreDisplay'
import { ComboDisplay } from './ComboDisplay'
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
}

/**
 * Renders the primary status tracking overlay for active gigs.
 * It displays the score, combo, and accuracy readouts; the overload and
 * corruption meters live in the top-edge meter bar owned by `GigHUD`.
 *
 * @returns A React element rendering the floating status HUD.
 */
export const StatsOverlay = memo(function StatsOverlay({
  score,
  combo,
  accuracy
}: StatsOverlayProps) {
  return (
    <div className='absolute top-20 left-4 max-sm:top-16 max-sm:left-2 max-sm:scale-75 max-sm:origin-top-left max-sm:flex max-sm:flex-col max-sm:items-start z-(--z-stage-overlay) text-star-white font-mono pointer-events-none p-4 group bg-void-black/40 backdrop-blur-sm border-l-2 border-toxic-green'>
      <UIFrameCorner className='absolute top-0 left-0 w-4 h-4 text-toxic-green opacity-80' />
      <UIFrameCorner className='absolute top-0 right-0 w-4 h-4 text-ash-gray rotate-90 opacity-50' />
      <UIFrameCorner className='absolute bottom-0 right-0 w-4 h-4 text-ash-gray rotate-180 opacity-50' />
      <UIFrameCorner className='absolute bottom-0 left-0 w-4 h-4 text-ash-gray -rotate-90 opacity-50' />

      <ScoreDisplay score={score} />
      <ComboDisplay combo={combo} accuracy={accuracy} />
    </div>
  )
})
