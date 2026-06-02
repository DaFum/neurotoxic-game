import { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAmpLogic } from '../hooks/minigames/useAmpLogic'
import { createAmpStageController } from '../components/stage/AmpStageController'
import { AmpCalibrationView } from '../components/minigames/amp/AmpCalibrationView'
import { useGameActions } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'

export const AmpCalibrationScene = () => {
  const { t } = useTranslation(['ui'])
  const { changeScene } = useGameActions()

  const ampLogicProps = useAmpLogic()

  const controllerFactory = useMemo(() => createAmpStageController, [])

  const logic = useMemo(
    () => ({
      update: ampLogicProps.update,
      gameStateRef: ampLogicProps.gameStateRef
    }),
    [ampLogicProps.update, ampLogicProps.gameStateRef]
  )

  const onComplete = useCallback(() => {
    changeScene(GAME_PHASES.GIG)
  }, [changeScene])

  return (
    <AmpCalibrationView
      {...ampLogicProps}
      t={t}
      controllerFactory={controllerFactory}
      logic={logic}
      onComplete={onComplete}
    />
  )
}
