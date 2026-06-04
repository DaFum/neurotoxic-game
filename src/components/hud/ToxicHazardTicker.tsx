import { memo } from 'react'
import { HazardTicker } from '../../ui/shared'
import { useTranslation } from 'react-i18next'

interface ToxicHazardTickerProps {
  isToxicMode: boolean
}

/**
 * Displays the toxic-mode warning ticker while the hazard is active.
 * @param props - Toxic-mode state used to show the hazard ticker.
 */
export const ToxicHazardTicker = memo(function ToxicHazardTicker({
  isToxicMode
}: ToxicHazardTickerProps) {
  const { t } = useTranslation()

  if (!isToxicMode) return null

  return (
    <div className='absolute top-0 w-full z-(--z-stage-overlay)'>
      <HazardTicker
        message={t(
          'ui:hazard.toxicOverload',
          'TOXIC OVERLOAD DETECTED // SEVERE SYSTEM STRESS // STAY FOCUSED'
        )}
      />
    </div>
  )
})
