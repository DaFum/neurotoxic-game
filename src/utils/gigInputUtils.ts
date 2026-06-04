/**
 * Generates a mapping of key strings to their corresponding lane indices.
 * @param currentLanes - The current lanes array from the game state.
 * @returns A Map where keys are lane keys and values are lane indices.
 */
export const createKeyToLaneMap = (
  currentLanes:
    | Array<{ key?: string } | null>
    | Record<string, { key?: string } | null>
    | null
    | undefined
): Map<string, number> => {
  const keyToLaneMap = new Map<string, number>()
  if (!currentLanes) return keyToLaneMap

  if (Array.isArray(currentLanes)) {
    for (let index = 0; index < currentLanes.length; index++) {
      if (!Object.hasOwn(currentLanes, index)) continue
      const lane = currentLanes[index] as { key?: string } | null
      if (lane && lane.key != null) {
        keyToLaneMap.set(lane.key, index)
      }
    }
  } else {
    const lanesRecord = currentLanes as Record<string, { key?: string } | null>
    for (const [index, lane] of Object.entries(lanesRecord)) {
      if (lane && lane.key != null && Number.isInteger(Number(index))) {
        keyToLaneMap.set(lane.key, Number(index))
      }
    }
  }
  return keyToLaneMap
}

/**
 * Handles keyboard input for a specific lane.
 * @param params - Params.
 * - `params.e` - The keyboard event.
 * - `params.getLaneIndex` - Function returning a lane index given a key string.
 * - `params.actions` - Action dispatchers.
 * - `params.triggerBandAnimation` - Callback to trigger the band animation.
 * - `params.onTogglePause` - Callback to toggle the pause menu.
 * - `params.ensureAudioFromGesture` - Ensures audio is playing.
 */
export const handleKeyDownLogic = ({
  e,
  getLaneIndex,
  actions,
  triggerBandAnimation,
  onTogglePause,
  ensureAudioFromGesture
}: {
  e: KeyboardEvent
  getLaneIndex: (key: string) => number | undefined
  actions: { registerInput: (laneIndex: number, pressed: boolean) => void }
  triggerBandAnimation: (laneIndex: number) => void
  onTogglePause?: () => void
  ensureAudioFromGesture: () => void
}): void => {
  if (e.repeat) return

  ensureAudioFromGesture()

  if (e.key === 'Escape') {
    onTogglePause?.()
    return
  }

  const laneIndex = getLaneIndex(e.key)
  if (laneIndex !== undefined) {
    actions.registerInput(laneIndex, true)
    triggerBandAnimation(laneIndex)
  }
}

/**
 * Handles keyup event for a lane.
 * @param params - Params.
 * - `params.e` - The keyboard event.
 * - `params.getLaneIndex` - Function returning a lane index given a key string.
 * - `params.actions` - Action dispatchers.
 */
export const handleKeyUpLogic = ({
  e,
  getLaneIndex,
  actions
}: {
  e: KeyboardEvent
  getLaneIndex: (key: string) => number | undefined
  actions: { registerInput: (laneIndex: number, pressed: boolean) => void }
}): void => {
  const laneIndex = getLaneIndex(e.key)
  if (laneIndex !== undefined) {
    actions.registerInput(laneIndex, false)
  }
}
