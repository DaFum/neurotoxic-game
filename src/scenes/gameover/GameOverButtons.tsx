// @ts-nocheck
/*
 * (#1) Actual Updates: Extracted action buttons from GameOver.tsx to a standalone file.
 * (#2) Next Steps: Refactor the main GameOver.tsx file to use these new components.
 * (#3) Found Errors + Solutions: N/A
 */
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import PropTypes from 'prop-types'
import { GlitchButton } from '../../ui/GlitchButton'

export const GameOverButtons = ({ onRetry, onReturnToMenu }) => {
  const { t } = useTranslation(['ui'])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2 }}
      className='flex gap-4 relative z-10'
    >
      <GlitchButton
        onClick={onRetry}
        className='border-star-white text-star-white'
      >
        {t('ui:gameOver.loadLastSave')}
      </GlitchButton>
      <GlitchButton
        onClick={onReturnToMenu}
        className='border-blood-red text-blood-red'
      >
        {t('ui:gameOver.returnToMenu')}
      </GlitchButton>
    </motion.div>
  )
}

GameOverButtons.propTypes = {
  onRetry: PropTypes.func.isRequired,
  onReturnToMenu: PropTypes.func.isRequired
}
