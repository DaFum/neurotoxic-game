import { memo, type ChangeEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import type { AmpControlsProps } from '../../../types/components'

export const AmpControls = memo(function AmpControls({
  dialValue,
  targetValue,
  setDialValue,
  isOverdriveActive,
  setIsOverdriveActive
}: AmpControlsProps) {
  const { t } = useTranslation(['ui'])

  const handleToggleOverdrive = useCallback(() => {
    setIsOverdriveActive(prev => !prev)
  }, [setIsOverdriveActive])

  const handleDialChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setDialValue(Number(e.target.value))
    },
    [setDialValue]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setDialValue(prev => Math.max(0, prev - 10))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setDialValue(prev => Math.min(1000, prev + 10))
      }
    },
    [setDialValue]
  )

  const handleFineTuneDown = useCallback(() => {
    setDialValue(prev => Math.max(0, prev - 1))
  }, [setDialValue])

  const handleFineTuneUp = useCallback(() => {
    setDialValue(prev => Math.min(1000, prev + 1))
  }, [setDialValue])

  // Optional distance color mapping for better UX
  const distance = Math.abs(dialValue - targetValue)
  const isClose = distance < 100
  const isPerfect = distance < 20

  return (
    <div className='absolute bottom-16 left-1/2 -translate-x-1/2 z-(--z-hud) flex flex-col items-center gap-4 w-full max-w-md px-4'>
      <div className='flex justify-between w-full text-toxic-green font-mono text-sm'>
        <span>
          {t('ui:minigames.amp.controls.min', { defaultValue: '0Hz' })}
        </span>
        <span
          className={
            isPerfect
              ? 'text-toxic-green font-bold'
              : isClose
                ? 'text-toxic-green/80'
                : 'text-ash-gray'
          }
        >
          {t('ui:minigames.amp.controls.current', {
            defaultValue: '{{value}}Hz',
            value: Math.round(dialValue)
          })}
        </span>
        <span>
          {t('ui:minigames.amp.controls.max', { defaultValue: '1000Hz' })}
        </span>
      </div>

      <div className='flex items-center gap-4 w-full'>
        <button
          onClick={handleFineTuneDown}
          className='w-12 h-12 flex items-center justify-center bg-void-black border-2 border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black active:scale-95 transition-colors font-bold text-xl rounded focus:outline-none focus:ring-2 focus:ring-toxic-green focus:ring-offset-2 focus:ring-offset-void-black'
          aria-label={t('ui:minigames.amp.controls.fineTuneDown', {
            defaultValue: 'Fine tune down'
          })}
        >
          -
        </button>

        <input
          type='range'
          min='0'
          max='1000'
          step='10'
          value={dialValue}
          onChange={handleDialChange}
          onKeyDown={handleKeyDown}
          className='flex-1 h-4 bg-void-black border-2 border-toxic-green appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-12 [&::-webkit-slider-thumb]:bg-toxic-green
                     [&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-12 [&::-moz-range-thumb]:bg-toxic-green [&::-moz-range-thumb]:border-none [&::-moz-range-track]:bg-transparent
                     focus:outline-none focus:ring-2 focus:ring-toxic-green focus:ring-offset-2 focus:ring-offset-void-black'
          aria-label={t('ui:minigames.amp.controls.dialAria', {
            defaultValue: 'Frequency Dial'
          })}
          aria-valuetext={t('ui:minigames.amp.controls.dialValue', {
            value: dialValue,
            defaultValue: '{{value}} Hz'
          })}
        />

        <button
          onClick={handleFineTuneUp}
          className='w-12 h-12 flex items-center justify-center bg-void-black border-2 border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black active:scale-95 transition-colors font-bold text-xl rounded focus:outline-none focus:ring-2 focus:ring-toxic-green focus:ring-offset-2 focus:ring-offset-void-black'
          aria-label={t('ui:minigames.amp.controls.fineTuneUp', {
            defaultValue: 'Fine tune up'
          })}
        >
          +
        </button>
      </div>

      <div className='text-star-white font-mono uppercase tracking-widest mt-2'>
        {t('ui:minigames.amp.controls.instruction', {
          defaultValue: 'TUNE THE FREQUENCY'
        })}
      </div>

      <div className='mt-2'>
        <button
          onClick={handleToggleOverdrive}
          className={`px-6 py-2 font-mono font-bold uppercase border-2 transition-all duration-150 ${
            isOverdriveActive
              ? 'bg-toxic-green text-void-black border-toxic-green shadow-[0_0_15px_var(--color-toxic-green)] animate-pulse'
              : 'bg-void-black text-toxic-green border-toxic-green hover:bg-toxic-green/20'
          }`}
          aria-label={t('ui:minigames.amp.controls.overdrive', {
            defaultValue: 'Toggle Overdrive'
          })}
        >
          {t('ui:minigames.amp.controls.overdrive', {
            defaultValue: 'OVERDRIVE'
          })}
        </button>
      </div>
    </div>
  )
})
