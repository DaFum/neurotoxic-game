export const Header = ({ t, isShocked, isPoweredOn, isGameOver, timeLeft }) => (
  <div className='w-full flex flex-col md:flex-row justify-between items-end border-b-2 border-(--toxic-green) pb-2 mb-6 gap-4 bg-(--void-black)/80 p-4 rounded-t-sm'>
    <div>
      <h2 className='text-2xl font-bold text-(--toxic-green) tracking-[0.2em] relative'>
        <span className='relative z-10'>
          {t('ui:minigames.kabelsalat.title')}
        </span>
        {isShocked && (
          <span className='absolute top-0 left-0 text-(--blood-red) translate-x-[2px] opacity-70 mix-blend-screen'>
            {t('ui:minigames.kabelsalat.title')}
          </span>
        )}
        {isShocked && (
          <span className='absolute top-0 left-0 text-(--info-blue) -translate-x-[2px] opacity-70 mix-blend-screen'>
            {t('ui:minigames.kabelsalat.title')}
          </span>
        )}
      </h2>
      <p className='text-xs text-(--ash-gray) uppercase tracking-widest mt-1'>
        {t('ui:minigames.kabelsalat.status')}:{' '}
        {isPoweredOn
          ? t('ui:minigames.kabelsalat.statusConnected')
          : isGameOver
            ? t('ui:minigames.kabelsalat.statusFailed')
            : t('ui:minigames.kabelsalat.statusPending')}
      </p>
    </div>

    <div
      className={`flex items-center gap-4 px-4 py-2 border-2 transition-colors bg-(--void-black)/50
      ${
        timeLeft <= 10
          ? 'border-(--error-red) text-(--error-red) animate-pulse'
          : isPoweredOn
            ? 'border-(--success-green) text-(--success-green)'
            : 'border-(--warning-yellow) text-(--warning-yellow)'
      }`}
    >
      <span className='text-[10px] tracking-widest uppercase'>
        {t('ui:minigames.kabelsalat.tMinus')}
      </span>
      <span className='text-3xl font-bold tracking-widest'>
        {t('ui:minigames.kabelsalat.timeValue', { count: timeLeft })}
      </span>
    </div>
  </div>
)
