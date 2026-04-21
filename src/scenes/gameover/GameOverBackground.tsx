/*
 * (#1) Actual Updates: Extracted static background elements from GameOver.tsx to a standalone file.
 * (#2) Next Steps: Continue extracting other sub-components from GameOver.tsx.

 */
import React from 'react'

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
      <div className='absolute inset-0 pointer-events-none opacity-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,var(--color-blood-red)_2px,var(--color-blood-red)_4px)]' />
    </>
  )
})

GameOverBackground.displayName = 'GameOverBackground'
