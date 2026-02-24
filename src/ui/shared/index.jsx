/**
 * Shared UI Components
 * Reusable UI elements used across multiple components.
 * @module shared
 */

import React, { memo } from 'react'
import PropTypes from 'prop-types'

// Export SettingsPanel
export { SettingsPanel } from './SettingsPanel'
export { VolumeSlider } from './VolumeSlider'
export { Tooltip } from './Tooltip'

/**
 * ActionButton - A standardized action button for overlays and dialogues.
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button label.
 * @param {Function} [props.onClick] - Click handler (optional).
 * @param {string} [props.type='button'] - Button type attribute.
 * @param {string} [props.className] - Additional CSS classes.
 * @param {React.Ref} [props.ref] - Forwarded ref.
 */
export const ActionButton = memo(({ children, onClick, type = 'button', className = '', ref, ...rest }) => (
  <button
    ref={ref}
    type={type}
    onClick={onClick}
    className={`px-8 py-4 bg-(--toxic-green) text-(--void-black) font-bold uppercase
                hover:scale-105 transition-transform
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--toxic-green-20)
                ${className}`}
    {...rest}
  >
    {children}
  </button>
))

ActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.string,
  className: PropTypes.string,
  ref: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.any })
  ])
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

const SIZE_CLASSES = {
  sm: 'h-3',
  md: 'h-5',
  mini: 'h-1.5'
};

/**
 * ProgressBar - Displays a progress bar with label
 * @param {Object} props
 * @param {string} [props.label] - Progress bar label (optional)
 * @param {number} props.value - Current value
 * @param {number} props.max - Maximum value
 * @param {string} props.color - CSS color class
 * @param {string} [props.size='md'] - Size variant (sm, md, mini)
 * @param {boolean} [props.showValue=true] - Whether to show value
 * @param {boolean} [props.warn=false] - Whether to show warning animation
 * @param {string} [props.className] - Additional CSS classes
 */
export const ProgressBar = memo(function ProgressBar({
  label,
  value = 0,
  max,
  color,
  size = 'md',
  showValue = true,
  warn = false,
  className = '',
  ...props
}) {
  const safeMax = max > 0 ? max : 1
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0
  const pct = Math.min(100, (safeValue / safeMax) * 100)
  const isMini = size === 'mini'

  return (
    <div
      className={`w-full ${className}`}
      role='progressbar'
      aria-valuenow={Math.round(safeValue)}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label}
      {...props}
    >
      {!isMini && (label || showValue) && (
        <div className='flex justify-between text-xs mb-1 font-mono'>
          {label && <span className='text-(--ash-gray)'>{label}</span>}
          {showValue && (
            <span className='text-(--ash-gray)'>
              {Math.round(safeValue)}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-(--void-black) border ${
          isMini ? 'border-(--ash-gray)/50 overflow-hidden' : 'border-(--ash-gray)'
        } ${SIZE_CLASSES[size] || SIZE_CLASSES.mini}`}
      >
        <div
          className={`h-full ${color} transition-all duration-500 ${warn ? 'animate-fuel-warning' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
})

ProgressBar.propTypes = {
  label: PropTypes.string,
  value: PropTypes.number,
  max: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'mini']),
  showValue: PropTypes.bool,
  warn: PropTypes.bool,
  className: PropTypes.string
}

/**
 * Panel - A styled container with an optional title.
 * @param {Object} props
 * @param {string} [props.title] - Optional title for the panel header.
 * @param {React.ReactNode} props.children - Panel content.
 * @param {string} [props.className] - Additional CSS classes.
 */
export const Panel = ({ title, children, className = '' }) => (
  <div className={`bg-(--void-black)/40 border border-(--ash-gray)/40 p-4 h-full ${className}`}>
    {title && (
      <h3 className='text-(--toxic-green) text-sm font-bold mb-3 border-b border-(--ash-gray)/40 pb-1 font-mono uppercase tracking-wider'>
        {title}
      </h3>
    )}
    <div className='space-y-1'>
      {children}
    </div>
  </div>
)

Panel.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}
