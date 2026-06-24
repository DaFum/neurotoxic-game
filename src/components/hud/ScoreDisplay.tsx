import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface ScoreDisplayProps {
  score: number
}

/**
 * Displays the current score with compact gig-HUD styling.
 * @param props - Props containing the current `score` value.
 */
export const ScoreDisplay = memo(function ScoreDisplay({
  score
}: ScoreDisplayProps) {
  const { t } = useTranslation()
  return (
    <div className='bg-void-black/90 backdrop-blur-sm border-2 border-toxic-green/50 shadow-[4px_4px_0px_var(--color-toxic-green-20)] px-4 py-2 inline-block'>
      <div className='text-xs text-ash-gray tracking-widest mb-0.5'>
        {t('ui:gig.score', 'SCORE')}
      </div>
      <div className='text-4xl font-bold font-display text-toxic-green drop-shadow-[0_0_10px_theme(colors.toxic-green)] tracking-widest tabular-nums animate-pulse'>
        {Math.floor(score).toString().padStart(7, '0')}
      </div>
    </div>
  )
})
