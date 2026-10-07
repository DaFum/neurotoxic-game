import * as m from 'motion/react-m'
import { useTranslation } from 'react-i18next'
import { PixiStage } from './PixiStage'
import { ActionButton } from '../ui/shared'
import { MinigameSkipButton } from './MinigameSkipButton'
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
 * @returns A JSX element containing the Pixi stage and completion overlay.
 */
export const MinigameSceneFrame = <TState,>({
  controllerFactory,
  logic,
  uiState,
  onComplete,
  completionTitle,
  renderCompletionStats,
  completionButtonText,
  children
}: MinigameSceneFrameProps<TState>) => {
  const { t } = useTranslation(['ui'])

  const { continueButtonRef, handleSkip, canSkip } = useMinigameSceneLogic({
    logic,
    uiState,
    onComplete
  })

  return (
    <div className='w-full h-full bg-void-black relative overflow-hidden flex flex-col items-center justify-center'>
      <div className='absolute inset-0 pointer-events-none'>
        <PixiStage
          gameStateRef={logic.gameStateRef}
          update={logic.update}
          controllerFactory={controllerFactory}
        />
      </div>

      {/* Player-initiated exit: forfeits the run and continues. Offered only for
          pre-gig setup minigames, and hidden once the completion overlay is
          shown (CONTINUE owns that path). */}
      {canSkip && <MinigameSkipButton onClick={handleSkip} />}

      {/* Custom UI Elements (HUD, Controls) */}
      {children}

      {/* Game Over / Success Overlay */}
      {uiState?.isGameOver && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='fixed inset-0 z-(--z-modal) flex flex-col items-center justify-center bg-void-black/80 backdrop-blur-sm pointer-events-auto'
          role='dialog'
          aria-modal='true'
          aria-labelledby='completion-title'
        >
          <h1
            id='completion-title'
            className='text-4xl text-toxic-green font-bold mb-4'
          >
            {completionTitle ?? t('ui:minigames.complete')}
          </h1>
          <div className='text-star-white mb-8'>
            {renderCompletionStats ? renderCompletionStats(uiState) : null}
          </div>
          <ActionButton ref={continueButtonRef} onClick={onComplete}>
            {completionButtonText ?? t('ui:continue')}
          </ActionButton>
        </m.div>
      )}
    </div>
  )
}
