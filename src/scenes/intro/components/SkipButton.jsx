import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../../ui/GlitchButton'

export const SkipButton = ({ onSkip }) => {
  const { t } = useTranslation()

  return (
    <div className='absolute bottom-8 right-8 z-50 opacity-80 hover:opacity-100 transition-opacity'>
      <GlitchButton onClick={onSkip}>{t('ui:intro_skip')}</GlitchButton>
    </div>
  )
}
