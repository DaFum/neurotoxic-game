import * as m from 'motion/react-m'
import { useTranslation } from 'react-i18next'
import { MOTION_TRANSITIONS } from '../../config/motion'
import { GlitchButton } from '../../ui/GlitchButton'

interface MainMenuActionButtonsProps {
  handleStartTour: () => void
  isStarting: boolean
  handleLoad: () => void
  isLoadingGame: boolean
  openHQ: () => void
}

/**
 * Provides the primary main-menu actions for start, load, and Band HQ preview.
 * @param props - Start/load handlers, loading flags, and Band HQ shortcut for the main menu.
 */
export const MainMenuActionButtons = ({
  handleStartTour,
  isStarting,
  handleLoad,
  isLoadingGame,
  openHQ
}: MainMenuActionButtonsProps) => {
  const { t } = useTranslation()

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...MOTION_TRANSITIONS.ui,
        delay: 0.2
      }}
      className='flex w-full max-w-xs flex-col gap-3'
    >
      <GlitchButton
        onClick={handleStartTour}
        isLoading={isStarting}
        className='relative z-20 w-full'
      >
        {t('ui:start_game')}
      </GlitchButton>

      <GlitchButton
        onClick={handleLoad}
        isLoading={isLoadingGame}
        variant='accent'
        className='relative z-20 w-full'
      >
        {t('ui:load_game')}
      </GlitchButton>

      <GlitchButton
        onClick={openHQ}
        variant='accentAlt'
        className='relative z-20 w-full'
      >
        {t('ui:band_hq')}
      </GlitchButton>
    </m.div>
  )
}
