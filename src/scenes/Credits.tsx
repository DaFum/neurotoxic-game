import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { CreditsView } from './credits/CreditsView'

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

  const credits = useMemo(() => [
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
  ], [t])

  return (
    <CreditsView
      credits={credits}
      onReturn={handleReturn}
      returnText={t('ui:creditsScreen.return', { defaultValue: 'RETURN' })}
    />
  )
}
