import { memo } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../../ui/GlitchButton'
import type { AudioLockedOverlayProps } from '../../../types/components'

export const AudioLockedOverlay = memo(
  ({ onInitializeAudio }: AudioLockedOverlayProps) => {
    const { t } = useTranslation()

    return (
      <div
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='audio-locked-title'
        aria-describedby='audio-locked-desc'
        className='flex flex-col items-center justify-center w-full h-full bg-void-black relative'
        style={{ zIndex: 'var(--z-modal)' }}
      >
        <h2
          id='audio-locked-title'
          className="text-4xl text-toxic-green font-['Metal_Mania'] mb-8 animate-pulse text-center"
        >
          {t('ui:gig.systemLocked', { defaultValue: 'SYSTEM LOCKED' })}
        </h2>
        <p
          id='audio-locked-desc'
          className='text-ash-gray mb-8 font-mono max-w-md text-center'
        >
          {t('ui:gig.audioOverride', {
            defaultValue: 'Audio Interface requires manual override.'
          })}
        </p>
        <GlitchButton
          onClick={onInitializeAudio}
          className='scale-150'
          autoFocus
        >
          {t('ui:gig.initializeAudio', { defaultValue: 'INITIALIZE AUDIO' })}
        </GlitchButton>
      </div>
    )
  }
)

AudioLockedOverlay.displayName = 'AudioLockedOverlay'

AudioLockedOverlay.propTypes = {
  onInitializeAudio: PropTypes.func.isRequired
}
