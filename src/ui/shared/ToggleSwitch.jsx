import { memo } from 'react'
import PropTypes from 'prop-types'

/**
 * ToggleSwitch - A standardized toggle switch for binary options.
 * @module ToggleSwitch
 * @param {Object} props
 * @param {boolean} props.isOn - Current state.
 * @param {Function} props.onToggle - Callback function.
 * @param {string} props.ariaLabel - Accessible label.
 * @param {string} [props.className] - Additional CSS classes.
 */
const ToggleSwitchComponent = ({
  isOn,
  onToggle,
  ariaLabel,
  className = ''
}) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <span
      className={`font-mono text-[10px] uppercase tracking-widest w-8 text-right transition-colors duration-300 ${
        isOn ? 'text-(--toxic-green)' : 'text-(--ash-gray)/40'
      }`}
      aria-hidden='true'
    >
      {isOn ? 'ON' : 'OFF'}
    </span>
    <button
      type='button'
      onClick={onToggle}
      role='switch'
      aria-checked={isOn}
      aria-label={ariaLabel}
      className={`
        w-16 h-8 border-2 rounded-none shadow-[4px_4px_0px_var(--blood-red)]
        relative flex items-center p-1 transition-colors duration-300 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green) focus-visible:ring-offset-2 focus-visible:ring-offset-(--void-black)
        ${isOn ? 'bg-(--toxic-green)/20 border-(--toxic-green)' : 'bg-transparent border-(--ash-gray)'}
      `}
    >
      <div
        className={`
          absolute top-1 left-1 w-6 h-6 transition-transform duration-300 ease-out
          ${isOn ? 'translate-x-8 bg-(--toxic-green)' : 'translate-x-0 bg-(--ash-gray)'}
        `}
      />
    </button>
  </div>
)

export const ToggleSwitch = memo(ToggleSwitchComponent)
ToggleSwitch.displayName = 'ToggleSwitch'

ToggleSwitch.propTypes = {
  isOn: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  className: PropTypes.string
}
