import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { GlitchButton } from '../../ui/GlitchButton'

type GameOverButtonsProps = {
  onRetry: () => void
  onReturnToMenu: () => void
}

/**
 * Renders the Game Over Buttons scene from onRetry and onReturnToMenu.
 * @param props - Retry and return-to-menu callbacks for game-over recovery actions.
 * @returns The rendered Game Over Buttons UI.
 */
export const GameOverButtons = ({
  onRetry,
  onReturnToMenu
}: GameOverButtonsProps) => {
  const { t } = useTranslation(['ui'])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2 }}
      className='flex gap-4 relative z-10'
    >
      <GlitchButton onClick={onRetry} variant='primary'>
        {t('ui:gameOver.loadLastSave')}
      </GlitchButton>
      <GlitchButton onClick={onReturnToMenu} variant='danger'>
        {t('ui:gameOver.returnToMenu')}
      </GlitchButton>
    </motion.div>
  )
}
