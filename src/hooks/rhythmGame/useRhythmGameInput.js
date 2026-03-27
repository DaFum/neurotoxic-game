import { useCallback, useRef } from 'react'
import { getTransportState, getGigTimeMs } from '../../utils/audioEngine.js'

import { canProcessInput, processLaneInput } from '../../utils/rhythmGameInputUtils.js'

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
        now: getGigTimeMs(),
        state,
        lastInputTimes: lastInputTimesRef.current,
        handleHit
      })
    },
    [activeEvent, gameStateRef, handleHit]
  )

  return { registerInput }
}
