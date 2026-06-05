import { useState, useEffect, useRef, useId, memo, useCallback } from 'react'
import type { MouseEvent, ComponentType } from 'react'
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
interface DeadmanButtonProps {
  label: string
  onConfirm?: () => void
}

interface CrisisModalProps {
  className?: string
  isOpen: boolean
  onClose?: () => void
  title?: string
  description?: string
  actions?: Array<{
    id?: string
    label: string
    meta?: string
    onClick?: () => void
    variant?: 'safe' | 'risk' | 'danger'
  }>
}

/**
 * Displays the reusable brutalist uplink button surface.
 * @param props - External link title, URL, subtitle, type, and icon component.
 */
export const UplinkButton = memo(
  ({ title, url, subtitle, type, Icon }: UplinkButtonProps) => {
    const [isHovered, setIsHovered] = useState(false)

    // Only absolute http(s) URLs navigate; unsafe values render inertly.
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
            <div className='w-full h-1 bg-toxic-green absolute top-1/2 motion-safe:animate-[scan_0.5s_linear_infinite]'></div>
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
                className={`text-[8px] sm:text-xxs tracking-[0.12em] sm:tracking-widest px-2 py-1 border transition-colors whitespace-normal break-words [overflow-wrap:anywhere] max-w-full ${isHovered ? 'border-toxic-green text-toxic-green' : 'border-transparent text-toxic-green/50'}`}
              >
                {type}
              </span>
            </div>
            <p className='text-xxs sm:text-xs opacity-70 mt-1 font-mono tracking-wide break-words [overflow-wrap:anywhere] whitespace-normal leading-[1.35] pb-[2px]'>
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
/**
 * Displays the alert icon with severity-specific styling.
 * @param props - Optional class and accessible title for the alert icon.
 */
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
/**
 * Displays one hex-node status tile.
 * @param props - Optional class and accessible title for the hex-node icon.
 */
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
const WarningStripe = memo(() => {
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
/**
 * Displays a segmented block meter for compact numeric status.
 * @param props - Meter label, current value, maximum value, and danger-state flag.
 */
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
/**
 * Displays a high-priority modal with confirm and cancel actions.
 * @param props - Modal visibility, close handler, title, description, actions, and optional classes.
 */
export const CrisisModal = memo(
  ({
    isOpen,
    onClose,
    title,
    description,
    actions,
    className
  }: CrisisModalProps) => {
    const { t } = useTranslation(['ui'])
    const titleId = useId()
    if (!isOpen) return null
    const modalTitle = title ?? t('ui:crisis.title')
    const modalDescription = description ?? t('ui:crisis.desc')
    const modalActions = actions ?? [
      {
        label: t('ui:crisis.opt1'),
        meta: t('ui:crisis.safe'),
        variant: 'safe' as const
      },
      {
        label: t('ui:crisis.opt2'),
        meta: t('ui:crisis.risk'),
        variant: 'risk' as const
      },
      {
        label: t('ui:crisis.opt3'),
        meta: t('ui:crisis.risky'),
        variant: 'danger' as const
      }
    ]

    const getActionClassName = (
      variant: 'safe' | 'risk' | 'danger' = 'safe'
    ): string => {
      if (variant === 'risk') {
        return 'w-full p-3 border border-warning-yellow/50 text-warning-yellow/80 hover:border-warning-yellow hover:text-void-black hover:bg-warning-yellow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning-yellow font-bold tracking-widest uppercase transition-colors text-left flex justify-between'
      }
      if (variant === 'danger') {
        return 'w-full p-3 border border-blood-red/50 text-blood-red/80 hover:border-blood-red hover:text-void-black hover:bg-blood-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blood-red font-bold tracking-widest uppercase transition-colors text-left flex justify-between'
      }
      return 'w-full p-3 border border-toxic-green bg-toxic-green/10 hover:bg-toxic-green hover:text-void-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green font-bold tracking-widest uppercase transition-colors text-left flex justify-between'
    }

    return (
      <div
        className='fixed inset-0 z-(--z-modal) flex items-center justify-center p-4'
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
      >
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
        <div
          className={`relative w-full max-w-4xl border-2 border-toxic-green bg-void-black shadow-[0_0_40px_var(--color-toxic-green-glow)] motion-safe:animate-[glitch-anim_0.2s_ease-in-out] ${className || ''}`}
        >
          {/* Hardware details */}
          <div className='absolute top-0 left-0 w-full h-1 bg-toxic-green'></div>
          <div className='absolute top-0 left-2 w-16 h-4 bg-toxic-green text-void-black text-xs font-bold text-center leading-4 uppercase'>
            {t('ui:event.severity.critical')}
          </div>

          <div className='p-8 flex flex-col gap-6'>
            <div className='flex items-start gap-4 border-b border-toxic-green/30 pb-6'>
              <AlertIcon className='w-12 h-12 text-toxic-green animate-pulse shrink-0 mt-1' />
              <div>
                <h2
                  id={titleId}
                  className='text-2xl font-bold tracking-[0.1em] uppercase glitch-text'
                  data-text={modalTitle}
                >
                  {modalTitle}
                </h2>
                <p className='mt-2 text-sm opacity-80 leading-relaxed'>
                  {modalDescription}
                </p>
              </div>
            </div>

            <div className='flex flex-col gap-3'>
              {modalActions.map((action, i) => (
                <button
                  key={action.id ?? `action-${i}`}
                  type='button'
                  onClick={action.onClick ?? onClose}
                  className={getActionClassName(action.variant)}
                >
                  <span>{action.label}</span>
                  {action.meta ? (
                    <span className='opacity-50 text-xs mt-1'>
                      {action.meta}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

// 8. Deadman Button (Hold to Confirm)
/**
 * Displays a hold-to-confirm deadman button for dangerous actions.
 * @param props - Button label and confirmation callback.
 */
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
        <span className='text-xs tracking-widest uppercase opacity-50 text-center'>
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
/**
 * Displays a looping hazard ticker with repeated warning text.
 * @param props - Ticker message text.
 */
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
      <div className='flex w-full whitespace-nowrap motion-safe:animate-[marquee_10s_linear_infinite] px-8 items-center gap-12'>
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
