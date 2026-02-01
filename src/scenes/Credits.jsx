import React from 'react'
import { useGameState } from '../context/GameState'
import { GlitchButton } from '../ui/GlitchButton'

/**
 * Scene displaying game credits.
 */
export const Credits = () => {
  const { changeScene } = useGameState()

  const credits = [
    { role: 'LEAD DEVELOPER', name: 'Jules Agent' },
    { role: 'AUDIO ENGINE', name: 'Howler.js' },
    { role: 'RENDERING', name: 'Pixi.js' },
    { role: 'ANIMATION', name: 'Framer Motion' },
    { role: 'TEXTURES', name: 'Generated AI Assets' },
    { role: 'SPECIAL THANKS', name: 'The Users' }
  ]

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-black z-50 text-center overflow-hidden'>
      <h1 className='text-5xl text-[var(--toxic-green)] font-[Metal_Mania] mb-12 animate-pulse'>
        CREDITS
      </h1>

      <div className='space-y-8 animate-slide-up'>
        {credits.map((c, i) => (
          <div key={i} className='flex flex-col gap-1'>
            <span className='text-gray-500 text-sm font-mono tracking-widest'>
              {c.role}
            </span>
            <span className='text-white text-2xl font-bold'>{c.name}</span>
          </div>
        ))}
      </div>

      <div className='mt-16'>
        <GlitchButton onClick={() => changeScene('MENU')}>RETURN</GlitchButton>
      </div>
    </div>
  )
}
