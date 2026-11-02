import { useTranslation } from 'react-i18next'
import * as m from 'motion/react-m'
import type { TFunction } from 'i18next'
import type { LoadPreviewResult } from '../../types/game'
import { GlitchButton } from '../../ui/GlitchButton'

/** Why the save preview refuses the stored save. */
type GameOverRefusalReason = Extract<
  LoadPreviewResult,
  { status: 'unavailable' }
>['reason']

/**
 * What the last save allows: `pending` until it has been evaluated, `available`
 * when loading it plays on, `ending` when the save only records this ending,
 * `none` when there is no save, `{ refused }` when a save exists but the
 * preview refuses it for that reason.
 */
export type GameOverLoadAvailability =
  | 'pending'
  | 'available'
  | 'ending'
  | 'none'
  | { refused: GameOverRefusalReason }

/**
 * The status shown for a refused save. Keys stay literal for the i18n parser;
 * a reason this build does not know gets the generic message.
 */
const refusalMessage = (
  reason: GameOverRefusalReason,
  t: TFunction
): string => {
  switch (reason) {
    case 'corrupt':
      return t('ui:gameOver.lastSaveCorrupt')
    case 'incompatible':
      return t('ui:gameOver.lastSaveIncompatible')
    case 'unreadable':
      return t('ui:gameOver.lastSaveUnreadable')
    default:
      return t('ui:gameOver.lastSaveUnavailable')
  }
}

type GameOverButtonsProps = {
  loadAvailability: GameOverLoadAvailability
  onRetry: () => void
  onReturnToMenu: () => void
}

/**
 * Provides the retry and return-to-menu actions for game-over recovery.
 * @param props - Whether the last save can be loaded, plus the retry and
 * return-to-menu callbacks. Load stays hidden until the save has been
 * evaluated; an ending-only or refused save gets a notice in its place.
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
      {typeof loadAvailability === 'object' && (
        <p
          role='status'
          className='max-w-xs self-center text-sm text-ash-gray font-mono'
        >
          {refusalMessage(loadAvailability.refused, t)}
        </p>
      )}
      <GlitchButton onClick={onReturnToMenu} variant='danger'>
        {t('ui:gameOver.returnToMenu')}
      </GlitchButton>
    </m.div>
  )
}
