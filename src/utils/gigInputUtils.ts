/**
 * Generates a mapping of key strings to their corresponding lane indices.
 * @param {Array} currentLanes - The current lanes array from the game state.
 * @returns {Map<string, number>} A Map where keys are lane keys and values are lane indices.
 */
export const createKeyToLaneMap = (
  currentLanes: Array<{ key?: string } | null> | null | undefined
): Map<string, number> => {
  const keyToLaneMap = new Map<string, number>()
  if (!currentLanes) return keyToLaneMap

  for (const index in currentLanes) {
    if (!Object.hasOwn(currentLanes, index)) continue

    const lane = currentLanes[index] as { key?: string } | null
    if (lane && Object.hasOwn(lane, 'key') && Number.isInteger(Number(index))) {
      keyToLaneMap.set((lane.key as string) ?? '', Number(index))
    }
  }
  return keyToLaneMap
}

/**
 * Handles keyboard input for a specific lane.
 * @param {Object} params
 * @param {KeyboardEvent} params.e - The keyboard event.
 * @param {Function} params.getLaneIndex - Function returning a lane index given a key string.
 * @param {Object} params.actions - Action dispatchers.
 * @param {Function} params.triggerBandAnimation - Callback to trigger the band animation.
 * @param {Function} params.onTogglePause - Callback to toggle the pause menu.
 * @param {Function} params.ensureAudioFromGesture - Ensures audio is playing.
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
 * @param {Object} params
 * @param {KeyboardEvent} params.e - The keyboard event.
 * @param {Function} params.getLaneIndex - Function returning a lane index given a key string.
 * @param {Object} params.actions - Action dispatchers.
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
