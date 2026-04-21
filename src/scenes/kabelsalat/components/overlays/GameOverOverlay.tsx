/*
 * (#1) Actual Updates: Created GameOverOverlay component.


 */
import React from 'react'
import PropTypes from 'prop-types'
import type { FC } from 'react'
import type { TFunction } from 'i18next'

interface GameOverOverlayProps {
  t: TFunction
}

export const GameOverOverlay: FC<GameOverOverlayProps> = React.memo(({ t }) => {
  return (
    <div className='absolute inset-0 z-40 flex flex-col items-center justify-center bg-void-black/90 backdrop-blur-sm'>
      <h3 className='text-error-red text-5xl font-bold tracking-[0.3em] mb-4 drop-shadow-[0_0_15px_var(--color-error-red)] text-center'>
        {t('ui:minigames.kabelsalat.timeUp')}
      </h3>
      <p className='text-ash-gray tracking-widest uppercase mb-8 text-center'>
        {t('ui:minigames.kabelsalat.managerMad')}
      </p>
    </div>
  )
})
GameOverOverlay.displayName = 'GameOverOverlay'

GameOverOverlay.propTypes = {
  t: PropTypes.func.isRequired
}
