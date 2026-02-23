import { motion } from 'framer-motion'
import { PixiStage } from './PixiStage'

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
  return (
    <div className="w-full h-full bg-(--void-black) relative overflow-hidden flex flex-col items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        <PixiStage logic={logic} controllerFactory={controllerFactory} />
      </div>

      {/* Custom UI Elements (HUD, Controls) */}
      {children}

      {/* Game Over / Success Overlay */}
      {uiState?.isGameOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-(--void-black)/80 backdrop-blur-sm pointer-events-auto"
        >
          <h1 className="text-4xl text-(--toxic-green) font-bold mb-4">
            {completionTitle}
          </h1>
          <div className="text-(--star-white) mb-8">
            {renderCompletionStats ? renderCompletionStats(uiState) : null}
          </div>
          <button
            onClick={onComplete}
            className="px-8 py-4 bg-(--toxic-green) text-(--void-black) font-bold uppercase hover:scale-105 transition-transform"
          >
            {completionButtonText}
          </button>
        </motion.div>
      )}
    </div>
  )
}
