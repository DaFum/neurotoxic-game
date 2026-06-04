import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface GameOverOverlayProps {
  isGameOver?: boolean
}

/**
 * Renders the GameOverOverlay component when the gig has ended in failure.
 * @param props - Game-over visibility flag for the gig overlay.
 * @returns The rendered Game Over Overlay UI.
 */
export const GameOverOverlay = memo(function GameOverOverlay({
  isGameOver
}: GameOverOverlayProps) {
  const { t } = useTranslation()
  if (!isGameOver) return null
  return (
    <div
      className='absolute inset-0 z-(--z-modal) flex flex-col items-center justify-center pointer-events-none'
      style={{ backgroundColor: 'rgb(var(--color-void-black-rgb) / 90%)' }}
      role='alert'
      aria-live='assertive'
    >
      <h1
        className='text-7xl font-display animate-doom-zoom'
        style={{ color: 'var(--color-blood-red)' }}
      >
        {t('ui:game-over.booed-off-stage', { defaultValue: 'BOOED OFF STAGE' })}
      </h1>
      <div
        className='mt-4 font-mono text-sm animate-pulse tracking-widest'
        style={{ color: 'var(--color-ash-gray)' }}
      >
        {t('ui:game-over.crowd-spoken', {
          defaultValue: 'THE CROWD HAS SPOKEN'
        })}
      </div>
    </div>
  )
})
