/*
 * (#1) Actual Updates: Created PoweredOnOverlay component.


 */
import React from 'react'
import PropTypes from 'prop-types'
import type { FC } from 'react'
import type { TFunction } from 'i18next'
import { ActionButton } from '../../../../ui/shared'

interface PoweredOnOverlayProps {
  t: TFunction
  onAdvance: () => void
}

export const PoweredOnOverlay: FC<PoweredOnOverlayProps> = React.memo(
  ({ t, onAdvance }) => {
    return (
      <div className='absolute inset-0 z-40 flex flex-col items-center justify-center overflow-y-auto bg-void-black/60 backdrop-blur-sm transition-all duration-1000 px-4'>
        <h3 className='text-success-green text-3xl md:text-4xl font-bold tracking-[0.3em] mb-2 drop-shadow-[0_0_15px_var(--color-success-green)] text-center max-w-full break-words'>
          {t('ui:minigames.kabelsalat.success')}
        </h3>
        <p className='text-ash-gray tracking-widest uppercase mb-8 text-center max-w-full break-words'>
          {t('ui:minigames.kabelsalat.ampsReady')}
        </p>
        <ActionButton onClick={onAdvance} className='mt-4'>
          {t('ui:minigames.kabelsalat.continueButton')}
        </ActionButton>
      </div>
    )
  }
)
PoweredOnOverlay.displayName = 'PoweredOnOverlay'

PoweredOnOverlay.propTypes = {
  t: PropTypes.func.isRequired,
  onAdvance: PropTypes.func.isRequired
}
