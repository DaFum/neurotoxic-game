import { memo } from 'react'
import { HazardTicker } from '../../ui/shared'
import { useTranslation } from 'react-i18next'

interface ToxicHazardTickerProps {
  /** Indicates whether the toxic-mode hazard is currently active. */
  isToxicMode: boolean
}

/**
 * Displays the toxic-mode warning ticker while the hazard is active.
 *
 * @returns The warning ticker element, or null if the hazard is inactive.
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
