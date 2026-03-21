/**
 * (#1) Actual Updates:
 * - Extracted chatter polling, generation, and cleanup logic from ChatterOverlay.jsx.
 * - Created custom hook `useChatterLogic` to handle periodic background messages and state.
 *
 * (#2) Next Steps:
 * - Expand chatter events and conditions based on deeper game state metrics (e.g. harmony, fame).
 *
 * (#3) Found Errors + Solutions:
 * - Error: Component re-renders on every timeout tick.
 * - Solution: Used refs for gameState to separate UI updates from logical ticks.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { getRandomChatter } from '../data/chatter'
import { secureRandom } from '../utils/crypto.js'

let secureRandomFallbackWarned = false

const CHATTER_DELAY_MIN_MS = 8000
const CHATTER_DELAY_RANGE_MS = 17000

const resolveSpeaker = (fixedSpeaker, bandMembers, t) => {
  if (fixedSpeaker) return fixedSpeaker
  const memberNames = []
  if (bandMembers) {
    for (let i = 0; i < bandMembers.length; i++) {
      const name = bandMembers[i].name
      if (typeof name === 'string') {
        memberNames.push(name)
      }
    }
  }
  if (memberNames.length > 0) {
    let roll
    try {
      roll = secureRandom()
    } catch (error) {
      console.warn(
        'Crypto API not available, falling back to Math.random',
        error
      )
      roll = Math.random()
    }
    return memberNames[Math.floor(roll * memberNames.length)]
  }
  return t('ui:chatter_labels.default_speaker', { defaultValue: 'Band' })
}

export const useChatterLogic = (gameState, t) => {
  const stateRef = useRef(gameState)
  const [messages, setMessages] = useState([])

  const removeMessage = useCallback(id => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  useEffect(() => {
    stateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    let timeoutId
    let active = true

    const scheduleNext = () => {
      if (!active) return
      let delay
      try {
        delay = secureRandom() * CHATTER_DELAY_RANGE_MS + CHATTER_DELAY_MIN_MS
      } catch (error) {
        console.warn(
          'Crypto API not available, falling back to Math.random',
          error
        )
        delay = Math.random() * CHATTER_DELAY_RANGE_MS + CHATTER_DELAY_MIN_MS
      }

      timeoutId = setTimeout(() => {
        if (!active) return

        const currentState = stateRef.current
        const result = getRandomChatter(currentState)

        if (result) {
          const { text, speaker: fixedSpeaker, type } = result
          const members = currentState.band?.members
          const speaker = resolveSpeaker(fixedSpeaker, members, t)

          const generators = [
            () => (globalThis.crypto || window?.crypto)?.randomUUID(),
            () => secureRandom().toString(36).substring(2)
          ]
          let id
          for (const gen of generators) {
            try {
              id = gen()
              if (id) break
            } catch {
              // Try the next generator
            }
          }

          if (!id) {
            // Fallback to Math.random() if secureRandom is unavailable
            let roll
            try {
              roll = secureRandom()
            } catch (error) {
              if (!secureRandomFallbackWarned) {
                secureRandomFallbackWarned = true
                console.warn(
                  'secureRandom() failed, falling back to Math.random().',
                  error
                )
              }
              roll = Math.random()
            }
            id = `fallback-${Date.now().toString(36)}-${roll.toString(36).substring(2)}`
          }

          const newMessage = {
            id: String(id),
            text,
            speaker,
            type,
            scene: currentState.currentScene
          }

          setMessages(prev => [
            ...prev.slice(-4), // Keep max 5 (4 old + 1 new)
            newMessage
          ])
        }

        scheduleNext()
      }, delay)
    }

    // Pause scheduling when tab is hidden
    const handleVisibilityChange = () => {
      if (!active) return
      if (document.hidden) {
        clearTimeout(timeoutId)
        return
      }
      clearTimeout(timeoutId)
      scheduleNext()
    }

    scheduleNext()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [t])

  return { messages, removeMessage }
}
