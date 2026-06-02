import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { GlitchButton } from '../../ui/GlitchButton'

interface MainMenuSecondaryButtonsProps {
  setShowSocials: (show: boolean) => void
  handleCredits: () => void
  setShowFeatures: (show: boolean) => void
}

export const MainMenuSecondaryButtons = ({
  setShowSocials,
  handleCredits,
  setShowFeatures
}: MainMenuSecondaryButtonsProps) => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { delay: 1.2 }}
      className='flex w-full max-w-xs flex-col gap-4 mt-6 items-center'
    >
      <div className='flex w-full flex-wrap justify-center gap-3 sm:gap-4'>
        <GlitchButton
          onClick={() => setShowSocials(true)}
          className='flex-1'
        >
          {t('ui:socials')}
        </GlitchButton>
        <GlitchButton onClick={handleCredits} className='flex-1'>
          {t('ui:credits')}
        </GlitchButton>
      </div>
      <GlitchButton
        onClick={() => setShowFeatures(true)}
        className='w-full'
      >
        {t('ui:features.button')}
      </GlitchButton>
    </motion.div>
  )
}
