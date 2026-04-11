import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAmpLogic } from '../hooks/minigames/useAmpLogic'
import { createAmpStageController } from '../components/stage/AmpStageController'
import { MinigameSceneFrame } from '../components/MinigameSceneFrame'
import { AmpHUD } from '../components/minigames/amp/AmpHUD'
import { AmpControls } from '../components/minigames/amp/AmpControls'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'

export const AmpCalibrationScene = () => {
  const { t } = useTranslation(['ui'])
  const {
    dialValue,
    setDialValue,
    targetValue,
    timeLeft,
    score,
    update,
    handleComplete
  } = useAmpLogic()

  const { changeScene } = useGameState()

  const controllerFactory = useMemo(() => createAmpStageController, [])

  const logic = useMemo(
    () => ({
      update
    }),
    [update]
  )

  const onComplete = useCallback(
    () => changeScene(GAME_PHASES.GIG),
    [changeScene]
  )

  const renderCompletionStats = useCallback(
    state =>
      t('ui:ampCalibration.completion.stability', {
        defaultValue: `Stability Achieved: ${Math.floor(score)}%`
      }),
    [t, score]
  )

  return (
    <MinigameSceneFrame
      controllerFactory={controllerFactory}
      logic={logic}
      uiState={{ timeLeft, score }}
      onComplete={onComplete}
      completionTitle={t('ui:ampCalibration.completion.title', { defaultValue: 'AMP CALIBRATED' })}
      completionButtonText={t('ui:ampCalibration.completion.button', { defaultValue: 'START GIG' })}
      renderCompletionStats={renderCompletionStats}
    >
      <AmpHUD timeLeft={timeLeft} score={score} />
      <AmpControls
        dialValue={dialValue}
        setDialValue={setDialValue}
        targetValue={targetValue}
      />
    </MinigameSceneFrame>
  )
}

// Ensure default export is not needed if lazyLoader uses Named exports (which it does via createNamedLazyLoader)
