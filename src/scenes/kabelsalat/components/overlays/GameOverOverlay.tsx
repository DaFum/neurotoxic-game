/*
 * (#1) Actual Updates: Created GameOverOverlay component.


 */
import React from 'react'
import PropTypes from 'prop-types'
import type { FC } from 'react'
import type { TFunction } from 'i18next'
import { ActionButton } from '../../../../ui/shared'

interface GameOverOverlayProps {
  t: TFunction
  onAdvance: () => void
}

export const GameOverOverlay: FC<GameOverOverlayProps> = React.memo(
  ({ t, onAdvance }) => {
    return (
      <div className='absolute inset-0 z-40 flex flex-col items-center justify-center overflow-y-auto bg-void-black/90 backdrop-blur-sm px-4'>
        <h3 className='text-error-red text-3xl md:text-5xl font-bold tracking-[0.3em] mb-4 drop-shadow-[0_0_15px_var(--color-error-red)] text-center max-w-full break-words'>
          {t('ui:minigames.kabelsalat.timeUp')}
        </h3>
        <p className='text-ash-gray tracking-widest uppercase mb-8 text-center max-w-full break-words'>
          {t('ui:minigames.kabelsalat.managerMad')}
        </p>
        <ActionButton onClick={onAdvance} className='mt-4'>
          {t('ui:minigames.kabelsalat.continueButton')}
        </ActionButton>
      </div>
    )
  }
)
GameOverOverlay.displayName = 'GameOverOverlay'

GameOverOverlay.propTypes = {
  t: PropTypes.func.isRequired,
  onAdvance: PropTypes.func.isRequired
}
