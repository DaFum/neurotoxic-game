import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'

export const TUTORIAL_STEPS = [0, 1, 2, 3]
export const TOTAL_STEPS = TUTORIAL_STEPS.length

export const useTutorial = () => {
  const { t } = useTranslation()
  const { player, updatePlayer, currentScene, settings, updateSettings } =
    useGameState()
  const step = player.tutorialStep ?? 0

  const completeStep = () => {
    const nextStep = step + 1
    updatePlayer({ tutorialStep: nextStep })

    // If we passed the last tutorial step (currently 3), mark as seen globally
    if (nextStep >= TOTAL_STEPS) {
      updateSettings({ tutorialSeen: true })
    }
  }

  const skipTutorial = () => {
    updatePlayer({ tutorialStep: -1 })
    updateSettings({ tutorialSeen: true })
  }

  // Tutorial Content Logic
  const getContent = () => {
    if (
      step === 0 &&
      (currentScene === GAME_PHASES.MENU ||
        currentScene === GAME_PHASES.OVERWORLD)
    ) {
      return {
        title: t('ui:tutorial.welcome.title', {
          defaultValue: 'WELCOME TO THE GRIND'
        }),
        text: t('ui:tutorial.welcome.text', {
          defaultValue:
            "You are the manager of NEUROTOXIC. Your goal: survive the tour, earn fame, and don't go broke."
        }),
        target: null // Centered
      }
    }
    if (step === 1 && currentScene === GAME_PHASES.OVERWORLD) {
      return {
        title: t('ui:tutorial.map.title', { defaultValue: 'THE MAP' }),
        text: t('ui:tutorial.map.text', {
          defaultValue:
            'Travel between cities to play Gigs. Traveling costs Fuel and Time. Watch your supplies.'
        }),
        target: 'map-container'
      }
    }
    if (step === 2 && currentScene === GAME_PHASES.OVERWORLD) {
      return {
        title: t('ui:tutorial.stats.title', { defaultValue: 'STATS' }),
        text: t('ui:tutorial.stats.text', {
          defaultValue:
            'Keep an eye on Health (Mood) and Money. If Money hits 0, game over. If Mood hits 0, the band breaks up.'
        }),
        target: 'hud-stats'
      }
    }
    if (
      step === 3 &&
      (currentScene === GAME_PHASES.GIG ||
        currentScene === GAME_PHASES.PRACTICE)
    ) {
      return {
        title: t('ui:tutorial.perform.title', { defaultValue: 'PERFORM' }),
        text: t('ui:tutorial.perform.text', {
          defaultValue:
            'Hit the notes when they reach the bottom. Arrow Keys or Click the lanes. High Combo = More Fame.'
        }),
        target: 'game-canvas'
      }
    }
    return null
  }

  const content = getContent()
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
