import { useMemo } from 'react'
import { useTourbusLogic } from '../hooks/minigames/useTourbusLogic'
import { useArrivalLogic } from '../hooks/useArrivalLogic'
import { createTourbusStageController } from '../components/stage/TourbusStageController'
import { MinigameSceneFrame } from '../components/MinigameSceneFrame'

export const TourbusScene = () => {
  const { uiState, gameStateRef, stats, update, actions } = useTourbusLogic()
  const { handleArrivalSequence } = useArrivalLogic()

  // Controller factory for Tourbus
  const controllerFactory = useMemo(() => createTourbusStageController, [])

  // Pass logic object expected by PixiStage
  const logic = useMemo(
    () => ({
      gameStateRef,
      stats,
      update
    }),
    [gameStateRef, stats, update]
  )

  return (
    <MinigameSceneFrame
      controllerFactory={controllerFactory}
      logic={logic}
      uiState={uiState}
      onComplete={handleArrivalSequence}
      completionTitle='DESTINATION REACHED'
      renderCompletionStats={state =>
        `Van Condition: ${Math.max(0, 100 - state.damage)}%`
      }
    >
      {/* UI Overlay */}
      <div className='absolute top-4 left-4 z-30 text-(--star-white) font-mono pointer-events-none'>
        <h2 className='text-2xl text-(--toxic-green)'>TOURBUS TERROR</h2>
        <div className='mt-2'>
          <p>DISTANCE: {uiState.distance}m</p>
          <p>DAMAGE: {uiState.damage}%</p>
        </div>
      </div>

      {/* Controls Overlay (Touch/Mobile) */}
      <div className='absolute inset-0 z-40 flex justify-between pointer-events-auto'>
        <button
          type='button'
          aria-label='Move Left'
          className='w-1/2 h-full active:bg-(--star-white)/5 transition-colors focus:outline-none'
          onClick={actions.moveLeft}
        />
        <button
          type='button'
          aria-label='Move Right'
          className='w-1/2 h-full active:bg-(--star-white)/5 transition-colors focus:outline-none'
          onClick={actions.moveRight}
        />
      </div>
    </MinigameSceneFrame>
  )
}
