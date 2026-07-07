import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'
import { normalizePercentageToScale } from '../../utils/gameState'

/**
 * Properties for the {@link HealthBar} component.
 */
interface HealthBarProps {
  /** The current health/crowd energy level, represented as a percentage. */
  health: number
  /** Indicates whether the toxic mode visual modifiers should be applied. */
  isToxicMode?: boolean
}

/**
 * Displays crowd energy with toxic-mode visual treatment.
 *
 * @returns A JSX element containing the health bar meter and optional toxic mode warning.
 */
export const HealthBar = memo(function HealthBar({
  health,
  isToxicMode = false
}: HealthBarProps) {
  const { t } = useTranslation()

  return (
    <div className='absolute bottom-14 sm:bottom-20 left-1/2 -translate-x-1/2 w-full px-4 max-w-[28rem] z-(--z-stage-overlay) pointer-events-none'>
      <div className='p-3 sm:p-4 border backdrop-blur-sm bg-void-black/80 border-toxic-green/30'>
        <BlockMeter
          label={String(t('ui:gig.crowdEnergy', 'CROWD ENERGY'))}
          value={normalizePercentageToScale(health, 20)}
          max={20}
          isDanger={health < 20}
        />
        {isToxicMode && (
          <div className='mt-3 animate-neon-flicker font-bold tracking-widest text-center font-display text-sm border-t pt-2 border-t-[color-mix(in_srgb,var(--color-error-red)_30%,transparent)] text-error-red'>
            {t('ui:gig.toxicModeActive', 'TOXIC MODE ACTIVE')}
          </div>
        )}
      </div>
    </div>
  )
})
