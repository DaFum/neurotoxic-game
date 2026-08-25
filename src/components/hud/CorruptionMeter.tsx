import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'
import { normalizePercentageToScale } from '../../utils/gameState'

/**
 * Configuration properties for the CorruptionMeter component.
 */
interface CorruptionMeterProps {
  corruptionLevel: number
  isCorruptionBurstActive: boolean
  isDanger?: boolean
}

/**
 * Displays corruption percentage and burst status as a compact HUD meter.
 *
 * @remarks
 * The meter visually escalates into a danger state as corruption approaches
 * its limit, switching entirely to a burst warning when triggered.
 *
 * @param props - The properties for the corruption meter component.
 * @returns The rendered block meter or the active burst warning.
 */
export const CorruptionMeter = memo(function CorruptionMeter({
  corruptionLevel,
  isCorruptionBurstActive,
  isDanger = false
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
          isDanger={isDanger}
          showValue={false}
        />
      )}
    </div>
  )
})
