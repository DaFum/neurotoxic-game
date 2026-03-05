import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState.jsx'
import { getGenImageUrl, IMG_PROMPTS } from '../utils/imageGen.js'

// --- SVG HARDWARE DEKORATIONEN ---
const RackScrew = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <circle
      cx='0'
      cy='0'
      r='4'
      fill='var(--concrete-gray)'
      stroke='var(--void-black)'
      strokeWidth='1'
    />
    <line
      x1='-2'
      y1='-2'
      x2='2'
      y2='2'
      stroke='var(--void-black)'
      strokeWidth='1.5'
    />
    <line
      x1='-2'
      y1='2'
      x2='2'
      y2='-2'
      stroke='var(--void-black)'
      strokeWidth='1.5'
    />
  </g>
)

const CABLES = [
  {
    id: 'midi',
    labelKey: 'ui:minigames.kabelsalat.cables.midi',
    type: 'midi',
    x: 120,
    y: 480,
    color: 'var(--cosmic-purple)'
  },
  {
    id: 'iec',
    labelKey: 'ui:minigames.kabelsalat.cables.pwr',
    type: 'iec',
    x: 260,
    y: 480,
    color: 'var(--blood-red)'
  },
  {
    id: 'jack',
    labelKey: 'ui:minigames.kabelsalat.cables.jack',
    type: 'jack',
    x: 400,
    y: 480,
    color: 'var(--warning-yellow)'
  },
  {
    id: 'xlr',
    labelKey: 'ui:minigames.kabelsalat.cables.xlr',
    type: 'xlr',
    x: 540,
    y: 480,
    color: 'var(--toxic-green)'
  },
  {
    id: 'dc',
    labelKey: 'ui:minigames.kabelsalat.cables.9v',
    type: 'dc',
    x: 680,
    y: 480,
    color: 'var(--info-blue)'
  }
]

const SLOT_XS = [120, 260, 400, 540, 680]

const SOCKET_DEFS = {
  mic: {
    id: 'mic',
    labelKey: 'ui:minigames.kabelsalat.sockets.mic',
    type: 'xlr',
    color: 'var(--toxic-green)'
  },
  amp: {
    id: 'amp',
    labelKey: 'ui:minigames.kabelsalat.sockets.amp',
    type: 'jack',
    color: 'var(--warning-yellow)'
  },
  pedal: {
    id: 'pedal',
    labelKey: 'ui:minigames.kabelsalat.sockets.pedal',
    type: 'dc',
    color: 'var(--info-blue)'
  },
  power: {
    id: 'power',
    labelKey: 'ui:minigames.kabelsalat.sockets.power',
    type: 'iec',
    color: 'var(--blood-red)'
  },
  synth: {
    id: 'synth',
    labelKey: 'ui:minigames.kabelsalat.sockets.synth',
    type: 'midi',
    color: 'var(--cosmic-purple)'
  }
}

const INITIAL_SOCKET_ORDER = ['mic', 'amp', 'pedal', 'power', 'synth']
const TIME_LIMIT = 25

