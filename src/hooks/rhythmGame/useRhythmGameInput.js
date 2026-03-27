import { useCallback, useRef } from 'react'
import { getTransportState } from '../../utils/audioEngine'

/**
 * Determines whether input can be processed based on the current game state.
 *
 * @param {Object} state - Current game state.
 * @param {Object|null} activeEvent - Active context event, if any.
 * @param {string} transportState - Current audio transport state.
 * @returns {boolean} True if input should be processed, false otherwise.
 */
export const canProcessInput = (state, activeEvent, transportState) => {
  if (
    activeEvent ||
    state.songTransitioning ||
    state.isGameOver ||
    state.hasSubmittedResults
  ) {
    return false
  }

  return transportState === 'started'
}

/**
 * Processes an input event for a specific lane.
 *
 * @param {Object} params - Input parameters.
 * @param {number} params.laneIndex - Lane index.
 * @param {boolean} params.isDown - Whether the input is pressed.
 * @param {number} params.now - Current timestamp.
 * @param {Object} params.state - Current game state.
 * @param {Object} params.lastInputTimes - Reference object holding last input times.
 * @param {Function} params.handleHit - Callback to handle a hit.
 */
export const processLaneInput = ({
  laneIndex,
  isDown,
  now,
  state,
  lastInputTimes,
  handleHit
}) => {
  if (laneIndex < 0 || laneIndex >= state.lanes.length) return

  // Toggle the visual active state (this is read by the PixiJS game loop)
  state.lanes[laneIndex].active = isDown

  if (isDown) {
    const lastInputTime = lastInputTimes[laneIndex] || 0
    // Debounce to prevent multiple hits within 50ms
    if (now - lastInputTime < 50) return
    lastInputTimes[laneIndex] = now

    handleHit(laneIndex)
  }
}

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
      const state = gameStateRef.current
      const transportState = getTransportState()

      if (!canProcessInput(state, activeEvent, transportState)) {
        return
      }

      processLaneInput({
        laneIndex,
        isDown,
        now: Date.now(),
        state,
        lastInputTimes: lastInputTimesRef.current,
        handleHit
      })
    },
    [activeEvent, gameStateRef, handleHit]
  )

  return { registerInput }
}
