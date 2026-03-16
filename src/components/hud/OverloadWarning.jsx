// TODO: Implement this
import { memo } from 'react'
import PropTypes from 'prop-types'
import { VoidSkullIcon } from '../../ui/shared/Icons'

export const OverloadWarning = memo(function OverloadWarning({
  overload,
  isToxicMode
}) {
  if (overload <= 90 && !isToxicMode) return null

  return (
    <div className='absolute top-1/4 right-8 z-20 opacity-50 pointer-events-none'>
      <VoidSkullIcon className='w-32 h-32 text-blood-red animate-pulse' />
    </div>
  )
})

OverloadWarning.propTypes = {
  overload: PropTypes.number.isRequired,
  isToxicMode: PropTypes.bool.isRequired
}
