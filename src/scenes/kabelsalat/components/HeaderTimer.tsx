/*
 * (#1) Actual Updates: Extracted HeaderTimer component.


 */
import React from 'react'
import PropTypes from 'prop-types'
import type { FC } from 'react'
import type { TFunction } from 'i18next'

interface HeaderTimerProps {
  t: TFunction
  isPoweredOn: boolean
  timeLeft: number
}

export const HeaderTimer: FC<HeaderTimerProps> = React.memo(
  ({ t, isPoweredOn, timeLeft }) => (
    <div
      className={`flex items-center gap-4 px-4 py-2 border-2 transition-colors bg-void-black/50
    ${
      timeLeft <= 10
        ? 'border-error-red text-error-red animate-pulse'
        : isPoweredOn
          ? 'border-success-green text-success-green'
          : 'border-warning-yellow text-warning-yellow'
    }`}
    >
      <span className='text-[10px] tracking-widest uppercase'>
        {t('ui:minigames.kabelsalat.tMinus')}
      </span>
      <span className='text-3xl font-bold tracking-widest'>
        {t('ui:minigames.kabelsalat.timeValue', { count: timeLeft })}
      </span>
    </div>
  )
)
HeaderTimer.displayName = 'HeaderTimer'

HeaderTimer.propTypes = {
  t: PropTypes.func.isRequired,
  isPoweredOn: PropTypes.bool.isRequired,
  timeLeft: PropTypes.number.isRequired
}
