import sys

with open("src/ui/overworld/OverworldHeader.tsx", "r") as f:
    content = f.read()

new_header = """import React from 'react'
import { ToggleRadio } from '../../components/ToggleRadio'

export const OverworldHeader = React.memo(
  ({ t, locationName, isTraveling }: any) => {
    return (
      <>
        <div className="ow-title">{t('ui:overworld.header.tourPlan', { defaultValue: 'TOUR PLAN' })}: {locationName}</div>
        <div className="ow-status">
          <div className="ow-status-main">
            {isTraveling ? t('ui:overworld.status.traveling', { defaultValue: 'TRAVELING...' }) : t('ui:overworld.status.nextStop', { defaultValue: 'Next Stop' })}
          </div>
          <div className="ow-status-sub">
            {isTraveling ? t('ui:overworld.status.onRoad', { defaultValue: 'On the road' }) : t('ui:overworld.status.selectLocation', { defaultValue: 'Select a highlighted location' })}
          </div>
        </div>
      </>
    )
  }
)

OverworldHeader.displayName = 'OverworldHeader'
"""

with open("src/ui/overworld/OverworldHeader.tsx", "w") as f:
    f.write(new_header)
