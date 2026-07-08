import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'
import { normalizePercentageToScale } from '../../utils/gameState'

interface CorruptionMeterProps {
  corruptionLevel: number
  isCorruptionBurstActive: boolean
}

/**
 * Displays decibel corruption and burst status as a compact HUD meter.
 * @param props - Corruption level and burst-active state.
 */
export const CorruptionMeter = memo(function CorruptionMeter({
  corruptionLevel,
  isCorruptionBurstActive
}: CorruptionMeterProps) {
  const { t } = useTranslation('ui')
  return (
    <div className='w-48 p-2 border backdrop-blur-sm bg-void-black/80 border-[color-mix(in_srgb,var(--color-error-red)_30%,transparent)]'>
      {isCorruptionBurstActive ? (
        <div className='font-bold text-sm tracking-widest text-center animate-pulse text-error-red'>
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
