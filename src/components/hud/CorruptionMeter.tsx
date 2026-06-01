import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'
import { normalizePercentageToScale } from '../../utils/gameStateUtils'

interface CorruptionMeterProps {
  corruptionLevel: number
  isCorruptionBurstActive: boolean
}

export const CorruptionMeter = memo(function CorruptionMeter({
  corruptionLevel,
  isCorruptionBurstActive
}: CorruptionMeterProps) {
  const { t } = useTranslation('ui')
  return (
    <div className='mt-3 w-48 bg-void-black/80 p-2 border border-error-red/30 backdrop-blur-sm'>
      {isCorruptionBurstActive ? (
        <div className='text-error-red font-bold text-sm tracking-widest text-center animate-pulse'>
          {t('ui:hud.burst_armed')}
        </div>
      ) : (
        <BlockMeter
          label={t('ui:hud.decibel_corruption')}
          value={normalizePercentageToScale(corruptionLevel, 10)}
          max={10}
          isDanger={corruptionLevel > 80}
        />
      )}
    </div>
  )
})
