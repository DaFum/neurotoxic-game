import { useCallback, useRef } from 'react'
import { getTransportState, getGigTimeMs } from '../../utils/audio/audioEngine'
import type { RhythmGameRefState } from './useRhythmGameState'

import {
  canProcessInput,
  processLaneInput
} from '../../utils/rhythmGameInputUtils'

type RhythmGameInputParams = {
  gameStateRef: { current: RhythmGameRefState }
  scoringActions: { handleHit: (laneIndex: number) => boolean }
  contextState: { activeEvent: unknown }
}

export type RhythmGameInputReturn = {
  registerInput: (laneIndex: number, isDown: boolean) => void
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
}: RhythmGameInputParams): RhythmGameInputReturn => {
  const { handleHit } = scoringActions
  const { activeEvent } = contextState
  const lastInputTimesRef = useRef<number[]>([])

  /**
   * Registers player input for a lane.
   * @param {number} laneIndex - Lane index.
   * @param {boolean} isDown - Whether the input is pressed.
   */
  const registerInput = useCallback(
    (laneIndex: number, isDown: boolean) => {
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
