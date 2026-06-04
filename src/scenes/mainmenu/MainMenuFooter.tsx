import { motion, useReducedMotion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

/**
 * Renders the main menu footer controls and status text.
 * @returns The rendered Main Menu Footer UI.
 */
export const MainMenuFooter = () => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { delay: 1.5 }}
      className='absolute bottom-4 sm:bottom-6 flex w-full flex-col items-center gap-1 z-10 px-4'
    >
      <div className='w-32 h-px bg-gradient-to-r from-transparent via-ash-gray/50 to-transparent' />
      <div className='text-center text-ash-gray text-xs font-mono tracking-widest'>
        {t('ui:mainMenu.footer', {
          defaultValue: '© 2026 NEUROTOXIC // DEATH GRINDCORE FROM STENDAL'
        })}
      </div>
    </motion.div>
  )
}
