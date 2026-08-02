/**
 * Shared progress bar primitive for clamped meter displays.
 */

import { memo, type HTMLAttributes } from 'react'

import { finiteNumberOr } from '../../utils/finiteNumber'

type ProgressBarSize = 'sm' | 'md' | 'mini'

const SIZE_CLASSES: Record<ProgressBarSize, string> = {
  sm: 'h-3',
  md: 'h-5',
  mini: 'h-1.5'
}

interface ProgressBarProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'color'
> {
  label?: string
  value?: number
  max: number
  color: string
  size?: ProgressBarSize
  showValue?: boolean
  warn?: boolean
  className?: string
}

/**
 * Displays clamped progress with optional label, value text, and warning animation.
 * @param props - Progress label/value/max, color class, size variant, value visibility, warning state, and wrapper attributes.
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
}: ProgressBarProps) {
  const finiteMax = finiteNumberOr(max, 1)
  const safeMax = finiteMax > 0 ? finiteMax : 1
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0
  const pct = Math.min(100, (safeValue / safeMax) * 100)
  const isMini = size === 'mini'

  return (
    <div
      className={`w-full ${className}`}
      role='progressbar'
      aria-valuenow={Math.floor(Math.min(safeValue, safeMax))}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label}
      {...props}
    >
      {!isMini && (label || showValue) && (
        <div className='flex justify-between text-xs mb-1 font-mono'>
          {label && <span className='text-ash-gray'>{label}</span>}
          {showValue && (
            <span className='text-ash-gray'>
              {Math.floor(safeValue)}/{safeMax}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-charcoal-gray border ${
          isMini
            ? 'border-steel-gray overflow-hidden'
            : 'border-2 border-toxic-green'
        } ${SIZE_CLASSES[size]}`}
      >
        <div
          className={`h-full ${color} transition-all duration-500 ${warn ? 'animate-fuel-warning' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
})
