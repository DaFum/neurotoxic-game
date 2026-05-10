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
    gameStateRef,
    isOverdriveActive,
    setIsOverdriveActive,
    heat,
    isOverheat,
    voidResonance,
    isAnomalyActive,
    interference,
    purgeInterference,
    isHijackActive,
    hijacksOverridden,
    overrideHijack
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
    () => (
      <div className='flex flex-col gap-2'>
        <div>
          {t('ui:minigames.amp.completion.stability', {
            defaultValue: `Stability Achieved: ${Math.floor(score)}%`,
            score: Math.floor(score)
          })}
        </div>
        {voidResonance > 0 && (
          <div className='text-electric-blue font-bold animate-pulse'>
            {t('ui:minigames.amp.completion.resonance', {
              defaultValue: `Void Resonance Captured: ${Math.floor(voidResonance)}%`,
              voidResonance: Math.floor(voidResonance)
            })}
          </div>
        )}
        {hijacksOverridden > 0 && (
          <div className='text-warning-yellow font-bold'>
            {t('ui:minigames.amp.completion.hijacks', {
              defaultValue: `Hijacks Overridden: ${hijacksOverridden}`,
              hijacksOverridden
            })}
          </div>
        )}
      </div>
    ),
    [t, score, voidResonance, hijacksOverridden]
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
      <AmpHUD
        timeLeft={timeLeft}
        score={score}
        heat={heat}
        isOverheat={isOverheat}
        voidResonance={voidResonance}
        isAnomalyActive={isAnomalyActive}
        interference={interference}
        isHijackActive={isHijackActive}
        hijacksOverridden={hijacksOverridden}
      />
      <AmpControls
        dialValue={dialValue}
        targetValue={targetValue}
        setDialValue={setDialValue}
        isOverdriveActive={isOverdriveActive}
        setIsOverdriveActive={setIsOverdriveActive}
        interference={interference}
        purgeInterference={purgeInterference}
        isHijackActive={isHijackActive}
        overrideHijack={overrideHijack}
      />
    </MinigameSceneFrame>
  )
}

export default AmpCalibrationScene
