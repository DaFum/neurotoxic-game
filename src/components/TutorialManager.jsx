// TODO: Review this file
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'

const TUTORIAL_STEPS = [0, 1, 2, 3]
const TOTAL_STEPS = TUTORIAL_STEPS.length

const getStepColorClass = (stepId, currentStep) => {
  if (stepId === currentStep) return 'bg-toxic-green'
  if (stepId < currentStep) return 'bg-toxic-green/40'
  return 'bg-ash-gray/30'
}

export const TutorialManager = () => {
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          role='dialog'
          aria-label={t('ui:tutorial.ariaLabel', { defaultValue: 'Tutorial' })}
          aria-modal='true'
          className='fixed bottom-20 left-1/2 transform -translate-x-1/2 z-(--z-tutorial) w-full max-w-md'
        >
          <div className='bg-void-black/95 border-2 border-toxic-green p-6 shadow-[0_0_20px_var(--color-toxic-green)] relative'>
            <div className='absolute -top-3 left-4 bg-void-black px-2 text-toxic-green font-bold text-xs border border-toxic-green'>
              {t('ui:tutorial.header', {
                current: step + 1,
                total: TOTAL_STEPS,
                defaultValue: `TUTORIAL ${step + 1}/${TOTAL_STEPS}`
              })}
            </div>

            <h3 className='text-xl text-star-white font-[Metal_Mania] mb-2'>
              {content.title}
            </h3>
            <p className='text-ash-gray font-mono text-sm mb-4 leading-relaxed'>
              {content.text}
            </p>

            {/* Progress dots */}
            <div className='flex items-center gap-1.5 mb-4'>
              {TUTORIAL_STEPS.map(stepId => (
                <div
                  key={stepId}
                  className={`w-2 h-2 transition-colors ${getStepColorClass(stepId, step)}`}
                />
              ))}
            </div>

            <div className='flex justify-between items-center'>
              <button
                type='button'
                onClick={skipTutorial}
                className='text-xs text-ash-gray hover:text-star-white underline'
              >
                {t('ui:tutorial.skipAll', { defaultValue: 'SKIP ALL' })}
              </button>
              <button
                type='button'
                onClick={completeStep}
                className='bg-toxic-green text-void-black px-6 py-1.5 font-bold hover:bg-star-white transition-colors'
              >
                {step < TOTAL_STEPS - 1
                  ? t('ui:tutorial.next', { defaultValue: 'NEXT' })
                  : t('ui:tutorial.done', { defaultValue: 'DONE' })}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
