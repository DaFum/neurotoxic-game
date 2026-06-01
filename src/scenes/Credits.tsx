import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { GlitchButton } from '../ui/GlitchButton'
import { CreditEntry } from './credits/CreditEntry'
import { CreditFooter } from './credits/CreditFooter'
import { CreditHeader } from './credits/CreditHeader'

/**
 * Scene displaying game credits.
 */
export const Credits = () => {
  const { t } = useTranslation(['ui'])
  const { changeScene } = useGameActions()

  const handleReturn = useCallback(
    () => changeScene(GAME_PHASES.MENU),
    [changeScene]
  )

  const credits = [
    {
      role: t('ui:credits.role.code', { defaultValue: 'VOCAL CODE VOMIT' }),
      name: t('ui:credits.name.code', {
        defaultValue: 'Jules "Agent of Segfaults" Agent'
      })
    },
    {
      role: t('ui:credits.role.audio', {
        defaultValue: 'AUDIO ENGINE ERADICATION'
      }),
      name: t('ui:credits.name.audio', {
        defaultValue: 'Tone.js // Blastbeat Buffer Overflow'
      })
    },
    {
      role: t('ui:credits.role.rendering', {
        defaultValue: 'RENDERING RAZORSTORM'
      }),
      name: t('ui:credits.name.rendering', {
        defaultValue: 'Pixi.js // Retina Shredder Edition'
      })
    },
    {
      role: t('ui:credits.role.animation', {
        defaultValue: 'SPASM ANIMATION RITUALS'
      }),
      name: t('ui:credits.name.animation', {
        defaultValue: 'Framer Motion // Framegrind Frenzy'
      })
    },
    {
      role: t('ui:credits.role.assets', { defaultValue: 'TEXTURE FLESHMELT' }),
      name: t('ui:credits.name.assets', {
        defaultValue: 'Mutated Generated AI Assets from the Void'
      })
    },
    {
      role: t('ui:credits.role.thanks', {
        defaultValue: 'SPECIAL THANKS IN CAPS OF GORE'
      }),
      name: t('ui:credits.name.thanks', {
        defaultValue: 'THE USERS // CLICK TILL SYSTEM DECAYS'
      })
    }
  ]

  return (
    <div className='flex flex-col items-center h-full w-full bg-void-black z-(--z-overlay) text-center overflow-hidden relative'>
      {/* Gradient fade at top and bottom */}
      <div className='absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-void-black to-transparent z-(--z-crt) pointer-events-none' />
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void-black to-transparent z-(--z-crt) pointer-events-none' />

      {/* Subtle vignette + descending scan bar for cinematic feel */}
      <div
        aria-hidden='true'
        className='absolute inset-0 pointer-events-none z-(--z-base)'
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, var(--color-void-black) 100%)'
        }}
      />
      <div
        aria-hidden='true'
        className='absolute inset-x-0 top-0 h-40 pointer-events-none animate-scan-bar z-(--z-base)'
        style={{
          background:
            'linear-gradient(to bottom, transparent, var(--color-toxic-green-10) 50%, transparent)'
        }}
      />

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

      <div className='absolute bottom-8 z-(--z-hud)'>
        <GlitchButton onClick={handleReturn}>
          {t('ui:creditsScreen.return', { defaultValue: 'RETURN' })}
        </GlitchButton>
      </div>
    </div>
  )
}
