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
  const lastInputTimeRef = useRef({})

  /**
   * Registers player input for a lane.
   * @param {number} laneIndex - Lane index.
   * @param {boolean} isDown - Whether the input is pressed.
   */
  const registerInput = useCallback(
    (laneIndex, isDown) => {
      const now = Date.now()
      if (isDown) {
        const lastInputTime = lastInputTimeRef.current[laneIndex] || 0
        if (now - lastInputTime < 50) return
        lastInputTimeRef.current[laneIndex] = now
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

      if (laneIndex < 0 || laneIndex >= state.lanes.length) return

      const newLanes = [...state.lanes]
      newLanes[laneIndex] = { ...newLanes[laneIndex], active: isDown }
      state.lanes = newLanes

      if (isDown) handleHit(laneIndex)
    },
    [activeEvent, gameStateRef, handleHit]
  )

  return { registerInput }
}
