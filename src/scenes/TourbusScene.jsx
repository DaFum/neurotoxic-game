
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTourbusLogic } from '../hooks/minigames/useTourbusLogic'
import { createTourbusStageController } from '../components/stage/TourbusStageController'
import { PixiStage } from '../components/PixiStage'
import { useGameState } from '../context/GameState'

import { useCallback } from 'react'

export const TourbusScene = () => {
  const { uiState, gameStateRef, stats, update, actions } = useTourbusLogic()
  const { changeScene, gameMap, player, startGig, advanceDay, saveGame, triggerEvent, addToast, updateBand, band } = useGameState()

  // Controller factory for Tourbus
  const controllerFactory = useMemo(() => createTourbusStageController, [])

  // Pass logic object expected by PixiStage
  const logic = useMemo(() => ({
    gameStateRef,
    stats,
    update
  }), [gameStateRef, stats, update])

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      {/* Pixi Stage */}
      <PixiStage logic={logic} controllerFactory={controllerFactory} />

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-30 text-white font-mono pointer-events-none">
        <h2 className="text-2xl text-[var(--toxic-green)]">TOURBUS TERROR</h2>
        <div className="mt-2">
          <p>DISTANCE: {uiState.distance}m</p>
          <p>DAMAGE: {uiState.damage}%</p>
        </div>
      </div>

      {/* Controls Overlay (Touch/Mobile) */}
      <div className="absolute inset-0 z-40 flex justify-between pointer-events-auto">
        <div
          className="w-1/2 h-full active:bg-white/5 transition-colors"
          onClick={actions.moveLeft}
        />
        <div
          className="w-1/2 h-full active:bg-white/5 transition-colors"
          onClick={actions.moveRight}
        />
      </div>

      {/* Game Over Screen */}
      {uiState.isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <h1 className="text-4xl text-[var(--toxic-green)] font-bold mb-4">DESTINATION REACHED</h1>
          <p className="text-white mb-8">Van Condition: {Math.max(0, 100 - uiState.damage)}%</p>
          <button
            onClick={() => {
               // Legacy Arrival Sequence

               // 1. Advance Day
               advanceDay()

               // 2. Save Game
               saveGame()

               // 3. Harmony Regen (if applicable)
               if (band?.harmonyRegenTravel) {
                   updateBand({ harmony: Math.min(100, (band.harmony ?? 0) + 5) })
               }

               // 4. Trigger Events
               let travelEventActive = triggerEvent('transport', 'travel')
               if (!travelEventActive) {
                   travelEventActive = triggerEvent('band', 'travel')
               }

               // 5. Handle Node Arrival & Routing
               const currentNode = gameMap?.nodes[player.currentNodeId]

               if (currentNode) {
                   if (currentNode.type === 'REST_STOP') {
                       // Apply rest stop effect locally or via logic?
                       // Logic is in useTravelLogic which is unmounted.
                       // Replicate logic here:
                        const newMembers = (band?.members ?? []).map(m => ({
                            ...m,
                            stamina: Math.min(100, Math.max(0, m.stamina + 20)),
                            mood: Math.min(100, Math.max(0, m.mood + 10))
                        }))
                        updateBand({ members: newMembers })
                        addToast('Rested at stop. Band feels better.', 'success')
                   } else if (currentNode.type === 'SPECIAL' && !travelEventActive) {
                        const specialEvent = triggerEvent('special')
                        if (!specialEvent) {
                            addToast('A mysterious place, but nothing happened.', 'info')
                        }
                   } else if (currentNode.type === 'START') {
                       addToast('Home Sweet Home.', 'success')
                       // Show HQ handled by Overworld on mount or explicit call?
                       // Overworld checks current node?
                   }
               }

               if (currentNode && currentNode.type === 'GIG') {
                   // Ensure harmony check
                   if ((band?.harmony ?? 0) <= 0) {
                        addToast("Band's harmony too low to perform!", 'warning')
                        changeScene('OVERWORLD')
                   } else {
                        startGig(currentNode.venue)
                   }
               } else {
                   changeScene('OVERWORLD')
               }
            }}
            className="px-8 py-4 bg-[var(--toxic-green)] text-black font-bold uppercase hover:scale-105 transition-transform"
          >
            CONTINUE
          </button>
        </motion.div>
      )}
    </div>
  )
}
