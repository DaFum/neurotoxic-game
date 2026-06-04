import { useState, useEffect, useRef, useCallback } from 'react'
import { getRandomChatter } from '../data/chatter/index'
import { getSafeRandom, getSafeUUID } from '../utils/crypto'
import { logger } from '../utils/logger'
import type { BandMember } from '../types'
import type { TranslationCallback } from '../types/callbacks'
import type {
  ChatterGameState,
  ChatterMessageData,
  ChatterMessageType
} from '../types/components'

const CHATTER_DELAY_MIN_MS = 8000
const CHATTER_DELAY_RANGE_MS = 17000

interface ChatterTemplate {
  text: string
  speaker?: string
  type: ChatterMessageType
}

const resolveSpeaker = (
  fixedSpeaker: string | undefined,
  bandMembers: BandMember[] | undefined,
  t: TranslationCallback
): string => {
  if (fixedSpeaker) return fixedSpeaker
  const memberNames = []
  if (bandMembers) {
    for (let i = 0; i < bandMembers.length; i++) {
      const name = bandMembers[i]?.name
      if (typeof name === 'string') {
        memberNames.push(name)
      }
    }
  }
  if (memberNames.length > 0) {
    const roll = getSafeRandom()
    return (
      memberNames[Math.floor(roll * memberNames.length)] ??
      t('ui:chatter_labels.default_speaker', { defaultValue: 'Band' })
    )
  }
  return t('ui:chatter_labels.default_speaker', { defaultValue: 'Band' })
}

/**
 * Schedules scene-aware chatter messages for the active game state.
 * @param gameState - Current state snapshot used when selecting chatter lines.
 * @param t - Translation callback used for fallback speaker labels.
 * @returns Active chatter messages and a handler for dismissing a message by id.
 */
export const useChatterLogic = (
  gameState: ChatterGameState,
  t: TranslationCallback
) => {
  const stateRef = useRef<ChatterGameState>(gameState)
  const [messages, setMessages] = useState<ChatterMessageData[]>([])

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  useEffect(() => {
    stateRef.current = gameState
  }, [gameState])

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    let active = true

    const scheduleNext = () => {
      if (!active) return
      const delay =
        getSafeRandom() * CHATTER_DELAY_RANGE_MS + CHATTER_DELAY_MIN_MS

      timeoutId = setTimeout(() => {
        if (!active) return

        const currentState = stateRef.current
        let result: ChatterTemplate | null = null
        try {
          result = getRandomChatter(currentState) as ChatterTemplate | null
        } catch (error) {
          logger.error(
            'ChatterLogic',
            'getRandomChatter failed; continuing scheduler loop.',
            error
          )
        }

        if (result) {
          const { text, speaker: fixedSpeaker, type } = result
          const members = currentState.band?.members
          const speaker = resolveSpeaker(fixedSpeaker, members, t)

          const id = getSafeUUID()

          const newMessage = {
            id,
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
