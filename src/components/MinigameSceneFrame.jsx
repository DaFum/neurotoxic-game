import { useEffect, useLayoutEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../context/GameState'
import { PixiStage } from './PixiStage'
import { ActionButton } from '../ui/shared'

export const MinigameSceneFrame = ({
  controllerFactory,
  logic,
  uiState,
  onComplete,
  completionTitle = 'COMPLETE',
  renderCompletionStats,
  completionButtonText = 'CONTINUE',
  children
}) => {
  const { settings } = useGameState()
  const continueButtonRef = useRef(null)
  const previousFocusRef = useRef(null)

  useLayoutEffect(() => {
    if (uiState?.isGameOver) {
      previousFocusRef.current = document.activeElement
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
    const handleKeyDown = (e) => {
      if (uiState?.isGameOver && e.key === 'Escape') {
        onComplete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [uiState?.isGameOver, onComplete])

  return (
    <div className="w-full h-full bg-(--void-black) relative overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        <PixiStage
          gameStateRef={logic.gameStateRef}
          update={logic.update}
          controllerFactory={controllerFactory}
        />
      </div>

      {settings?.crtEnabled && <div className="crt-overlay pointer-events-none fixed inset-0 z-500" />}

      {/* Custom UI Elements (HUD, Controls) */}
      {children}

      {/* Game Over / Success Overlay */}
      {uiState?.isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-(--void-black)/80 backdrop-blur-sm pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="completion-title"
        >
          <h1 id="completion-title" className="text-4xl text-(--toxic-green) font-bold mb-4">
            {completionTitle}
          </h1>
          <div className="text-(--star-white) mb-8">
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
