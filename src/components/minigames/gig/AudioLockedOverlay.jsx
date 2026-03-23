import { memo } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../../ui/GlitchButton'

export const AudioLockedOverlay = memo(({ onInitializeAudio }) => {
  const { t } = useTranslation()

  return (
    <div
      className='flex flex-col items-center justify-center w-full h-full bg-void-black relative'
      style={{ zIndex: 'var(--z-modal)' }}
    >
      <h2 className="text-4xl text-toxic-green font-['Metal_Mania'] mb-8 animate-pulse text-center">
        {t('ui:gig.systemLocked', { defaultValue: 'SYSTEM LOCKED' })}
      </h2>
      <p className='text-ash-gray mb-8 font-mono max-w-md text-center'>
        {t('ui:gig.audioOverride', {
          defaultValue: 'Audio Interface requires manual override.'
        })}
      </p>
      <GlitchButton onClick={onInitializeAudio} className='scale-150'>
        {t('ui:gig.initializeAudio', { defaultValue: 'INITIALIZE AUDIO' })}
      </GlitchButton>
    </div>
  )
})

AudioLockedOverlay.displayName = 'AudioLockedOverlay'

AudioLockedOverlay.propTypes = {
  onInitializeAudio: PropTypes.func.isRequired
}
