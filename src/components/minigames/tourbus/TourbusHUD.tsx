import { useTranslation } from 'react-i18next'
import type { TourbusHUDProps } from '../../../types/components'

export const TourbusHUD = ({ distance, damage }: TourbusHUDProps) => {
  const { t } = useTranslation('minigame')

  return (
    <div className='absolute scale-75 sm:scale-100 origin-top-left top-4 left-4 z-(--z-stage-overlay) text-star-white font-mono pointer-events-none bg-void-black/80 p-4 border-2 border-toxic-green shadow-[0_0_15px_var(--color-toxic-green)]'>
      <h2 className='text-2xl font-bold text-toxic-green tracking-widest uppercase mb-2'>
        {t('minigame:tourbus.title', { defaultValue: 'TOURBUS TERROR' })}
      </h2>
      <div className='flex flex-col gap-1 text-sm'>
        <div className='flex justify-between w-48'>
          <span className='text-ash-gray uppercase'>
            {t('minigame:tourbus.distance', { defaultValue: 'DISTANCE:' })}
          </span>
          <span className='text-toxic-green'>{distance}m</span>
        </div>
        <div className='flex justify-between w-48'>
          <span className='text-ash-gray uppercase'>
            {t('minigame:tourbus.damage', { defaultValue: 'DAMAGE:' })}
          </span>
          <span className='text-toxic-green'>{damage}%</span>
        </div>
      </div>
    </div>
  )
}
