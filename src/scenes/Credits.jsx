import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { GlitchButton } from '../ui/GlitchButton'

/**
 * Scene displaying game credits.
 */
export const Credits = () => {
  const { changeScene, settings } = useGameState()

  const credits = [
    { role: 'VOCAL CODE VOMIT', name: 'Jules "Agent of Segfaults" Agent' },
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
    <div className='flex flex-col items-center h-full w-full bg-(--void-black) z-50 text-center overflow-hidden relative'>
      {(settings?.crtEnabled ?? false) && (
        <div className='crt-overlay pointer-events-none fixed inset-0 z-50 mix-blend-overlay opacity-50' />
      )}

      {/* Gradient fade at top and bottom */}
      <div className='absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-(--void-black) to-transparent z-10 pointer-events-none' />
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-(--void-black) to-transparent z-10 pointer-events-none' />

      {/* Scrolling credits */}
      <div className='flex-1 flex items-center justify-center w-full overflow-hidden'>
        <div className='animate-credits-scroll space-y-12 py-16'>
          <div className='mb-16'>
            <h1 className='text-6xl text-(--toxic-green) font-[Metal_Mania] animate-neon-flicker'>
              CREDITS
            </h1>
            <div className='w-48 h-[1px] bg-gradient-to-r from-transparent via-(--toxic-green) to-transparent mx-auto mt-4' />
          </div>

          {credits.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.3 }}
              className='flex flex-col gap-2'
            >
              <span className='text-(--ash-gray)/60 text-[10px] font-mono tracking-[0.4em] uppercase'>
                {c.role}
              </span>
              <span className='text-(--star-white) text-2xl font-bold font-[Metal_Mania] tracking-wide'>
                {c.name}
              </span>
              <div className='w-16 h-[1px] bg-(--ash-gray)/20 mx-auto mt-2' />
            </motion.div>
          ))}

          <div className='pt-16'>
            <div className='text-(--toxic-green)/40 text-xs font-mono tracking-widest'>
              NEUROTOXIC: GRIND THE VOID v3.0
            </div>
            <div className='text-(--ash-gray)/30 text-[10px] font-mono mt-2'>
              DEATH GRINDCORE FROM STENDAL // 2026
            </div>
          </div>
        </div>
      </div>

      <div className='absolute bottom-8 z-20'>
        <GlitchButton onClick={() => changeScene('MENU')}>RETURN</GlitchButton>
      </div>
    </div>
  )
}
