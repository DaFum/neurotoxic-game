import { useCallback, useRef } from 'react'
import { getTransportState } from '../../utils/audioEngine'

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
  const lastInputTimesRef = useRef({})

  /**
   * Registers player input for a lane.
   * @param {number} laneIndex - Lane index.
   * @param {boolean} isDown - Whether the input is pressed.
   */
  const registerInput = useCallback(
    (laneIndex, isDown) => {
      const now = Date.now()
      if (isDown) {
        const lastInputTime = lastInputTimesRef.current[laneIndex] || 0
        if (now - lastInputTime < 50) return
        lastInputTimesRef.current[laneIndex] = now
      }

      const state = gameStateRef.current
      if (
        activeEvent ||
        state.songTransitioning ||
        state.isGameOver ||
        state.hasSubmittedResults
      ) {
        return
      }
      const isTransportRunning = getTransportState() === 'started'
      if (!isTransportRunning) return

      if (laneIndex >= 0 && laneIndex < state.lanes.length) {
        // Toggle the visual active state (this is read by the PixiJS game loop)
        state.lanes[laneIndex].active = isDown

        if (isDown) {
          handleHit(laneIndex)
        }
      }
    },
    [activeEvent, gameStateRef, handleHit]
  )

  return { registerInput }
}
