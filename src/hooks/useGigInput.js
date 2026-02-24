import { useEffect, useRef, useCallback } from 'react'
import { audioManager } from '../utils/AudioManager'
import { buildGigStatsSnapshot } from '../utils/gigStats'
import { handleError } from '../utils/errorHandler'

/**
 * Manages user input for the Gig scene, including keyboard and touch events.
 *
 * @param {Object} params
 * @param {Object} params.actions - Rhythm game actions (registerInput).
 * @param {Object} params.gameStateRef - Reference to the game state.
 * @param {Object} params.activeEvent - Current active event (e.g., Pause menu).
 * @param {Function} params.setActiveEvent - Function to set the active event.
 * @param {Function} params.changeScene - Function to change the scene.
 * @param {Function} params.addToast - Function to show toast notifications.
 * @param {Function} params.setLastGigStats - Function to set the last gig stats.
 * @param {Function} params.triggerBandAnimation - Callback to trigger band animation.
 * @returns {Object} - Input handlers.
 */
export const useGigInput = ({
  actions,
  gameStateRef,
  activeEvent,
  setActiveEvent,
  changeScene,
  addToast,
  setLastGigStats,
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
    /**
     * Handles key press events for rhythm inputs and pause menu.
     * @param {KeyboardEvent} e
     */
    const handleKeyDown = e => {
      if (e.repeat) return

      ensureAudioFromGesture()

      if (e.key === 'Escape') {
        onTogglePause?.()
        return
      }

      const laneIndex = gameStateRef.current.lanes.findIndex(
        l => l.key === e.key
      )
      if (laneIndex !== -1) {
        actions.registerInput(laneIndex, true)
        triggerBandAnimation(laneIndex)
      }
    }

    /**
     * Handles key release events to stop input.
     * @param {KeyboardEvent} e
     */
    const handleKeyUp = e => {
      const laneIndex = gameStateRef.current.lanes.findIndex(
        l => l.key === e.key
      )
      if (laneIndex !== -1) {
        actions.registerInput(laneIndex, false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [
    actions,
    gameStateRef,
    activeEvent,
    setActiveEvent,
    changeScene,
    addToast,
    setLastGigStats,
    ensureAudioFromGesture,
    triggerBandAnimation
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
    (index, active) => (active ? handleTouchStart(index) : handleTouchEnd(index)),
    [handleTouchStart, handleTouchEnd]
  )

  return { handleLaneInput }
}
