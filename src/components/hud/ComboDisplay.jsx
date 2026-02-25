import { memo } from 'react'
import PropTypes from 'prop-types'

export const ComboDisplay = memo(function ComboDisplay({ combo, accuracy }) {
  const comboTier =
    combo >= 50
      ? 'text-(--blood-red) animate-pulse'
      : combo >= 20
        ? 'text-(--warning-yellow)'
        : combo > 0
          ? 'text-(--toxic-green)'
          : 'text-(--ash-gray)/50'

  return (
    <div className='mt-2 bg-(--void-black)/60 backdrop-blur-sm border border-(--toxic-green)/20 px-3 py-1.5 inline-flex items-baseline gap-2'>
      <div
        className={`text-2xl font-bold transition-all duration-100 tabular-nums ${comboTier} ${
          combo > 0 ? 'scale-110' : 'scale-100'
        }`}
      >
        {combo}x
      </div>
      <div className='text-[10px] text-(--ash-gray) uppercase tracking-widest'>
        combo
      </div>
      {accuracy < 70 && (
        <div className='text-[10px] text-(--warning-yellow) animate-pulse'>
          LOW ACC
        </div>
      )}
    </div>
  )
})

ComboDisplay.propTypes = {
  combo: PropTypes.number.isRequired,
  accuracy: PropTypes.number.isRequired
}
