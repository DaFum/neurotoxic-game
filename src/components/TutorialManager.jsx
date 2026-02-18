import { useState, useEffect } from 'react'
import { useGameState } from '../context/GameState'
import { motion, AnimatePresence } from 'framer-motion'

const TOTAL_STEPS = 4

export const TutorialManager = () => {
  const { player, updatePlayer, currentScene, settings, updateSettings } =
    useGameState()
  const [step, setStep] = useState(player.tutorialStep || 0)

  useEffect(() => {
    // Sync local step with global player state if changed elsewhere (e.g. load game)
    if (player.tutorialStep !== undefined && player.tutorialStep !== step) {
      setStep(player.tutorialStep)
    }
    // step is used for comparison, but we only want to update if player.tutorialStep mismatches.
    // Adding step to dependency array is safe here.
  }, [player.tutorialStep, step])

  const completeStep = () => {
    const nextStep = step + 1
    setStep(nextStep)
    updatePlayer({ tutorialStep: nextStep })

    // If we passed the last tutorial step (currently 3), mark as seen globally
    if (nextStep > 3) {
      updateSettings({ tutorialSeen: true })
    }
  }

  const skipTutorial = () => {
    setStep(-1)
    updatePlayer({ tutorialStep: -1 })
    updateSettings({ tutorialSeen: true })
  }

  // Tutorial Content Logic
  const getContent = () => {
    if (
      step === 0 &&
      (currentScene === 'MENU' || currentScene === 'OVERWORLD')
    ) {
      return {
        title: 'WELCOME TO THE GRIND',
        text: "You are the manager of NEUROTOXIC. Your goal: survive the tour, earn fame, and don't go broke.",
        target: null // Centered
      }
    }
    if (step === 1 && currentScene === 'OVERWORLD') {
      return {
        title: 'THE MAP',
        text: 'Travel between cities to play Gigs. Traveling costs Fuel and Time. Watch your supplies.',
        target: 'map-container'
      }
    }
    if (step === 2 && currentScene === 'OVERWORLD') {
      return {
        title: 'STATS',
        text: 'Keep an eye on Health (Mood) and Money. If Money hits 0, game over. If Mood hits 0, the band breaks up.',
        target: 'hud-stats'
      }
    }
    if (step === 3 && currentScene === 'GIG') {
      return {
        title: 'PERFORM',
        text: 'Hit the notes when they reach the bottom. Arrow Keys or Click the lanes. High Combo = More Fame.',
        target: 'game-canvas'
      }
    }
    return null
  }

  const content = getContent()

  if (settings?.tutorialSeen || !content || step === -1) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        role='dialog'
        aria-label='Tutorial'
        className='fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[150] w-full max-w-md'
      >
        <div className='bg-(--void-black)/95 border-2 border-(--toxic-green) p-6 shadow-[0_0_20px_var(--toxic-green)] relative'>
          <div className='absolute -top-3 left-4 bg-(--void-black) px-2 text-(--toxic-green) font-bold text-xs border border-(--toxic-green)'>
            TUTORIAL {step + 1}/{TOTAL_STEPS}
          </div>

          <h3 className='text-xl text-(--star-white) font-[Metal_Mania] mb-2'>
            {content.title}
          </h3>
          <p className='text-(--ash-gray) font-mono text-sm mb-4 leading-relaxed'>
            {content.text}
          </p>

          {/* Progress dots */}
          <div className='flex items-center gap-1.5 mb-4'>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 transition-colors ${
                  i === step
                    ? 'bg-(--toxic-green)'
                    : i < step
                      ? 'bg-(--toxic-green)/40'
                      : 'bg-(--ash-gray)/30'
                }`}
              />
            ))}
          </div>

          <div className='flex justify-between items-center'>
            <button
              onClick={skipTutorial}
              className='text-xs text-(--ash-gray) hover:text-(--star-white) underline'
            >
              SKIP ALL
            </button>
            <button
              onClick={completeStep}
              className='bg-(--toxic-green) text-(--void-black) px-6 py-1.5 font-bold hover:bg-(--star-white) transition-colors'
            >
              {step < TOTAL_STEPS - 1 ? 'NEXT' : 'DONE'}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
