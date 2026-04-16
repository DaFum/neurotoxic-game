/*
 * (#1) Actual Updates: Extracted header elements from GameOver.tsx to a standalone file.
 * (#2) Next Steps: Continue extracting other sub-components from GameOver.tsx.
 * (#3) Found Errors + Solutions: N/A
 */
import React from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { AnimatedDivider, AnimatedSubtitle } from '../../ui/shared'
import { VoidSkullIcon } from '../../ui/shared/Icons'

export const GameOverHeader = React.memo(() => {
  const { t } = useTranslation(['ui'])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className='relative z-10 mb-4'
        aria-hidden='true'
      >
        <VoidSkullIcon className='w-24 h-24 text-blood-red drop-shadow-[0_0_20px_var(--color-blood-red)]' />
      </motion.div>

      <h1 className='text-8xl md:text-9xl text-blood-red font-[Metal_Mania] mb-2 animate-doom-zoom relative z-10'>
        {t('ui:gameOver.soldOut')}
      </h1>

      {/* jscpd:ignore-start */}
      <AnimatedDivider
        width='16rem'
        transition={{ duration: 0.8, delay: 0.8 }}
        className='bg-gradient-to-r from-transparent via-blood-red to-transparent mb-3'
      />

      <AnimatedSubtitle
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className='text-lg text-ash-gray font-mono mb-10 tracking-[0.3em] relative z-10'
      >
        {t('ui:tour.endedPrematurely')}
      </AnimatedSubtitle>
      {/* jscpd:ignore-end */}
    </>
  )
})

GameOverHeader.displayName = 'GameOverHeader'
