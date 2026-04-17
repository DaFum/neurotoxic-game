export const DEBOUNCE_MS = 50

interface LaneState {
  active: boolean
}

interface InputRuntimeState {
  songTransitioning: boolean
  isGameOver: boolean
  hasSubmittedResults: boolean
  lanes: LaneState[]
}

type LaneHitHandler = (laneIndex: number) => void

/**
 * Determines whether input can be processed based on the current game state.
 *
 * @param {Object} state - Current game state.
 * @param {Object|null} activeEvent - Active context event, if any.
 * @param {string} transportState - Current audio transport state.
 * @returns {boolean} True if input should be processed, false otherwise.
 */
export const canProcessInput = (
  state: InputRuntimeState,
  activeEvent: unknown,
  transportState: string
): boolean => {
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
}: {
  laneIndex: number
  isDown: boolean
  now: number
  state: InputRuntimeState
  lastInputTimes: number[]
  handleHit: LaneHitHandler
}): void => {
  if (laneIndex < 0 || laneIndex >= state.lanes.length) return

  // Toggle the visual active state (this is read by the PixiJS game loop)
  state.lanes[laneIndex].active = isDown

  if (isDown) {
    const lastInputTime = lastInputTimes[laneIndex] ?? -Infinity
    // Debounce to prevent multiple hits within 50ms
    if (now - lastInputTime < DEBOUNCE_MS) return
    lastInputTimes[laneIndex] = now

    handleHit(laneIndex)
  }
}
