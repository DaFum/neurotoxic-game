import { GamepadHint } from '../../../ui/shared/InputHint'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../../ui/GlitchButton'
import { useModalBehavior } from '../../../ui/shared/useModalBehavior'
import type { PauseOverlayProps } from '../../../types/components'

/**
 * Blocks the gig scene with resume and quit actions while paused.
 * @param props - Pause visibility plus resume and quit callbacks.
 */
export const PauseOverlay = ({
  isPaused,
  onResume,
  onQuit
}: PauseOverlayProps) => {
  const { overlayRef, dialogRef } = useModalBehavior(isPaused, onResume)
  const { t } = useTranslation()

  if (!isPaused) return null

  return (
    <div
      ref={overlayRef}
      data-modal-overlay=''
      role='presentation'
      className='absolute inset-0 bg-void-black/90 flex flex-col items-center justify-center pointer-events-auto'
      style={{ zIndex: 'var(--z-modal)' }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role='dialog'
        data-gamepad-pause=''
        aria-modal='true'
        aria-labelledby='pause-overlay-title'
        className='flex flex-col items-center justify-center focus:outline-none'
      >
        <h2
          id='pause-overlay-title'
          className='text-6xl font-display text-toxic-green mb-8 animate-pulse drop-shadow-[0_0_15px_var(--color-toxic-green)]'
        >
          {t('ui:gig.pause_title', { defaultValue: 'PAUSED' })}
        </h2>
        <GamepadHint action='menu'>
          {t('ui:controller.resume', { defaultValue: 'Resume' })}
        </GamepadHint>
        <div className='flex flex-col gap-6 w-64'>
          <GlitchButton onClick={onResume}>
            {t('ui:gig.resume', { defaultValue: 'RESUME' })}
          </GlitchButton>
          <GlitchButton onClick={onQuit} variant='danger'>
            {t('ui:gig.quit', { defaultValue: 'QUIT GIG' })}
          </GlitchButton>
        </div>
      </div>
    </div>
  )
}
