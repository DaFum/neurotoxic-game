import React from 'react'
import { useGameState } from '../context/GameState'
import { GlitchButton } from '../ui/GlitchButton'

/**
 * Scene displaying game credits.
 */
export const Credits = () => {
  const { changeScene, settings } = useGameState()

  const credits = [
    { role: 'VOCAL CODE VOMIT', name: 'Jules “Agent of Segfaults” Agent' },
    {
      role: 'AUDIO ENGINE ERADICATION',
      name: 'Tone.js // Blastbeat Buffer Overflow'
    },
    {
      role: 'RENDERING RAZORSTORM',
      name: 'Pixi.js // Retina Shredder Edition'
    },
    {
      role: 'SPASM ANIMATION RITUALS',
      name: 'Framer Motion // Framegrind Frenzy'
    },
    {
      role: 'TEXTURE FLESHMELT',
      name: 'Mutierte Generated AI Assets aus dem Void'
    },
    {
      role: 'SPECIAL THANKS IN CAPS OF GORE',
      name: 'THE USERS // CLICK TILL SYSTEM DECAYS'
    }
  ]

  return (
    <div className='flex flex-col items-center justify-center h-full w-full bg-(--void-black) z-50 text-center overflow-hidden'>
      {(settings?.crtEnabled ?? false) && (
        <div className='crt-overlay pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-50' />
      )}

      <h1 className='text-5xl text-(--toxic-green) font-[Metal_Mania] mb-12 animate-pulse'>
        CREDITS
      </h1>

      <div className='space-y-8 animate-slide-up'>
        {credits.map((c, i) => (
          <div key={i} className='flex flex-col gap-1'>
            <span className='text-(--ash-gray) text-sm font-mono tracking-widest'>
              {c.role}
            </span>
            <span className='text-(--star-white) text-2xl font-bold'>
              {c.name}
            </span>
          </div>
        ))}
      </div>

      <div className='mt-16'>
        <GlitchButton onClick={() => changeScene('MENU')}>RETURN</GlitchButton>
      </div>
    </div>
  )
}
