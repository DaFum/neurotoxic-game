import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../../ui/GlitchButton'

type SkipButtonProps = {
  onSkip: () => void
}

/**
 * Renders the Skip Button scene from onSkip.
 * @param props - Skip callback for leaving the intro immediately.
 * @returns The rendered Skip Button UI.
 */
export const SkipButton = ({ onSkip }: SkipButtonProps) => {
  const { t } = useTranslation()

  return (
    <div className='absolute bottom-[max(2rem,env(safe-area-inset-bottom))] right-[max(2rem,env(safe-area-inset-right))] z-(--z-overlay) opacity-80 hover:opacity-100 transition-opacity'>
      <GlitchButton onClick={onSkip}>{t('ui:intro_skip')}</GlitchButton>
    </div>
  )
}
