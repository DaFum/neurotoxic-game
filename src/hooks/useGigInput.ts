import { useEffect, useRef, useCallback } from 'react'
import { audioService } from '../utils/audio/audioEngine'
import {
  createKeyToLaneMap,
  handleKeyDownLogic,
  handleKeyUpLogic
} from '../utils/gigInputUtils'
import { releaseAllLanes } from '../utils/rhythmGameInputUtils'
import { hasActiveModal, closeTopmostModal, getActiveFocusScope } from '../ui/shared/useModalBehavior'
import { useGamepadActions } from '../context/GamepadInputContext'
import type { RhythmGameLogicReturn } from './useRhythmGameLogic'
import type { RhythmLane } from '../types/rhythmGame'

type GigInputParams = {
  actions: RhythmGameLogicReturn['actions']
  gameStateRef: RhythmGameLogicReturn['gameStateRef']
  triggerBandAnimation: (laneIndex: number) => void
  onTogglePause?: () => void
}

/**
 * Wires keyboard, touch, and mouse input into the active Gig scene.
 *
 * @remarks
 * The hook unlocks audio from the first accepted user gesture and reuses a
 * cached key-to-lane map while the lane array reference stays stable.
 *
 * @param params - Rhythm input collaborators from `useRhythmGameLogic`.
 * - `params.actions` - Rhythm game actions (registerInput).
 * - `params.gameStateRef` - Reference to the game state.
 * - `params.triggerBandAnimation` - Callback to trigger band animation.
 * - `params.onTogglePause` - Callback to toggle the pause menu.
 * @returns Lane input handlers for pointer/touch controls.
 */
export const useGigInput = ({
  actions,
  gameStateRef,
  triggerBandAnimation,
  onTogglePause
}: GigInputParams): {
  handleLaneInput: (index: number, active: boolean) => void
} => {
  const hasUnlockedAudioRef = useRef(false)

  const ensureAudioFromGesture = useCallback(() => {
    if (hasUnlockedAudioRef.current) return
    // Optimistically mark as unlocked to dedupe concurrent gestures; clear on
    // failure so a later gesture can retry rather than getting stuck silent.
    hasUnlockedAudioRef.current = true
    void audioService
      .ensureAudioContext()
      .then(success => {
        if (!success) hasUnlockedAudioRef.current = false
      })
      .catch(() => {
        hasUnlockedAudioRef.current = false
      })
  }, [])

  const handleLaneAction = useCallback(
    (laneIndex: number, pressed: boolean) => {
      if (pressed) {
        if (hasActiveModal()) return
        ensureAudioFromGesture()
        actions.registerInput(laneIndex, true)
        triggerBandAnimation(laneIndex)
      } else {
        actions.registerInput(laneIndex, false)
      }
    },
    [actions, ensureAudioFromGesture, triggerBandAnimation]
  )

  const handleMenuAction = useCallback(() => {
    if (!hasActiveModal()) {
      if (onTogglePause) onTogglePause()
    } else {
      const scope = getActiveFocusScope()
      if (scope?.querySelector('#pause-overlay-title')) {
        closeTopmostModal()
      }
    }
  }, [onTogglePause])

  const handleDisconnect = useCallback(() => {
    const state = gameStateRef.current
    if (state) releaseAllLanes(state)
    if (onTogglePause && !hasActiveModal()) {
      onTogglePause()
    }
  }, [gameStateRef, onTogglePause])

  useGamepadActions(
    {
      onLane: handleLaneAction,
      onMenu: handleMenuAction,
      onDisconnect: handleDisconnect
    },
    { enabled: true, consumes: ['lane0', 'lane1', 'lane2', 'menu'] }
  )


  // Keyboard Event Handling
  useEffect(() => {
    // ⚡ Optimization: Pre-compute key-to-lane mapping to change O(N) array lookups
    // into O(1) Map lookups during the high-frequency keydown/keyup events.
    let cachedLanesArray: RhythmLane[] | null = null
    let keyToLaneMap = new Map<string, number>()

    const getLaneIndex = (key: string): number | undefined => {
      const currentLanes = gameStateRef.current?.lanes
      if (!currentLanes) {
        cachedLanesArray = null
        keyToLaneMap.clear()
        return undefined
      }
      // Invalidate cache if the array reference changes or doesn't match
      if (currentLanes !== cachedLanesArray) {
        cachedLanesArray = currentLanes
        keyToLaneMap = createKeyToLaneMap(currentLanes)
      }
      return keyToLaneMap.get(key)
    }

    // Keyup is intentionally not gated: a lane pressed before a dialog opened
    // must still release, or it would stay held.
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (hasActiveModal()) return
      handleKeyDownLogic({
        e,
        getLaneIndex,
        actions,
        triggerBandAnimation,
        onTogglePause,
        ensureAudioFromGesture
      })
    }

    const handleKeyUp = (e: KeyboardEvent): void =>
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

  // A keyup that happens while the window is unfocused never arrives, so a lane
  // held when focus is lost would stay lit. Lanes are per-mount state, so
  // scene teardown needs no release.
  useEffect(() => {
    const releaseHeldLanes = (): void => {
      const state = gameStateRef.current
      if (state) releaseAllLanes(state)
    }
    window.addEventListener('blur', releaseHeldLanes)
    return () => window.removeEventListener('blur', releaseHeldLanes)
  }, [gameStateRef])

  // Touch/Mouse Input Handlers for Columns
  /**
   * Handles touch/mouse input on a lane column.
   * @param index - Lane that should receive the input state.
   * @param active - Whether the lane is pressed or released.
   */
  const handleLaneInput = useCallback(
    (index: number, active: boolean) => {
      if (active) ensureAudioFromGesture()
      actions.registerInput(index, active)
      if (active) triggerBandAnimation(index)
    },
    [ensureAudioFromGesture, actions, triggerBandAnimation]
  )

  return { handleLaneInput }
}
