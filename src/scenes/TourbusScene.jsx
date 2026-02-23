
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTourbusLogic } from '../hooks/minigames/useTourbusLogic'
import { useArrivalLogic } from '../hooks/useArrivalLogic'
import { createTourbusStageController } from '../components/stage/TourbusStageController'
import { PixiStage } from '../components/PixiStage'
import { useGameState } from '../context/GameState'
import { IMG_PROMPTS, getGenImageUrl } from '../utils/imageGen'

export const TourbusScene = () => {
  const { uiState, gameStateRef, stats, update, actions } = useTourbusLogic()
  const { handleArrivalSequence } = useArrivalLogic()
  const { band } = useGameState()

  // Character Images based on Harmony
  let matzeImg = IMG_PROMPTS.MATZE_PLAYING
  let larsImg = IMG_PROMPTS.LARS_PLAYING
  let mariusImg = IMG_PROMPTS.MARIUS_PLAYING

  if (band.harmony < 30) {
    matzeImg = IMG_PROMPTS.MATZE_ANGRY
    larsImg = IMG_PROMPTS.LARS_DRINKING
    mariusImg = IMG_PROMPTS.MARIUS_IDLE
  } else if (band.harmony < 60) {
    matzeImg = IMG_PROMPTS.MATZE_ANGRY
    larsImg = IMG_PROMPTS.LARS_PLAYING
    mariusImg = IMG_PROMPTS.MARIUS_SCREAMING
  }

  // Controller factory for Tourbus
  const controllerFactory = useMemo(() => createTourbusStageController, [])

  // Pass logic object expected by PixiStage
  const logic = useMemo(() => ({
    gameStateRef,
    stats,
    update
  }), [gameStateRef, stats, update])

  return (
    <div className="w-full h-full bg-(--void-black) relative overflow-hidden">
      {/* Pixi Stage */}
      <PixiStage logic={logic} controllerFactory={controllerFactory} />

      {/* Band Members Overlay */}
      <div className='absolute inset-0 z-30 pointer-events-none'>
        {/* Matze (Guitar) - Left */}
        <div
          id='band-member-0'
          className='absolute left-[15%] top-[30%] w-32 h-48 transition-transform duration-100'
        >
          <img
            src={getGenImageUrl(matzeImg)}
            alt='Matze'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--blood-red)]'
          />
        </div>
        {/* Lars (Drums) - Center Back */}
        <div
          id='band-member-1'
          className='absolute left-[50%] top-[20%] -translate-x-1/2 w-40 h-40 transition-transform duration-100'
        >
          <img
            src={getGenImageUrl(larsImg)}
            alt='Lars'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--toxic-green-glow)]'
          />
        </div>
        {/* Marius (Bass) - Right */}
        <div
          id='band-member-2'
          className='absolute right-[15%] top-[30%] w-32 h-48 transition-transform duration-100'
        >
          <img
            src={getGenImageUrl(mariusImg)}
            alt='Marius'
            className='w-full h-full object-contain filter drop-shadow-[0_0_10px_var(--toxic-green)]'
          />
        </div>
      </div>

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-30 text-(--star-white) font-mono pointer-events-none">
        <h2 className="text-2xl text-(--toxic-green)">TOURBUS TERROR</h2>
        <div className="mt-2">
          <p>DISTANCE: {uiState.distance}m</p>
          <p>DAMAGE: {uiState.damage}%</p>
        </div>
      </div>

      {/* Controls Overlay (Touch/Mobile) */}
      <div className="absolute inset-0 z-40 flex justify-between pointer-events-auto">
        <div
          className="w-1/2 h-full active:bg-(--star-white)/5 transition-colors"
          onClick={actions.moveLeft}
        />
        <div
          className="w-1/2 h-full active:bg-(--star-white)/5 transition-colors"
          onClick={actions.moveRight}
        />
      </div>

      {/* Game Over Screen */}
      {uiState.isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-(--void-black)/80 backdrop-blur-sm"
        >
          <h1 className="text-4xl text-(--toxic-green) font-bold mb-4">DESTINATION REACHED</h1>
          <p className="text-(--star-white) mb-8">Van Condition: {Math.max(0, 100 - uiState.damage)}%</p>
          <button
            onClick={handleArrivalSequence}
            className="px-8 py-4 bg-(--toxic-green) text-(--void-black) font-bold uppercase hover:scale-105 transition-transform"
          >
            CONTINUE
          </button>
        </motion.div>
      )}
    </div>
  )
}
