import { useTranslation } from 'react-i18next'
import { useGameActions } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { CreditsView } from './credits/CreditsView'

const CREDIT_KEYS = [
  {
    roleKey: 'ui:credits.role.code',
    roleDefault: 'VOCAL CODE VOMIT',
    nameKey: 'ui:credits.name.code',
    nameDefault: 'Jules "Agent of Segfaults" Agent'
  },
  {
    roleKey: 'ui:credits.role.audio',
    roleDefault: 'AUDIO ENGINE ERADICATION',
    nameKey: 'ui:credits.name.audio',
    nameDefault: 'Tone.js // Blastbeat Buffer Overflow'
  },
  {
    roleKey: 'ui:credits.role.rendering',
    roleDefault: 'RENDERING RAZORSTORM',
    nameKey: 'ui:credits.name.rendering',
    nameDefault: 'Pixi.js // Retina Shredder Edition'
  },
  {
    roleKey: 'ui:credits.role.animation',
    roleDefault: 'SPASM ANIMATION RITUALS',
    nameKey: 'ui:credits.name.animation',
    nameDefault: 'Framer Motion // Framegrind Frenzy'
  },
  {
    roleKey: 'ui:credits.role.assets',
    roleDefault: 'TEXTURE FLESHMELT',
    nameKey: 'ui:credits.name.assets',
    nameDefault: 'Mutated Generated AI Assets from the Void'
  },
  {
    roleKey: 'ui:credits.role.thanks',
    roleDefault: 'SPECIAL THANKS IN CAPS OF GORE',
    nameKey: 'ui:credits.name.thanks',
    nameDefault: 'THE USERS // CLICK TILL SYSTEM DECAYS'
  }
] as const

/**
 * Builds localized credits data and returns to the main menu on exit.
 */
export const Credits = () => {
  const { t } = useTranslation(['ui'])
  const { changeScene } = useGameActions()

  const credits = CREDIT_KEYS.map(entry => ({
    role: t(entry.roleKey, { defaultValue: entry.roleDefault }),
    name: t(entry.nameKey, { defaultValue: entry.nameDefault })
  }))

  return (
    <CreditsView
      credits={credits}
      onReturn={() => changeScene(GAME_PHASES.MENU)}
      returnText={t('ui:creditsScreen.return', { defaultValue: 'RETURN' })}
    />
  )
}
