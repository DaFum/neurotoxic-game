/*
 * (#1) Actual Updates: Extracted HeaderTitle component.


 */
import React from 'react'
import PropTypes from 'prop-types'
import type { FC } from 'react'
import type { TFunction } from 'i18next'

interface HeaderTitleProps {
  t: TFunction
  isShocked: boolean
  isPoweredOn: boolean
  isGameOver: boolean
}

export const HeaderTitle: FC<HeaderTitleProps> = React.memo(
  ({ t, isShocked, isGameOver, isPoweredOn }) => (
    <div>
      <h2 className='text-2xl font-bold text-toxic-green tracking-[0.2em] relative'>
        <span className='relative z-10'>
          {t('ui:minigames.kabelsalat.title')}
        </span>
        {isShocked && (
          <span className='absolute top-0 left-0 text-blood-red translate-x-[2px] opacity-70 mix-blend-screen'>
            {t('ui:minigames.kabelsalat.title')}
          </span>
        )}
        {isShocked && (
          <span className='absolute top-0 left-0 text-info-blue -translate-x-[2px] opacity-70 mix-blend-screen'>
            {t('ui:minigames.kabelsalat.title')}
          </span>
        )}
      </h2>
      <p className='text-xs text-ash-gray uppercase tracking-widest mt-1'>
        {t('ui:minigames.kabelsalat.status')}:{' '}
        {isPoweredOn
          ? t('ui:minigames.kabelsalat.statusConnected')
          : isGameOver
            ? t('ui:minigames.kabelsalat.statusFailed')
            : t('ui:minigames.kabelsalat.statusPending')}
      </p>
    </div>
  )
)
HeaderTitle.displayName = 'HeaderTitle'

HeaderTitle.propTypes = {
  t: PropTypes.func.isRequired,
  isShocked: PropTypes.bool.isRequired,
  isPoweredOn: PropTypes.bool.isRequired,
  isGameOver: PropTypes.bool.isRequired
}
