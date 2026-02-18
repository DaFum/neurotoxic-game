import PropTypes from 'prop-types'

export const VolumeSlider = ({ label, value, onChange }) => {
  const pct = Math.round(value * 100)

  return (
    <div className='flex items-center justify-between gap-4'>
      <label className='font-[Courier_New] text-sm uppercase tracking-wide text-(--star-white) shrink-0'>
        {label}
      </label>
      <div className='flex items-center gap-3 flex-1 max-w-[16rem]'>
        <input
          type='range'
          min='0'
          max='1'
          step='0.1'
          value={value}
          onChange={onChange}
          aria-label={`${label}: ${pct}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
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
