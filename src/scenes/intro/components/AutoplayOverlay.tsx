import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../../ui/GlitchButton'

type AutoplayOverlayProps = {
  onPlay: () => void
}

export const AutoplayOverlay = ({ onPlay }: AutoplayOverlayProps) => {
  const { t } = useTranslation()

  return (
    <div className='absolute inset-0 z-50 flex items-center justify-center bg-overlay'>
      <GlitchButton onClick={onPlay} className='scale-150'>
        {t('ui:intro_play')}
      </GlitchButton>
    </div>
  )
}
