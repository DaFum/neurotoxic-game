import React from 'react'
import { type TranslationCallback } from '../../types/callbacks'

export interface OverworldHeaderProps {
  t: TranslationCallback
  locationName: string
  isTraveling: boolean
}

export const OverworldHeader = React.memo(
  ({ t, locationName, isTraveling }: OverworldHeaderProps) => {
    return (
      <>
        <div className='ow-title'>
          {t('ui:overworld.header.tourPlan', { defaultValue: 'TOUR PLAN' })}:{' '}
          {locationName}
        </div>
        <div className='ow-status'>
          <div className='ow-status-main'>
            {isTraveling
              ? t('ui:overworld.status.traveling', {
                  defaultValue: 'TRAVELING...'
                })
              : t('ui:overworld.status.nextStop', {
                  defaultValue: 'Next Stop'
                })}
          </div>
          <div className='ow-status-sub'>
            {isTraveling
              ? t('ui:overworld.status.onRoad', { defaultValue: 'On the road' })
              : t('ui:overworld.status.selectLocation', {
                  defaultValue: 'Select a highlighted location'
                })}
          </div>
        </div>
      </>
    )
  }
)

OverworldHeader.displayName = 'OverworldHeader'
