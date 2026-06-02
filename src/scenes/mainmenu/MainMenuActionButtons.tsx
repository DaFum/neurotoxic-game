import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../ui/GlitchButton'

interface MainMenuActionButtonsProps {
  handleStartTour: () => void
  isStarting: boolean
  handleLoad: () => void
  isLoadingGame: boolean
  openHQ: () => void
}

export const MainMenuActionButtons = ({
  handleStartTour,
  isStarting,
  handleLoad,
  isLoadingGame,
  openHQ
}: MainMenuActionButtonsProps) => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { duration: 0.5, delay: 0.8 }
      }
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
        className='relative z-20 w-full border-blood-red text-blood-red hover:bg-blood-red hover:shadow-[4px_4px_0px_var(--color-toxic-green)]'
      >
        {t('ui:load_game')}
      </GlitchButton>

      <GlitchButton
        onClick={openHQ}
        className='relative z-20 w-full border-warning-yellow text-warning-yellow hover:bg-warning-yellow hover:shadow-[4px_4px_0px_var(--color-toxic-green)]'
      >
        {t('ui:band_hq')}
      </GlitchButton>
    </motion.div>
  )
}
