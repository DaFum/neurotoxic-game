// TODO: Extract complex UI sub-components into standalone files for better maintainability
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTourbusLogic } from '../hooks/minigames/useTourbusLogic'
import { useArrivalLogic } from '../hooks/useArrivalLogic'
import { createTourbusStageController } from '../components/stage/TourbusStageController'
import { MinigameSceneFrame } from '../components/MinigameSceneFrame'

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
      <div className='absolute top-4 left-4 z-30 text-star-white font-mono pointer-events-none'>
        <h2 className='text-2xl text-toxic-green'>
          {t('minigame:tourbus.title', { defaultValue: 'TOURBUS TERROR' })}
        </h2>
        <div className='mt-2'>
          <p>
            {t('minigame:tourbus.distance', { defaultValue: 'DISTANCE:' })}{' '}
            {uiState.distance}m
          </p>
          <p>
            {t('minigame:tourbus.damage', { defaultValue: 'DAMAGE:' })}{' '}
            {uiState.damage}%
          </p>
        </div>
      </div>

      {/* Controls Overlay (Touch/Mobile) */}
      <div className='absolute inset-0 z-40 flex justify-between pointer-events-auto'>
        <button
          type='button'
          aria-label={t('minigame:tourbus.moveLeft', {
            defaultValue: 'Move Left'
          })}
          className='w-1/2 h-full active:bg-star-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-inset'
          onClick={actions.moveLeft}
        />
        <button
          type='button'
          aria-label={t('minigame:tourbus.moveRight', {
            defaultValue: 'Move Right'
          })}
          className='w-1/2 h-full active:bg-star-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-toxic-green focus-visible:ring-inset'
          onClick={actions.moveRight}
        />
      </div>
    </MinigameSceneFrame>
  )
}
