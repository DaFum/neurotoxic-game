import PropTypes from 'prop-types'

export const VolumeSlider = ({ label, value, onChange }) => (
  <div className='flex items-center justify-between'>
    <label className='font-[Courier_New] text-sm uppercase tracking-wide text-(--star-white)'>
      {label}
    </label>
    <input
      type='range'
      min='0'
      max='1'
      step='0.1'
      value={value}
      onChange={onChange}
      className='w-48 accent-(--toxic-green) bg-(--void-black)'
    />
  </div>
)

VolumeSlider.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired
}
