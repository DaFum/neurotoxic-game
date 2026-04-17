import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../../ui/GlitchButton'

export const PauseOverlay = ({ isPaused, onResume, onQuit }) => {
  const { t } = useTranslation()

  if (!isPaused) return null

  return (
    <div
      className='absolute inset-0 bg-void-black/90 flex flex-col items-center justify-center pointer-events-auto'
      style={{ zIndex: 'var(--z-modal)' }}
      role='dialog'
      aria-modal='true'
    >
      <h2 className='text-6xl font-display text-toxic-green mb-8 animate-pulse drop-shadow-[0_0_15px_var(--color-toxic-green)]'>
        {t('ui:gig.pause_title', { defaultValue: 'PAUSED' })}
      </h2>
      <div className='flex flex-col gap-6 w-64'>
        <GlitchButton onClick={onResume}>
          {t('ui:gig.resume', { defaultValue: 'RESUME' })}
        </GlitchButton>
        <GlitchButton onClick={onQuit} variant='danger'>
          {t('ui:gig.quit', { defaultValue: 'QUIT GIG' })}
        </GlitchButton>
      </div>
    </div>
  )
}

PauseOverlay.propTypes = {
  isPaused: PropTypes.bool.isRequired,
  onResume: PropTypes.func.isRequired,
  onQuit: PropTypes.func.isRequired
}
