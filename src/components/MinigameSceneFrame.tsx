import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useGameActions, useGameSelector } from '../context/GameState'
import { PixiStage } from './PixiStage'
import { ActionButton } from '../ui/shared'
import type { MinigameSceneFrameProps } from '../types/components'
import { MINIGAME_TYPES } from '../context/gameConstants'
import { logger } from '../utils/logger'

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
  const band = useGameSelector(state => state.band)
  // Canonical active minigame type from reducer state — used by the DEV
  // Shift+P backdoor instead of the non-canonical `window.gameState` global.
  const minigameType = useGameSelector(state => state.minigame?.type)
  const {
    completeTravelMinigame,
    completeRoadieMinigame,
    completeKabelsalatMinigame,
    completeAmpCalibration
  } = useGameActions()
  const continueButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const logicRef = useRef(logic)

  useLayoutEffect(() => {
    logicRef.current = logic
  }, [logic])

  useLayoutEffect(() => {
    if (uiState?.isGameOver) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      continueButtonRef.current?.focus()
    }

    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
    }
  }, [uiState?.isGameOver])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (uiState?.isGameOver && e.key === 'Escape') {
        onComplete()
      } else if (
        import.meta.env?.DEV &&
        e.shiftKey &&
        e.key.toUpperCase() === 'P'
      ) {
        // Only trigger backdoor if minigame is not already finished to avoid duplicate calls
        if (!uiState?.isGameOver) {
          const currentLogic = logicRef.current
          if (currentLogic?.finishMinigame) {
            currentLogic.finishMinigame()
          } else if (minigameType === MINIGAME_TYPES.TOURBUS) {
            completeTravelMinigame(0, [])
            onComplete()
            return
          } else if (minigameType === MINIGAME_TYPES.ROADIE) {
            completeRoadieMinigame(0)
            onComplete()
            return
          } else if (minigameType === MINIGAME_TYPES.KABELSALAT) {
            completeKabelsalatMinigame({ isPoweredOn: true, timeLeft: 0 })
            onComplete()
            return
          } else if (minigameType === MINIGAME_TYPES.AMP_CALIBRATION) {
            completeAmpCalibration(100)
            onComplete()
            return
          } else {
            logger.warn(
              'Minigame',
              'Unhandled minigame type for completion',
              minigameType
            )
            return
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onComplete,
    uiState?.isGameOver,
    minigameType,
    completeTravelMinigame,
    completeRoadieMinigame,
    completeKabelsalatMinigame,
    completeAmpCalibration
  ])

  // Player-initiated skip for the pre-gig setup minigames: an explicit exit
  // affordance like CLINIC/ASSETS have. Skip is a FORFEIT classified as a failed
  // run (never a perfect/best-case clear), so it can't be used to farm rewards:
  //  - Amp score 0 / Kabelsalat not-powered → stress > 0 → failed run, no bonus.
  //  - Roadie max equipment damage (> 50 → failed) AND the escorted contraband
  //    is consumed (stashItemId), so skipping can't dodge damage or keep it.
  // Travel (Tourbus) is deliberately excluded: its arrival continuation reads
  // not-yet-committed travel state, so a synchronous skip would misroute arrival.
  // The completion reducers reset minigame state and leave currentScene
  // untouched; onComplete owns the scene change.
  const handleSkip = useCallback(() => {
    if (uiState?.isGameOver) return
    switch (minigameType) {
      case MINIGAME_TYPES.ROADIE: {
        const stashItemId = band?.stash ? Object.keys(band.stash)[0] : undefined
        completeRoadieMinigame(100, 0, stashItemId)
        break
      }
      case MINIGAME_TYPES.KABELSALAT:
        completeKabelsalatMinigame({ isPoweredOn: false, timeLeft: 0 })
        break
      case MINIGAME_TYPES.AMP_CALIBRATION:
        completeAmpCalibration(0)
        break
      default:
        logger.warn('Minigame', 'Skip: unsupported minigame type', minigameType)
        return
    }
    onComplete()
  }, [
    uiState?.isGameOver,
    minigameType,
    band,
    completeRoadieMinigame,
    completeKabelsalatMinigame,
    completeAmpCalibration,
    onComplete
  ])

  // Skip is only offered for the pre-gig setup minigames (not travel).
  const canSkip =
    !uiState?.isGameOver &&
    (minigameType === MINIGAME_TYPES.ROADIE ||
      minigameType === MINIGAME_TYPES.KABELSALAT ||
      minigameType === MINIGAME_TYPES.AMP_CALIBRATION)

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
        <motion.div
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
            {completionTitle}
          </h1>
          <div className='text-star-white mb-8'>
            {renderCompletionStats ? renderCompletionStats(uiState) : null}
          </div>
          <ActionButton ref={continueButtonRef} onClick={onComplete}>
            {completionButtonText}
          </ActionButton>
        </motion.div>
      )}
    </div>
  )
}
