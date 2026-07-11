import { MainMenuMotionContainer } from './shared/MainMenuMotionContainer'
import { useTranslation } from 'react-i18next'

/**
 * Displays main-menu footer controls and status text.
 */
export const MainMenuFooter = () => {
  const { t } = useTranslation()

  return (
    <MainMenuMotionContainer
      className='absolute bottom-4 sm:bottom-6 flex w-full flex-col items-center gap-1 z-10 px-4'
      delay={1.5}
    >
      <div className='w-32 h-px bg-gradient-to-r from-transparent via-ash-gray/50 to-transparent' />
      <div className='text-center text-ash-gray text-xs font-mono tracking-widest'>
        {t('ui:mainMenu.footer', {
          defaultValue: '© 2026 NEUROTOXIC // DEATH GRINDCORE FROM STENDAL'
        })}
      </div>
    </MainMenuMotionContainer>
  )
}
