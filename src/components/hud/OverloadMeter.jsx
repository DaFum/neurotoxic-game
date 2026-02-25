import { memo } from 'react'
import PropTypes from 'prop-types'

export const OverloadMeter = memo(function OverloadMeter({ overload }) {
  return (
    <div className='mt-3 w-48'>
      <div className='flex justify-between text-[10px] text-(--ash-gray) mb-1'>
        <span className='tracking-widest'>TOXIC OVERLOAD</span>
        <span
          className={`tabular-nums ${overload > 80 ? 'text-(--blood-red) animate-pulse' : ''}`}
        >
          {Math.floor(overload)}%
        </span>
      </div>
      <div className='w-full h-2.5 bg-(--void-black)/80 border border-(--ash-gray)/30 overflow-hidden p-[1px]'>
        <div
          className={`h-full transition-all duration-200 ease-out ${
            overload > 80
              ? 'bg-gradient-to-r from-(--toxic-green) to-(--blood-red) shadow-[0_0_10px_var(--blood-red)]'
              : 'bg-(--toxic-green) shadow-[0_0_6px_var(--toxic-green)]'
          }`}
          style={{ width: `${overload}%` }}
        />
      </div>
    </div>
  )
})

OverloadMeter.propTypes = {
  overload: PropTypes.number.isRequired
}
