import { useTranslation } from 'react-i18next'
import * as m from 'motion/react-m'
import { GlitchButton } from '../../ui/GlitchButton'

/**
 * What the last save allows: `pending` until it has been evaluated, `available`
 * when loading it plays on, `ending` when the save only records this ending,
 * `none` when there is no save that can be loaded.
 */
export type GameOverLoadAvailability =
  'pending' | 'available' | 'ending' | 'none'

type GameOverButtonsProps = {
  loadAvailability: GameOverLoadAvailability
  onRetry: () => void
  onReturnToMenu: () => void
}

/**
 * Provides the retry and return-to-menu actions for game-over recovery.
 * @param props - Whether the last save can be loaded, plus the retry and
 * return-to-menu callbacks. Load stays hidden until the save has been
 * evaluated, and an ending-only save gets a notice in its place.
 */
export const GameOverButtons = ({
  loadAvailability,
  onRetry,
  onReturnToMenu
}: GameOverButtonsProps) => {
  const { t } = useTranslation(['ui'])

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2 }}
      className='flex gap-4 relative z-10'
    >
      {loadAvailability === 'available' && (
        <GlitchButton onClick={onRetry} variant='primary'>
          {t('ui:gameOver.loadLastSave')}
        </GlitchButton>
      )}
      {loadAvailability === 'ending' && (
        <p
          role='status'
          className='max-w-xs self-center text-sm text-ash-gray font-mono'
        >
          {t('ui:gameOver.lastSaveIsEnding')}
        </p>
      )}
      <GlitchButton onClick={onReturnToMenu} variant='danger'>
        {t('ui:gameOver.returnToMenu')}
      </GlitchButton>
    </m.div>
  )
}
