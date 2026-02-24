import { memo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { HecklerOverlay } from './HecklerOverlay'

const LANE_NAMES = ['Guitar', 'Drums', 'Bass']
const LANE_KEYS = ['←', '↓', '→']
const LANE_INDICES = [0, 1, 2]

const LaneInputZone = memo(function LaneInputZone({ laneIndex, onLaneInput }) {
  const handleMouseDown = useCallback(
    () => onLaneInput?.(laneIndex, true),
    [laneIndex, onLaneInput]
  )
  const handleMouseUp = useCallback(
    () => onLaneInput?.(laneIndex, false),
    [laneIndex, onLaneInput]
  )
  const handleTouchStart = useCallback(
    e => {
      e.preventDefault()
      onLaneInput?.(laneIndex, true)
    },
    [laneIndex, onLaneInput]
  )
  const handleTouchEnd = useCallback(
    e => {
      e.preventDefault()
      onLaneInput?.(laneIndex, false)
    },
    [laneIndex, onLaneInput]
  )

  return (
    <div
      role='button'
      aria-label={`${LANE_NAMES[laneIndex]} lane`}
      className='flex-1 h-full cursor-pointer hover:bg-(--star-white)/5 active:bg-(--star-white)/10 transition-colors duration-75 pointer-events-auto relative'
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Separator lines between lanes */}
      {laneIndex < 2 && (
        <div className='absolute right-0 top-0 h-full w-[1px] bg-(--toxic-green)/10 pointer-events-none' />
      )}
    </div>
  )
})

LaneInputZone.propTypes = {
  laneIndex: PropTypes.number.isRequired,
  onLaneInput: PropTypes.func
}

const LaneInputArea = memo(function LaneInputArea({ onLaneInput }) {
  return (
    <div className='absolute inset-0 z-40 flex pb-16 pt-32 pointer-events-none'>
      {LANE_INDICES.map(laneIndex => (
        <LaneInputZone
          key={laneIndex}
          laneIndex={laneIndex}
          onLaneInput={onLaneInput}
        />
      ))}
    </div>
  )
})

LaneInputArea.propTypes = {
  onLaneInput: PropTypes.func
}

const ControlsHint = memo(function ControlsHint() {
  return (
    <div className='absolute bottom-3 w-full flex justify-center gap-8 z-10 pointer-events-none'>
      {LANE_NAMES.map((name, i) => (
        <div
          key={i}
          className='flex items-center gap-1.5 text-(--ash-gray)/60 font-mono text-xs'
        >
          <span className='border border-(--ash-gray)/30 px-1.5 py-0.5 text-[10px]'>
            {LANE_KEYS[i]}
          </span>
          <span className='uppercase tracking-wider'>{name}</span>
        </div>
      ))}
    </div>
  )
})

