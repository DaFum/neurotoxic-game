
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTourbusLogic } from '../hooks/minigames/useTourbusLogic'
import { createTourbusStageController } from '../components/stage/TourbusStageController'
import { PixiStage } from '../components/PixiStage'
import { useGameState } from '../context/GameState'
import { useArrivalLogic } from '../hooks/useArrivalLogic'

export const TourbusScene = () => {
  const { uiState, gameStateRef, stats, update, actions } = useTourbusLogic()
  // const { changeScene, gameMap, player, startGig, advanceDay, saveGame, triggerEvent, addToast, updateBand, band } = useGameState() // Removed direct usage
  const { handleArrivalSequence } = useArrivalLogic()

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
