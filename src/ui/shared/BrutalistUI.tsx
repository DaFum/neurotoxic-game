import { Tooltip } from './Tooltip'
import { SegmentedSlider } from './SegmentedSlider'
import { ToggleSwitch } from './ToggleSwitch'
import { useState, useEffect, useRef, useId, memo, useCallback } from 'react'
import type { MouseEvent, ComponentType, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

const SCANLINE_BACKGROUND_STYLE = {
  backgroundImage:
    'repeating-linear-gradient(transparent, transparent 2px, var(--color-void-black-50) 2px, var(--color-void-black-50) 4px)'
} as const

interface HazardTickerProps {
  message: string
}

interface SvgIconProps {
  className?: string
  title?: string
}

interface BlockMeterProps {
  label: string
  value: number
  max?: number
  isDanger?: boolean
}

interface UplinkButtonProps {
  title?: string
  url?: string
  subtitle?: string
  type?: string
  Icon?: ComponentType<SvgIconProps>
}

// Local prop types for components in this file (avoid `any`)
interface BrutalToggleProps {
  label: string
  initialState?: boolean
  isOn?: boolean
  onToggle?: (next: boolean) => void
}

interface DeadmanButtonProps {
  label: string
  onConfirm?: () => void
}

interface BrutalSlotItem {
  name: string
  icon?: ReactNode
}

interface BrutalSlotProps {
  label: string
  item?: BrutalSlotItem | null
}

interface VoidLoaderProps {
  size?: string
}

interface StatBlockProps {
  label: string
  value: number | string
  // Icon must be a component accepting `SvgIconProps` because
  // `StatBlock` renders it as `<Icon className=... />`.
  icon?: ComponentType<SvgIconProps>
}

interface BrutalFaderProps {
  label: string
  initialValue?: number
  max?: number
  value?: number
  onChange?: (next: number) => void
}

interface CrisisModalProps {
  isOpen: boolean
  onClose?: () => void
}

export const UplinkButton = memo(
  ({ title, url, subtitle, type, Icon }: UplinkButtonProps) => {
    const [isHovered, setIsHovered] = useState(false)

    /**
     * ACTUAL UPDATES (#1):
     * - Implemented robust URL validation using regex for case-insensitive protocol check (http/https).
     * - Conditionally apply target='_blank' and rel='noopener noreferrer' only for safe URLs.
     * - Added onClick handler to prevent default behavior (opening a new tab with #) for unsafe URLs.
     *
     * NEXT STEPS AND IDEAS (#2):
     * - Consider moving the URL sanitizer to a shared utility if other components need it.
     * - Implement a 'copy to clipboard' fallback for unsafe URLs if they appear intended as data but not navigation.
     *
     * FOUND ERRORS + SOLUTIONS (#3):
     * - ERROR: Case-sensitive protocol check was too restrictive. SOLUTION: Used case-insensitive regex.
     * - ERROR: Clicking unsafe URL with target='_blank' opened an empty tab. SOLUTION: Conditional target and e.preventDefault().
     */
    const isSafeUrl = url && /^\s*https?:\/\//i.test(url)
    const safeUrl = isSafeUrl ? url.trim() : '#'

    const handleClick = useCallback(
      (e: MouseEvent<HTMLAnchorElement>) => {
        if (!isSafeUrl) {
          e.preventDefault()
        }
      },
      [isSafeUrl]
    )

    const handleMouseEnter = useCallback(() => setIsHovered(true), [])
    const handleMouseLeave = useCallback(() => setIsHovered(false), [])

    return (
      <a
        href={safeUrl}
        target={isSafeUrl ? '_blank' : undefined}
        rel={isSafeUrl ? 'noopener noreferrer' : undefined}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className='relative shrink-0 w-full block border-2 border-toxic-green/30 bg-void-black hover:border-toxic-green transition-colors duration-100 group overflow-hidden'
      >
        {/* Glitch Background on Hover */}
        {isHovered && (
          <div className='absolute inset-0 bg-toxic-green/10 z-0'>
            <div
              className='absolute inset-0 opacity-50'
              style={SCANLINE_BACKGROUND_STYLE}
            ></div>
            <div className='w-full h-1 bg-toxic-green absolute top-1/2 animate-[scan_0.5s_linear_infinite]'></div>
          </div>
        )}

        <div className='relative z-10 flex items-start gap-3 sm:gap-0 p-3 sm:p-4'>
          {/* Icon Block */}
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 border-2 flex items-center justify-center shrink-0 transition-colors
          ${isHovered ? 'border-toxic-green bg-toxic-green text-void-black shadow-[0_0_15px_var(--color-toxic-green)]' : 'border-toxic-green/50 text-toxic-green'}`}
          >
            {Icon && <Icon className='w-6 h-6 sm:w-8 sm:h-8 shrink-0' />}
          </div>

          {/* Text Block */}
          <div className='ml-1 sm:ml-6 flex-1 min-w-0 pr-1 sm:pr-2'>
            <div className='flex flex-col gap-1 items-start justify-start'>
              <h2
                className='font-bold tracking-[0.08em] sm:tracking-[0.2em] text-sm sm:text-lg uppercase glitch-text break-words [overflow-wrap:anywhere] w-full leading-snug'
                data-text={title}
              >
                {title}
              </h2>
              <span
                className={`text-[8px] sm:text-[9px] tracking-[0.12em] sm:tracking-widest px-2 py-1 border transition-colors whitespace-normal break-words [overflow-wrap:anywhere] max-w-full ${isHovered ? 'border-toxic-green text-toxic-green' : 'border-transparent text-toxic-green/50'}`}
              >
                {type}
              </span>
            </div>
            <p className='text-[9px] sm:text-xs opacity-70 mt-1 font-mono tracking-wide break-words [overflow-wrap:anywhere] whitespace-normal leading-[1.35] pb-[2px]'>
              {subtitle}
            </p>
          </div>

          {/* External Link Indicator */}
          <div
            className={`shrink-0 ml-1 sm:ml-4 mt-1 sm:mt-0 transition-transform duration-200 ${isHovered ? 'translate-x-1 text-star-white' : 'text-toxic-green/30'}`}
          >
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='square'
              aria-hidden='true'
              focusable='false'
              role='presentation'
            >
              <path d='M5 12H19M19 12L12 5M19 12L12 19' />
            </svg>
          </div>
        </div>
      </a>
    )
  }
)

// --- SVG DECORATIONS ---

// Optimization: Wrapped in React.memo to prevent unnecessary re-renders of static SVG decorations
export const HexBorder = memo(({ className, title }: SvgIconProps) => {
  const titleId = useId()

  if (title) {
    return (
      <svg
        className={className}
        viewBox='0 0 100 100'
        preserveAspectRatio='none'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        role='img'
        aria-labelledby={titleId}
      >
        <title id={titleId}>{title}</title>
        <path
          d='M5 0H95L100 5V95L95 100H5L0 95V5L5 0Z'
          stroke='currentColor'
          strokeWidth='2'
          vectorEffect='non-scaling-stroke'
        />
        <rect x='2' y='2' width='4' height='4' fill='currentColor' />
        <rect x='94' y='94' width='4' height='4' fill='currentColor' />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox='0 0 100 100'
      preserveAspectRatio='none'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
    >
      <path
        d='M5 0H95L100 5V95L95 100H5L0 95V5L5 0Z'
        stroke='currentColor'
        strokeWidth='2'
        vectorEffect='non-scaling-stroke'
      />
      <rect x='2' y='2' width='4' height='4' fill='currentColor' />
      <rect x='94' y='94' width='4' height='4' fill='currentColor' />
    </svg>
  )
})

// Optimization: Wrapped in React.memo to prevent unnecessary re-renders of static SVG decorations
export const CrosshairIcon = memo(({ className, title }: SvgIconProps) => {
  const titleId = useId()

  if (title) {
    return (
      <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        role='img'
        aria-labelledby={titleId}
      >
        <title id={titleId}>{title}</title>
        <path
          d='M12 2V6M12 18V22M2 12H6M18 12H22M12 12V12.01'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='square'
        />
        <circle
          cx='12'
          cy='12'
          r='4'
          stroke='currentColor'
          strokeWidth='1'
          strokeDasharray='2 2'
        />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
    >
      <path
        d='M12 2V6M12 18V22M2 12H6M18 12H22M12 12V12.01'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
      />
      <circle
        cx='12'
        cy='12'
        r='4'
        stroke='currentColor'
        strokeWidth='1'
        strokeDasharray='2 2'
      />
    </svg>
  )
})

// Optimization: Wrapped in React.memo to prevent unnecessary re-renders of static SVG decorations
export const MoneyIcon = memo(({ className, title }: SvgIconProps) => {
  const titleId = useId()

  if (title) {
    return (
      <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        role='img'
        aria-labelledby={titleId}
      >
        <title id={titleId}>{title}</title>
        <path
          d='M12 2V22M8 6H14C16.2091 6 18 7.79086 18 10C18 12.2091 16.2091 14 14 14H10C7.79086 14 6 15.7908 6 18C6 20.2091 7.79086 22 10 22H16'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='square'
        />
        <path
          d='M4 12L6 12M18 12L20 12'
          stroke='currentColor'
          strokeWidth='2'
        />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
    >
      <path
        d='M12 2V22M8 6H14C16.2091 6 18 7.79086 18 10C18 12.2091 16.2091 14 14 14H10C7.79086 14 6 15.7908 6 18C6 20.2091 7.79086 22 10 22H16'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
      />
      <path d='M4 12L6 12M18 12L20 12' stroke='currentColor' strokeWidth='2' />
    </svg>
  )
})

// Optimization: Wrapped in React.memo to prevent unnecessary re-renders of static SVG decorations
export const AlertIcon = memo(({ className, title }: SvgIconProps) => {
  const titleId = useId()

  if (title) {
    return (
      <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        role='img'
        aria-labelledby={titleId}
      >
        <title id={titleId}>{title}</title>
        <path
          d='M12 2L22 20H2L12 2Z'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='square'
          strokeLinejoin='miter'
        />
        <rect x='11' y='10' width='2' height='6' fill='currentColor' />
        <rect x='11' y='17' width='2' height='2' fill='currentColor' />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
    >
      <path
        d='M12 2L22 20H2L12 2Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
        strokeLinejoin='miter'
      />
      <rect x='11' y='10' width='2' height='6' fill='currentColor' />
      <rect x='11' y='17' width='2' height='2' fill='currentColor' />
    </svg>
  )
})

// Optimization: Wrapped in React.memo to prevent unnecessary re-renders of static SVG decorations
export const SkullIcon = memo(({ className, title }: SvgIconProps) => {
  const titleId = useId()

  if (title) {
    return (
      <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        role='img'
        aria-labelledby={titleId}
      >
        <title id={titleId}>{title}</title>
        <path
          d='M5 7C5 4 8 2 12 2C16 2 19 4 19 7V13C19 16 16 17 16 17L15 22H9L8 17C8 17 5 16 5 13V7Z'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinejoin='miter'
        />
        <circle
          cx='9'
          cy='10'
          r='1'
          fill='currentColor'
          stroke='currentColor'
          strokeWidth='1'
        />
        <circle
          cx='15'
          cy='10'
          r='1'
          fill='currentColor'
          stroke='currentColor'
          strokeWidth='1'
        />
        <path d='M10 16H14' stroke='currentColor' strokeWidth='2' />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
    >
      <path
        d='M5 7C5 4 8 2 12 2C16 2 19 4 19 7V13C19 16 16 17 16 17L15 22H9L8 17C8 17 5 16 5 13V7Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='miter'
      />
      <circle
        cx='9'
        cy='10'
        r='1'
        fill='currentColor'
        stroke='currentColor'
        strokeWidth='1'
      />
      <circle
        cx='15'
        cy='10'
        r='1'
        fill='currentColor'
        stroke='currentColor'
        strokeWidth='1'
      />
      <path d='M10 16H14' stroke='currentColor' strokeWidth='2' />
    </svg>
  )
})

// Optimization: Wrapped in React.memo to prevent unnecessary re-renders of static SVG decorations
export const GearIcon = memo(({ className, title }: SvgIconProps) => {
  const titleId = useId()

  if (title) {
    return (
      <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        role='img'
        aria-labelledby={titleId}
      >
        <title id={titleId}>{title}</title>
        <path
          d='M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z'
          stroke='currentColor'
          strokeWidth='2'
        />
        <path
          d='M19.4 15A1.65 1.65 0 0 0 19 16.5L20 18L18 20L16.5 19A1.65 1.65 0 0 0 15 19.4V21H12H9V19.4A1.65 1.65 0 0 0 7.5 19L6 20L4 18L5 16.5A1.65 1.65 0 0 0 4.6 15H3V12V9H4.6A1.65 1.65 0 0 0 5 7.5L4 6L6 4L7.5 5A1.65 1.65 0 0 0 9 4.6V3H12H15V4.6A1.65 1.65 0 0 0 16.5 5L18 4L20 6L19 7.5A1.65 1.65 0 0 0 19.4 9H21V12V15H19.4Z'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinejoin='miter'
        />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
    >
      <path
        d='M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M19.4 15A1.65 1.65 0 0 0 19 16.5L20 18L18 20L16.5 19A1.65 1.65 0 0 0 15 19.4V21H12H9V19.4A1.65 1.65 0 0 0 7.5 19L6 20L4 18L5 16.5A1.65 1.65 0 0 0 4.6 15H3V12V9H4.6A1.65 1.65 0 0 0 5 7.5L4 6L6 4L7.5 5A1.65 1.65 0 0 0 9 4.6V3H12H15V4.6A1.65 1.65 0 0 0 16.5 5L18 4L20 6L19 7.5A1.65 1.65 0 0 0 19.4 9H21V12V15H19.4Z'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinejoin='miter'
      />
    </svg>
  )
})

// Optimization: Wrapped in React.memo to prevent unnecessary re-renders of static SVG decorations
export const HexNode = memo(({ className, title }: SvgIconProps) => {
  const titleId = useId()

  if (title) {
    return (
      <svg
        className={className}
        viewBox='0 0 100 100'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        role='img'
        aria-labelledby={titleId}
      >
        <title id={titleId}>{title}</title>
        <path
          d='M50 5L95 25V75L50 95L5 75V25L50 5Z'
          stroke='currentColor'
          strokeWidth='4'
          strokeLinejoin='miter'
        />
        <circle cx='50' cy='50' r='10' fill='currentColor' />
        <path
          d='M50 25V40M50 60V75M25 50H40M60 50H75'
          stroke='currentColor'
          strokeWidth='2'
        />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox='0 0 100 100'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
    >
      <path
        d='M50 5L95 25V75L50 95L5 75V25L50 5Z'
        stroke='currentColor'
        strokeWidth='4'
        strokeLinejoin='miter'
      />
      <circle cx='50' cy='50' r='10' fill='currentColor' />
      <path
        d='M50 25V40M50 60V75M25 50H40M60 50H75'
        stroke='currentColor'
        strokeWidth='2'
      />
    </svg>
  )
})

// Optimization: Wrapped in React.memo to prevent unnecessary re-renders of static SVG decorations
export const WarningStripe = memo(() => {
  const patternId = useId()
  return (
    <svg
      width='100%'
      height='100%'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
    >
      <defs>
        <pattern
          id={`stripes-${patternId}`}
          width='20'
          height='20'
          patternTransform='rotate(45)'
        >
          <rect width='10' height='20' fill='currentColor' />
          <rect x='10' width='10' height='20' fill='var(--color-void-black)' />
        </pattern>
      </defs>
      <rect width='100%' height='100%' fill={`url(#stripes-${patternId})`} />
    </svg>
  )
})

// Optimization: Wrapped in React.memo to prevent unnecessary re-renders of static SVG decorations
export const BiohazardIcon = memo(({ className, title }: SvgIconProps) => {
  const titleId = useId()

  if (title) {
    return (
      <svg
        className={className}
        viewBox='0 0 24 24'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        role='img'
        aria-labelledby={titleId}
      >
        <title id={titleId}>{title}</title>
        <path
          d='M12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5Z'
          stroke='currentColor'
          strokeWidth='2'
        />
        <path
          d='M12 9.5V4M12 4C9.5 4 7.5 5.5 6.5 7.5M12 4C14.5 4 16.5 5.5 17.5 7.5M9.83494 13.25L5.0718 16M5.0718 16C3.5 14.5 3 12 3.5 9.5M5.0718 16C6.5 17.5 9 18 11.5 17.5M14.1651 13.25L18.9282 16M18.9282 16C20.5 14.5 21 12 20.5 9.5M18.9282 16C17.5 17.5 15 18 12.5 17.5'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='square'
        />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
    >
      <path
        d='M12 14.5C13.3807 14.5 14.5 13.3807 14.5 12C14.5 10.6193 13.3807 9.5 12 9.5C10.6193 9.5 9.5 10.6193 9.5 12C9.5 13.3807 10.6193 14.5 12 14.5Z'
        stroke='currentColor'
        strokeWidth='2'
      />
      <path
        d='M12 9.5V4M12 4C9.5 4 7.5 5.5 6.5 7.5M12 4C14.5 4 16.5 5.5 17.5 7.5M9.83494 13.25L5.0718 16M5.0718 16C3.5 14.5 3 12 3.5 9.5M5.0718 16C6.5 17.5 9 18 11.5 17.5M14.1651 13.25L18.9282 16M18.9282 16C20.5 14.5 21 12 20.5 9.5M18.9282 16C17.5 17.5 15 18 12.5 17.5'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
      />
    </svg>
  )
})

// Optimization: Wrapped in React.memo to prevent unnecessary re-renders of static SVG decorations
export const CorporateSeal = memo(({ className, title }: SvgIconProps) => {
  const titleId = useId()

  if (title) {
    return (
      <svg
        className={className}
        viewBox='0 0 100 100'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        role='img'
        aria-labelledby={titleId}
      >
        <title id={titleId}>{title}</title>
        <circle
          cx='50'
          cy='50'
          r='45'
          stroke='currentColor'
          strokeWidth='4'
          strokeDasharray='10 5'
        />
        <circle cx='50' cy='50' r='35' stroke='currentColor' strokeWidth='2' />
        <path
          d='M30 50L45 65L75 35'
          stroke='currentColor'
          strokeWidth='6'
          strokeLinecap='square'
        />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox='0 0 100 100'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      focusable='false'
      role='presentation'
    >
      <circle
        cx='50'
        cy='50'
        r='45'
        stroke='currentColor'
        strokeWidth='4'
        strokeDasharray='10 5'
      />
      <circle cx='50' cy='50' r='35' stroke='currentColor' strokeWidth='2' />
      <path
        d='M30 50L45 65L75 35'
        stroke='currentColor'
        strokeWidth='6'
        strokeLinecap='square'
      />
    </svg>
  )
})

// --- UI COMPONENTS ---

// 1. Industrial Toggle
// Supports uncontrolled mode (seed via `initialState`) and controlled mode
// (pass `isOn` + `onToggle`). Only strict booleans are treated as controlled;
// `undefined`/`null`/non-boolean values fall through to uncontrolled mode so a
// stray `NaN` or missing prop can't put the component in a stuck state. The
// internal state mirrors the controlled value so a later transition back to
// uncontrolled retains the last value instead of snapping to `initialState`.
export const BrutalToggle = memo(
  ({
    label,
    initialState = false,
    isOn: controlledIsOn,
    onToggle
  }: BrutalToggleProps) => {
    const isControlled = typeof controlledIsOn === 'boolean'
    const [internalIsOn, setInternalIsOn] = useState<boolean>(initialState)
    const isOn =
      typeof controlledIsOn === 'boolean' ? controlledIsOn : internalIsOn

    // Mirror controlled prop into internal state so a later transition back
    // to uncontrolled mode retains the value. Guarded by a value equality
    // check to avoid loops; this is the canonical "uncontrolled with
    // optional controlled" sync pattern.
    useEffect(() => {
      if (
        typeof controlledIsOn === 'boolean' &&
        controlledIsOn !== internalIsOn
      ) {
        // eslint-disable-next-line @eslint-react/set-state-in-effect -- intentional controlled-to-internal mirror
        setInternalIsOn(controlledIsOn)
      }
    }, [controlledIsOn, internalIsOn])

    return (
      <ToggleSwitch
        isOn={isOn}
        onToggle={() => {
          const next = !isOn
          if (!isControlled) setInternalIsOn(next)
          onToggle?.(next)
        }}
        ariaLabel={label}
      />
    )
  }
)

// 2. Segmented Block Meter
// Optimization: Wrapped in React.memo to prevent unnecessary re-renders when parent components
// pass frequently changing state (like overload or health) that results in the same quantized value.
export const BlockMeter = memo(
  ({ label, value, max = 10, isDanger = false }: BlockMeterProps) => {
    const blocks = Array.from({ length: max }, (_, i) => i)
    return (
      <div
        className='w-full max-w-sm flex flex-col gap-2'
        role='meter'
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div className='flex justify-between items-end'>
          <span className='text-xs tracking-widest uppercase opacity-80'>
            {label}
          </span>
          <span
            className={`text-sm font-bold ${isDanger ? 'text-blood-red animate-fuel-warning' : 'text-toxic-green'}`}
          >
            {value} / {max}
          </span>
        </div>
        <div className='flex gap-1 h-6'>
          {blocks.map(block => {
            const isFilled = block < value
            let blockClass =
              'flex-1 border border-toxic-green/30 transition-all duration-300'
            if (isFilled) {
              blockClass = isDanger
                ? 'flex-1 bg-blood-red border-blood-red shadow-[0_0_10px_var(--color-blood-red)]'
                : 'flex-1 bg-toxic-green border-toxic-green shadow-[0_0_5px_var(--color-toxic-green-50)]'
            }
            return <div key={block} className={blockClass}></div>
          })}
        </div>
      </div>
    )
  }
)

// 3. Brutalist Tabs
export const BrutalTabs = memo(() => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('inventory')
  const tabs = [
    { id: 'inventory', label: t('ui:menu.inventory', 'INVENTORY') },
    { id: 'upgrades', label: t('ui:menu.upgrades', 'UPGRADES') }
  ]

  return (
    <div className='w-full max-w-sm border border-toxic-green/50 p-1'>
      <div
        role='tablist'
        aria-label={t('ui:hqNavigation', 'HQ Navigation')}
        className='flex border-b-2 border-toxic-green'
      >
        {tabs.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              type='button'
              key={tab.id}
              role='tab'
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 text-xs font-bold tracking-[0.1em] uppercase transition-all
                ${isActive ? 'bg-toxic-green text-void-black shadow-[0_-2px_10px_var(--color-toxic-green)]' : 'bg-void-black text-toxic-green hover:bg-toxic-green/10'}`}
            >
              {isActive && <span className='mr-2'>▶</span>}
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className='p-4 bg-shadow-black min-h-[100px] relative overflow-hidden'>
        <div
          className='absolute inset-0 opacity-5 pointer-events-none'
          style={{
            backgroundImage:
              'radial-gradient(var(--color-toxic-green) 1px, transparent 1px)',
            backgroundSize: '10px 10px'
          }}
        ></div>
        {tabs.map(tab => (
          <div
            key={`panel-${tab.id}`}
            className={activeTab === tab.id ? 'block relative z-10' : 'hidden'}
          >
            <p className='text-sm opacity-80 typewriter-effect'>
              {t('ui:loading', 'Loading')} {tab.label}{' '}
              {t('ui:module', 'module')}...
            </p>
          </div>
        ))}
      </div>
    </div>
  )
})

// 4. Data/Stat Block
export const StatBlock = memo(
  ({ label, value, icon: Icon }: StatBlockProps) => (
    <div className='relative w-32 h-24 bg-void-black flex flex-col items-center justify-center group overflow-hidden'>
      <HexBorder className='absolute inset-0 w-full h-full text-toxic-green/50 group-hover:text-toxic-green transition-colors' />
      <div className='absolute inset-0 bg-gradient-to-b from-transparent via-toxic-green/10 to-transparent translate-y-[-100%] group-hover:animate-[scan_2s_linear_infinite]'></div>
      <div className='z-10 flex flex-col items-center gap-1'>
        {Icon && <Icon className='w-5 h-5 text-toxic-green' />}
        <span className='text-2xl font-bold tracking-wider'>{value}</span>
        <span className='text-[9px] tracking-[0.2em] opacity-60 uppercase'>
          {label}
        </span>
      </div>
    </div>
  )
)

// 5. Brutal Amp Fader (Custom Slider)
// Supports uncontrolled mode (seed via `initialValue`) and controlled mode
// (pass `value` + `onChange`). Only finite numbers are treated as controlled;
// `NaN`/`Infinity`/`undefined` fall through to uncontrolled so a malformed
// prop can't leave the slider stuck. The internal state mirrors the
// controlled value so a later transition back to uncontrolled retains it.
export const BrutalFader = memo(
  ({
    label,
    initialValue = 7,
    max = 10,
    value: controlledValue,
    onChange
  }: BrutalFaderProps) => {
    const safeMax = Number.isFinite(max) && max > 0 ? Math.floor(max) : 1
    const clampValue = useCallback(
      (value: number) => Math.max(1, Math.min(safeMax, Math.round(value))),
      [safeMax]
    )
    const finiteControlled =
      typeof controlledValue === 'number' && Number.isFinite(controlledValue)
        ? clampValue(controlledValue)
        : null
    const isControlled = finiteControlled !== null
    const [internalVal, setInternalVal] = useState<number>(() =>
      clampValue(initialValue)
    )
    const val = finiteControlled ?? internalVal

    // Mirror controlled prop into internal state so a later transition back
    // to uncontrolled mode retains the value.
    useEffect(() => {
      if (finiteControlled !== null && finiteControlled !== internalVal) {
        // eslint-disable-next-line @eslint-react/set-state-in-effect -- intentional controlled-to-internal mirror
        setInternalVal(finiteControlled)
      }
    }, [finiteControlled, internalVal])

    const setClampedValue = useCallback(
      (value: number) => {
        const next = clampValue(value)
        if (!isControlled) setInternalVal(next)
        onChange?.(next)
      },
      [clampValue, isControlled, onChange]
    )

    return (
      <SegmentedSlider
        label={label}
        inputValue={val}
        inputMin={1}
        inputMax={safeMax}
        inputStep={1}
        activeSegments={val}
        segmentCount={safeMax}
        valueLabel={String(val)}
        onInputChange={event => setClampedValue(Number(event.target.value))}
        onSegmentSelect={setClampedValue}
      />
    )
  }
)

// 7. Crisis Modal Overlay
export const CrisisModal = memo(({ isOpen, onClose }: CrisisModalProps) => {
  const { t } = useTranslation(['ui'])
  if (!isOpen) return null
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-void-black/80 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      ></div>
      {/* Scanline FX on background */}
      <div
        className='absolute inset-0 pointer-events-none opacity-20'
        style={SCANLINE_BACKGROUND_STYLE}
      ></div>

      {/* Modal Box */}
      <div className='relative w-full max-w-lg border-2 border-toxic-green bg-void-black shadow-[0_0_40px_var(--color-toxic-green-glow)] animate-[glitch-anim_0.2s_ease-in-out]'>
        {/* Hardware details */}
        <div className='absolute top-0 left-0 w-full h-1 bg-toxic-green'></div>
        <div className='absolute top-0 left-2 w-16 h-4 bg-toxic-green text-void-black text-[10px] font-bold text-center leading-4 uppercase'>
          {t('ui:event.severity.critical')}
        </div>

        <div className='p-8 flex flex-col gap-6'>
          <div className='flex items-start gap-4 border-b border-toxic-green/30 pb-6'>
            <AlertIcon className='w-12 h-12 text-toxic-green animate-pulse shrink-0 mt-1' />
            <div>
              <h2
                className='text-2xl font-bold tracking-[0.1em] uppercase glitch-text'
                data-text={t('ui:crisis.title')}
              >
                {t('ui:crisis.title')}
              </h2>
              <p className='mt-2 text-sm opacity-80 leading-relaxed'>
                {t('ui:crisis.desc')}
              </p>
            </div>
          </div>

          <div className='flex flex-col gap-3'>
            <button
              type='button'
              onClick={onClose}
              className='w-full p-3 border border-toxic-green bg-toxic-green/10 hover:bg-toxic-green hover:text-void-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green font-bold tracking-widest uppercase transition-colors text-left flex justify-between'
            >
              <span>{t('ui:crisis.opt1')}</span>
              <span className='opacity-50 text-xs mt-1'>
                {t('ui:crisis.safe')}
              </span>
            </button>
            <button
              type='button'
              onClick={onClose}
              className='w-full p-3 border border-warning-yellow/50 text-warning-yellow/80 hover:border-warning-yellow hover:text-void-black hover:bg-warning-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-yellow font-bold tracking-widest uppercase transition-colors text-left flex justify-between'
            >
              <span>{t('ui:crisis.opt2')}</span>
              <span className='opacity-50 text-xs mt-1'>
                {t('ui:crisis.risk')}
              </span>
            </button>
            <button
              type='button'
              onClick={onClose}
              className='w-full p-3 border border-blood-red/50 text-blood-red/80 hover:border-blood-red hover:text-void-black hover:bg-blood-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood-red font-bold tracking-widest uppercase transition-colors text-left flex justify-between'
            >
              <span>{t('ui:crisis.opt3')}</span>
              <span className='opacity-50 text-xs mt-1'>
                {t('ui:crisis.risky')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

// 8. Deadman Button (Hold to Confirm)
export const DeadmanButton = memo(
  ({ label, onConfirm }: DeadmanButtonProps) => {
    const { t } = useTranslation()
    const [progress, setProgress] = useState<number>(0)
    const [isHolding, setIsHolding] = useState<boolean>(false)
    const progressRef = useRef<number>(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const drainIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
      progressRef.current = progress
    }, [progress])

    const startHold = () => {
      if (progressRef.current >= 100) return
      setIsHolding(true)
      if (drainIntervalRef.current != null)
        clearInterval(drainIntervalRef.current)
      if (intervalRef.current != null) clearInterval(intervalRef.current)

      const intervalId = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (intervalRef.current === intervalId) {
              clearInterval(intervalId)
              intervalRef.current = null
            }
            setIsHolding(false)
            if (onConfirm) onConfirm()
            return 100
          }
          return prev + 2 // Speed of fill
        })
      }, 20) // 20ms tick
      intervalRef.current = intervalId
    }

    const stopHold = () => {
      if (intervalRef.current != null) clearInterval(intervalRef.current)
      intervalRef.current = null
      setIsHolding(false)

      if (progressRef.current < 100) {
        // Rapid drain if let go too early
        if (drainIntervalRef.current != null)
          clearInterval(drainIntervalRef.current)
        const drainId = setInterval(() => {
          setProgress(prev => {
            if (prev <= 0) {
              if (drainIntervalRef.current === drainId) {
                clearInterval(drainId)
                drainIntervalRef.current = null
              }
              return 0
            }
            return prev - 5
          })
        }, 20)
        drainIntervalRef.current = drainId
      }
    }

    useEffect(() => {
      return () => {
        if (intervalRef.current != null) clearInterval(intervalRef.current)
        if (drainIntervalRef.current != null)
          clearInterval(drainIntervalRef.current)
        intervalRef.current = null
        drainIntervalRef.current = null
      }
    }, [])

    const isComplete = progress >= 100

    return (
      <div className='w-full flex flex-col gap-1'>
        <span className='text-[10px] tracking-widest uppercase opacity-50 text-center'>
          {t('ui:holdToOverride', 'HOLD TO OVERRIDE')}
        </span>
        <button
          type='button'
          onMouseDown={startHold}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={startHold}
          onTouchEnd={stopHold}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (e.key === ' ') e.preventDefault()
              if (!e.repeat) startHold()
            }
          }}
          onKeyUp={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              stopHold()
            }
          }}
          onBlur={stopHold}
          className={`relative w-full h-14 border-2 overflow-hidden flex items-center justify-center select-none transition-colors
          ${isComplete ? 'border-blood-red bg-blood-red-dark' : 'border-toxic-green bg-void-black hover:border-star-white'}`}
        >
          {/* Progress Fill Background */}
          <div
            className={`absolute left-0 top-0 h-full transition-none ${isComplete ? 'bg-blood-red' : 'bg-toxic-green-bright'}`}
            style={{ width: `${progress}%` }}
          ></div>

          {/* Scanline FX on fill */}
          {isHolding && !isComplete && (
            <div className='absolute inset-0 scanline-overlay opacity-50 z-10 pointer-events-none'></div>
          )}

          {/* Text */}
          <span
            className={`relative z-20 font-bold tracking-[0.2em] uppercase mix-blend-difference
          ${isComplete ? 'text-void-black' : 'text-toxic-green-bright'}`}
          >
            {isComplete ? t('ui:executed', 'EXECUTED') : label}
          </span>
        </button>
      </div>
    )
  }
)

// 10. Hardware Inventory Slot
export const BrutalSlot = memo(({ label, item = null }: BrutalSlotProps) => {
  const { t } = useTranslation(['ui'])

  const tooltipText = item
    ? t('ui:inventory.slot', {
        name: item.name,
        defaultValue: `Inventory slot: ${item.name}`
      })
    : t('ui:inventory.emptySlot', {
        label,
        defaultValue: `Empty inventory slot: ${label}`
      })

  return (
    <div className='flex flex-col gap-2 items-center'>
      <Tooltip content={tooltipText}>
        <button
          type='button'
          className='relative w-20 h-20 border-2 border-toxic-green/30 bg-shadow-black flex items-center justify-center group cursor-pointer hover:border-toxic-green transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green'
          aria-label={tooltipText}
        >
          {/* Corner Decals */}
          <div className='absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-toxic-green opacity-0 group-hover:opacity-100 transition-opacity'></div>
          <div className='absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-toxic-green opacity-0 group-hover:opacity-100 transition-opacity'></div>

          {item ? (
            <>
              <div className='absolute inset-0 bg-toxic-green/10 group-hover:bg-toxic-green/20 transition-colors'></div>
              {item.icon}
            </>
          ) : (
            <CrosshairIcon className='w-6 h-6 text-toxic-green opacity-20 group-hover:opacity-50 transition-opacity' />
          )}
        </button>
      </Tooltip>
      <span className='text-[9px] tracking-[0.2em] uppercase opacity-60 text-center max-w-[80px] truncate'>
        {item ? item.name : label}
      </span>
    </div>
  )
})

// 11. Void Loader (Geometric Spinner)
export const VoidLoader = memo(({ size = 'w-16 h-16' }: VoidLoaderProps) => {
  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      {/* Outer Hex - Slow counter-clockwise */}
      <svg
        className='absolute inset-0 w-full h-full text-toxic-green animate-[spin_4s_linear_infinite_reverse]'
        viewBox='0 0 100 100'
        fill='none'
        aria-hidden='true'
        focusable='false'
      >
        <polygon
          points='50,5 90,25 90,75 50,95 10,75 10,25'
          stroke='currentColor'
          strokeWidth='2'
          strokeDasharray='10 20'
        />
      </svg>
      {/* Inner Square - Fast clockwise */}
      <svg
        className='absolute w-[60%] h-[60%] text-toxic-green animate-[spin_1.5s_linear_infinite]'
        viewBox='0 0 100 100'
        fill='none'
        aria-hidden='true'
        focusable='false'
      >
        <rect
          x='15'
          y='15'
          width='70'
          height='70'
          stroke='currentColor'
          strokeWidth='4'
          strokeDasharray='40 10'
        />
      </svg>
      {/* Core Dot - Pulsing */}
      <div className='w-2 h-2 bg-star-white rounded-full animate-pulse shadow-[0_0_10px_var(--color-star-white)]'></div>
    </div>
  )
})

// 14. Hazard Ticker Tape (For Gig Modifiers)
export const HazardTicker = memo(({ message }: HazardTickerProps) => {
  const { t } = useTranslation(['ui'])
  return (
    <div className='relative w-full h-8 bg-void-black border-y-2 border-toxic-green flex items-center overflow-hidden'>
      {/* Striped Background Ends */}
      <div className='absolute left-0 top-0 bottom-0 w-8 z-10'>
        <WarningStripe />
      </div>
      <div className='absolute right-0 top-0 bottom-0 w-8 z-10'>
        <WarningStripe />
      </div>

      {/* Scrolling Text Container */}
      <div className='flex w-full whitespace-nowrap animate-[marquee_10s_linear_infinite] px-8 items-center gap-12'>
        {}
        {['pill-0', 'pill-1', 'pill-2'].map(pillKey => (
          <span
            key={pillKey}
            className='text-xs font-bold tracking-[0.3em] uppercase text-toxic-green'
          >
            {t('ui:hazard.modifierActive')} {message}
          </span>
        ))}
      </div>
    </div>
  )
})
