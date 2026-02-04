/**
 * Shared UI Components
 * Reusable UI elements used across multiple components.
 * @module shared
 */

import React from 'react'
import PropTypes from 'prop-types'

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
    className={`bg-[var(--void-black)] p-3 flex flex-col items-center justify-center border border-[var(--ash-gray)] ${className}`}
  >
    <div className='text-2xl mb-1 text-[var(--toxic-green)]'>{icon}</div>
    <div className='text-xl font-bold text-white font-mono'>{value}</div>
    <div className='text-xs text-[var(--ash-gray)] uppercase font-mono'>
      {label}
    </div>
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
        <span className='text-[var(--ash-gray)]'>{label}</span>
        {showValue && (
          <span className='text-[var(--ash-gray)]'>
            {Math.round(safeValue)}/{max}
          </span>
        )}
      </div>
      <div
        className={`w-full bg-[var(--void-black)] border border-[var(--ash-gray)] ${size === 'sm' ? 'h-3' : 'h-5'}`}
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

/**
 * Panel - A styled container panel
 * @param {Object} props
 * @param {string} [props.title] - Panel title
 * @param {React.ReactNode} props.children - Panel content
 * @param {string} [props.className] - Additional CSS classes
 */
export const Panel = ({ title, children, className = '' }) => (
  <div
    className={`bg-black/40 border-2 border-[var(--ash-gray)] p-4 ${className}`}
  >
    {title && (
      <h3 className='text-[var(--toxic-green)] text-lg font-bold mb-4 border-b border-[var(--ash-gray)] pb-2 font-mono'>
        {title}
      </h3>
    )}
    {children}
  </div>
)

Panel.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

/**
 * TabButton - A styled tab button
 * @param {Object} props
 * @param {boolean} props.active - Whether tab is active
 * @param {Function} props.onClick - Click handler
 * @param {React.ReactNode} props.children - Button content
 * @param {string} [props.className] - Additional CSS classes
 */
export const TabButton = ({ active, onClick, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-4 text-center font-bold text-xl uppercase tracking-wider transition-colors duration-150 font-mono ${className}
      ${
        active
          ? 'bg-[var(--toxic-green)] text-black'
          : 'text-[var(--ash-gray)] hover:text-white bg-black/50 hover:bg-black/70'
      }`}
  >
    {children}
  </button>
)

TabButton.propTypes = {
  active: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

/**
 * ActionButton - A styled action button
 * @param {Object} props
 * @param {Function} props.onClick - Click handler
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {string} [props.variant='primary'] - Button variant
 * @param {React.ReactNode} props.children - Button content
 * @param {string} [props.className] - Additional CSS classes
 */
export const ActionButton = ({
  onClick,
  disabled = false,
  variant = 'primary',
  children,
  className = ''
}) => {
  const variants = {
    primary:
      'border-[var(--toxic-green)] bg-[var(--toxic-green)] text-black hover:invert',
    secondary:
      'border-[var(--ash-gray)] text-[var(--ash-gray)] hover:bg-[var(--ash-gray)] hover:text-black',
    danger:
      'border-[var(--blood-red)] text-[var(--blood-red)] hover:bg-[var(--blood-red)] hover:text-black',
    warning:
      'border-[var(--warning-yellow)] text-[var(--warning-yellow)] hover:bg-[var(--warning-yellow)] hover:text-black'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 border-2 font-bold uppercase transition-all duration-200 font-mono
        ${variants[variant] || variants.primary}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'shadow-[4px_4px_0px_var(--void-black)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'}
        ${className}`}
    >
      {children}
    </button>
  )
}

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'warning']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

/**
 * Modal - A styled modal container
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {string} [props.title] - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} [props.className] - Additional CSS classes
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm'>
      <div
        className={`relative w-full max-w-2xl border-4 border-[var(--toxic-green)] bg-[var(--void-black)] shadow-[0_0_50px_var(--toxic-green)] ${className}`}
      >
        {/* Header */}
        <div className='flex justify-between items-center p-4 border-b-2 border-[var(--toxic-green)] bg-black/50'>
          {title && (
            <h2 className="text-2xl text-[var(--toxic-green)] font-['Metal_Mania'] drop-shadow-[0_0_5px_var(--toxic-green)]">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className='px-4 py-1 border-2 border-[var(--blood-red)] text-[var(--blood-red)] font-bold hover:bg-[var(--blood-red)] hover:text-black transition-colors duration-200 uppercase font-mono text-sm'
          >
            CLOSE [ESC]
          </button>
        </div>

        {/* Content */}
        <div className='p-4'>{children}</div>
      </div>
    </div>
  )
}

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}

/**
 * Static class maps for Tailwind JIT compatibility
 * @private
 */
const colClassMap = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6'
}

const gapClassMap = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8'
}

/**
 * Grid - A responsive grid container
 * @param {Object} props
 * @param {number} [props.cols=3] - Number of columns on large screens
 * @param {number} [props.gap=4] - Gap between items
 * @param {React.ReactNode} props.children - Grid content
 * @param {string} [props.className] - Additional CSS classes
 */
export const Grid = ({ cols = 3, gap = 4, children, className = '' }) => {
  const colClass = colClassMap[cols] || colClassMap[3]
  const gapClass = gapClassMap[gap] || gapClassMap[4]

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 ${colClass} ${gapClass} ${className}`}
    >
      {children}
    </div>
  )
}

Grid.propTypes = {
  cols: PropTypes.number,
  gap: PropTypes.number,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
}
