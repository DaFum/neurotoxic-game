import { useTranslation } from 'react-i18next'
import type { TourbusHUDProps } from '../../../types/components'

/**
 * Renders the Tourbus HUD.
 * @param props - Travel distance and damage totals displayed during the tourbus minigame.
 */
export const TourbusHUD = ({ distance, damage }: TourbusHUDProps) => {
  const { t } = useTranslation('minigame')

  return (
    <div className='absolute scale-75 sm:scale-100 origin-top-left top-4 left-4 z-(--z-stage-overlay) text-star-white font-mono pointer-events-none'>
      <h2 className='text-2xl text-toxic-green'>
        {t('minigame:tourbus.title', { defaultValue: 'TOURBUS TERROR' })}
      </h2>
      <div className='mt-2'>
        <p>
          {t('minigame:tourbus.distance', { defaultValue: 'DISTANCE:' })}{' '}
          {distance}m
        </p>
        <p>
          {t('minigame:tourbus.damage', { defaultValue: 'DAMAGE:' })} {damage}%
        </p>
      </div>
    </div>
  )
}
