import { memo, useId, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { useGlitchPulse } from '../../hooks/useGlitchPulse'

/**
 * ToggleSwitch - A standardized toggle switch for binary options.
 * @param props - Toggle state, accessible label, toggle callback, and optional classes.
 */
type ToggleSwitchProps = {
  isOn: boolean
  onToggle: () => void
  ariaLabel: string
  className?: string
}

const ToggleSwitchComponent = ({
  isOn,
  onToggle,
  ariaLabel,
  className = ''
}: ToggleSwitchProps) => {
  const { t } = useTranslation()
  const labelId = useId()
  const { isGlitching, trigger: pulseGlitch } = useGlitchPulse()

  const handleToggle = useCallback(() => {
    pulseGlitch()
    onToggle()
  }, [onToggle, pulseGlitch])

  return (
    <div
      className={`flex items-center justify-between w-full max-w-sm border border-toxic-green/30 p-3 bg-void-black ${className}`}
    >
      <span
        id={labelId}
        className='text-sm font-bold tracking-widest uppercase'
      >
        {ariaLabel}
      </span>
      <button
        type='button'
        onClick={handleToggle}
        className={`relative w-16 h-8 border-2 border-toxic-green flex items-center p-1 transition-colors duration-75 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-offset-2 focus-visible:ring-offset-void-black ${isGlitching ? 'translate-x-px translate-y-px' : ''}`}
        aria-checked={isOn}
        role='switch'
        {...(labelId
          ? { 'aria-labelledby': labelId }
          : { 'aria-label': ariaLabel })}
      >
        <div
          className={`w-full h-full absolute inset-0 bg-toxic-green transition-opacity duration-150 ${isOn ? 'opacity-20' : 'opacity-0'}`}
        ></div>
        <div
          /* Exception: component-internal z-index stacking */
          className={`w-5 h-full bg-toxic-green transition-transform duration-100 relative z-10 ${isOn ? 'translate-x-8' : 'translate-x-0'}`}
        >
          <div className='w-0.5 h-full bg-void-black mx-auto opacity-50'></div>
        </div>
        <span
          /* Exception: component-internal z-index stacking */
          className={`absolute z-0 text-xs font-bold ${isOn ? 'left-2 text-toxic-green' : 'right-2 text-toxic-green/50'}`}
        >
          {isOn ? t('ui:toggle.on') : t('ui:toggle.off')}
        </span>
      </button>
    </div>
  )
}

/**
 * Renders an accessible binary toggle switch with glitch feedback.
 * @param props - Toggle state, accessible label, toggle callback, and optional classes.
 */
export const ToggleSwitch = memo(ToggleSwitchComponent)
ToggleSwitch.displayName = 'ToggleSwitch'
