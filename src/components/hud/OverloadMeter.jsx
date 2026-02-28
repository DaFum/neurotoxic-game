import { memo } from 'react'
import PropTypes from 'prop-types'

import { BlockMeter } from '../../ui/shared/BrutalistUI'

export const OverloadMeter = memo(function OverloadMeter({ overload }) {
  return (
    <div className='mt-3 w-48 bg-(--void-black)/80 p-2 border border-(--toxic-green)/30 backdrop-blur-sm'>
      <BlockMeter
        label="TOXIC OVERLOAD"
        value={Math.round((overload / 100) * 10)}
        max={10}
        isDanger={overload > 80}
      />
    </div>
  )
})

OverloadMeter.propTypes = {
  overload: PropTypes.number.isRequired
}
