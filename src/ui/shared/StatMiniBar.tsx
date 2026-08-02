/**
 * Shared tooltip-wrapped mini stat readout used by the HUD stat rows.
 */

import { memo, type ReactNode } from 'react'

import { ProgressBar } from './ProgressBar'
import { Tooltip } from './Tooltip'

interface StatMiniBarProps {
  value: number
  max?: number
  /** Tooltip content. */
  label: ReactNode
  /** Accessible name for the bar; defaults to `label`. */
  ariaLabel?: string
  /** Values below this render in the warning treatment. */
  threshold: number
  /** Base bar colour class. */
  color: string
  /** Bar colour class used below `threshold` (inline variant only). */
  warnColor?: string
  icon?: ReactNode
  variant: 'stacked' | 'inline'
}

/**
 * Renders a labelled mini progress bar with its numeric readout.
 *
 * @param props - Value, scale, tooltip/aria labels, warning threshold, colour classes, optional icon, and layout variant.
 */
export const StatMiniBar = memo(function StatMiniBar({
  value,
  max = 100,
  label,
  ariaLabel,
  threshold,
  color,
  warnColor,
  icon,
  variant
}: StatMiniBarProps) {
  const isLow = value < threshold
  const resolvedAriaLabel =
    ariaLabel ?? (typeof label === 'string' ? label : undefined)
  const readout = `${Math.floor(value)}%`

  if (variant === 'stacked') {
    return (
      <Tooltip content={label} position='bottom'>
        <div className='flex items-end gap-1.5 pointer-events-auto'>
          {icon}
          <div className='min-w-0 flex-1'>
            <div className='text-xs text-ash-gray font-mono tabular-nums mb-0.5 leading-none'>
              {readout}
            </div>
            <ProgressBar
              value={value}
              max={max}
              color={color}
              warn={isLow}
              size='mini'
              aria-label={resolvedAriaLabel}
            />
          </div>
        </div>
      </Tooltip>
    )
  }

  const activeColor = isLow && warnColor ? warnColor : color
  const textColor = activeColor.replace(/^bg-/, 'text-')

  return (
    <Tooltip content={label} position='bottom'>
      <div className='flex items-center gap-1 pointer-events-auto'>
        {icon}
        <div className='w-12'>
          <ProgressBar
            value={value}
            max={max}
            color={activeColor}
            size='mini'
            aria-label={resolvedAriaLabel}
          />
        </div>
        <span
          className={`text-xxs w-7 text-right tabular-nums ${textColor}${isLow ? ' font-bold' : ''}`}
        >
          {readout}
        </span>
      </div>
    </Tooltip>
  )
})
