import { memo } from 'react'
import { useTranslation } from 'react-i18next'

export const RoadieHUD = memo(function RoadieHUD({ uiState }) {
  const { t } = useTranslation(['ui'])

  return (
    <div className='absolute top-4 left-4 z-30 text-star-white font-mono pointer-events-none bg-void-black/50 p-2 border border-star-white/20'>
      <h2 className='text-xl text-toxic-green'>
        {t('ui:roadieRun.hud.title')}
      </h2>
      <div>
        {t('ui:roadieRun.hud.itemsRemaining')} {uiState.itemsRemaining}
      </div>
      <div>
        {t('ui:roadieRun.hud.delivered')} {uiState.itemsDelivered}
      </div>
      <div>
        {t('ui:roadieRun.hud.damage')} {uiState.currentDamage}%
      </div>
      {uiState.carrying && (
        <div className='text-warning-yellow'>
          {t('ui:roadieRun.hud.carrying')}{' '}
          {t(`ui:roadieRun.itemTypes.${uiState.carrying.type}`, {
            defaultValue: t('ui:roadieRun.itemTypes.unknown', {
              defaultValue: uiState.carrying.type
            })
          })}
        </div>
      )}
    </div>
  )
})
