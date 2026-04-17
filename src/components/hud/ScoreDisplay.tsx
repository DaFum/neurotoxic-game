// TODO: Review this file
import { memo } from 'react'

interface ScoreDisplayProps {
  score: number
}

export const ScoreDisplay = memo(function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div className='bg-void-black/60 backdrop-blur-sm border border-toxic-green/20 px-3 py-2 inline-block'>
      <div className='text-[10px] text-ash-gray tracking-widest mb-0.5'>SCORE</div>
      <div className='text-4xl font-bold text-toxic-green drop-shadow-[0_0_10px_var(--color-toxic-green)] tracking-wider tabular-nums'>
        {Math.floor(score).toString().padStart(7, '0')}
      </div>
    </div>
  )
})
