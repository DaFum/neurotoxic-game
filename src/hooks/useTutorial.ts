import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { GamePhase } from '../types'

/** Tutorial step ids in progression order. */
export const TUTORIAL_STEPS = [0, 1, 2, 3]
/** Total number of tutorial steps. */
export const TOTAL_STEPS = TUTORIAL_STEPS.length

interface TutorialConfig {
  validScenes: GamePhase[]
  titleKey: string
  defaultTitle: string
  textKey: string
  defaultText: string
  target: string | null
}

const TUTORIAL_CONFIGS: TutorialConfig[] = [
  {
    validScenes: [GAME_PHASES.MENU, GAME_PHASES.OVERWORLD],
    titleKey: 'ui:tutorial.welcome.title',
    defaultTitle: 'WELCOME TO THE GRIND',
    textKey: 'ui:tutorial.welcome.text',
    defaultText:
      "You are the manager of NEUROTOXIC. Your goal: survive the tour, earn fame, and don't go broke.",
    target: null
  },
  {
    validScenes: [GAME_PHASES.OVERWORLD],
    titleKey: 'ui:tutorial.map.title',
    defaultTitle: 'THE MAP',
    textKey: 'ui:tutorial.map.text',
    defaultText:
      'Travel between cities to play Gigs. Traveling costs Fuel and Time. Watch your supplies.',
    target: 'map-container'
  },
  {
    validScenes: [GAME_PHASES.OVERWORLD],
    titleKey: 'ui:tutorial.stats.title',
    defaultTitle: 'STATS',
    textKey: 'ui:tutorial.stats.text',
    defaultText:
      'Keep an eye on Health (Mood) and Money. If Money hits 0, game over. If Mood hits 0, the band breaks up.',
    target: 'hud-stats'
  },
  {
    validScenes: [GAME_PHASES.GIG, GAME_PHASES.PRACTICE],
    titleKey: 'ui:tutorial.perform.title',
    defaultTitle: 'PERFORM',
    textKey: 'ui:tutorial.perform.text',
    defaultText:
      'Hit the notes when they reach the bottom. Arrow Keys or Click the lanes. High Combo = More Fame.',
    target: 'game-canvas'
  }
]

/**
 * Derives tutorial overlay content and completion controls from game state.
 *
 * @returns Current tutorial step, visible content, visibility flag, and completion controls.
 */
export const useTutorial = () => {
  const { t } = useTranslation()
  const player = useGameSelector(state => state.player)
  const currentScene = useGameSelector(state => state.currentScene)
  const settings = useGameSelector(state => state.settings)
  const { updatePlayer, updateSettings } = useGameActions()
  const step = player.tutorialStep ?? 0

  const completeStep = useCallback(() => {
    const nextStep = step + 1
    updatePlayer({ tutorialStep: nextStep })

    // If we passed the last tutorial step (currently 3), mark as seen globally
    if (nextStep >= TOTAL_STEPS) {
      updateSettings({ tutorialSeen: true })
    }
  }, [step, updatePlayer, updateSettings])

  const skipTutorial = useCallback(() => {
    updatePlayer({ tutorialStep: -1 })
    updateSettings({ tutorialSeen: true })
  }, [updatePlayer, updateSettings])

  // Tutorial Content Logic
  const content = useMemo(() => {
    const config = TUTORIAL_CONFIGS[step]
    if (config && config.validScenes.includes(currentScene)) {
      return {
        title: t(config.titleKey, { defaultValue: config.defaultTitle }),
        text: t(config.textKey, { defaultValue: config.defaultText }),
        target: config.target
      }
    }
    return null
  }, [step, currentScene, t])

  const isVisible = !(settings?.tutorialSeen || !content || step === -1)

  return {
    step,
    content,
    isVisible,
    completeStep,
    skipTutorial,
    TOTAL_STEPS,
    TUTORIAL_STEPS,
    t
  }
}
