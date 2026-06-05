import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'
import { normalizePercentageToScale } from '../../utils/gameState'

interface HealthBarProps {
  health: number
  isToxicMode?: boolean
}

/**
 * Displays crowd energy with toxic-mode visual treatment.
 * @param props - Current health and toxic-mode state.
 */
export const HealthBar = memo(function HealthBar({
  health,
  isToxicMode = false
}: HealthBarProps) {
  const { t } = useTranslation()

  return (
    <div className='absolute bottom-14 sm:bottom-20 left-1/2 -translate-x-1/2 w-full px-4 max-w-[28rem] z-(--z-stage-overlay) pointer-events-none'>
      <div
        className='p-3 sm:p-4 border backdrop-blur-sm'
        style={{
          backgroundColor: 'rgb(var(--color-void-black-rgb) / 80%)',
          borderColor:
            'color-mix(in srgb, var(--color-toxic-green) 30%, transparent)'
        }}
      >
        <BlockMeter
          label={String(t('ui:gig.crowdEnergy', 'CROWD ENERGY'))}
          value={normalizePercentageToScale(health, 20)}
          max={20}
          isDanger={health < 20}
        />
        {isToxicMode && (
          <div
            className='mt-3 animate-neon-flicker font-bold tracking-widest text-center font-display text-sm border-t pt-2'
            style={{
              borderTopColor:
                'color-mix(in srgb, var(--color-error-red) 30%, transparent)',
              color: 'var(--color-error-red)'
            }}
          >
            {t('ui:gig.toxicModeActive', 'TOXIC MODE ACTIVE')}
          </div>
        )}
      </div>
    </div>
  )
})
