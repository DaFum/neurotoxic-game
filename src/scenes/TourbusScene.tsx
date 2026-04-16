// @ts-nocheck
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTourbusLogic } from '../hooks/minigames/useTourbusLogic'
import { useArrivalLogic } from '../hooks/useArrivalLogic'
import { createTourbusStageController } from '../components/stage/TourbusStageController'
import { MinigameSceneFrame } from '../components/MinigameSceneFrame'
import { TourbusHUD } from '../components/minigames/tourbus/TourbusHUD'
import { TourbusControls } from '../components/minigames/tourbus/TourbusControls'

export const TourbusScene = () => {
  const { t } = useTranslation('minigame')
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
      completionTitle={t('minigame:tourbus.destination_reached', {
        defaultValue: 'DESTINATION REACHED'
      })}
      renderCompletionStats={state =>
        `${t('minigame:tourbus.van_condition', { defaultValue: 'Van Condition:' })} ${Math.max(0, 100 - state.damage)}%`
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

export default TourbusScene
