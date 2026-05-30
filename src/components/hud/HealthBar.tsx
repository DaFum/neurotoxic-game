import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { BlockMeter } from '../../ui/shared'
import { normalizePercentageToScale } from '../../utils/gameStateUtils'

interface HealthBarProps {
  health: number
  isToxicMode?: boolean
}

export const HealthBar = memo(function HealthBar({
  health,
  isToxicMode = false
}: HealthBarProps) {
  const { t } = useTranslation()

  return (
    <div className='absolute bottom-14 sm:bottom-20 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-[28rem] z-(--z-stage-overlay) pointer-events-none'>
      <div className='bg-void-black/80 p-3 sm:p-4 border border-toxic-green/30 backdrop-blur-sm'>
        <BlockMeter
          label={String(t('ui:gig.crowdEnergy', 'CROWD ENERGY'))}
          value={normalizePercentageToScale(health, 20)}
          max={20}
          isDanger={health < 20}
        />
        {isToxicMode && (
          <div className='mt-3 text-blood-red animate-neon-flicker font-bold tracking-widest text-center font-display text-sm border-t border-blood-red/30 pt-2'>
            {t('ui:gig.toxicModeActive', 'TOXIC MODE ACTIVE')}
          </div>
        )}
      </div>
    </div>
  )
})
