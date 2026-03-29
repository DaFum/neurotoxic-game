import { memo } from 'react'
import PropTypes from 'prop-types'

export const ToxicModeFlash = memo(function ToxicModeFlash({ isToxicMode }) {
  if (!isToxicMode) return null
  return (
    <div className='absolute inset-0 z-0 toxic-border-flash pointer-events-none' />
  )
})

ToxicModeFlash.propTypes = {
  isToxicMode: PropTypes.bool
}
