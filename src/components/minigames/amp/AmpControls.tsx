import { memo, type ChangeEvent, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import type { AmpControlsProps } from '../../../types/components'

export const AmpControls = memo(function AmpControls({
  dialValue,
  targetValue,
  setDialValue
}: AmpControlsProps) {
  const { t } = useTranslation(['ui'])

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
    setDialValue(prev => Math.max(0, prev - 10))
  }, [setDialValue])

  const handleFineTuneUp = useCallback(() => {
    setDialValue(prev => Math.min(1000, prev + 10))
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
        <span className={isPerfect ? 'text-toxic-green font-bold' : isClose ? 'text-toxic-green/80' : 'text-ash-gray'}>
          {t('ui:minigames.amp.controls.current', { defaultValue: '{{value}}Hz', value: Math.round(dialValue) })}
        </span>
        <span>
          {t('ui:minigames.amp.controls.max', { defaultValue: '1000Hz' })}
        </span>
      </div>

      <div className='flex items-center gap-4 w-full'>
        <button
          onClick={handleFineTuneDown}
          className='w-12 h-12 flex items-center justify-center bg-void-black border-2 border-toxic-green text-toxic-green hover:bg-toxic-green hover:text-void-black active:scale-95 transition-colors font-bold text-xl rounded focus:outline-none focus:ring-2 focus:ring-toxic-green focus:ring-offset-2 focus:ring-offset-void-black'
          aria-label={t('ui:minigames.amp.controls.fineTuneDown', { defaultValue: 'Fine tune down' })}
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
          aria-label={t('ui:minigames.amp.controls.fineTuneUp', { defaultValue: 'Fine tune up' })}
        >
          +
        </button>
      </div>

      <div className='text-star-white font-mono uppercase tracking-widest mt-2'>
        {t('ui:minigames.amp.controls.instruction', {
          defaultValue: 'TUNE THE FREQUENCY'
        })}
      </div>
    </div>
  )
})
