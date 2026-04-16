// @ts-nocheck
import { useMemo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoadieLogic } from '../hooks/minigames/useRoadieLogic'
import { createRoadieStageController } from '../components/stage/RoadieStageController'
import { MinigameSceneFrame } from '../components/MinigameSceneFrame'
import { RoadieHUD } from '../components/minigames/roadie/RoadieHUD'
import { RoadieControls } from '../components/minigames/roadie/RoadieControls'
import { useGameState } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'

export const RoadieRunScene = () => {
  const { t } = useTranslation(['ui'])
  const { uiState, gameStateRef, stats, update, actions } = useRoadieLogic()
  const { changeScene } = useGameState()
  const [showControls, setShowControls] = useState(false)

  const controllerFactory = useMemo(() => createRoadieStageController, [])

  const logic = useMemo(
    () => ({
      gameStateRef,
      stats,
      update
    }),
    [gameStateRef, stats, update]
  )

  const handleComplete = useCallback(
    () => changeScene(GAME_PHASES.GIG),
    [changeScene]
  )

  const handleMoveUp = useCallback(() => actions.move(0, -1), [actions])
  const handleMoveLeft = useCallback(() => actions.move(-1, 0), [actions])
  const handleMoveDown = useCallback(() => actions.move(0, 1), [actions])
  const handleMoveRight = useCallback(() => actions.move(1, 0), [actions])

  const renderCompletionStats = useCallback(
    state =>
      t('ui:roadieRun.completion.equipmentDamage', {
        damage: Math.max(0, state.currentDamage)
      }),
    [t]
  )

  return (
    <MinigameSceneFrame
      controllerFactory={controllerFactory}
      logic={logic}
      uiState={uiState}
      onComplete={handleComplete}
      completionTitle={t('ui:roadieRun.completion.title')}
      completionButtonText={t('ui:roadieRun.completion.button')}
      renderCompletionStats={renderCompletionStats}
    >
      <RoadieHUD uiState={uiState} />
      <RoadieControls
        showControls={showControls}
        setShowControls={setShowControls}
        handleMoveUp={handleMoveUp}
        handleMoveLeft={handleMoveLeft}
        handleMoveDown={handleMoveDown}
        handleMoveRight={handleMoveRight}
      />
    </MinigameSceneFrame>
  )
}

export default RoadieRunScene
