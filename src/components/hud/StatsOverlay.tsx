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
 * Displays score, combo, accuracy, overload, and corruption meters during a gig.
 * @param props - Props containing `score`, `combo`, `accuracy`, `overload`, `corruptionLevel`, and `isCorruptionBurstActive`.
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
    <div className='absolute top-32 left-4 max-sm:top-20 max-sm:left-2 max-sm:scale-75 max-sm:origin-top-left z-(--z-stage-bg) text-star-white font-mono pointer-events-none p-4 group bg-void-black/40 backdrop-blur-sm border-l-2 border-toxic-green'>
      <UIFrameCorner className='absolute top-0 left-0 w-4 h-4 text-toxic-green opacity-80' />
      <UIFrameCorner className='absolute top-0 right-0 w-4 h-4 text-toxic-green rotate-90 opacity-80' />
      <UIFrameCorner className='absolute bottom-0 right-0 w-4 h-4 text-toxic-green rotate-180 opacity-80' />
      <UIFrameCorner className='absolute bottom-0 left-0 w-4 h-4 text-toxic-green -rotate-90 opacity-80' />

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
