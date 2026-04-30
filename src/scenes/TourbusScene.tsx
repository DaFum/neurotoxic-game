import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTourbusLogic } from '../hooks/minigames/useTourbusLogic'
import { useArrivalLogic } from '../hooks/useArrivalLogic'
import { createTourbusStageController } from '../components/stage/TourbusStageController'
import { MinigameSceneFrame } from '../components/MinigameSceneFrame'
import { TourbusHUD } from '../components/minigames/tourbus/TourbusHUD'
import { TourbusControls } from '../components/minigames/tourbus/TourbusControls'
import { calculateTravelMinigameResult } from '../utils/economyEngine'

export const TourbusScene = () => {
  const { t } = useTranslation('minigame')
  const { uiState, gameStateRef, stats, update, actions, finishMinigame } =
    useTourbusLogic()
  const { handleArrivalSequence } = useArrivalLogic()

  // Controller factory for Tourbus
  const controllerFactory = useMemo(() => createTourbusStageController, [])

  // Pass logic object expected by PixiStage
  const logic = useMemo(
    () => ({
      gameStateRef,
      stats,
      update,
      finishMinigame
    }),
    [gameStateRef, stats, update, finishMinigame]
  )

  return (
    <MinigameSceneFrame
      controllerFactory={controllerFactory}
      logic={logic}
      uiState={uiState}
      onComplete={handleArrivalSequence}
      completionTitle={t('minigame:tourbus.destination_reached', {
        defaultValue: 'DESTINATION REACHED'
      })}
      renderCompletionStats={state => {
        const { conditionLoss } = calculateTravelMinigameResult(
          state.damage,
          []
        )
        return `${t('minigame:tourbus.condition_loss', { defaultValue: 'Condition Loss:' })} ${conditionLoss}%`
      }}
    >
      {/* UI Overlay */}
      <TourbusHUD distance={uiState.distance} damage={uiState.damage} />

      {/* Controls Overlay (Touch/Mobile) */}
      <TourbusControls
        onMoveLeft={actions.moveLeft}
        onMoveRight={actions.moveRight}
      />
    </MinigameSceneFrame>
  )
}

export default TourbusScene
