
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRoadieLogic } from '../hooks/minigames/useRoadieLogic'
import { createRoadieStageController } from '../components/stage/RoadieStageController'
import { PixiStage } from '../components/PixiStage'
import { useGameState } from '../context/GameState'

export const RoadieRunScene = () => {
  const { uiState, gameStateRef, stats, update, actions } = useRoadieLogic()
  const { changeScene } = useGameState()

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
