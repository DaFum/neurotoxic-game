/*
 * (#1) Actual Updates: Created ShockOverlay component.


 */
import React from 'react'
import PropTypes from 'prop-types'
import type { FC } from 'react'
import type { TFunction } from 'i18next'

interface ShockOverlayProps {
  t: TFunction
  faultReason: string
}

export const ShockOverlay: FC<ShockOverlayProps> = React.memo(
  ({ t, faultReason }) => {
    return (
      <div className='absolute inset-0 z-40 mix-blend-color-dodge flex flex-col items-center justify-center bg-blood-red/50 backdrop-blur-[2px]'>
        <div className='bg-warning-yellow text-void-black text-5xl font-bold tracking-[0.3em] px-8 py-4 skew-x-[-15deg] shadow-[0_0_50px_var(--color-warning-yellow)]'>
          {t('ui:minigames.kabelsalat.systemShock')}
        </div>
        <div className='mt-6 bg-void-black text-star-white text-xl font-bold tracking-widest uppercase px-6 py-2 border-2 border-star-white'>
          {faultReason}
        </div>
      </div>
    )
  }
)
ShockOverlay.displayName = 'ShockOverlay'

ShockOverlay.propTypes = {
  t: PropTypes.func.isRequired,
  faultReason: PropTypes.string.isRequired
}
