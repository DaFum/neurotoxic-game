/**
 * Shared UI Components
 * Reusable UI elements used across multiple components.
 * @module shared
 */

import React from 'react'
import PropTypes from 'prop-types'

// Prevent linter errors for re-exported components
/* eslint-disable react/prop-types */

// Export SettingsPanel
export { SettingsPanel } from './SettingsPanel'
export { VolumeSlider } from './VolumeSlider'

// Re-export deprecated components to maintain API compatibility
// These might be removed in future versions.
export const Panel = ({ children, className = '' }) => (
  <div
    className={`bg-(--void-black) border border-(--ash-gray) p-4 ${className}`}
  >
    {children}
  </div>
)
export const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-mono uppercase text-sm transition-colors ${
      active
        ? 'bg-(--toxic-green) text-(--void-black) font-bold'
        : 'text-(--ash-gray) hover:text-(--star-white)'
    }`}
  >
    {children}
  </button>
)
export const ActionButton = ({ onClick, disabled, label, className = '' }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-2 font-bold font-mono uppercase transition-colors ${
      disabled
        ? 'bg-(--ash-gray)/20 text-(--ash-gray) cursor-not-allowed'
        : 'bg-(--toxic-green) text-(--void-black) hover:bg-(--star-white)'
    } ${className}`}
  >
    {label}
  </button>
)
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80'>
      <div className='bg-(--void-black) border-2 border-(--toxic-green) w-full max-w-lg p-6 relative shadow-[0_0_20px_var(--toxic-green)]'>
        <div className='flex justify-between items-center mb-6 border-b border-(--ash-gray) pb-2'>
          <h2 className='text-2xl font-[Metal_Mania] text-(--toxic-green)'>
            {title}
          </h2>
          <button
            onClick={onClose}
            className='text-(--ash-gray) hover:text-(--blood-red)'
            aria-label='Close'
          >
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
export const Grid = ({ children, cols = 1, gap = 4, className = '' }) => {
  const colsClass =
    {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4'
    }[cols] || 'grid-cols-1'

  const gapClass =
    {
      1: 'gap-1',
      2: 'gap-2',
      4: 'gap-4',
      6: 'gap-6',
      8: 'gap-8'
    }[gap] || 'gap-4'

  return (
    <div className={`grid ${colsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  )
}

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
