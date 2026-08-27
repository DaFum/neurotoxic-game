import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'
import { normalizePercentageToScale } from '../../utils/gameState'

/**
 * Properties for the {@link HealthBar} component.
 */
interface HealthBarProps {
  health: number
  isToxicMode?: boolean
  isDanger?: boolean
}

/**
 * Displays crowd energy with toxic-mode visual treatment.
 *
 * @returns A JSX element containing the health bar meter and optional toxic mode warning.
 */
export const HealthBar = memo(function HealthBar({
  health,
  isToxicMode = false,
  isDanger = false
}: HealthBarProps) {
  const { t } = useTranslation()

  return (
    // Pinned below the lanes rather than across them. `buildRhythmLayout` puts
    // the lanes at `screenHeight * 0.6` with the hit line 60px above the bottom
    // edge, so this panel used to cover all three lanes through the last ~100px
    // of a note's approach. As a slim strip on the bottom edge it only overlaps
    // the lanes' tail below the hit line, where notes are already resolved.
    <div className='absolute bottom-0 left-1/2 -translate-x-1/2 w-full px-4 max-w-[28rem] z-(--z-stage-overlay) pointer-events-none'>
      <div className='px-2 py-0 border backdrop-blur-sm bg-void-black/80 border-[color-mix(in_srgb,var(--color-toxic-green)_30%,transparent)]'>
        <BlockMeter
          layout='inline'
          label={String(t('ui:gig.crowdEnergy', 'CROWD ENERGY'))}
          value={normalizePercentageToScale(health, 20)}
          max={20}
          isDanger={isDanger}
        />
        {isToxicMode && (
          <div className='mt-1 animate-neon-flicker font-bold tracking-widest text-center font-display text-xs border-t pt-1 border-t-[color-mix(in_srgb,var(--color-error-red)_30%,transparent)] text-error-red'>
            {t('ui:gig.toxicModeActive', 'TOXIC MODE ACTIVE')}
          </div>
        )}
      </div>
    </div>
  )
})
