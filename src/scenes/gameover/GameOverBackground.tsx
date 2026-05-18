import React from 'react'

const SCANLINES_STYLE = {
  backgroundImage:
    'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--color-blood-red) 2px, var(--color-blood-red) 4px)'
} as const

export const GameOverBackground = React.memo(() => {
  return (
    <>
      {/* Vignette overlay */}
      <div
        className='absolute inset-0 pointer-events-none'
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, var(--color-void-black) 100%)'
        }}
      />

      {/* Red scanlines */}
      <div
        className='absolute inset-0 pointer-events-none opacity-10'
        style={SCANLINES_STYLE}
      />

      {/* Slow descending red scan bar */}
      <div
        aria-hidden='true'
        className='absolute inset-x-0 top-0 h-32 pointer-events-none animate-scan-bar'
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgb(var(--color-blood-red-rgb) / 0.18) 50%, transparent)'
        }}
      />
    </>
  )
})

GameOverBackground.displayName = 'GameOverBackground'
