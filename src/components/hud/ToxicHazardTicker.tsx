// TODO: Review this file
import { memo } from 'react'
import { HazardTicker } from '../../ui/shared'
import { useTranslation } from 'react-i18next'

interface ToxicHazardTickerProps {
  isToxicMode: boolean
}

export const ToxicHazardTicker = memo(function ToxicHazardTicker({
  isToxicMode
}: ToxicHazardTickerProps) {
  const { t } = useTranslation()

  if (!isToxicMode) return null

  return (
    <div className='absolute top-0 w-full z-20'>
      <HazardTicker
        message={t(
          'ui:hazard.toxicOverload',
          'TOXIC OVERLOAD DETECTED // SEVERE SYSTEM STRESS // STAY FOCUSED'
        )}
      />
    </div>
  )
})
