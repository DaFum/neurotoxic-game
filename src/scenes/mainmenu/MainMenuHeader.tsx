import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { AnimatedDivider, AnimatedSubtitle } from '../../ui/shared'

/**
 * Displays the main-menu title lockup and subtitle copy.
 */
export const MainMenuHeader = () => {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  return (
    <>
      <motion.h1
        initial={
          prefersReducedMotion ? false : { scale: 0.8, opacity: 0, y: -20 }
        }
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 0.8, ease: 'easeOut' }
        }
        data-text='NEUROTOXIC'
        className='title-ghost text-5xl sm:text-6xl md:text-9xl text-center text-transparent bg-clip-text bg-gradient-to-b from-toxic-green to-toxic-green-dark font-display animate-neon-flicker mb-2 break-words drop-shadow-lg'
        style={{
          WebkitTextStroke: '2px var(--color-toxic-green)',
          filter: 'drop-shadow(0 0 18px var(--color-toxic-green-glow))'
        }}
      >
        NEUROTOXIC
      </motion.h1>

      <AnimatedDivider
        width='100%'
        transition={
          prefersReducedMotion ? { duration: 0 } : { duration: 0.6, delay: 0.4 }
        }
        className='bg-gradient-to-r from-transparent via-toxic-green to-transparent mb-4 max-w-md'
      />

      {/* jscpd:ignore-start */}
      <AnimatedSubtitle
        initial={
          prefersReducedMotion ? false : { opacity: 0, letterSpacing: '0.1em' }
        }
        animate={{ opacity: 1, letterSpacing: '0.5em' }}
        transition={
          prefersReducedMotion ? { duration: 0 } : { duration: 1, delay: 0.6 }
        }
        className='text-lg md:text-2xl text-toxic-green/80 mb-2 font-ui text-center tracking-[0.5em]'
      >
        {t('ui:mainMenu.subtitle.grindTheVoid')}
      </AnimatedSubtitle>

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0 } : { delay: 1 }}
        className='mb-8 sm:mb-10 px-3 py-1 border border-toxic-green/30 text-xs font-mono text-toxic-green tracking-widest'
      >
        {t('ui:mainMenu.versionBadge', {
          defaultValue: 'v3.0 // EARLY ACCESS'
        })}
      </motion.div>
      {/* jscpd:ignore-end */}
    </>
  )
}
