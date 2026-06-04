import { memo } from 'react'
import { HazardTicker } from '../../ui/shared'
import { useTranslation } from 'react-i18next'

interface ToxicHazardTickerProps {
  isToxicMode: boolean
}

/**
 * Renders the Toxic Hazard Ticker component from isToxicMode.
 * @param props - Toxic-mode state used to show the hazard ticker.
 * @returns The rendered Toxic Hazard Ticker UI.
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
