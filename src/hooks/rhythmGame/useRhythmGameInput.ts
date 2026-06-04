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

/**
 * Input controls exposed by the rhythm game input hook.
 */
export type RhythmGameInputReturn = {
  registerInput: (laneIndex: number, isDown: boolean) => void
}

/**
 * Handles user input for the rhythm game.
 *
 * @param params - Rhythm state ref, scoring actions, and active-event context for input handling.
 * - `params.gameStateRef` - Game state reference.
 * - `params.scoringActions` - Scoring actions (handleHit).
 * - `params.contextState` - Context state (activeEvent).
 * @returns Input actions (registerInput).
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
   * @param laneIndex - Lane index.
   * @param isDown - Whether the input is pressed.
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
