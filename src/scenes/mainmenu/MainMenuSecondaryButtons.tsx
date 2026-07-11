import { MainMenuMotionContainer } from './shared/MainMenuMotionContainer'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../ui/GlitchButton'

interface MainMenuSecondaryButtonsProps {
  setShowSocials: (show: boolean) => void
  handleCredits: () => void
  setShowFeatures: (show: boolean) => void
}

/**
 * Provides secondary main-menu actions for socials, credits, and features.
 * @param props - Callbacks that open socials, credits, and feature panels.
 */
export const MainMenuSecondaryButtons = ({
  setShowSocials,
  handleCredits,
  setShowFeatures
}: MainMenuSecondaryButtonsProps) => {
  const { t } = useTranslation()

  return (
    <MainMenuMotionContainer
      className='flex w-full max-w-xs flex-col gap-4 mt-6 items-center'
      delay={1.2}
    >
      <div className='flex w-full flex-wrap justify-center gap-3 sm:gap-4'>
        <GlitchButton onClick={() => setShowSocials(true)} className='flex-1'>
          {t('ui:socials')}
        </GlitchButton>
        <GlitchButton onClick={handleCredits} className='flex-1'>
          {t('ui:credits')}
        </GlitchButton>
      </div>
      <GlitchButton onClick={() => setShowFeatures(true)} className='w-full'>
        {t('ui:features.button')}
      </GlitchButton>
    </MainMenuMotionContainer>
  )
}
