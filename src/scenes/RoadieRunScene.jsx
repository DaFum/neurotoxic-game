import { useMemo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRoadieLogic } from '../hooks/minigames/useRoadieLogic'
import { createRoadieStageController } from '../components/stage/RoadieStageController'
import { MinigameSceneFrame } from '../components/MinigameSceneFrame'
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
      {/* HUD */}
      <div className='absolute top-4 left-4 z-30 text-star-white font-mono pointer-events-none bg-void-black/50 p-2 border border-star-white/20'>
        <h2 className='text-xl text-toxic-green'>
          {t('ui:roadieRun.hud.title')}
        </h2>
        <div>
          {t('ui:roadieRun.hud.itemsRemaining')} {uiState.itemsRemaining}
        </div>
        <div>
          {t('ui:roadieRun.hud.delivered')} {uiState.itemsDelivered}
        </div>
        <div>
          {t('ui:roadieRun.hud.damage')} {uiState.currentDamage}%
        </div>
        {uiState.carrying && (
          <div className='text-warning-yellow'>
            {t('ui:roadieRun.hud.carrying')}{' '}
            {t(`ui:roadieRun.itemTypes.${uiState.carrying.type}`, {
              defaultValue: t('ui:roadieRun.itemTypes.unknown', {
                defaultValue: uiState.carrying.type
              })
            })}
          </div>
        )}
      </div>

      {/* Controls Toggle (Desktop Mode Support) */}
      <button
        type='button'
        className='absolute top-4 right-4 z-50 p-2 bg-void-black/50 text-toxic-green border border-toxic-green rounded hover:bg-toxic-green/20 pointer-events-auto text-xs font-mono hidden md:block'
        onClick={() => setShowControls(prev => !prev)}
        aria-label={t('ui:roadieRun.controls.toggleAria')}
      >
        {showControls
          ? t('ui:roadieRun.controls.hide')
          : t('ui:roadieRun.controls.show')}
      </button>

      {/* Controls Hint */}
      <div className='absolute bottom-4 left-8 text-star-white/50 text-sm font-mono pointer-events-none hidden md:block'>
        {t('ui:roadieRun.controls.movementHint')}
      </div>

      {/* Mobile D-Pad */}
      <div
        className={`absolute bottom-24 right-8 z-40 grid grid-cols-3 gap-2 pointer-events-auto ${showControls ? '' : 'md:hidden'}`}
      >
        <div />
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white'
          onClick={handleMoveUp}
          aria-label={t('ui:moveUp', { defaultValue: 'Move Up' })}
        >
          ▲
        </button>
        <div />
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white'
          onClick={handleMoveLeft}
          aria-label={t('ui:moveLeft', { defaultValue: 'Move Left' })}
        >
          ◄
        </button>
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white'
          onClick={handleMoveDown}
          aria-label={t('ui:moveDown', { defaultValue: 'Move Down' })}
        >
          ▼
        </button>
        <button
          type='button'
          className='w-14 h-14 bg-star-white/10 active:bg-toxic-green/50 border border-star-white/30 rounded flex items-center justify-center text-star-white'
          onClick={handleMoveRight}
          aria-label={t('ui:moveRight', { defaultValue: 'Move Right' })}
        >
          ►
        </button>
      </div>
    </MinigameSceneFrame>
  )
}
