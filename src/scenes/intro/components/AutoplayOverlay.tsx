/*
 * (#1) Actual Updates: Replaced arbitrary color value with native Tailwind token bg-overlay.

 * (#3) Found Errors + Solutions: Color was used via arbitrary value syntax bg-[var(--color-overlay)] rather than the native token bg-overlay. Solution: Changed to bg-overlay.
 */
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
