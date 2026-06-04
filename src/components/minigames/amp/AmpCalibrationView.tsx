import { useCallback } from 'react'
import type { MutableRefObject } from 'react'
import type { TFunction } from 'i18next'
import { MinigameSceneFrame } from '../../MinigameSceneFrame'
import { AmpHUD } from './AmpHUD'
import { AmpControls } from './AmpControls'
import type {
  StageControllerOptions,
  AmpStageOptions
} from '../../../types/components'
import { AmpStageController } from '../../stage/AmpStageController'
const INACTIVE_UI_STATE = { timeLeft: 0, score: 0, isGameOver: false }

/**
 * State, callbacks, and Pixi controller factory required to host amp calibration.
 */
export interface AmpCalibrationViewProps {
  t: TFunction<'ui', undefined>
  dialValue: number
  setDialValue: (val: number | ((prev: number) => number)) => void
  targetValue: number
  timeLeft: number
  score: number
  isGameOver: boolean
  isOverdriveActive: boolean
  setIsOverdriveActive: (val: boolean | ((prev: boolean) => boolean)) => void
  heat: number
  isOverheat: boolean
  voidResonance: number
  isAnomalyActive: boolean
  interference: number
  purgeInterference: () => void
  isHijackActive: boolean
  hijacksOverridden: number
  overrideHijack: () => void
  controllerFactory: (
    params: StageControllerOptions<AmpStageOptions>
  ) => AmpStageController
  logic: {
    update: (deltaMS: number) => void
    gameStateRef: MutableRefObject<AmpStageOptions>
  }
  onComplete: () => void
}

/**
 * Hosts the amp-calibration Pixi stage, HUD, controls, and completion summary.
 * @param props - Amp calibration controls, HUD state, stage controller factory, completion handler, and advanced mechanic callbacks.
 */
export const AmpCalibrationView = ({
  t,
  dialValue,
  setDialValue,
  targetValue,
  timeLeft,
  score,
  isGameOver,
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
  overrideHijack,
  controllerFactory,
  logic,
  onComplete
}: AmpCalibrationViewProps) => {
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
      uiState={isGameOver ? { timeLeft, score, isGameOver } : INACTIVE_UI_STATE}
      onComplete={onComplete}
      completionTitle={t('ui:minigames.amp.completion.title', {
        defaultValue: 'AMP CALIBRATED'
      })}
      completionButtonText={t('ui:minigames.amp.completion.button', {
        defaultValue: 'START GIG'
      })}
      renderCompletionStats={isGameOver ? renderCompletionStats : undefined}
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
