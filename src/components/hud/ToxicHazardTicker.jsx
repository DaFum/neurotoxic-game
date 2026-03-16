// TODO: Implement this
import { memo } from 'react'
import PropTypes from 'prop-types'
import { HazardTicker } from '../../ui/shared'
import { useTranslation } from 'react-i18next'

export const ToxicHazardTicker = memo(function ToxicHazardTicker({
  isToxicMode
}) {
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

ToxicHazardTicker.propTypes = {
  isToxicMode: PropTypes.bool.isRequired
}
