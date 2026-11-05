import { useMemo, useCallback, useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoadieLogic } from '../hooks/minigames/useRoadieLogic'
import { createRoadieStageController } from '../components/stage/RoadieStageController'
import { MinigameSceneFrame } from '../components/MinigameSceneFrame'
import { RoadieHUD } from '../components/minigames/roadie/RoadieHUD'
import { RoadieControls } from '../components/minigames/roadie/RoadieControls'
import { useGameActions } from '../context/GameState'
import { GAME_PHASES } from '../context/gameConstants'
import { finiteNumberOr } from '../utils/finiteNumber'
import { ActionButton } from '../ui/shared'
import { useModalBehavior } from '../ui/shared/useModalBehavior'

const keepBriefingOpen = () => {}

/**
 * Hosts the Roadie equipment-delivery minigame and returns to the gig flow on completion.
 */
export const RoadieRunScene = () => {
  const { t } = useTranslation(['ui', 'items'])
  const { uiState, gameStateRef, stats, update, actions } = useRoadieLogic({
    requireContrabandBriefing: true
  })
  const { changeScene } = useGameActions()
  const [showControls, setShowControls] = useState(false)
  const startButtonRef = useRef<HTMLButtonElement | null>(null)
  const { overlayRef, dialogRef } = useModalBehavior(
    uiState.awaitingStart,
    keepBriefingOpen
  )

  useEffect(() => {
    if (uiState.awaitingStart) startButtonRef.current?.focus()
  }, [uiState.awaitingStart])

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
    (state: unknown) => {
      const currentDamage =
        state && typeof state === 'object'
          ? finiteNumberOr(
              (state as { currentDamage?: unknown }).currentDamage,
              0
            )
          : 0
      return t('ui:roadieRun.completion.equipmentDamage', {
        damage: Math.max(0, currentDamage)
      })
    },
    [t]
  )

  return (
    <MinigameSceneFrame
      controllerFactory={createRoadieStageController}
      logic={logic}
      uiState={uiState}
      onComplete={handleComplete}
      completionTitle={t('ui:roadieRun.completion.title')}
      completionButtonText={t('ui:roadieRun.completion.button')}
      renderCompletionStats={renderCompletionStats}
    >
      <RoadieHUD uiState={uiState} />
      {uiState.awaitingStart && uiState.carrying && (
        <div
          ref={overlayRef}
          data-modal-overlay=''
          className='fixed inset-0 z-(--z-modal) flex items-center justify-center bg-void-black/90 p-6'
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            role='dialog'
            aria-modal='true'
            aria-labelledby='roadie-briefing-title'
            className='flex flex-col items-center justify-center gap-4 text-center text-star-white'
          >
            <h1
              id='roadie-briefing-title'
              className='text-2xl text-toxic-green'
            >
              {t('ui:roadieRun.hud.title')}
            </h1>
            <p className='max-w-md'>
              {t('ui:roadieRun.contraband.warning', {
                item: t(`items:contraband.${uiState.carrying.id}.name`, {
                  defaultValue: uiState.carrying.id
                })
              })}
            </p>
            <ActionButton ref={startButtonRef} onClick={actions.start}>
              {t('ui:roadieRun.briefing.start')}
            </ActionButton>
          </div>
        </div>
      )}
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
