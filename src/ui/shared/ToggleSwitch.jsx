import React, { memo, useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useTranslation } from 'react-i18next'

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
}) => {
  const { t } = useTranslation()
  const [isGlitching, setIsGlitching] = useState(false)
  const glitchTimerRef = useRef(null)

  const handleToggle = () => {
    setIsGlitching(true)
    if (glitchTimerRef.current) {
      clearTimeout(glitchTimerRef.current)
    }
    glitchTimerRef.current = setTimeout(() => setIsGlitching(false), 150)
    onToggle()
  }

  useEffect(() => {
    return () => {
      if (glitchTimerRef.current) {
        clearTimeout(glitchTimerRef.current)
      }
    }
  }, [])

  return (
    <div className={`flex items-center justify-between w-full max-w-sm border border-(--toxic-green)/30 p-3 bg-(--void-black) ${className}`}>
      <span className="text-sm font-bold tracking-widest uppercase" aria-hidden="true">{ariaLabel}</span>
      <button
        type="button"
        onClick={handleToggle}
        className={`relative w-16 h-8 border-2 border-(--toxic-green) flex items-center p-1 transition-colors duration-75 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green) focus-visible:ring-offset-2 focus-visible:ring-offset-(--void-black) ${isGlitching ? 'translate-x-[1px] translate-y-[1px]' : ''}`}
        aria-checked={isOn}
        role="switch"
        aria-label={ariaLabel}
      >
        <div className={`w-full h-full absolute inset-0 bg-(--toxic-green) transition-opacity duration-150 ${isOn ? 'opacity-20' : 'opacity-0'}`}></div>
        <div className={`w-5 h-full bg-(--toxic-green) transition-transform duration-100 z-10 ${isOn ? 'translate-x-8' : 'translate-x-0'}`}>
           <div className="w-[2px] h-full bg-(--void-black) mx-auto opacity-50"></div>
        </div>
        <span className={`absolute text-[10px] font-bold z-0 ${isOn ? 'left-2 text-(--toxic-green)' : 'right-2 text-(--toxic-green)/50'}`}>
          {isOn ? t('ui:toggle.on') : t('ui:toggle.off')}
        </span>
      </button>
    </div>
  )
}

export const ToggleSwitch = memo(ToggleSwitchComponent)
ToggleSwitch.displayName = 'ToggleSwitch'

ToggleSwitch.propTypes = {
  isOn: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  className: PropTypes.string
}
