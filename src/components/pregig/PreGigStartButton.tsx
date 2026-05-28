import React from 'react'
import { motion } from 'framer-motion'
import { RazorPlayIcon } from '../../ui/shared/Icons'
import { ActionButton } from '../../ui/shared'
import type { TranslationCallback } from '../../types/callbacks'

type PreGigStartButtonProps = {
  t: TranslationCallback
  isStarting: boolean
  isSetlistEmpty: boolean
  onStartShow: () => void | Promise<void>
}

export const PreGigStartButton = React.memo(
  ({ t, isStarting, isSetlistEmpty, onStartShow }: PreGigStartButtonProps) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='relative z-10 mt-4 lg:mt-6 mb-4 lg:mb-0 w-full max-w-[20rem] sm:w-auto'
      >
        <ActionButton
          onClick={onStartShow}
          disabled={isSetlistEmpty || isStarting}
          className='w-full px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-2xl tracking-widest shadow-[4px_4px_0px_var(--color-blood-red)] hover:shadow-[4px_4px_0px_var(--color-blood-red)] flex items-center justify-center gap-3 sm:gap-4'
        >
          {!isStarting && <RazorPlayIcon className='w-5 h-5 text-void-black' />}
          {isStarting ? t('ui:pregig.initializing') : t('ui:pregig.startShow')}
        </ActionButton>
      </motion.div>
    )
  }
)
PreGigStartButton.displayName = 'PreGigStartButton'
