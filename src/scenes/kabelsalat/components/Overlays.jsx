export const Overlays = ({
  t,
  isShocked,
  isGameOver,
  isPoweredOn,
  faultReason
}) => {
  return (
    <>
      {isShocked && (
        <div className='absolute inset-0 z-40 mix-blend-color-dodge flex flex-col items-center justify-center bg-blood-red/50 backdrop-blur-[2px]'>
          <div className='bg-warning-yellow text-void-black text-5xl font-bold tracking-[0.3em] px-8 py-4 skew-x-[-15deg] shadow-[0_0_50px_var(--color-warning-yellow)]'>
            {t('ui:minigames.kabelsalat.systemShock')}
          </div>
          <div className='mt-6 bg-void-black text-star-white text-xl font-bold tracking-widest uppercase px-6 py-2 border-2 border-star-white'>
            {faultReason}
          </div>
        </div>
      )}

      {isGameOver && !isShocked && (
        <div className='absolute inset-0 z-40 flex flex-col items-center justify-center bg-void-black/90 backdrop-blur-sm'>
          <h3 className='text-error-red text-5xl font-bold tracking-[0.3em] mb-4 drop-shadow-[0_0_15px_var(--color-error-red)] text-center'>
            {t('ui:minigames.kabelsalat.timeUp')}
          </h3>
          <p className='text-ash-gray tracking-widest uppercase mb-8 text-center'>
            {t('ui:minigames.kabelsalat.managerMad')}
          </p>
        </div>
      )}

      {isPoweredOn && (
        <div className='absolute inset-0 z-40 flex flex-col items-center justify-center bg-void-black/60 backdrop-blur-sm transition-all duration-1000'>
          <h3 className='text-success-green text-4xl font-bold tracking-[0.3em] mb-2 drop-shadow-[0_0_15px_var(--color-success-green)] text-center'>
            {t('ui:minigames.kabelsalat.success')}
          </h3>
          <p className='text-ash-gray tracking-widest uppercase mb-8 text-center max-w-sm'>
            {t('ui:minigames.kabelsalat.ampsReady')}
          </p>
        </div>
      )}
    </>
  )
}
