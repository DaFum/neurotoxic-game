import React from 'react'
/**
 * Shared UI Components
 * Reusable UI elements used across multiple components.
 * @module shared
 */

import PropTypes from 'prop-types'

// Export SettingsPanel
export { SettingsPanel } from './SettingsPanel'
export { VolumeSlider } from './VolumeSlider'

/**
 * StatBox - Displays a single statistic with an icon
 * @param {Object} props
 * @param {string} props.label - Stat label
 * @param {string|number} props.value - Stat value
 * @param {string} props.icon - Icon or emoji
 * @param {string} [props.className] - Additional CSS classes
 */
export const StatBox = ({ label, value, icon, className = '' }) => (
  <div
    className={`bg-(--void-black) p-3 flex flex-col items-center justify-center border border-(--ash-gray) ${className}`}
  >
    <div className='text-2xl mb-1 text-(--toxic-green)'>{icon}</div>
    <div className='text-xl font-bold text-(--star-white) font-mono'>
      {value}
    </div>
    <div className='text-xs text-(--ash-gray) uppercase font-mono'>{label}</div>
  </div>
)

StatBox.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.string.isRequired,
  className: PropTypes.string
}

/**
 * ProgressBar - Displays a progress bar with label
 * @param {Object} props
 * @param {string} props.label - Progress bar label
 * @param {number} props.value - Current value
 * @param {number} props.max - Maximum value
 * @param {string} props.color - CSS color class
 * @param {string} [props.size='md'] - Size variant (sm, md)
 * @param {boolean} [props.showValue=true] - Whether to show value
 * @param {string} [props.className] - Additional CSS classes
 */
export const ProgressBar = ({
  label,
  value = 0,
  max,
  color,
  size = 'md',
  showValue = true,
  className = ''
}) => {
  const safeMax = max > 0 ? max : 1
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0
  const pct = Math.min(100, (safeValue / safeMax) * 100)

  return (
    <div className={`w-full ${className}`}>
      <div className='flex justify-between text-xs mb-1 font-mono'>
        <span className='text-(--ash-gray)'>{label}</span>
        {showValue && (
          <span className='text-(--ash-gray)'>
            {Math.round(safeValue)}/{max}
          </span>
        )}
      </div>
      <div
        className={`w-full bg-(--void-black) border border-(--ash-gray) ${size === 'sm' ? 'h-3' : 'h-5'}`}
      >
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

ProgressBar.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  max: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md']),
  showValue: PropTypes.bool,
  className: PropTypes.string
}
