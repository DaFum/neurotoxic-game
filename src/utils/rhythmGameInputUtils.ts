/**
 * Minimum milliseconds between accepted lane-down inputs.
 */
const DEBOUNCE_MS = 50

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
 * @param state - Current game state.
 * @param activeEvent - Active context event, if any.
 * @param transportState - Current audio transport state.
 * @returns True if input should be processed, false otherwise.
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
 * @param params - Lane index, press state, timestamp, runtime state,
 * last-input timestamps, and hit callback.
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
  if (!state.lanes || laneIndex < 0 || laneIndex >= state.lanes.length) return
  if (!state.lanes[laneIndex]) return

  // Toggle the visual active state (this is read by the PixiJS game loop)
  state.lanes[laneIndex].active = isDown

  if (isDown) {
    if (!lastInputTimes) return
    const lastInputTime = lastInputTimes[laneIndex] ?? -Infinity
    // Debounce to prevent multiple hits within 50ms.
    // If now < lastInputTime, the clock has reset (e.g. new song started), so we should allow the hit.
    if (now >= lastInputTime && now - lastInputTime < DEBOUNCE_MS) return
    lastInputTimes[laneIndex] = now

    handleHit(laneIndex)
  }
}

/**
 * Clears the held visual of one lane. Releases never score.
 *
 * @param state - Runtime state holding the lane visuals.
 * @param laneIndex - Lane being released; out-of-range indexes are ignored.
 */
const releaseLane = (
  state: Pick<InputRuntimeState, 'lanes'>,
  laneIndex: number
): void => {
  if (!state.lanes || laneIndex < 0 || laneIndex >= state.lanes.length) return
  const lane = state.lanes[laneIndex]
  if (lane) lane.active = false
}

/**
 * Clears the held visual of every lane, e.g. when the window loses focus and
 * the matching keyup events will never arrive.
 *
 * @param state - Runtime state holding the lane visuals.
 */
export const releaseAllLanes = (
  state: Pick<InputRuntimeState, 'lanes'>
): void => {
  if (!state.lanes) return
  for (const lane of state.lanes) {
    if (lane) lane.active = false
  }
}

/**
 * Routes one lane input edge through gameplay gating.
 *
 * @remarks
 * A release is applied before the gate, so a lane pressed before a pause,
 * event or song transition still clears its held visual when released. Only
 * presses are gated by {@link canProcessInput} and can reach `handleHit`.
 *
 * @param params - Lane edge, runtime state, gating context, gig clock,
 * last-input timestamps, and hit callback.
 */
export const registerLaneInput = ({
  laneIndex,
  isDown,
  state,
  activeEvent,
  transportState,
  getNow,
  lastInputTimes,
  handleHit
}: {
  laneIndex: number
  isDown: boolean
  state: InputRuntimeState
  activeEvent: unknown
  transportState: string
  getNow: () => number
  lastInputTimes: number[]
  handleHit: LaneHitHandler
}): void => {
  if (!isDown) {
    releaseLane(state, laneIndex)
    return
  }
  if (!canProcessInput(state, activeEvent, transportState)) return

  processLaneInput({
    laneIndex,
    isDown,
    now: getNow(),
    state,
    lastInputTimes,
    handleHit
  })
}
