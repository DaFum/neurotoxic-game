import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useTourbusLogic } from '../hooks/minigames/useTourbusLogic'
import { useArrivalLogic } from '../hooks/useArrivalLogic'
import { createTourbusStageController } from '../components/stage/TourbusStageController'
import { MinigameSceneFrame } from '../components/MinigameSceneFrame'
import { TourbusHUD } from '../components/minigames/tourbus/TourbusHUD'
import { TourbusControls } from '../components/minigames/tourbus/TourbusControls'
import { useGameSelector } from '../context/GameState'
import { finiteNumberOr } from '../utils/finiteNumber'

/**
 * Hosts the tourbus travel minigame and hands completion to the arrival sequence.
 */
export const TourbusScene = () => {
  const { t } = useTranslation('minigame')
  const vanCondition = useGameSelector(state => state.player.van.condition)
  const startingConditionRef = useRef(finiteNumberOr(vanCondition, 0))
  const conditionLoss = Math.max(
    0,
    startingConditionRef.current - finiteNumberOr(vanCondition, 0)
  )
  const { uiState, gameStateRef, stats, update, actions, finishMinigame } =
    useTourbusLogic()
  const { handleArrivalSequence } = useArrivalLogic()

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
      controllerFactory={createTourbusStageController}
      logic={logic}
      uiState={uiState}
      onComplete={handleArrivalSequence}
      completionTitle={t('minigame:tourbus.destination_reached', {
        defaultValue: 'DESTINATION REACHED'
      })}
      completionButtonText={t('ui:continue', { defaultValue: 'CONTINUE' })}
      renderCompletionStats={() =>
        t('minigame:tourbus.condition_loss', {
          loss: conditionLoss,
          defaultValue: 'Condition Loss: {{loss}}%'
        })
      }
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
