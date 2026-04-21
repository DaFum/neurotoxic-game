/*
 * (#1) Actual Updates: Added strict isRequired to MinigameSceneFrame logic props and added this block.
 * (#2) Next Steps: Extract specific minigame UIs from this component.
 * (#3) Found Errors + Solutions: N/A
 */
// TODO: Review this file
import { useEffect, useLayoutEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { PixiStage } from './PixiStage'
import { ActionButton } from '../ui/shared'
import PropTypes from 'prop-types'
import type { MinigameSceneFrameProps } from '../types/components'
import { ActionTypes } from '../context/actionTypes'
import { MINIGAME_TYPES } from '../context/gameConstants'

export const MinigameSceneFrame = ({
  controllerFactory,
  logic,
  uiState,
  onComplete,
  completionTitle = 'COMPLETE',
  renderCompletionStats,
  completionButtonText = 'CONTINUE',
  children
}: MinigameSceneFrameProps) => {
  const {
    settings,
    completeTravelMinigame,
    completeRoadieMinigame,
    completeKabelsalatMinigame,
    completeAmpCalibration,
    endGig
  } = useGameState()
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
          } else {
            const currentType =
              currentLogic?.gameStateRef?.current?.minigame?.type

            if (currentType === MINIGAME_TYPES.TOURBUS) {
              completeTravelMinigame(0, [])
              return
            } else if (currentType === MINIGAME_TYPES.ROADIE) {
              completeRoadieMinigame(0)
              return
            } else if (currentType === MINIGAME_TYPES.KABELSALAT) {
              completeKabelsalatMinigame({ isPoweredOn: true, timeLeft: 0 })
              return
            } else if (currentType === MINIGAME_TYPES.AMP_CALIBRATION) {
              completeAmpCalibration(100)
              return
            } else {
              console.warn(
                'Unhandled minigame type for completion: ',
                currentType
              )
              return
            }
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onComplete,
    uiState?.isGameOver,
    completeTravelMinigame,
    completeRoadieMinigame,
    completeKabelsalatMinigame,
    completeAmpCalibration,
    endGig
  ])

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
        <div className='crt-overlay pointer-events-none fixed inset-0 z-500' />
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

MinigameSceneFrame.propTypes = {
  controllerFactory: PropTypes.func,
  logic: PropTypes.shape({
    gameStateRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
    update: PropTypes.func.isRequired,
    finishMinigame: PropTypes.func,
    dispatch: PropTypes.func
  }).isRequired,
  uiState: PropTypes.shape({
    isGameOver: PropTypes.bool
  }),
  onComplete: PropTypes.func.isRequired,
  completionTitle: PropTypes.string,
  renderCompletionStats: PropTypes.func,
  completionButtonText: PropTypes.string,
  children: PropTypes.node
}