const SegmentedBar = memo(function SegmentedBar({
  value,
  segments = 20,
  lowThreshold = 20,
  className = ''
}) {
  const filledCount = Math.round((value / 100) * segments)
  const isLow = value < lowThreshold
  return (
    <div className={`flex gap-[2px] ${className}`}>
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-full transition-all duration-150 ${
            i < filledCount
              ? isLow
                ? 'bg-(--blood-red) shadow-[0_0_4px_var(--blood-red)]'
                : 'bg-(--toxic-green) shadow-[0_0_2px_var(--toxic-green)]'
              : 'bg-(--ash-gray)/10'
          }`}
        />
      ))}
    </div>
  )
})

export const GigHUD = memo(function GigHUD({ stats, onLaneInput, gameStateRef, onTogglePause }) {
  const {
    score,
    combo,
    health,
    overload,
    isGameOver,
    accuracy = 100,
    isToxicMode = false
  } = stats

  const comboTier =
    combo >= 50
      ? 'text-(--blood-red) animate-pulse'
      : combo >= 20
        ? 'text-(--warning-yellow)'
        : combo > 0
          ? 'text-(--toxic-green)'
          : 'text-(--ash-gray)/50'

  return (
    <div className='absolute inset-0 z-30 pointer-events-none'>
      {/* Toxic Mode Border Flash */}
      {isToxicMode && (
        <div className='absolute inset-0 z-0 toxic-border-flash pointer-events-none' />
      )}

      <HecklerOverlay gameStateRef={gameStateRef} />

      {/* Pause Button */}
      <div className='absolute top-4 right-4 z-50 pointer-events-auto'>
        <button
          onClick={onTogglePause}
          className='bg-(--void-black)/80 border border-(--toxic-green) text-(--toxic-green) p-2 hover:bg-(--toxic-green) hover:text-(--void-black) transition-all'
          aria-label='Pause Game'
        >
          <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='w-8 h-8'>
            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 5.25v13.5m-7.5-13.5v13.5' />
          </svg>
        </button>
      </div>

      {/* Input Zones with lane labels */}
      <LaneInputArea onLaneInput={onLaneInput} />

      {/* Stats Overlay */}
      <div className='absolute top-32 left-4 z-10 text-(--star-white) font-mono pointer-events-none'>
        {/* Score Display */}
        <div className='bg-(--void-black)/60 backdrop-blur-sm border border-(--toxic-green)/20 px-3 py-2 inline-block'>
          <div className='text-[10px] text-(--ash-gray) tracking-widest mb-0.5'>
            SCORE
          </div>
          <div className='text-4xl font-bold text-(--toxic-green) drop-shadow-[0_0_10px_var(--toxic-green)] tracking-wider tabular-nums'>
            {Math.floor(score).toString().padStart(7, '0')}
          </div>
        </div>

        {/* Combo Counter */}
        <div className='mt-2 bg-(--void-black)/60 backdrop-blur-sm border border-(--toxic-green)/20 px-3 py-1.5 inline-flex items-baseline gap-2'>
          <div
            className={`text-2xl font-bold transition-all duration-100 tabular-nums ${comboTier} ${
              combo > 0 ? 'scale-110' : 'scale-100'
            }`}
          >
            {combo}x
          </div>
          <div className='text-[10px] text-(--ash-gray) uppercase tracking-widest'>
            combo
          </div>
          {accuracy < 70 && (
            <div className='text-[10px] text-(--warning-yellow) animate-pulse'>
              LOW ACC
            </div>
          )}
        </div>

        {/* Toxic Overload Meter */}
        <div className='mt-3 w-48'>
          <div className='flex justify-between text-[10px] text-(--ash-gray) mb-1'>
            <span className='tracking-widest'>TOXIC OVERLOAD</span>
            <span
              className={`tabular-nums ${overload > 80 ? 'text-(--blood-red) animate-pulse' : ''}`}
            >
              {Math.floor(overload)}%
            </span>
          </div>
          <div className='w-full h-2.5 bg-(--void-black)/80 border border-(--ash-gray)/30 overflow-hidden p-[1px]'>
            <div
              className={`h-full transition-all duration-200 ease-out ${
                overload > 80
                  ? 'bg-gradient-to-r from-(--toxic-green) to-(--blood-red) shadow-[0_0_10px_var(--blood-red)]'
                  : 'bg-(--toxic-green) shadow-[0_0_6px_var(--toxic-green)]'
              }`}
              style={{ width: `${overload}%` }}
            />
          </div>
        </div>
      </div>

      {/* Health Bar (Bottom Center) - Segmented */}
      <div className='absolute bottom-20 left-1/2 -translate-x-1/2 w-[28rem] z-10 pointer-events-none'>
        <div className='flex justify-between text-(--star-white) text-xs mb-1 font-bold tracking-widest drop-shadow-md'>
          <span>CROWD ENERGY</span>
          <span
            className={`tabular-nums ${
              health < 20
                ? 'text-(--blood-red) animate-fuel-warning'
                : 'text-(--star-white)'
            }`}
          >
            {Math.floor(health)}%
          </span>
        </div>
        <div
          className={`w-full h-5 bg-(--void-black)/70 border-2 backdrop-blur-sm p-[3px] ${
            health < 20
              ? 'border-(--blood-red) shadow-[0_0_10px_var(--blood-red)]'
              : 'border-(--ash-gray)/30'
          }`}
        >
          <SegmentedBar
            value={health}
            segments={25}
            lowThreshold={20}
            className='h-full'
          />
        </div>
        {isToxicMode && (
          <div className='mt-2 text-(--blood-red) animate-neon-flicker font-bold tracking-widest text-center font-[var(--font-display)] text-sm'>
            TOXIC MODE ACTIVE
          </div>
        )}
      </div>

      {/* Controls Hint */}
      <ControlsHint />

      {isGameOver && (
        <div className='absolute inset-0 z-50 bg-(--void-black)/90 flex flex-col items-center justify-center pointer-events-none'>
          <h1 className='text-7xl text-(--blood-red) font-[Metal_Mania] animate-doom-zoom'>
            BOOED OFF STAGE
          </h1>
          <div className='mt-4 text-(--ash-gray) font-mono text-sm animate-pulse tracking-widest'>
            THE CROWD HAS SPOKEN
          </div>
        </div>
      )}
    </div>
  )
})

GigHUD.propTypes = {
  stats: PropTypes.shape({
    score: PropTypes.number.isRequired,
    combo: PropTypes.number.isRequired,
    health: PropTypes.number.isRequired,
    overload: PropTypes.number.isRequired,
    isGameOver: PropTypes.bool.isRequired,
    accuracy: PropTypes.number.isRequired,
    isToxicMode: PropTypes.bool
  }).isRequired,
  onLaneInput: PropTypes.func,
  gameStateRef: PropTypes.shape({
    current: PropTypes.shape({
      projectiles: PropTypes.array
    })
  }).isRequired,
  onTogglePause: PropTypes.func
}
