import { memo } from 'react'
import { ScoreDisplay } from './ScoreDisplay'
import { ComboDisplay } from './ComboDisplay'
import { OverloadMeter } from './OverloadMeter'
import { CorruptionMeter } from './CorruptionMeter'
import { UIFrameCorner } from '../../ui/shared/Icons'

interface StatsOverlayProps {
  score: number
  combo: number
  accuracy: number
  overload: number
  corruptionLevel: number
  isCorruptionBurstActive: boolean
}

/**
 * Renders the Stats Overlay component from score, combo, accuracy, overload, corruptionLevel, and isCorruptionBurstActive.
 * @param props - Score, combo, accuracy, overload, corruption, and burst state displayed over the gig.
 * @returns The rendered Stats Overlay UI.
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
    <div className='absolute top-32 left-4 max-sm:top-20 max-sm:left-2 max-sm:scale-75 max-sm:origin-top-left z-(--z-stage-bg) text-star-white font-mono pointer-events-none p-4 group'>
      <UIFrameCorner className='absolute top-0 left-0 w-4 h-4 text-ash-gray opacity-50' />
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
