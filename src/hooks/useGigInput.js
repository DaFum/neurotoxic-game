import { useEffect, useRef, useCallback } from 'react'
import { audioManager } from '../utils/AudioManager'
import {
  createKeyToLaneMap,
  handleKeyDownLogic,
  handleKeyUpLogic
} from '../utils/gigInputUtils'

/**
 * Manages user input for the Gig scene, including keyboard and touch events.
 *
 * @param {Object} params
 * @param {Object} params.actions - Rhythm game actions (registerInput).
 * @param {Object} params.gameStateRef - Reference to the game state.
 * @param {Function} params.triggerBandAnimation - Callback to trigger band animation.
 * @param {Function} params.onTogglePause - Callback to toggle the pause menu.
 * @returns {Object} - Input handlers.
 */
export const useGigInput = ({
  actions,
  gameStateRef,
  triggerBandAnimation,
  onTogglePause
}) => {
  const hasUnlockedAudioRef = useRef(false)

  const ensureAudioFromGesture = useCallback(() => {
    if (hasUnlockedAudioRef.current) return
    hasUnlockedAudioRef.current = true
    audioManager.ensureAudioContext()
  }, [])

  // Keyboard Event Handling
  useEffect(() => {
    // ⚡ Optimization: Pre-compute key-to-lane mapping to change O(N) array lookups
    // into O(1) Map lookups during the high-frequency keydown/keyup events.
    let cachedLanesArray = null
    let keyToLaneMap = new Map()

    const getLaneIndex = key => {
      const currentLanes = gameStateRef.current?.lanes
      // Invalidate cache if the array reference changes or doesn't match
      if (currentLanes && currentLanes !== cachedLanesArray) {
        cachedLanesArray = currentLanes
        keyToLaneMap = createKeyToLaneMap(currentLanes)
      }
      return keyToLaneMap.get(key)
    }

    const handleKeyDown = e =>
      handleKeyDownLogic({
        e,
        getLaneIndex,
        actions,
        triggerBandAnimation,
        onTogglePause,
        ensureAudioFromGesture
      })

    const handleKeyUp = e =>
      handleKeyUpLogic({
        e,
        getLaneIndex,
        actions
      })

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    actions,
    gameStateRef,
    ensureAudioFromGesture,
    triggerBandAnimation,
    onTogglePause
  ])

  // Touch/Mouse Input Handlers for Columns
  /**
   * Handles touch/mouse down on a lane column.
   * @param {number} laneIndex
   */
  const handleTouchStart = useCallback(
    laneIndex => {
      ensureAudioFromGesture()
      actions.registerInput(laneIndex, true)
      triggerBandAnimation(laneIndex)
    },
    [ensureAudioFromGesture, actions, triggerBandAnimation]
  )

  /**
   * Handles touch/mouse up on a lane column.
   * @param {number} laneIndex
   */
  const handleTouchEnd = useCallback(
    laneIndex => {
      actions.registerInput(laneIndex, false)
    },
    [actions]
  )

  const handleLaneInput = useCallback(
    (index, active) =>
      active ? handleTouchStart(index) : handleTouchEnd(index),
    [handleTouchStart, handleTouchEnd]
  )

  return { handleLaneInput }
}
