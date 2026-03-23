import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import { RazorPlayIcon } from '../../ui/shared/Icons'

export const PreGigStartButton = ({
  t,
  isStarting,
  isSetlistEmpty,
  onStartShow
}) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className='relative z-30 mt-4 lg:mt-6 mb-20 lg:mb-12 w-full max-w-[20rem] sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-toxic-green text-void-black font-bold text-lg sm:text-2xl uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[4px_4px_0px_var(--color-blood-red)] hover:shadow-[6px_6px_0px_var(--color-blood-red)] flex items-center justify-center gap-3 sm:gap-4'
      disabled={isSetlistEmpty || isStarting}
      onClick={onStartShow}
    >
      {!isStarting && <RazorPlayIcon className='w-8 h-8 text-void-black' />}
      {isStarting ? t('ui:pregig.initializing') : t('ui:pregig.startShow')}
    </motion.button>
  )
}

PreGigStartButton.propTypes = {
  t: PropTypes.func.isRequired,
  isStarting: PropTypes.bool.isRequired,
  isSetlistEmpty: PropTypes.bool.isRequired,
  onStartShow: PropTypes.func.isRequired
}
