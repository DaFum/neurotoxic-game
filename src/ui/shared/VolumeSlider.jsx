import { useId } from 'react'
import PropTypes from 'prop-types'

export const VolumeSlider = ({ label, value, onChange }) => {
  const sliderId = useId()
  const clampedValue = Math.min(1, Math.max(0, value))
  const pct = Math.round(clampedValue * 100)

  return (
    <div className='flex items-center justify-between gap-4'>
      <label
        htmlFor={sliderId}
        className='font-[Courier_New] text-sm uppercase tracking-wide text-(--star-white) shrink-0 cursor-pointer'
      >
        {label}
      </label>
      <div className='flex items-center gap-3 flex-1 max-w-[16rem]'>
        <input
          id={sliderId}
          type='range'
          min='0'
          max='1'
          step='0.1'
          value={value}
          onChange={onChange}
          aria-valuetext={`${pct}%`}
          className='vol-slider flex-1'
          style={{
            background: `linear-gradient(to right, var(--toxic-green) ${pct}%, var(--ash-gray) ${pct}%)`
          }}
        />
        <span className='font-mono text-xs text-(--toxic-green) w-10 text-right tabular-nums'>
          {pct}%
        </span>
      </div>
    </div>
  )
}

VolumeSlider.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
}
