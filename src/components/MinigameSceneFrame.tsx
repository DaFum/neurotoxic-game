import { useTranslation } from 'react-i18next'
import { useGameSelector } from '../context/GameState'
import { PixiStage } from './PixiStage'
import { ActionButton } from '../ui/shared'
import { useAnime } from '../ui/shared/AnimatedTypography'
import type { MinigameSceneFrameProps } from '../types/components'
import { useMinigameSceneLogic } from '../hooks/useMinigameSceneLogic'

/**
 * Owns the shared Pixi minigame shell, completion overlay, and manual continue path.
 *
 * @remarks
 * In development, `Shift+P` force-completes the active minigame for testing.
 * When the completion overlay opens, focus moves to the continue button and is
 * restored when the overlay unmounts.
 *
 * @typeParam TState - Ref state consumed by the Pixi stage controller.
 * @param props - Stage controller factory, minigame logic, UI state, completion callback, completion copy, stats renderer, and child UI.
 */
export const MinigameSceneFrame = <TState,>({
  controllerFactory,
  logic,
  uiState,
  onComplete,
  completionTitle = 'COMPLETE',
  renderCompletionStats,
  completionButtonText = 'CONTINUE',
  children
}: MinigameSceneFrameProps<TState>) => {
  const { t } = useTranslation(['ui'])
  const settings = useGameSelector(state => state.settings)

  const { continueButtonRef, handleSkip, canSkip } = useMinigameSceneLogic({
    logic,
    uiState,
    onComplete
  })

  const completionOverlayRef = useAnime<HTMLDivElement>(
    uiState?.isGameOver ? { opacity: [0, 1], duration: 250 } : undefined
  )

  return (
    <div className='w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center'>
      <div className='absolute inset-0 pointer-events-none'>
        <PixiStage
          gameStateRef={logic.gameStateRef}
          update={logic.update}
          controllerFactory={controllerFactory}
        />
      </div>

      {settings?.crtEnabled && (
        <div className='crt-overlay pointer-events-none fixed inset-0 z-(--z-crt)' />
      )}

      {/* Player-initiated exit: forfeits the run and continues. Offered only for
          pre-gig setup minigames, and hidden once the completion overlay is
          shown (CONTINUE owns that path). */}
      {canSkip && (
        <button
          type='button'
          onClick={handleSkip}
          className='absolute top-4 right-4 z-(--z-modal) pointer-events-auto border-2 border-toxic-green/60 bg-void-black/70 px-3 py-1 text-sm text-toxic-green hover:bg-toxic-green/10'
        >
          {t('ui:minigames.skip', { defaultValue: 'SKIP' })}
        </button>
      )}

      {/* Custom UI Elements (HUD, Controls) */}
      {children}

      {/* Game Over / Success Overlay */}
      {uiState?.isGameOver && (
        <div
          ref={completionOverlayRef}
          className='fixed inset-0 z-(--z-modal) flex flex-col items-center justify-center bg-void-black/80 backdrop-blur-sm pointer-events-auto'
          role='dialog'
          aria-modal='true'
          aria-labelledby='completion-title'
        >
          <h1
            id='completion-title'
            className='text-4xl text-toxic-green font-bold mb-4'
          >
            {completionTitle}
          </h1>
          <div className='text-star-white mb-8'>
            {renderCompletionStats ? renderCompletionStats(uiState) : null}
          </div>
          <ActionButton ref={continueButtonRef} onClick={onComplete}>
            {completionButtonText}
          </ActionButton>
        </div>
      )}
    </div>
  )
}
