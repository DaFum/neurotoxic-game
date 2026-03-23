import PropTypes from 'prop-types'

export const HeaderTimer = ({ t, isPoweredOn, timeLeft }) => (
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

HeaderTimer.propTypes = {
  t: PropTypes.func.isRequired,
  isPoweredOn: PropTypes.bool.isRequired,
  timeLeft: PropTypes.number.isRequired
}
