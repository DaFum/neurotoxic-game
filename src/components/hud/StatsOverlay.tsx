import { memo } from 'react'
import { ScoreDisplay } from './ScoreDisplay'
import { ComboDisplay } from './ComboDisplay'
import { OverloadMeter } from './OverloadMeter'
import { UIFrameCorner } from '../../ui/shared/Icons'

interface StatsOverlayProps {
  score: number
  combo: number
  accuracy: number
  overload: number
}

export const StatsOverlay = memo(function StatsOverlay({
  score,
  combo,
  accuracy,
  overload
}: StatsOverlayProps) {
  return (
    <div className='absolute top-32 left-4 z-10 text-star-white font-mono pointer-events-none p-4 relative group'>
      <UIFrameCorner className='absolute top-0 left-0 w-4 h-4 text-ash-gray opacity-50' />
      <UIFrameCorner className='absolute top-0 right-0 w-4 h-4 text-ash-gray rotate-90 opacity-50' />
      <UIFrameCorner className='absolute bottom-0 right-0 w-4 h-4 text-ash-gray rotate-180 opacity-50' />
      <UIFrameCorner className='absolute bottom-0 left-0 w-4 h-4 text-ash-gray -rotate-90 opacity-50' />

      <ScoreDisplay score={score} />
      <ComboDisplay combo={combo} accuracy={accuracy} />
      <OverloadMeter overload={overload} />
    </div>
  )
})
