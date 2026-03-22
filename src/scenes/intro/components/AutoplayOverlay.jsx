import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../../ui/GlitchButton'

export const AutoplayOverlay = ({ onPlay }) => {
  const { t } = useTranslation()

  return (
    <div className='absolute inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)]'>
      <GlitchButton onClick={onPlay} className='scale-150'>
        {t('ui:intro_play')}
      </GlitchButton>
    </div>
  )
}
