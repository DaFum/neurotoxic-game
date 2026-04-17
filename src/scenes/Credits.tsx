import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { GlitchButton } from '../ui/GlitchButton'
import { CreditEntry } from './credits/CreditEntry'
import { CreditFooter } from './credits/CreditFooter'
import { CreditHeader } from './credits/CreditHeader'

/**
 * Scene displaying game credits.
 */
export const Credits = () => {
  const { t } = useTranslation()
  const { changeScene } = useGameState()

  const handleReturn = useCallback(
    () => changeScene(GAME_PHASES.MENU),
    [changeScene]
  )

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
    <div className='flex flex-col items-center h-full w-full bg-void-black z-50 text-center overflow-hidden relative'>
      {/* Gradient fade at top and bottom */}
      <div className='absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-void-black to-transparent z-10 pointer-events-none' />
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void-black to-transparent z-10 pointer-events-none' />

      {/* Scrolling credits */}
      <div className='flex-1 flex items-center justify-center w-full overflow-hidden'>
        <div className='animate-credits-scroll space-y-12 py-16'>
          <CreditHeader />

          {credits.map((c, i) => (
            <CreditEntry
              key={c.role}
              role={c.role}
              name={c.name}
              delay={0.3 + i * 0.3}
            />
          ))}

          <CreditFooter />
        </div>
      </div>

      <div className='absolute bottom-8 z-20'>
        <GlitchButton onClick={handleReturn}>
          {t('ui:creditsScreen.return', { defaultValue: 'RETURN' })}
        </GlitchButton>
      </div>
    </div>
  )
}

export default Credits
