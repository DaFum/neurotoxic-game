import React, { useState, useEffect } from 'react'
import { useGameState } from '../context/GameState'
import { motion, AnimatePresence } from 'framer-motion'

export const TutorialManager = () => {
  const { player, updatePlayer, currentScene } = useGameState()
  const [step, setStep] = useState(player.tutorialStep || 0)

  useEffect(() => {
    // Sync local step with global player state if changed elsewhere (e.g. load game)
    if (player.tutorialStep !== undefined && player.tutorialStep !== step) {
      setStep(player.tutorialStep)
    }
  }, [player.tutorialStep])

  const completeStep = () => {
    const nextStep = step + 1
    setStep(nextStep)
    updatePlayer({ tutorialStep: nextStep })
  }

  const skipTutorial = () => {
    setStep(999)
    updatePlayer({ tutorialStep: 999 })
  }

  // Tutorial Content Logic
  const getContent = () => {
    if (step === 0 && (currentScene === 'MENU' || currentScene === 'OVERWORLD')) {
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

  if (!content || step >= 999) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className='fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md'
      >
        <div className='bg-black/95 border-2 border-(--toxic-green) p-6 shadow-[0_0_20px_(--toxic-green)] relative'>
          <div className='absolute -top-3 left-4 bg-black px-2 text-(--toxic-green) font-bold text-xs border border-(--toxic-green)'>
            TUTORIAL {step + 1}
          </div>

          <h3 className='text-xl text-white font-[Metal_Mania] mb-2'>{content.title}</h3>
          <p className='text-gray-300 font-mono text-sm mb-4 leading-relaxed'>
            {content.text}
          </p>

          <div className='flex justify-end gap-4'>
            <button
              onClick={skipTutorial}
              className='text-xs text-gray-500 hover:text-white underline'
            >
              SKIP ALL
            </button>
            <button
              onClick={completeStep}
              className='bg-(--toxic-green) text-black px-4 py-1 font-bold hover:bg-white'
            >
              NEXT
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
