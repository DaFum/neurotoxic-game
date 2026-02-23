
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRoadieLogic } from '../hooks/minigames/useRoadieLogic'
import { createRoadieStageController } from '../components/stage/RoadieStageController'
import { PixiStage } from '../components/PixiStage'
import { useGameState } from '../context/GameState'
import { IMG_PROMPTS, getGenImageUrl } from '../utils/imageGen'

export const RoadieRunScene = () => {
  const { uiState, gameStateRef, stats, update, actions } = useRoadieLogic()
  const { changeScene, band } = useGameState()

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

  const controllerFactory = useMemo(() => createRoadieStageController, [])

  const logic = useMemo(() => ({
    gameStateRef,
    stats,
    update
  }), [gameStateRef, stats, update])

  return (
    <div className="w-full h-full bg-(--void-black) relative overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
         <PixiStage logic={logic} controllerFactory={controllerFactory} />
      </div>

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

      {/* HUD */}
      <div className="absolute top-4 left-4 z-30 text-(--star-white) font-mono pointer-events-none bg-(--void-black)/50 p-2 border border-(--star-white)/20">
        <h2 className="text-xl text-(--toxic-green)">ROADIE RUN</h2>
        <div>ITEMS REMAINING: {uiState.itemsRemaining}</div>
        <div>DELIVERED: {uiState.itemsDelivered}</div>
        <div>DAMAGE: {uiState.currentDamage}%</div>
        {uiState.carrying && <div className="text-(--warning-yellow)">CARRYING: {uiState.carrying.type}</div>}
      </div>

      {/* Controls Hint */}
      <div className="absolute bottom-4 left-8 text-(--star-white)/50 text-sm font-mono pointer-events-none hidden md:block">
        WASD / ARROWS to Move
      </div>

      {/* Mobile D-Pad */}
      <div className="absolute bottom-8 right-8 z-40 grid grid-cols-3 gap-2 pointer-events-auto md:hidden">
        <div />
        <button className="w-14 h-14 bg-(--star-white)/10 active:bg-(--toxic-green)/50 border border-(--star-white)/30 rounded flex items-center justify-center text-(--star-white)" onClick={() => actions.move(0, -1)}>▲</button>
        <div />
        <button className="w-14 h-14 bg-(--star-white)/10 active:bg-(--toxic-green)/50 border border-(--star-white)/30 rounded flex items-center justify-center text-(--star-white)" onClick={() => actions.move(-1, 0)}>◄</button>
        <button className="w-14 h-14 bg-(--star-white)/10 active:bg-(--toxic-green)/50 border border-(--star-white)/30 rounded flex items-center justify-center text-(--star-white)" onClick={() => actions.move(0, 1)}>▼</button>
        <button className="w-14 h-14 bg-(--star-white)/10 active:bg-(--toxic-green)/50 border border-(--star-white)/30 rounded flex items-center justify-center text-(--star-white)" onClick={() => actions.move(1, 0)}>►</button>
      </div>

      {/* Game Over / Success Overlay */}
      {uiState.isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-(--void-black)/80 backdrop-blur-sm"
        >
          <h1 className="text-4xl text-(--toxic-green) font-bold mb-4">SETUP COMPLETE</h1>
          <p className="text-(--star-white) mb-8">Equipment Damage: {uiState.currentDamage}%</p>
          <button
            onClick={() => changeScene('GIG')} // Proceed to Gig
            className="px-8 py-4 bg-(--toxic-green) text-(--void-black) font-bold uppercase hover:scale-105 transition-transform"
          >
            START SHOW
          </button>
        </motion.div>
      )}
    </div>
  )
}
