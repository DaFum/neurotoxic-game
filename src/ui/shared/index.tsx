// TODO: Review this file
/**
 * Shared UI Components
 * Reusable UI elements used across multiple components.
 * @module shared
 */

import { memo, type HTMLAttributes, type ReactNode } from 'react'

// Export components
export { SettingsPanel } from '../settings/SettingsPanel'
export { VolumeSlider } from './VolumeSlider'
export { Tooltip } from './Tooltip'
export { Modal } from './Modal'
export { ActionButton } from './ActionButton'
export { ToggleSwitch } from './ToggleSwitch'
export { AnimatedDivider, AnimatedSubtitle } from './AnimatedTypography'
import { UIFrameCorner } from './Icons'

export { UIFrameCorner }

export {
  RazorPlayIcon,
  VoidSkullIcon,
  BandcampIcon,
  InstaIcon,
  TikTokIcon,
  YouTubeIcon,
  BlogIcon,
  GameIcon
} from './Icons'
export {
  HexBorder,
  CrosshairIcon,
  MoneyIcon,
  AlertIcon,
  SkullIcon,
  GearIcon,
  HexNode,
  WarningStripe,
  BiohazardIcon,
  CorporateSeal,
  BrutalToggle,
  BlockMeter,
  BrutalTabs,
  StatBlock,
  BrutalFader,
  SetlistSelector,
  CrisisModal,
  DeadmanButton,
  TerminalReadout,
  BrutalSlot,
  VoidLoader,
  CorruptedText,
  HazardTicker,
  IndustrialChecklist,
  RhythmMatrix,
  SelloutContract,
  ToxicChatter,
  VoidDecryptor,
  UplinkButton
} from './BrutalistUI'

/**
 * StatBox - Displays a single statistic with an icon
 * @param {Object} props
 * @param {string} props.label - Stat label
 * @param {string|number} props.value - Stat value
 * @param {string} props.icon - Icon or emoji
 * @param {string} [props.className] - Additional CSS classes
 */
interface StatBoxProps {
  label: string
  value: string | number
  icon: ReactNode
  className?: string
}

export const StatBox = memo(function StatBox({
  label,
  value,
  icon,
  className = ''
}: StatBoxProps) {
  return (
    <div
      className={`relative bg-charcoal-gray p-3 flex flex-col items-center justify-center border border-steel-gray group overflow-hidden ${className}`}
    >
      <UIFrameCorner className='absolute top-0 left-0 w-3 h-3 text-steel-gray opacity-30 transition-opacity group-hover:opacity-60' />
      <UIFrameCorner className='absolute top-0 right-0 w-3 h-3 text-steel-gray rotate-90 opacity-30 transition-opacity group-hover:opacity-60' />
      <UIFrameCorner className='absolute bottom-0 right-0 w-3 h-3 text-steel-gray rotate-180 opacity-30 transition-opacity group-hover:opacity-60' />
      <UIFrameCorner className='absolute bottom-0 left-0 w-3 h-3 text-steel-gray -rotate-90 opacity-30 transition-opacity group-hover:opacity-60' />

      <div className='relative z-10 flex flex-col items-center'>
        <div className='text-2xl mb-1 text-toxic-green-bright'>{icon}</div>
        <div className='text-xl font-bold text-star-white font-mono'>
          {value}
        </div>
        <div className='text-xs text-ash-gray uppercase font-mono'>{label}</div>
      </div>
    </div>
  )
})

const SIZE_CLASSES: Record<string, string> = {
  sm: 'h-3',
  md: 'h-5',
  mini: 'h-1.5'
}

type ProgressBarSize = 'sm' | 'md' | 'mini'

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
}: ProgressBarProps) {
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
          {label && <span className='text-ash-gray'>{label}</span>}
          {showValue && (
            <span className='text-ash-gray'>
              {Math.round(safeValue)}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-charcoal-gray border ${
          isMini ? 'border-steel-gray/50 overflow-hidden' : 'border-steel-gray'
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

interface PanelProps {
  title?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}

/**
 * Panel - A styled container with an optional title.
 * @param {Object} props
 * @param {string} [props.title] - Optional title for the panel header.
 * @param {React.ReactNode} props.children - Panel content.
 * @param {string} [props.className] - Additional CSS classes applied to the outer container.
 * @param {string} [props.contentClassName] - Additional CSS classes applied to the inner content wrapper.
 */
export const Panel = memo(function Panel({
  title,
  children,
  className = '',
  contentClassName = 'space-y-1'
}: PanelProps) {
  return (
    <div
      className={`relative bg-abyss-black/40 border-2 border-steel-gray/40 p-4 group overflow-hidden ${className}`}
    >
      {/* Brutalist Frame Corners */}
      <UIFrameCorner className='absolute top-0 left-0 w-6 h-6 text-steel-gray opacity-30 transition-opacity group-hover:opacity-60' />
      <UIFrameCorner className='absolute top-0 right-0 w-6 h-6 text-steel-gray rotate-90 opacity-30 transition-opacity group-hover:opacity-60' />
      <UIFrameCorner className='absolute bottom-0 right-0 w-6 h-6 text-steel-gray rotate-180 opacity-30 transition-opacity group-hover:opacity-60' />
      <UIFrameCorner className='absolute bottom-0 left-0 w-6 h-6 text-steel-gray -rotate-90 opacity-30 transition-opacity group-hover:opacity-60' />

      <div className='relative z-10 flex-1 min-h-0 flex flex-col'>
        {title && (
          <h3 className='text-toxic-green text-sm font-bold mb-3 border-b border-ash-gray/40 pb-1 font-mono uppercase tracking-wider'>
            {title}
          </h3>
        )}
        <div className={`flex-1 min-h-0 flex flex-col ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  )
})
