import { useMemo } from 'react'
import { useRoadieLogic } from '../hooks/minigames/useRoadieLogic'
import { createRoadieStageController } from '../components/stage/RoadieStageController'
import { MinigameSceneFrame } from '../components/MinigameSceneFrame'
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
    <MinigameSceneFrame
      controllerFactory={controllerFactory}
      logic={logic}
      uiState={uiState}
      onComplete={() => changeScene('GIG')}
      completionTitle="SETUP COMPLETE"
      completionButtonText="START SHOW"
      renderCompletionStats={(state) => `Equipment Damage: ${state.currentDamage}%`}
    >
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
    </MinigameSceneFrame>
  )
}
