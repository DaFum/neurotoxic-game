import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export const AmpControls = memo(function AmpControls({
  dialValue,
  setDialValue,
  targetValue
}) {
  const { t } = useTranslation(['ui'])

  const handleDialChange = (e) => {
    setDialValue(Number(e.target.value))
  }

  return (
    <div className='absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-4 w-full max-w-md px-4'>
      <div className='flex justify-between w-full text-toxic-green font-mono text-sm'>
        <span>{t('ui:ampCalibration.controls.min', { defaultValue: '0Hz' })}</span>
        <span>{t('ui:ampCalibration.controls.max', { defaultValue: '1000Hz' })}</span>
      </div>
      <input
        type="range"
        min="0"
        max="1000"
        value={dialValue}
        onChange={handleDialChange}
        className="w-full h-4 bg-void-black border-2 border-toxic-green appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-12 [&::-webkit-slider-thumb]:bg-toxic-green
                   [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-12 [&::-moz-range-thumb]:bg-toxic-green [&::-moz-range-thumb]:border-none [&::-moz-range-track]:bg-transparent
                   focus:outline-none focus:ring-2 focus:ring-toxic-green focus:ring-offset-2 focus:ring-offset-void-black"
        aria-label={t('ui:ampCalibration.controls.dialAria', { defaultValue: 'Frequency Dial' })}
      />
      <div className='text-star-white font-mono uppercase tracking-widest mt-2'>
        {t('ui:ampCalibration.controls.instruction', { defaultValue: 'TUNE THE FREQUENCY' })}
      </div>
    </div>
  )
})
