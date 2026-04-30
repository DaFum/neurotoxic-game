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
    isGameOver,
    update,
    gameStateRef
  } = useAmpLogic()

  const { changeScene } = useGameState()

  const controllerFactory = useMemo(() => createAmpStageController, [])

  const logic = useMemo(
    () => ({
      update,
      gameStateRef
    }),
    [update, gameStateRef]
  )

  const onComplete = useCallback(() => {
    changeScene(GAME_PHASES.GIG)
  }, [changeScene])

  const renderCompletionStats = useCallback(
    () =>
      t('ui:minigames.amp.completion.stability', {
        defaultValue: `Stability Achieved: ${Math.floor(score)}%`,
        score: Math.floor(score)
      }),
    [t, score]
  )

  return (
    <MinigameSceneFrame
      controllerFactory={controllerFactory}
      logic={logic}
      uiState={{ timeLeft, score, isGameOver }}
      onComplete={onComplete}
      completionTitle={t('ui:minigames.amp.completion.title', {
        defaultValue: 'AMP CALIBRATED'
      })}
      completionButtonText={t('ui:minigames.amp.completion.button', {
        defaultValue: 'START GIG'
      })}
      renderCompletionStats={renderCompletionStats}
    >
      <AmpHUD timeLeft={timeLeft} score={score} />
      <AmpControls dialValue={dialValue} targetValue={targetValue} setDialValue={setDialValue} />
    </MinigameSceneFrame>
  )
}

export default AmpCalibrationScene
