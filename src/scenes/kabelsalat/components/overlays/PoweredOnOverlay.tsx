/*
 * (#1) Actual Updates: Created PoweredOnOverlay component.


 */
import React from 'react'
import PropTypes from 'prop-types'
import type { FC } from 'react'
import type { TFunction } from 'i18next'

interface PoweredOnOverlayProps {
  t: TFunction
}

export const PoweredOnOverlay: FC<PoweredOnOverlayProps> = React.memo(
  ({ t }) => {
    return (
      <div className='absolute inset-0 z-40 flex flex-col items-center justify-center bg-void-black/60 backdrop-blur-sm transition-all duration-1000'>
        <h3 className='text-success-green text-4xl font-bold tracking-[0.3em] mb-2 drop-shadow-[0_0_15px_var(--color-success-green)] text-center'>
          {t('ui:minigames.kabelsalat.success')}
        </h3>
        <p className='text-ash-gray tracking-widest uppercase mb-8 text-center max-w-sm'>
          {t('ui:minigames.kabelsalat.ampsReady')}
        </p>
      </div>
    )
  }
)
PoweredOnOverlay.displayName = 'PoweredOnOverlay'

PoweredOnOverlay.propTypes = {
  t: PropTypes.func.isRequired
}
