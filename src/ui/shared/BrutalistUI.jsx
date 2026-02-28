import React, { useState, useEffect, useRef } from 'react'

// --- SVG DECORATIONS ---

import { useId } from 'react'

export const HexBorder = ({ className, title }) => {
  const titleId = useId()
  return (
    <svg
      className={className}
      viewBox='0 0 100 100'
      preserveAspectRatio='none'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      role={title ? 'img' : 'presentation'}
      aria-hidden={!title}
      focusable='false'
      aria-labelledby={title ? titleId : undefined}
    >
      {title && <title id={titleId}>{title}</title>}
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

export const CrosshairIcon = ({ className, title }) => {
  const titleId = useId()
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      role={title ? 'img' : 'presentation'}
      aria-hidden={!title}
      focusable='false'
      aria-labelledby={title ? titleId : undefined}
    >
      {title && <title id={titleId}>{title}</title>}
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

export const MoneyIcon = ({ className, title }) => {
  const titleId = useId()
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      role={title ? 'img' : undefined}
      aria-hidden={!title}
      aria-labelledby={title ? titleId : undefined}
    >
      {title && <title id={titleId}>{title}</title>}
      <path
        d='M12 2V22M8 6H14C16.2091 6 18 7.79086 18 10C18 12.2091 16.2091 14 14 14H10C7.79086 14 6 15.7908 6 18C6 20.2091 7.79086 22 10 22H16'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='square'
      />
      <path d='M4 12L6 12M18 12L20 12' stroke='currentColor' strokeWidth='2' />
    </svg>
  )
}

export const AlertIcon = ({ className, title }) => {
  const titleId = useId()
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      role={title ? 'img' : undefined}
      aria-hidden={!title}
      aria-labelledby={title ? titleId : undefined}
    >
      {title && <title id={titleId}>{title}</title>}
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

export const SkullIcon = ({ className, title }) => {
  const titleId = useId()
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      role={title ? 'img' : undefined}
      aria-hidden={!title}
      aria-labelledby={title ? titleId : undefined}
    >
      {title && <title id={titleId}>{title}</title>}
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

export const GearIcon = ({ className, title }) => {
  const titleId = useId()
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      role={title ? 'img' : undefined}
      aria-hidden={!title}
      aria-labelledby={title ? titleId : undefined}
    >
      {title && <title id={titleId}>{title}</title>}
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

export const HexNode = ({ className, title }) => {
  const titleId = useId()
  return (
    <svg
      className={className}
      viewBox='0 0 100 100'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      role={title ? 'img' : undefined}
      aria-hidden={!title}
      aria-labelledby={title ? titleId : undefined}
    >
      {title && <title id={titleId}>{title}</title>}
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

export const WarningStripe = () => {
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
          <rect x='10' width='10' height='20' fill='var(--void-black)' />
        </pattern>
      </defs>
      <rect width='100%' height='100%' fill={`url(#stripes-${patternId})`} />
    </svg>
  )
}

export const BiohazardIcon = ({ className, title }) => {
  const titleId = useId()
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      role={title ? 'img' : undefined}
      aria-hidden={!title}
      aria-labelledby={title ? titleId : undefined}
    >
      {title && <title id={titleId}>{title}</title>}
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

export const CorporateSeal = ({ className, title }) => {
  const titleId = useId()
  return (
    <svg
      className={className}
      viewBox='0 0 100 100'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      role={title ? 'img' : undefined}
      aria-hidden={!title}
      aria-labelledby={title ? titleId : undefined}
    >
      {title && <title id={titleId}>{title}</title>}
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

// --- UI COMPONENTS ---

import { useTranslation } from 'react-i18next'

// 1. Industrial Toggle
export const BrutalToggle = ({ label, initialState = false }) => {
  const { t } = useTranslation()
  const [isOn, setIsOn] = useState(initialState)
  const [isGlitching, setIsGlitching] = useState(false)
  const glitchTimerRef = useRef(null)

  const toggle = () => {
    setIsGlitching(true)
    if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current)
    glitchTimerRef.current = setTimeout(() => setIsGlitching(false), 150)
    setIsOn(!isOn)
  }

  useEffect(() => {
    return () => {
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current)
    }
  }, [])

  return (
    <div className='flex items-center justify-between w-full max-w-sm border border-(--toxic-green)/30 p-3 bg-(--void-black)'>
      <span className='text-sm font-bold tracking-widest uppercase'>
        {label}
      </span>
      <button
        type='button'
        onClick={toggle}
        className={`relative w-16 h-8 border-2 border-(--toxic-green) flex items-center p-1 transition-colors duration-75 ${isGlitching ? 'translate-x-[1px] translate-y-[1px]' : ''}`}
        aria-pressed={isOn}
      >
        <div
          className={`w-full h-full absolute inset-0 bg-(--toxic-green) transition-opacity duration-150 ${isOn ? 'opacity-20' : 'opacity-0'}`}
        ></div>
        <div
          className={`w-5 h-full bg-(--toxic-green) transition-transform duration-100 z-10 ${isOn ? 'translate-x-8' : 'translate-x-0'}`}
        >
          <div className='w-[2px] h-full bg-(--void-black) mx-auto opacity-50'></div>
        </div>
        <span
          className={`absolute text-[10px] font-bold z-0 ${isOn ? 'left-2 text-(--toxic-green)' : 'right-2 text-(--toxic-green)/50'}`}
        >
          {isOn ? t('ui:toggle.on', 'ON') : t('ui:toggle.off', 'OFF')}
        </span>
      </button>
    </div>
  )
}

// 2. Segmented Block Meter
export const BlockMeter = ({ label, value, max = 10, isDanger = false }) => {
  const blocks = Array.from({ length: max }, (_, i) => i)
  return (
    <div className='w-full max-w-sm flex flex-col gap-2'>
      <div className='flex justify-between items-end'>
        <span className='text-xs tracking-widest uppercase opacity-80'>
          {label}
        </span>
        <span
          className={`text-sm font-bold ${isDanger ? 'text-(--blood-red) animate-fuel-warning' : 'text-(--toxic-green)'}`}
        >
          {value} / {max}
        </span>
      </div>
      <div className='flex gap-1 h-6'>
        {blocks.map(block => {
          const isFilled = block < value
          let blockClass =
            'flex-1 border border-(--toxic-green)/30 transition-all duration-300'
          if (isFilled) {
            blockClass = isDanger
              ? 'flex-1 bg-(--blood-red) border-(--blood-red) shadow-[0_0_10px_var(--blood-red)]'
              : 'flex-1 bg-(--toxic-green) border-(--toxic-green) shadow-[0_0_5px_var(--toxic-green-50)]'
          }
          return <div key={block} className={blockClass}></div>
        })}
      </div>
    </div>
  )
}

// 3. Brutalist Tabs
export const BrutalTabs = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('inventory')
  const tabs = [
    { id: 'inventory', label: t('ui:menu.inventory', 'INVENTORY') },
    { id: 'upgrades', label: t('ui:menu.upgrades', 'UPGRADES') }
  ]

  return (
    <div className='w-full max-w-sm border border-(--toxic-green)/50 p-1'>
      <div
        role='tablist'
        aria-label={t('ui:hqNavigation', 'HQ Navigation')}
        className='flex border-b-2 border-(--toxic-green)'
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
                ${isActive ? 'bg-(--toxic-green) text-(--void-black) shadow-[0_-2px_10px_var(--toxic-green)]' : 'bg-(--void-black) text-(--toxic-green) hover:bg-(--toxic-green)/10'}`}
            >
              {isActive && <span className='mr-2'>▶</span>}
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className='p-4 bg-[color:var(--shadow-black)] min-h-[100px] relative overflow-hidden'>
        <div
          className='absolute inset-0 opacity-5 pointer-events-none'
          style={{
            backgroundImage:
              'radial-gradient(var(--toxic-green) 1px, transparent 1px)',
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
}

// 4. Data/Stat Block
export const StatBlock = ({ label, value, icon: Icon }) => (
  <div className='relative w-32 h-24 bg-[color:var(--void-black)] flex flex-col items-center justify-center group overflow-hidden'>
    <HexBorder className='absolute inset-0 w-full h-full text-(--toxic-green)/50 group-hover:text-(--toxic-green) transition-colors' />
    <div className='absolute inset-0 bg-gradient-to-b from-transparent via-[var(--toxic-green)]/10 to-transparent translate-y-[-100%] group-hover:animate-[scan_2s_linear_infinite]'></div>
    <div className='z-10 flex flex-col items-center gap-1'>
      {Icon && <Icon className='w-5 h-5 text-(--toxic-green)' />}
      <span className='text-2xl font-bold tracking-wider'>{value}</span>
      <span className='text-[9px] tracking-[0.2em] opacity-60 uppercase'>
        {label}
      </span>
    </div>
  </div>
)

// 5. Brutal Amp Fader (Custom Slider)
export const BrutalFader = ({ label, initialValue = 7, max = 10 }) => {
  const [val, setVal] = useState(initialValue)
  const segments = Array.from({ length: max }, (_, i) => i + 1)

  return (
    <div className='w-full max-w-sm flex flex-col gap-2'>
      <div className='flex justify-between items-end'>
        <span className='text-xs tracking-widest uppercase opacity-80'>
          {label}
        </span>
        <span className='text-sm font-bold text-(--toxic-green)'>{val}</span>
      </div>
      <div
        className='flex gap-1 h-8 items-end cursor-pointer group'
        role='presentation'
      >
        {segments.map(segment => {
          const isActive = segment <= val
          // Calculate dynamic height for the bars to look like an EQ/Volume fader
          const height = `${30 + (segment / max) * 70}%`
          return (
            <button
              type='button'
              key={segment}
              onClick={() => setVal(segment)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (e.key === ' ') e.preventDefault()
                  setVal(segment)
                }
              }}
              className='flex-1 relative h-full flex items-end group-hover:opacity-100 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green)'
              aria-label={`Set ${label} to ${segment}`}
              aria-pressed={isActive}
            >
              <div
                style={{ height }}
                className={`w-full transition-colors duration-75 border-b-2 border-transparent hover:border-[color:var(--void-black)]
                  ${isActive ? 'bg-(--toxic-green) shadow-[0_0_8px_var(--toxic-green)]' : 'bg-(--toxic-green)/20'}`}
              ></div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 6. Setlist / Track Selector
export const SetlistSelector = () => {
  const [selected, setSelected] = useState(1)
  const tracks = [
    { id: 1, name: 'SUICIDAL JESUS', difficulty: 'HARD' },
    { id: 2, name: 'SYSTEMSPRENGER', difficulty: 'EXPERT' },
    { id: 3, name: 'TRAVESTIE MASSAKER', difficulty: 'INSANE' }
  ]

  return (
    <div className='w-full max-w-sm flex flex-col gap-3'>
      {tracks.map(track => {
        const isSelected = selected === track.id
        return (
          <button
            type='button'
            key={track.id}
            onClick={() => setSelected(track.id)}
            className={`w-full text-left p-3 border-2 transition-all duration-100 flex justify-between items-center group
              ${isSelected ? 'border-(--toxic-green) bg-(--toxic-green)/10 shadow-[inset_0_0_15px_var(--toxic-green-20)]' : 'border-(--toxic-green)/30 bg-[color:var(--void-black)] hover:border-(--toxic-green)/70'}`}
          >
            <div className='flex items-center gap-3'>
              <span
                className={`text-xl font-bold ${isSelected ? 'text-(--toxic-green)' : 'text-(--toxic-green)/30'}`}
              >
                {isSelected ? '[X]' : '[ ]'}
              </span>
              <span
                className={`font-bold tracking-widest uppercase ${isSelected ? 'text-[color:var(--star-white)]' : 'text-(--toxic-green)/80'}`}
              >
                {track.name}
              </span>
            </div>
            <span
              className={`text-[10px] tracking-widest px-2 py-1 border ${isSelected ? 'border-(--toxic-green) text-(--toxic-green)' : 'border-transparent text-(--toxic-green)/50'}`}
            >
              {track.difficulty}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// 7. Crisis Modal Overlay
export const CrisisModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation(['ui'])
  if (!isOpen) return null
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-[color:var(--void-black)]/80 backdrop-blur-sm'
        onClick={onClose}
        aria-hidden='true'
      ></div>
      {/* Scanline FX on background */}
      <div className='absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(transparent_50%,var(--void-black-50)_50%)] bg-[length:100%_4px]'></div>

      {/* Modal Box */}
      <div className='relative w-full max-w-lg border-2 border-(--toxic-green) bg-[color:var(--void-black)] shadow-[0_0_40px_var(--toxic-green-glow)] animate-[glitch-anim_0.2s_ease-in-out]'>
        {/* Hardware details */}
        <div className='absolute top-0 left-0 w-full h-1 bg-(--toxic-green)'></div>
        <div className='absolute top-0 left-2 w-16 h-4 bg-(--toxic-green) text-[color:var(--void-black)] text-[10px] font-bold text-center leading-4 uppercase'>
          {t('ui:event.severity.critical')}
        </div>

        <div className='p-8 flex flex-col gap-6'>
          <div className='flex items-start gap-4 border-b border-(--toxic-green)/30 pb-6'>
            <AlertIcon className='w-12 h-12 text-(--toxic-green) animate-pulse shrink-0 mt-1' />
            <div>
              <h2 className='text-2xl font-bold tracking-[0.1em] uppercase glitch-text'>
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
              className='w-full p-3 border border-(--toxic-green) bg-(--toxic-green)/10 hover:bg-(--toxic-green) hover:text-[color:var(--void-black)] font-bold tracking-widest uppercase transition-colors text-left flex justify-between'
            >
              <span>Pay mechanic (-$250)</span>
              <span className='opacity-50 text-xs mt-1'>SAFE</span>
            </button>
            <button
              type='button'
              onClick={onClose}
              className='w-full p-3 border border-[color:var(--star-white)]/50 text-[color:var(--star-white)]/50 hover:border-[color:var(--star-white)] hover:text-[color:var(--star-white)] hover:bg-[color:var(--star-white)]/10 font-bold tracking-widest uppercase transition-colors text-left flex justify-between'
            >
              <span>{t('ui:crisis.opt3')}</span>
              <span className='opacity-50 text-xs mt-1'>{t('ui:crisis.risky')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 8. Deadman Button (Hold to Confirm)
export const DeadmanButton = ({ label, onConfirm }) => {
  const { t } = useTranslation()
  const [progress, setProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const intervalRef = useRef(null)
  const drainIntervalRef = useRef(null)

  const startHold = () => {
    if (progress >= 100) return
    setIsHolding(true)
    if (drainIntervalRef.current) clearInterval(drainIntervalRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
          setIsHolding(false)
          if (onConfirm) onConfirm()
          return 100
        }
        return prev + 2 // Speed of fill
      })
    }, 20) // 20ms tick
  }

  const stopHold = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    setIsHolding(false)

    if (progress < 100) {
      // Rapid drain if let go too early
      if (drainIntervalRef.current) clearInterval(drainIntervalRef.current)
      drainIntervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(drainIntervalRef.current)
            drainIntervalRef.current = null
            return 0
          }
          return prev - 5
        })
      }, 20)
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (drainIntervalRef.current) clearInterval(drainIntervalRef.current)
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
        className={`relative w-full h-14 border-2 overflow-hidden flex items-center justify-center select-none transition-colors
          ${isComplete ? 'border-(--blood-red) bg-(--blood-red)/20' : 'border-(--toxic-green) bg-(--void-black) hover:border-[color:var(--star-white)]'}`}
      >
        {/* Progress Fill Background */}
        <div
          className={`absolute left-0 top-0 h-full transition-none ${isComplete ? 'bg-(--blood-red)' : 'bg-(--toxic-green)'}`}
          style={{ width: `${progress}%` }}
        ></div>

        {/* Scanline FX on fill */}
        {isHolding && !isComplete && (
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] opacity-50 z-10 pointer-events-none"></div>
        )}

        {/* Text */}
        <span
          className={`relative z-20 font-bold tracking-[0.2em] uppercase mix-blend-difference
          ${isComplete ? 'text-(--void-black)' : 'text-(--toxic-green)'}`}
        >
          {isComplete ? t('ui:executed', 'EXECUTED') : label}
        </span>
      </button>
    </div>
  )
}

// 9. Terminal Readout (Log)
const FULL_LOG_KEYS = [
  { id: 'log_1', key: 'ui:terminal.log1', type: 'info' },
  { id: 'log_2', key: 'ui:terminal.log2', type: 'info' },
  { id: 'log_3', key: 'ui:terminal.log3', type: 'ok' },
  { id: 'log_4', key: 'ui:terminal.log4', type: 'warn' },
  { id: 'log_5', key: 'ui:terminal.log5', type: 'info' },
  { id: 'log_6', key: 'ui:terminal.log6', type: 'info' },
  { id: 'log_7', key: 'ui:terminal.log7', type: 'error' },
  { id: 'log_8', key: 'ui:terminal.log8', type: 'info' }
]

export const TerminalReadout = () => {
  const { t } = useTranslation(['ui'])
  const [lines, setLines] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < FULL_LOG_KEYS.length) {
      const timer = setTimeout(
        () => {
          setLines(prev => [...prev, FULL_LOG_KEYS[currentIndex]])
          setCurrentIndex(currentIndex + 1)
        },
        Math.random() * 400 + 200
      ) // Random typing delay
      return () => clearTimeout(timer)
    }
  }, [currentIndex])

  return (
    <div className='w-full h-48 border border-(--toxic-green)/30 bg-[color:var(--shadow-black)] p-4 font-mono text-xs overflow-y-auto flex flex-col gap-1 custom-scrollbar relative shadow-[inset_0_0_20px_var(--void-black)]'>
      {/* Scanline overlay */}
      <div className='absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,var(--toxic-green-20)_50%)] bg-[length:100%_4px]'></div>

      {lines.map(line => (
        <div
          key={line.id}
          className={`${line.type === 'error' ? 'text-[color:var(--blood-red)] font-bold' : line.type === 'warn' ? 'text-[color:var(--warning-yellow)]' : 'text-(--toxic-green)'} opacity-90 leading-relaxed`}
        >
          {t(line.key)}
        </div>
      ))}
      {currentIndex < FULL_LOG_KEYS.length && (
        <div className='w-2 h-3 bg-(--toxic-green) animate-pulse mt-1'></div>
      )}
    </div>
  )
}

// 10. Hardware Inventory Slot
export const BrutalSlot = ({ label, item = null }) => {
  return (
    <div className='flex flex-col gap-2 items-center'>
      <button
        type='button'
        className='relative w-20 h-20 border-2 border-(--toxic-green)/30 bg-[color:var(--shadow-black)] flex items-center justify-center group cursor-pointer hover:border-(--toxic-green) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green)'
      >
        {/* Corner Decals */}
        <div className='absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-(--toxic-green) opacity-0 group-hover:opacity-100 transition-opacity'></div>
        <div className='absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-(--toxic-green) opacity-0 group-hover:opacity-100 transition-opacity'></div>

        {item ? (
          <>
            <div className='absolute inset-0 bg-(--toxic-green)/10 group-hover:bg-(--toxic-green)/20 transition-colors'></div>
            {item.icon}
          </>
        ) : (
          <CrosshairIcon className='w-6 h-6 text-(--toxic-green) opacity-20 group-hover:opacity-50 transition-opacity' />
        )}
      </button>
      <span className='text-[9px] tracking-[0.2em] uppercase opacity-60 text-center max-w-[80px] truncate'>
        {item ? item.name : label}
      </span>
    </div>
  )
}

// 11. Void Loader (Geometric Spinner)
export const VoidLoader = ({ size = 'w-16 h-16' }) => {
  return (
    <div className={`relative ${size} flex items-center justify-center`}>
      {/* Outer Hex - Slow counter-clockwise */}
      <svg
        className='absolute inset-0 w-full h-full text-(--toxic-green) animate-[spin_4s_linear_infinite_reverse]'
        viewBox='0 0 100 100'
        fill='none'
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
        className='absolute w-[60%] h-[60%] text-(--toxic-green) animate-[spin_1.5s_linear_infinite]'
        viewBox='0 0 100 100'
        fill='none'
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
      <div className='w-2 h-2 bg-[color:var(--star-white)] rounded-full animate-pulse shadow-[0_0_10px_var(--star-white)]'></div>
    </div>
  )
}

// 12. Void Nav-Node (Overworld Navigation Target)
export const VoidNavNode = ({
  id,
  label,
  type,
  isUnlocked = true,
  status = 'IDLE'
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      type='button'
      className={`relative w-40 h-48 flex flex-col items-center justify-center cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green) ${!isUnlocked ? 'opacity-30' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {/* Target Crosshairs (appear on hover) */}
      <div
        className={`absolute inset-0 border border-(--toxic-green)/30 transition-all duration-300 ${isHovered ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
      >
        <div className='absolute top-0 left-1/2 w-[1px] h-4 bg-(--toxic-green) -translate-x-1/2 -translate-y-2'></div>
        <div className='absolute bottom-0 left-1/2 w-[1px] h-4 bg-(--toxic-green) -translate-x-1/2 translate-y-2'></div>
        <div className='absolute left-0 top-1/2 w-4 h-[1px] bg-(--toxic-green) -translate-y-1/2 -translate-x-2'></div>
        <div className='absolute right-0 top-1/2 w-4 h-[1px] bg-(--toxic-green) -translate-y-1/2 translate-x-2'></div>
      </div>

      <HexNode
        className={`w-20 h-20 transition-all duration-200 ${isHovered ? 'text-[color:var(--star-white)] drop-shadow-[0_0_15px_var(--toxic-green-80)]' : 'text-(--toxic-green)'}`}
      />

      {/* Node Info */}
      <div className='mt-4 flex flex-col items-center'>
        <span className='text-[10px] opacity-70 tracking-[0.3em] uppercase'>
          {type}
        </span>
        <span
          className={`text-sm font-bold tracking-widest uppercase mt-1 ${isHovered ? 'text-[color:var(--star-white)]' : 'text-(--toxic-green)'}`}
        >
          {label}
        </span>
      </div>

      {/* Floating Status Tag */}
      {status !== 'IDLE' && (
        <div className='absolute top-2 right-2 bg-(--toxic-green) text-[color:var(--void-black)] text-[8px] font-bold px-1 tracking-widest animate-pulse'>
          {status}
        </div>
      )}
    </button>
  )
}

// 13. Corrupted Data Stream (Text Reveal Effect)
export const CorruptedText = ({ text, delay = 0 }) => {
  const [displayedText, setDisplayedText] = useState('')
  const chars = '!<>-_\\/[]{}—=+*^?#________'

  useEffect(() => {
    let iteration = 0
    let interval = null

    const startEffect = () => {
      interval = setInterval(() => {
        setDisplayedText(
          text
            .split('')
            .map((char, index) => {
              if (index < iteration) {
                return char
              }
              return chars[Math.floor(Math.random() * chars.length)]
            })
            .join('')
        )

        if (iteration >= text.length) {
          clearInterval(interval)
        }

        iteration += 1 / 3 // Speed of reveal
      }, 30)
    }

    const timeout = setTimeout(startEffect, delay)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [text, delay])

  return <span className='font-mono'>{displayedText}</span>
}

// 14. Hazard Ticker Tape (For Gig Modifiers)
export const HazardTicker = ({ message }) => {
  return (
    <div className='relative w-full h-8 bg-[color:var(--void-black)] border-y-2 border-(--toxic-green) flex items-center overflow-hidden'>
      {/* Striped Background Ends */}
      <div className='absolute left-0 top-0 bottom-0 w-8 z-10'>
        <WarningStripe />
      </div>
      <div className='absolute right-0 top-0 bottom-0 w-8 z-10'>
        <WarningStripe />
      </div>

      {/* Scrolling Text Container */}
      <div className='flex w-full whitespace-nowrap animate-[marquee_10s_linear_infinite] px-8 items-center gap-12'>
        <span className='text-xs font-bold tracking-[0.3em] uppercase text-(--toxic-green)'>
          [MODIFIER ACTIVE] {message}
        </span>
        <span className='text-xs font-bold tracking-[0.3em] uppercase text-(--toxic-green)'>
          [MODIFIER ACTIVE] {message}
        </span>
        <span className='text-xs font-bold tracking-[0.3em] uppercase text-(--toxic-green)'>
          [MODIFIER ACTIVE] {message}
        </span>
      </div>
    </div>
  )
}

// 15. Industrial Checklist (Pre-Gig Setup)
export const IndustrialChecklist = () => {
  const { t } = useTranslation(['ui'])
  const [tasks, setTasks] = useState(() => [
    {
      id: 1,
      key: 'ui:checklist.task1',
      completed: false
    },
    {
      id: 2,
      key: 'ui:checklist.task2',
      completed: false
    },
    {
      id: 3,
      key: 'ui:checklist.task3',
      completed: false
    },
    {
      id: 4,
      key: 'ui:checklist.task4',
      completed: false
    }
  ])

  const toggleTask = id => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const allDone = tasks.every(task => task.completed)

  return (
    <div className='w-full border border-(--toxic-green)/30 bg-[color:var(--void-black)] p-4 flex flex-col gap-3 relative'>
      <div className='text-[10px] opacity-50 tracking-[0.3em] mb-2'>
        {t('ui:checklist.header')}
      </div>

      {tasks.map(task => (
        <button
          type='button'
          key={task.id}
          onClick={() => toggleTask(task.id)}
          className={`relative w-full text-left p-3 border transition-all duration-200 flex items-center gap-4 group
            ${task.completed ? 'border-transparent opacity-60' : 'border-(--toxic-green)/30 hover:border-(--toxic-green) hover:bg-(--toxic-green)/10'}`}
        >
          {/* Brutal Checkbox */}
          <div
            className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 transition-colors
            ${task.completed ? 'border-(--toxic-green) bg-(--toxic-green)' : 'border-(--toxic-green) bg-[color:var(--void-black)]'}`}
          >
            {task.completed && (
              <span className='text-[color:var(--void-black)] font-bold text-xs leading-none'>
                X
              </span>
            )}
          </div>

          <span
            className={`font-bold tracking-widest uppercase transition-all duration-200
            ${task.completed ? 'text-(--toxic-green)' : 'text-(--toxic-green)'}`}
          >
            {t(task.key)}
          </span>

          {/* Strikethrough Line Animation */}
          <div
            className={`absolute left-10 top-1/2 h-[2px] bg-[color:var(--star-white)] transition-all duration-300 ease-out z-10
            ${task.completed ? 'w-[calc(100%-3rem)]' : 'w-0'}`}
          ></div>
        </button>
      ))}

      <button
        type='button'
        disabled={!allDone}
        className={`mt-4 p-4 font-bold tracking-[0.2em] uppercase transition-all duration-300 border-2
          ${allDone ? 'border-(--toxic-green) bg-(--toxic-green) text-[color:var(--void-black)] shadow-[0_0_20px_var(--toxic-green)] hover:bg-[color:var(--star-white)] hover:border-[color:var(--star-white)] animate-pulse' : 'border-(--toxic-green)/20 text-(--toxic-green)/20 cursor-not-allowed'}`}
      >
        {allDone
          ? t('ui:checklist.done', 'INITIATE GIG')
          : t('ui:checklist.waiting', 'AWAITING SEQUENCE')}
      </button>
    </div>
  )
}

// 16. Rhythm Lane Matrix (Simulation of the Rhythm Engine)
export const RhythmMatrix = () => {
  const { t } = useTranslation(['ui'])
  const [hits, setHits] = useState([false, false, false])

  const triggerHit = index => {
    setHits(prev => {
      const newHits = [...prev]
      newHits[index] = true
      return newHits
    })
    setTimeout(() => {
      setHits(prev => {
        const newHits = [...prev]
        newHits[index] = false
        return newHits
      })
    }, 150)
  }

  return (
    <div className='w-full h-64 bg-[color:var(--shadow-black)] border border-(--toxic-green)/30 p-4 flex flex-col relative overflow-hidden'>
      <div className='text-[10px] opacity-50 tracking-[0.3em] absolute top-2 left-2 z-10'>
        {t('ui:rhythm.header')}
      </div>

      {/* 3 Lanes */}
      <div className='flex-1 flex justify-center gap-4 mt-6'>
        {['GUITAR', 'DRUMS', 'BASS'].map((lane, i) => (
          <div
            key={lane}
            className='w-16 h-full border-x border-(--toxic-green)/10 relative flex flex-col justify-end pb-2 group'
          >
            {/* Falling Note Simulation */}
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 border-2 border-(--toxic-green) bg-[color:var(--void-black)] animate-[drop_2s_linear_infinite] opacity-50`}
              style={{ animationDelay: `${i * 0.5}s` }}
            ></div>

            {/* Target Box */}
            <button
              type='button'
              className={`w-14 h-8 mx-auto border-2 transition-all duration-75 flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green)
                ${hits[i] ? 'bg-(--toxic-green) border-(--toxic-green) shadow-[0_0_20px_var(--toxic-green)] scale-110' : 'bg-[color:var(--void-black)] border-(--toxic-green)/50 hover:border-(--toxic-green)'}`}
              onMouseDown={() => triggerHit(i)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (e.key === ' ') e.preventDefault()
                  triggerHit(i)
                }
              }}
              aria-label={t('ui:rhythm.hit_lane', { lane })}
              aria-pressed={hits[i]}
            >
              <span
                className={`text-[8px] font-bold ${hits[i] ? 'text-[color:var(--void-black)]' : 'text-(--toxic-green)/50'}`}
              >
                {t('ui:rhythm.hit')}
              </span>
            </button>

            <span className='text-[10px] text-center mt-2 opacity-50 tracking-widest'>
              {t(`ui:rhythm.lane_${lane.toLowerCase()}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 17. Corporate Sellout Contract (Brand Deals)
export const SelloutContract = () => {
  const { t } = useTranslation(['ui'])
  const [signed, setSigned] = useState(false)

  return (
    <div
      className={`w-full border-4 p-6 relative transition-all duration-500 ${signed ? 'border-(--toxic-green) bg-(--toxic-green)/5' : 'border-(--toxic-green)/30 bg-[color:var(--void-black)]'}`}
    >
      <div className='absolute top-0 right-0 p-2 border-l border-b border-(--toxic-green)/30 text-[8px] opacity-50'>
        {t('ui:contract.confidential')}
      </div>

      <h3 className='text-xl font-bold tracking-[0.2em] uppercase mb-4 border-b-2 border-(--toxic-green)/30 pb-2'>
        {t('ui:contract.title')}
      </h3>

      <div className='text-xs leading-relaxed opacity-80 flex flex-col gap-3 font-mono'>
        <p dangerouslySetInnerHTML={{ __html: t('ui:contract.p1') }}></p>
        <p dangerouslySetInnerHTML={{ __html: t('ui:contract.p2') }}></p>
        <p dangerouslySetInnerHTML={{ __html: t('ui:contract.warning') }}></p>

        <div className='mt-4 border-t border-dashed border-(--toxic-green)/50 pt-4 flex justify-between items-end'>
          <div className='flex flex-col gap-1 w-1/2'>
            <span className='text-[10px] opacity-50'>
              {t('ui:contract.sig')}
            </span>
            {signed ? (
              <span className='font-script text-2xl text-(--toxic-green) -rotate-6 tracking-widest animate-pulse'>
                Neurotoxic
              </span>
            ) : (
              <button
                type='button'
                aria-label={t('ui:contract.sign_aria')}
                className='h-8 border-b-2 border-(--toxic-green) w-full cursor-pointer hover:bg-(--toxic-green)/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green)'
                onClick={() => setSigned(true)}
              ></button>
            )}
          </div>

          <div
            className={`transition-all duration-500 ${signed ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}
          >
            <CorporateSeal className='w-16 h-16 text-(--toxic-green)' />
            <div className='text-[8px] text-center mt-1'>{t('ui:contract.sealed')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 18. Toxic Hate Feed (Chatter Overlay)
export const ToxicChatter = () => {
  const { t } = useTranslation(['ui'])
  const [messages, setMessages] = useState([
    { id: 1, user: 'VOID_WALKER', text: 'ui:chatter.msg1', type: 'hate' },
    { id: 2, user: 'TRUE_SCUM', text: 'ui:chatter.msg2', type: 'hate' },
    {
      id: 3,
      user: 'SYS_ADMIN',
      text: 'ui:chatter.msg3',
      type: 'system'
    }
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      const newHate = [
        'ui:chatter.random1',
        'ui:chatter.random2',
        'ui:chatter.random3',
        'ui:chatter.random4',
        'ui:chatter.random5'
      ]
      const randomHate = newHate[Math.floor(Math.random() * newHate.length)]
      setMessages(prev => {
        const updated = [
          ...prev,
          {
            id: Date.now(),
            user: `USER_${Math.floor(Math.random() * 999)}`,
            text: randomHate,
            type: 'hate'
          }
        ]
        return updated.slice(-5) // Keep only last 5
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className='w-full h-64 border border-(--toxic-green)/30 bg-[color:var(--void-black)] p-4 flex flex-col justify-end relative shadow-[inset_0_0_20px_var(--toxic-green-5)]'>
      <div className='absolute top-2 left-2 text-[10px] tracking-widest opacity-50'>
        {t('ui:chatter.header')}
      </div>

      <div className='flex flex-col gap-2 overflow-hidden'>
        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`text-xs p-2 animate-[slide-in_0.2s_ease-out] ${msg.type === 'system' ? 'border border-(--toxic-green) bg-(--toxic-green)/10' : 'border-l-2 border-(--toxic-green)/30'}`}
            style={{ opacity: 0.4 + i * 0.15 }} // Fade out older messages
          >
            <span className='font-bold opacity-70'>[{msg.user}]: </span>
            <span
              className={`${msg.type === 'hate' ? 'chromatic-text' : 'text-(--toxic-green)'}`}
            >
              {t(msg.text)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 19. Void Decryptor (Unlocks/Lore)
export const VoidDecryptor = () => {
  const { t } = useTranslation(['ui'])
  const [decrypted, setDecrypted] = useState(false)
  const [glitchText, setGlitchText] = useState('0x8F9A... ENCRYPTED')

  useEffect(() => {
    if (!decrypted) {
      const interval = setInterval(() => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*'
        let str = ''
        for (let i = 0; i < 15; i++)
          str += chars.charAt(Math.floor(Math.random() * chars.length))
        setGlitchText(str)
      }, 50)
      return () => clearInterval(interval)
    } else {
      setGlitchText(t('ui:decryptor.unlocked'))
    }
  }, [decrypted, t])

  return (
    <button
      type='button'
      className='w-full h-64 border-2 border-(--toxic-green)/50 bg-[color:var(--void-black)] flex flex-col items-center justify-center p-6 relative group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--toxic-green)'
      onClick={() => setDecrypted(true)}
      aria-pressed={decrypted}
    >
      {/* Glitch Frame Corners */}
      <div className='absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-(--toxic-green) transition-all duration-300 group-hover:p-2'></div>
      <div className='absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-(--toxic-green) transition-all duration-300 group-hover:p-2'></div>

      <div
        className={`relative transition-all duration-700 ${decrypted ? 'scale-125' : 'scale-100 animate-[pulse_0.1s_infinite]'}`}
      >
        <BiohazardIcon
          className={`w-20 h-20 ${decrypted ? 'text-(--toxic-green) drop-shadow-[0_0_20px_var(--toxic-green)]' : 'text-(--toxic-green)/30'}`}
        />

        {/* Scrambler Overlay */}
        {!decrypted && (
          <div className='absolute inset-0 bg-[color:var(--void-black)]/50 backdrop-blur-[1px] flex items-center justify-center mix-blend-overlay'>
            <div className='w-full h-2 bg-(--toxic-green) animate-[scan_1s_linear_infinite]'></div>
          </div>
        )}
      </div>

      <div
        className={`mt-6 font-mono text-xs tracking-[0.2em] font-bold ${decrypted ? 'text-[color:var(--star-white)]' : 'text-(--toxic-green)/50'}`}
      >
        {glitchText}
      </div>

      {!decrypted && (
        <div className='absolute bottom-4 text-[8px] opacity-50 animate-bounce'>
          {t('ui:decryptor.click')}
        </div>
      )}
    </button>
  )
}
