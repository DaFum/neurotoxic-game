import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import type { RoadieHUDProps } from '../../../types/components'

export const RoadieHUD = memo(function RoadieHUD({ uiState }: RoadieHUDProps) {
  const { t } = useTranslation(['ui'])

  return (
    <div className='absolute scale-75 sm:scale-100 origin-top-left top-4 left-4 z-(--z-stage-overlay) text-star-white font-mono pointer-events-none bg-void-black/80 p-4 border-2 border-toxic-green shadow-[0_0_15px_var(--color-toxic-green)]'>
      <h2 className='text-2xl font-bold text-toxic-green tracking-widest uppercase mb-2'>
        {t('ui:roadieRun.hud.title')}
      </h2>
      <div className='flex flex-col gap-1 text-sm'>
        <div className='flex justify-between w-48'>
          <span className='text-ash-gray uppercase'>
            {t('ui:roadieRun.hud.itemsRemaining')}
          </span>
          <span className='text-toxic-green'>{uiState.itemsRemaining}</span>
        </div>
        <div className='flex justify-between w-48'>
          <span className='text-ash-gray uppercase'>
            {t('ui:roadieRun.hud.delivered')}
          </span>
          <span className='text-toxic-green'>{uiState.itemsDelivered}</span>
        </div>
        <div className='flex justify-between w-48'>
          <span className='text-ash-gray uppercase'>
            {t('ui:roadieRun.hud.damage')}
          </span>
          <span className='text-toxic-green'>{uiState.currentDamage}%</span>
        </div>
        {uiState.carrying && (
          <div className='mt-2 border-t border-toxic-green/30 pt-2 flex justify-between w-48'>
            <span className='text-ash-gray uppercase'>
              {t('ui:roadieRun.hud.carrying')}
            </span>
            <span
              className={
                uiState.carrying.type === 'CONTRABAND'
                  ? 'text-toxic-green motion-safe:animate-pulse font-bold'
                  : 'text-warning-yellow'
              }
            >
              {t(`ui:roadieRun.itemTypes.${uiState.carrying.type}`, {
                defaultValue: t('ui:roadieRun.itemTypes.unknown', {
                  defaultValue: uiState.carrying.type
                })
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  )
})
