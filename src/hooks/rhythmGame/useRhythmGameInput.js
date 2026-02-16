import { useCallback } from 'react'

/**
 * Handles user input for the rhythm game.
 *
 * @param {Object} params - Hook parameters.
 * @param {Object} params.gameStateRef - Game state reference.
 * @param {Object} params.scoringActions - Scoring actions (handleHit).
 * @param {Object} params.contextState - Context state (activeEvent).
 * @returns {Object} Input actions (registerInput).
 */
export const useRhythmGameInput = ({
  gameStateRef,
  scoringActions,
  contextState
}) => {
  const { handleHit } = scoringActions
  const { activeEvent } = contextState

  /**
   * Registers player input for a lane.
   * @param {number} laneIndex - Lane index.
   * @param {boolean} isDown - Whether the input is pressed.
   */
  const registerInput = useCallback(
    (laneIndex, isDown) => {
      // Ignore input if game is not running or is paused
      if (!gameStateRef.current.running || activeEvent) return

      if (gameStateRef.current.lanes[laneIndex]) {
        gameStateRef.current.lanes[laneIndex].active = isDown
        if (isDown) handleHit(laneIndex)
      }
    },
    [activeEvent, handleHit, gameStateRef]
  )

  return { registerInput }
}
