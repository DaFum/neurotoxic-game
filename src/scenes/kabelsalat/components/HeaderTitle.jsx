import PropTypes from 'prop-types'

export const HeaderTitle = ({ t, isShocked, isPoweredOn, isGameOver }) => (
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

HeaderTitle.propTypes = {
  t: PropTypes.func.isRequired,
  isShocked: PropTypes.bool.isRequired,
  isPoweredOn: PropTypes.bool.isRequired,
  isGameOver: PropTypes.bool.isRequired
}
