import { memo } from 'react'
import { useTranslation } from 'react-i18next'

interface GameOverOverlayProps {
  /** Whether the failed-gig overlay should cover the stage HUD. */
  isGameOver?: boolean
}

/**
 * Shows the non-interactive failure overlay after a gig ends badly.
 *
 * @remarks
 * The component renders `null` until `isGameOver` is truthy. The overlay keeps
 * pointer events disabled so scene-level continuation handlers stay in control.
 */
export const GameOverOverlay = memo(function GameOverOverlay({
  isGameOver
}: GameOverOverlayProps) {
  const { t } = useTranslation()
  if (!isGameOver) return null
  return (
    <div
      className='absolute inset-0 z-(--z-modal) flex flex-col items-center justify-center pointer-events-none bg-void-black/90'
      role='alert'
      aria-live='assertive'
    >
      <h1 className='text-7xl font-display animate-doom-zoom text-blood-red'>
        {t('ui:game-over.booed-off-stage', { defaultValue: 'BOOED OFF STAGE' })}
      </h1>
      <div className='mt-4 font-mono text-sm animate-pulse tracking-widest text-ash-gray'>
        {t('ui:game-over.crowd-spoken', {
          defaultValue: 'THE CROWD HAS SPOKEN'
        })}
      </div>
    </div>
  )
})
