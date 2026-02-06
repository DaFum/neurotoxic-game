import React from 'react'
import PropTypes from 'prop-types'
import { ChatterOverlay } from './ChatterOverlay'
import { HecklerOverlay } from './HecklerOverlay'

export const GigHUD = ({ stats, onLaneInput, gameStateRef }) => {
  const {
    score,
    combo,
    health,
    overload,
    isGameOver,
    accuracy = 100,
    isToxicMode = false
  } = stats

  return (
    <div className='absolute inset-0 z-30 pointer-events-none'>
      {/* Heckler Overlay (Projectiles) */}
      <HecklerOverlay gameStateRef={gameStateRef} />

      {/* Chatter Overlay Integration */}
      <div className='hidden sm:block absolute bottom-32 right-4 z-20'>
        <ChatterOverlay staticPosition={true} />
      </div>

      {/* Input Zones */}
      <div className='absolute inset-0 z-40 flex pb-16 pt-32'>
        {[0, 1, 2].map(laneIndex => (
          <div
            key={laneIndex}
            className='flex-1 h-full cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors duration-75 pointer-events-auto'
            onMouseDown={() => onLaneInput && onLaneInput(laneIndex, true)}
            onMouseUp={() => onLaneInput && onLaneInput(laneIndex, false)}
            onMouseLeave={() => onLaneInput && onLaneInput(laneIndex, false)}
            onTouchStart={e => {
              e.preventDefault()
              onLaneInput && onLaneInput(laneIndex, true)
            }}
            onTouchEnd={e => {
              e.preventDefault()
              onLaneInput && onLaneInput(laneIndex, false)
            }}
          />
        ))}
      </div>

      {/* Stats Overlay */}
      <div className='absolute top-32 left-4 z-10 text-(--star-white) font-mono pointer-events-none'>
        {/* Score Display with Shadow */}
        <div className='text-5xl font-bold text-(--toxic-green) drop-shadow-[0_0_10px_var(--toxic-green)] tracking-widest'>
          {Math.floor(score).toString().padStart(7, '0')}
        </div>

        {/* Combo Counter with Scale Animation */}
        <div className='mt-2 flex items-center gap-2'>
          <div
            className={`text-3xl font-bold transition-transform duration-100 ${
              combo > 0 ? 'scale-110' : 'scale-100'
            } ${
              accuracy < 70
                ? 'text-(--warning-yellow) animate-pulse'
                : combo > 30
                  ? 'text-(--blood-red) animate-pulse'
                  : 'text-(--ash-gray)'
            }`}
          >
            {combo}x
          </div>
          <div className='text-sm text-(--ash-gray) uppercase tracking-widest'>
            Combo
          </div>
        </div>

        {/* Toxic Overload Meter */}
        <div className='mt-4'>
          <div className='flex justify-between text-xs text-(--ash-gray) mb-1'>
            <span>TOXIC OVERLOAD</span>
            <span>{Math.floor(overload)}%</span>
          </div>
          <div className='w-48 h-3 bg-(--void-black) border border-(--ash-gray) overflow-hidden'>
            <div
              className='h-full bg-(--toxic-green) transition-all duration-200 ease-out shadow-[0_0_10px_var(--toxic-green)]'
              style={{ width: `${overload}%` }}
            />
          </div>
        </div>
      </div>

      {/* Health Bar (Bottom Center) */}
      <div className='absolute bottom-24 left-1/2 -translate-x-1/2 w-96 z-10 pointer-events-none'>
        <div className='flex justify-between text-(--star-white) text-xs mb-1 font-bold tracking-widest drop-shadow-md'>
          <span>CROWD ENERGY</span>
          <span
            className={
              health < 20
                ? 'text-(--blood-red) animate-flash'
                : 'text-(--star-white)'
            }
          >
            {Math.floor(health)}%
          </span>
        </div>
        {/* Segmented Bar Look */}
        <div
          className={`w-full h-6 bg-(--void-black)/50 border-2 backdrop-blur-sm p-[2px] ${
            health < 20
              ? 'border-(--blood-red) animate-flash'
              : 'border-(--ash-gray)/30'
          }`}
        >
          <div
            className={`h-full transition-all duration-300 ease-out ${
              health < 20
                ? 'bg-(--blood-red) shadow-[0_0_15px_var(--blood-red)]'
                : 'bg-gradient-to-r from-(--toxic-green) to-(--toxic-green) shadow-[0_0_10px_var(--toxic-green)]'
            }`}
            style={{ width: `${health}%` }}
          />
        </div>
        {isToxicMode && (
          <div className='mt-2 text-(--blood-red) animate-pulse font-bold tracking-widest text-center font-[var(--font-display)]'>
            TOXIC MODE ACTIVE
          </div>
        )}
      </div>

      {/* Controls Hint */}
      <div className='absolute bottom-4 w-full text-center text-(--ash-gray) font-mono text-sm z-10'>
        [← GUITAR] [↓ DRUMS] [→ BASS] (Arrow Keys)
      </div>

      {isGameOver && (
        <div className='absolute inset-0 z-50 bg-(--void-black)/90 flex items-center justify-center pointer-events-none'>
          <h1 className='text-6xl text-(--blood-red) font-[Metal_Mania] animate-pulse'>
            BOOED OFF STAGE
          </h1>
        </div>
      )}
    </div>
  )
}

GigHUD.propTypes = {
  stats: PropTypes.shape({
    score: PropTypes.number.isRequired,
    combo: PropTypes.number.isRequired,
    health: PropTypes.number.isRequired,
    overload: PropTypes.number.isRequired,
    isGameOver: PropTypes.bool.isRequired,
    accuracy: PropTypes.number,
    isToxicMode: PropTypes.bool
  }).isRequired,
  onLaneInput: PropTypes.func,
  gameStateRef: PropTypes.shape({
    current: PropTypes.shape({
      projectiles: PropTypes.array
    })
  }).isRequired
}
