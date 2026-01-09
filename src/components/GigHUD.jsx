import React from 'react'
import { ChatterOverlay } from './ChatterOverlay'

export const GigHUD = ({ stats, onLaneInput }) => {
  const { score, combo, health, overload, isGameOver } = stats

  return (
    <div className='absolute inset-0 z-30 pointer-events-none'>
      {/* Chatter Overlay Integration */}
      <div className='absolute top-32 right-4 z-50'>
        <ChatterOverlay />
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
      <div className='absolute top-32 left-4 z-10 text-white font-mono pointer-events-none'>
        <div className='text-4xl font-bold text-(--toxic-green)'>
          {Math.floor(score).toString().padStart(7, '0')}
        </div>
        <div
          className={`text-2xl ${combo > 10 ? 'text-(--blood-red) animate-pulse' : 'text-gray-400'}`}
        >
          {combo}x COMBO
        </div>
        <div className='mt-2'>
          <div className='text-xs text-gray-400'>TOXIC OVERLOAD</div>
          <div className='w-32 h-2 bg-gray-800'>
            <div
              className='h-full bg-(--toxic-green) transition-all duration-200'
              style={{ width: `${overload}%` }}
            />
          </div>
        </div>
      </div>

      <div className='absolute bottom-16 left-1/2 -translate-x-1/2 w-64 z-10'>
        <div className='flex justify-between text-white text-xs mb-1'>
          <span>CROWD ENERGY</span>
          <span>{Math.floor(health)}%</span>
        </div>
        <div className='w-full h-4 bg-gray-800 border border-gray-600'>
          <div
            className={`h-full transition-all duration-200 ${health < 30 ? 'bg-red-500' : 'bg-(--toxic-green)'}`}
            style={{ width: `${health}%` }}
          />
        </div>
      </div>

      {/* Controls Hint */}
      <div className='absolute bottom-4 w-full text-center text-gray-500 font-mono text-sm z-10'>
        [← GUITAR] [↓ DRUMS] [→ BASS] (Arrow Keys)
      </div>

      {isGameOver && (
        <div className='absolute inset-0 z-50 bg-black/90 flex items-center justify-center pointer-events-none'>
          <h1 className='text-6xl text-red-600 font-[Metal_Mania] animate-pulse'>
            BOOED OFF STAGE
          </h1>
        </div>
      )}
    </div>
  )
}
