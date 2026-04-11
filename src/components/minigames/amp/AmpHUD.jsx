import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export const AmpHUD = memo(function AmpHUD({ timeLeft, score }) {
  const { t } = useTranslation(['ui'])

  return (
    <div className='absolute top-4 left-4 z-30 text-star-white font-mono pointer-events-none bg-void-black/80 p-4 border-2 border-toxic-green shadow-[0_0_15px_var(--color-toxic-green)]'>
      <h2 className='text-2xl font-bold text-toxic-green tracking-widest uppercase mb-2'>
        {t('ui:ampCalibration.hud.title', { defaultValue: 'AMP CALIBRATION' })}
      </h2>
      <div className='flex flex-col gap-1 text-sm'>
        <div className='flex justify-between w-48'>
          <span className='text-ash-gray uppercase'>{t('ui:ampCalibration.hud.time', { defaultValue: 'TIME:' })}</span>
          <span className={timeLeft < 5 ? 'text-blood-red animate-pulse font-bold' : 'text-toxic-green'}>
            {timeLeft.toFixed(1)}s
          </span>
        </div>
        <div className='flex justify-between w-48'>
          <span className='text-ash-gray uppercase'>{t('ui:ampCalibration.hud.stability', { defaultValue: 'STABILITY:' })}</span>
          <span className='text-toxic-green'>{Math.floor(score)}%</span>
        </div>
      </div>
    </div>
  )
})