export const KabelsalatScene = () => {
  const { t } = useTranslation(['ui'])
  const { completeKabelsalatMinigame, changeScene } = useGameState()

  const [selectedCable, setSelectedCable] = useState(null)
  const [connections, setConnections] = useState({})
  const [isShocked, setIsShocked] = useState(false)
  const [faultReason, setFaultReason] = useState('')
  const [isPoweredOn, setIsPoweredOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [isGameOver, setIsGameOver] = useState(false)
  const [socketOrder, setSocketOrder] = useState(INITIAL_SOCKET_ORDER)
  const [lightningSeeds, setLightningSeeds] = useState([])

  const timerRef = useRef(null)
  const finishedRef = useRef(false)
  const isWinningRef = useRef(false)

  // Generate deterministic seeds for lightning to avoid layout shift on every render
  useEffect(() => {
    if (isShocked && lightningSeeds.length === 0) {
      setLightningSeeds(
        Array.from({ length: 15 }).map(() => ({
          id: Math.random().toString(36).substr(2, 9),
          startX: Math.random() * 800,
          o1: Math.random() * 300 - 150,
          o2: Math.random() * 300 - 150,
          o3: Math.random() * 300 - 150,
          w: Math.random() * 10 + 2
        }))
      )
    } else if (!isShocked && lightningSeeds.length > 0) {
      setLightningSeeds([])
    }
  }, [isShocked, lightningSeeds.length])

  // Timer Logik
  useEffect(() => {
    if (!isPoweredOn && !isGameOver && !isWinningRef.current && !finishedRef.current) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            if (!finishedRef.current && !isWinningRef.current) {
              finishedRef.current = true
              setIsGameOver(true)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPoweredOn, isGameOver])

  // Process success scenario (delayed slightly for UX)
  useEffect(() => {
    if (Object.keys(connections).length === Object.keys(SOCKET_DEFS).length) {
      // Player successfully connected everything! Freeze timer instantly.
      if (timerRef.current) clearInterval(timerRef.current)
      isWinningRef.current = true

      const animTimer = setTimeout(() => {
        setIsPoweredOn(true)
      }, 600)
      return () => clearTimeout(animTimer)
    }
  }, [connections])

  // End Game Effects
  const transitionedRef = useRef(false)

  useEffect(() => {
    if (isPoweredOn && !transitionedRef.current) {
      transitionedRef.current = true
      const timer = setTimeout(() => {
        completeKabelsalatMinigame({ isPoweredOn: true, timeLeft })
        changeScene('GIG')
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [isPoweredOn, timeLeft, completeKabelsalatMinigame, changeScene])

  useEffect(() => {
    if (isGameOver && !transitionedRef.current) {
      transitionedRef.current = true
      const timer = setTimeout(() => {
        completeKabelsalatMinigame({ isPoweredOn: false, timeLeft: 0 })
        changeScene('GIG')
      }, 3500)
      return () => clearTimeout(timer)
    }
  }, [isGameOver, completeKabelsalatMinigame, changeScene])

  // Shuffle sockets
  useEffect(() => {
    if (isPoweredOn || isGameOver || isShocked || isWinningRef.current) return

    const interval = setInterval(() => {
      setSocketOrder(prevOrder => {
        const unconnected = prevOrder.filter(id => !connections[id])
        if (unconnected.length <= 1) return prevOrder

        const shuffled = [...unconnected].sort(() => Math.random() - 0.5)

        let shuffleIndex = 0
        return prevOrder.map(id => {
          if (connections[id]) return id
          return shuffled[shuffleIndex++]
        })
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [connections, isPoweredOn, isGameOver, isShocked])

  const handleCableClick = useCallback(
    cableId => {
      if (isShocked || isPoweredOn || isGameOver) return

      if (Object.values(connections).includes(cableId)) {
        setConnections(prev => {
          const newConn = { ...prev }
          const socketId = Object.keys(newConn).find(
            key => newConn[key] === cableId
          )
          delete newConn[socketId]
          return newConn
        })
        setSelectedCable(null)
        return
      }
      setSelectedCable(prev => (prev === cableId ? null : cableId))
    },
    [isShocked, isPoweredOn, isGameOver, connections]
  )

  const triggerShock = useCallback(reason => {
    setIsShocked(true)
    setFaultReason(reason)
    setSelectedCable(null)
    setConnections({})

    setTimeout(() => {
      setIsShocked(false)
      setFaultReason('')
    }, 1200)
  }, [])

  const handleSocketClick = useCallback(
    socketId => {
      if (isShocked || isPoweredOn || isGameOver || !selectedCable) return
      if (connections[socketId]) return

      const targetSocket = SOCKET_DEFS[socketId]
      const incomingCable = CABLES.find(c => c.id === selectedCable)

      const hasPower = !!connections['power']
      const hasAmp = !!connections['amp']

      if (targetSocket.type !== incomingCable.type) {
        triggerShock(t('ui:minigames.kabelsalat.errors.wrongCable'))
        return
      }

      if (!hasPower && targetSocket.id !== 'power') {
        triggerShock(t('ui:minigames.kabelsalat.errors.noPower'))
        return
      }

      if (
        hasPower &&
        !hasAmp &&
        (targetSocket.id === 'mic' || targetSocket.id === 'synth')
      ) {
        triggerShock(t('ui:minigames.kabelsalat.errors.noAmp'))
        return
      }

      setConnections(prev => {
        const next = { ...prev, [socketId]: selectedCable }
        return next
      })
      setSelectedCable(null)
    },
    [
      isShocked,
      isPoweredOn,
      isGameOver,
      selectedCable,
      connections,
      triggerShock,
      t
    ]
  )

  const drawMessyPath = useCallback(
    (cableId, socketId) => {
      const cable = CABLES.find(c => c.id === cableId)
      const socketIndex = socketOrder.indexOf(socketId)
      if (!cable || socketIndex === -1) return ''

      const socketX = SLOT_XS[socketIndex]
      const socketY = 120

      const midY = (cable.y + socketY) / 2
      const offset = (socketX - cable.x) * 1.5

      return `M ${cable.x} ${cable.y} C ${cable.x - offset} ${midY}, ${socketX + offset} ${midY}, ${socketX} ${socketY + 20}`
    },
    [socketOrder]
  )

  const renderPlug = type => {
    switch (type) {
      case 'xlr':
        return (
          <g>
            <rect
              x='-15'
              y='-35'
              width='30'
              height='35'
              rx='3'
              fill='var(--void-black)'
              stroke='currentColor'
              strokeWidth='2'
            />
            <circle cx='-6' cy='-25' r='2.5' fill='currentColor' />
            <circle cx='6' cy='-25' r='2.5' fill='currentColor' />
            <circle cx='0' cy='-12' r='2.5' fill='currentColor' />
          </g>
        )
      case 'jack':
        return (
          <g>
            <rect
              x='-8'
              y='-20'
              width='16'
              height='20'
              fill='var(--void-black)'
              stroke='currentColor'
              strokeWidth='2'
            />
            <path d='M -4 -20 L -2 -45 L 2 -45 L 4 -20 Z' fill='currentColor' />
            <line
              x1='-3'
              y1='-30'
              x2='3'
              y2='-30'
              stroke='var(--void-black)'
              strokeWidth='1'
            />
            <line
              x1='-2'
              y1='-38'
              x2='2'
              y2='-38'
              stroke='var(--void-black)'
              strokeWidth='1'
            />
          </g>
        )
      case 'dc':
        return (
          <g>
            <rect
              x='-10'
              y='-15'
              width='20'
              height='15'
              rx='2'
              fill='var(--void-black)'
              stroke='currentColor'
              strokeWidth='2'
            />
            <rect x='-4' y='-30' width='8' height='15' fill='currentColor' />
            <line
              x1='-2'
              y1='-30'
              x2='2'
              y2='-30'
              stroke='var(--void-black)'
              strokeWidth='2'
            />
          </g>
        )
      case 'iec':
        return (
          <g>
            <path
              d='M -18 -15 L 18 -15 L 14 -35 L -14 -35 Z'
              fill='var(--void-black)'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinejoin='round'
            />
            <rect x='-8' y='-30' width='3' height='10' fill='currentColor' />
            <rect x='-1.5' y='-30' width='3' height='10' fill='currentColor' />
            <rect x='5' y='-30' width='3' height='10' fill='currentColor' />
          </g>
        )
      case 'midi':
        return (
          <g>
            <circle
              cx='0'
              cy='-20'
              r='16'
              fill='var(--void-black)'
              stroke='currentColor'
              strokeWidth='2'
            />
            <circle cx='-8' cy='-20' r='2' fill='currentColor' />
            <circle cx='-5' cy='-28' r='2' fill='currentColor' />
            <circle cx='0' cy='-31' r='2' fill='currentColor' />
            <circle cx='5' cy='-28' r='2' fill='currentColor' />
            <circle cx='8' cy='-20' r='2' fill='currentColor' />
          </g>
        )
      default:
        return null
    }
  }

  const renderSocketGraphic = type => {
    switch (type) {
      case 'xlr':
        return (
          <g>
            <circle
              cx='0'
              cy='0'
              r='22'
              fill='var(--shadow-black)'
              stroke='currentColor'
              strokeWidth='2'
            />
            <circle cx='-6' cy='-5' r='4' fill='var(--void-black)' />
            <circle cx='6' cy='-5' r='4' fill='var(--void-black)' />
            <circle cx='0' cy='8' r='4' fill='var(--void-black)' />
          </g>
        )
      case 'jack':
        return (
          <g>
            <polygon
              points='-18,-10 0,-22 18,-10 18,10 0,22 -18,10'
              fill='var(--shadow-black)'
              stroke='currentColor'
              strokeWidth='2'
            />
            <circle
              cx='0'
              cy='0'
              r='8'
              fill='var(--void-black)'
              stroke='currentColor'
              strokeWidth='1'
              strokeDasharray='2 2'
            />
          </g>
        )
      case 'dc':
        return (
          <g>
            <rect
              x='-14'
              y='-14'
              width='28'
              height='28'
              rx='4'
              fill='var(--shadow-black)'
              stroke='currentColor'
              strokeWidth='2'
            />
            <circle cx='0' cy='0' r='7' fill='var(--void-black)' />
            <circle cx='0' cy='0' r='2' fill='currentColor' />
          </g>
        )
      case 'iec':
        return (
          <g>
            <path
              d='M -22 -12 L 22 -12 L 18 18 L -18 18 Z'
              fill='var(--shadow-black)'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinejoin='round'
            />
            <rect
              x='-9'
              y='-4'
              width='4'
              height='10'
              fill='var(--void-black)'
            />
            <rect
              x='-2'
              y='-4'
              width='4'
              height='10'
              fill='var(--void-black)'
            />
            <rect x='5' y='-4' width='4' height='10' fill='var(--void-black)' />
          </g>
        )
      case 'midi':
        return (
          <g>
            <circle
              cx='0'
              cy='0'
              r='20'
              fill='var(--shadow-black)'
              stroke='currentColor'
              strokeWidth='2'
            />
            <path
              d='M -15 0 A 15 15 0 0 1 15 0'
              fill='none'
              stroke='var(--void-black)'
              strokeWidth='6'
              strokeLinecap='round'
            />
          </g>
        )
      default:
        return null
    }
  }

  const isPowerConnected = !!connections['power']
  const bgUrl = getGenImageUrl(IMG_PROMPTS.MINIGAME_KABELSALAT_BG)

  return (
    <div
      className='flex flex-col items-center justify-center w-full min-h-screen relative p-4'
      style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover' }}
    >
      <div className='absolute inset-0 bg-(--void-black)/80 z-0'></div>

      <div className='flex flex-col items-center w-full max-w-4xl mx-auto z-10'>
        <div className='w-full flex flex-col md:flex-row justify-between items-end border-b-2 border-(--toxic-green) pb-2 mb-6 gap-4 bg-(--void-black)/80 p-4 rounded-t-sm'>
          <div>
            <h2 className='text-2xl font-bold text-(--toxic-green) tracking-[0.2em] relative'>
              <span className='relative z-10'>
                {t('ui:minigames.kabelsalat.title')}
              </span>
              {isShocked && (
                <span className='absolute top-0 left-0 text-(--blood-red) translate-x-[2px] opacity-70 mix-blend-screen'>
                  {t('ui:minigames.kabelsalat.title')}
                </span>
              )}
              {isShocked && (
                <span className='absolute top-0 left-0 text-(--info-blue) -translate-x-[2px] opacity-70 mix-blend-screen'>
                  {t('ui:minigames.kabelsalat.title')}
                </span>
              )}
            </h2>
            <p className='text-xs text-(--ash-gray) uppercase tracking-widest mt-1'>
              {t('ui:minigames.kabelsalat.status')}:{' '}
              {isPoweredOn
                ? t('ui:minigames.kabelsalat.statusConnected')
                : isGameOver
                  ? t('ui:minigames.kabelsalat.statusFailed')
                  : t('ui:minigames.kabelsalat.statusPending')}
            </p>
          </div>

          <div
            className={`flex items-center gap-4 px-4 py-2 border-2 transition-colors bg-(--void-black)/50
            ${
              timeLeft <= 10
                ? 'border-(--error-red) text-(--error-red) animate-pulse'
                : isPoweredOn
                  ? 'border-(--success-green) text-(--success-green)'
                  : 'border-(--warning-yellow) text-(--warning-yellow)'
            }`}
          >
            <span className='text-[10px] tracking-widest uppercase'>
              {t('ui:minigames.kabelsalat.tMinus')}
            </span>
            <span className='text-3xl font-bold tracking-widest'>
              {t('ui:minigames.kabelsalat.timeValue', { count: timeLeft })}
            </span>
          </div>
        </div>

        <div
          className={`relative w-full aspect-[4/3] border-4 bg-(--void-black) transition-all duration-100 select-none overflow-hidden shadow-[inset_0_0_50px_var(--shadow-black)]
            ${
              isShocked
                ? 'border-(--error-red) animate-[shake_0.1s_infinite]'
                : isPoweredOn
                  ? 'border-(--success-green) shadow-[0_0_30px_var(--success-green)]'
                  : isGameOver
                    ? 'border-(--blood-red)'
                    : 'border-(--concrete-gray)'
            }`}
        >
          {isShocked && (
            <div className='absolute inset-0 z-40 mix-blend-color-dodge flex flex-col items-center justify-center bg-(--blood-red)/50 backdrop-blur-[2px]'>
              <div className='bg-(--warning-yellow) text-(--void-black) text-5xl font-bold tracking-[0.3em] px-8 py-4 skew-x-[-15deg] shadow-[0_0_50px_var(--warning-yellow)]'>
                {t('ui:minigames.kabelsalat.systemShock')}
              </div>
              <div className='mt-6 bg-(--void-black) text-(--star-white) text-xl font-bold tracking-widest uppercase px-6 py-2 border-2 border-(--star-white)'>
                {faultReason}
              </div>
            </div>
          )}

          {isGameOver && !isShocked && (
            <div className='absolute inset-0 z-40 flex flex-col items-center justify-center bg-(--void-black)/90 backdrop-blur-sm'>
              <h3 className='text-(--error-red) text-5xl font-bold tracking-[0.3em] mb-4 drop-shadow-[0_0_15px_var(--error-red)] text-center'>
                {t('ui:minigames.kabelsalat.timeUp')}
              </h3>
              <p className='text-(--ash-gray) tracking-widest uppercase mb-8 text-center'>
                {t('ui:minigames.kabelsalat.managerMad')}
              </p>
            </div>
          )}

          {isPoweredOn && (
            <div className='absolute inset-0 z-40 flex flex-col items-center justify-center bg-(--void-black)/60 backdrop-blur-sm transition-all duration-1000'>
              <h3 className='text-(--success-green) text-4xl font-bold tracking-[0.3em] mb-2 drop-shadow-[0_0_15px_var(--success-green)] text-center'>
                {t('ui:minigames.kabelsalat.success')}
              </h3>
              <p className='text-(--ash-gray) tracking-widest uppercase mb-8 text-center max-w-sm'>
                {t('ui:minigames.kabelsalat.ampsReady')}
              </p>
            </div>
          )}

          <svg
            width='100%'
            height='100%'
            viewBox='0 0 800 600'
            preserveAspectRatio='xMidYMid meet'
            className='absolute inset-0 z-10'
            role='img'
            aria-label={t('ui:minigames.kabelsalat.title')}
          >
            <title>{t('ui:minigames.kabelsalat.title')}</title>
            <rect
              x='40'
              y='20'
              width='720'
              height='180'
              fill='var(--shadow-black)'
              stroke='var(--concrete-gray)'
              strokeWidth='4'
            />
            <rect
              x='50'
              y='30'
              width='700'
              height='160'
              fill='var(--void-black)'
            />
            <RackScrew x='60' y='40' /> <RackScrew x='760' y='40' />
            <RackScrew x='60' y='170' /> <RackScrew x='760' y='170' />
            <circle
              cx='80'
              cy='100'
              r='6'
              fill={
                isPowerConnected
                  ? 'var(--success-green)'
                  : 'var(--concrete-gray)'
              }
              style={{
                filter: isPowerConnected
                  ? 'drop-shadow(0 0 10px var(--success-green))'
                  : 'none'
              }}
            />
            <text
              x='80'
              y='125'
              fill='var(--ash-gray)'
              fontSize='8'
              textAnchor='middle'
              className='font-mono tracking-widest'
            >
              {t('ui:minigames.kabelsalat.pwrLabel')}
            </text>
            {lightningSeeds.map(seed => (
              <path
                key={seed.id}
                d={`M ${seed.startX} 0 L ${seed.startX + seed.o1} 200 L ${seed.startX + seed.o2} 400 L ${seed.startX + seed.o3} 600`}
                fill='none'
                stroke='var(--warning-yellow)'
                strokeWidth={seed.w}
                className='animate-[flash_0.05s_infinite]'
                style={{
                  filter: 'drop-shadow(0 0 20px var(--warning-yellow))'
                }}
              />
            ))}
            {Object.entries(connections).map(([sockId, cabId]) => {
              const cable = CABLES.find(c => c.id === cabId)
              const isActive = isPowerConnected || cabId === 'iec'
              const cableColor = isActive ? cable.color : 'var(--concrete-gray)'

              return (
                <path
                  key={sockId}
                  d={drawMessyPath(cabId, sockId)}
                  fill='none'
                  stroke={cableColor}
                  strokeWidth='12'
                  strokeLinecap='round'
                  className='animate-[dash_0.6s_ease-out_forwards]'
                  strokeDasharray='1500'
                  strokeDashoffset='1500'
                  style={{
                    filter: isActive
                      ? `drop-shadow(0 5px 10px ${cable.color})`
                      : `drop-shadow(0 10px 10px var(--shadow-black))`
                  }}
                />
              )
            })}
            {socketOrder.map((socketId, index) => {
              const socket = SOCKET_DEFS[socketId]
              const x = SLOT_XS[index]
              const y = 120

              const isConnected = !!connections[socketId]
              const connectedCable = isConnected
                ? CABLES.find(c => c.id === connections[socketId])
                : null
              const showColor = isPowerConnected
              const socketDisplayColor = showColor
                ? socket.color
                : 'var(--ash-gray)'

              return (
                <g
                  key={socketId}
                  transform={`translate(${x}, ${y})`}
                  onClick={() => handleSocketClick(socketId)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSocketClick(socketId)
                    }
                  }}
                  role='button'
                  tabIndex={
                    !isConnected && selectedCable && !isGameOver ? 0 : -1
                  }
                  className={`transition-transform duration-500 ease-in-out ${!isConnected && selectedCable && !isGameOver ? 'cursor-pointer group' : 'outline-hidden'}`}
                  style={{ color: socketDisplayColor }}
                  aria-label={t('ui:minigames.kabelsalat.a11y.socket', {
                    label: t(socket.labelKey)
                  })}
                >
                  {selectedCable && !isConnected && !isGameOver && (
                    <circle
                      cx='0'
                      cy='0'
                      r='45'
                      fill='currentColor'
                      fillOpacity='0.05'
                      stroke='currentColor'
                      strokeWidth='1'
                      strokeDasharray='4 8'
                      className='animate-[spin_4s_linear_infinite] group-hover:fill-opacity-20'
                    />
                  )}

                  <rect
                    x='-35'
                    y='-35'
                    width='70'
                    height='70'
                    fill='var(--void-black)'
                    stroke='var(--concrete-gray)'
                    strokeWidth='1'
                    rx='4'
                  />

                  {renderSocketGraphic(socket.type)}

                  <circle
                    cx='-25'
                    cy='-25'
                    r='4'
                    fill={
                      isConnected && showColor
                        ? 'var(--success-green)'
                        : 'var(--shadow-black)'
                    }
                    style={{
                      filter:
                        isConnected && showColor
                          ? 'drop-shadow(0 0 5px var(--success-green))'
                          : 'none'
                    }}
                  />

                  <text
                    x='0'
                    y='-45'
                    fill={showColor ? 'currentColor' : 'var(--ash-gray)'}
                    opacity={showColor ? 1 : 0.5}
                    fontSize='12'
                    textAnchor='middle'
                    className='font-mono font-bold tracking-widest'
                  >
                    {t(socket.labelKey)}
                  </text>

                  {isConnected && (
                    <g
                      style={{
                        color: showColor
                          ? connectedCable.color
                          : 'var(--concrete-gray)'
                      }}
                    >
                      {renderPlug(connectedCable.type)}
                    </g>
                  )}
                </g>
              )
            })}
            {CABLES.map(cable => {
              const isConnected = Object.values(connections).includes(cable.id)
              const isSelected = selectedCable === cable.id

              return (
                <g
                  key={cable.id}
                  transform={`translate(${cable.x}, ${isSelected ? cable.y - 40 : cable.y})`}
                  onClick={() => handleCableClick(cable.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleCableClick(cable.id)
                    }
                  }}
                  role='button'
                  tabIndex={!isConnected && !isShocked && !isGameOver ? 0 : -1}
                  className={
                    !isConnected && !isShocked && !isGameOver
                      ? 'cursor-pointer transition-transform duration-200 group'
                      : 'transition-transform duration-200 outline-hidden'
                  }
                  style={{ color: cable.color }}
                  aria-label={t('ui:minigames.kabelsalat.a11y.cable', {
                    label: t(cable.labelKey)
                  })}
                >
                  <ellipse
                    cx='0'
                    cy='80'
                    rx='25'
                    ry='10'
                    fill='var(--void-black)'
                    opacity='0.8'
                  />

                  {!isConnected && (
                    <>
                      <path
                        d='M 0 0 C 0 40, -10 60, 0 80'
                        stroke='currentColor'
                        strokeWidth='12'
                        fill='none'
                        style={{
                          filter: `drop-shadow(0 5px 5px var(--shadow-black))`
                        }}
                      />

                      {isSelected && (
                        <circle
                          cx='0'
                          cy='-15'
                          r='35'
                          fill='currentColor'
                          opacity='0.15'
                          className='animate-pulse'
                        />
                      )}

                      {!isSelected && !isGameOver && (
                        <rect
                          x='-30'
                          y='-40'
                          width='60'
                          height='80'
                          fill='transparent'
                          className='group-hover:fill-[currentColor] group-hover:opacity-10 transition-colors'
                        />
                      )}

                      {renderPlug(cable.type)}

                      <rect
                        x='-25'
                        y='-68'
                        width='50'
                        height='18'
                        fill='var(--void-black)'
                        stroke='currentColor'
                        strokeWidth='1'
                      />
                      <text
                        x='0'
                        y='-55'
                        fill='currentColor'
                        fontSize='12'
                        textAnchor='middle'
                        className='font-mono font-bold tracking-widest'
                      >
                        {t(cable.labelKey)}
                      </text>
                    </>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        <div className='mt-6 border border-(--warning-yellow) bg-(--warning-yellow)/10 p-4 text-sm text-(--warning-yellow) max-w-4xl w-full'>
          <h4 className='font-bold tracking-widest mb-2 border-b border-(--warning-yellow)/30 pb-1'>
            == {t('ui:minigames.kabelsalat.rulesTitle')} ==
          </h4>
          <ul className='list-disc pl-4 space-y-1 opacity-80'>
            <li>{t('ui:minigames.kabelsalat.rules.time')}</li>
            <li>
              <strong>{t('ui:minigames.kabelsalat.rules.rule1Label')}:</strong>{' '}
              {t('ui:minigames.kabelsalat.rules.rule1Text')}
            </li>
            <li>
              <strong>{t('ui:minigames.kabelsalat.rules.rule2Label')}:</strong>{' '}
              {t('ui:minigames.kabelsalat.rules.rule2Text')}
            </li>
            <li>{t('ui:minigames.kabelsalat.rules.penalty')}</li>
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-10px, 5px) rotate(-1.5deg); }
          50% { transform: translate(10px, -5px) rotate(1.5deg); }
          75% { transform: translate(-10px, -5px) rotate(0deg); }
        }
        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}
