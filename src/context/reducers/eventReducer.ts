import { logger } from '../../utils/logger'
import { applyEventDelta, isForbiddenKey } from '../../utils/gameStateUtils'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { QuestEvents } from '../../utils/questProgress'
import { createStoryFlagAddedQuestEvent } from '../../quests/producers/storyQuestEvents'
import type { EventDeltaPayload, GameEvent, GameState } from '../../types'

export const handleSetActiveEvent = (
  state: GameState,
  payload: GameEvent | null
): GameState => {
  if (payload) {
    logger.info('GameState', 'Event Triggered', payload.title)
  }
  return { ...state, activeEvent: payload }
}

export const handleApplyEventDelta = (
  state: GameState,
  payload: EventDeltaPayload
): GameState => {
  logger.info('GameState', 'Applying Event Delta', payload)
  const nextState = applyEventDelta(state, payload)

  const eventUnlocks = checkTraitUnlocks(nextState, {
    type: 'EVENT_RESOLVED'
  })
  const traitResult = applyTraitUnlocks(
    { band: nextState.band, toasts: nextState.toasts },
    eventUnlocks
  )

  let resultState: GameState = {
    ...nextState,
    band: traitResult.band,
    toasts: traitResult.toasts
  }

  const priorFlags = new Set(
    Array.isArray(state.activeStoryFlags) ? state.activeStoryFlags : []
  )
  const addedFlags = Array.isArray(resultState.activeStoryFlags)
    ? resultState.activeStoryFlags.filter(flag => !priorFlags.has(flag))
    : []
  for (const flag of addedFlags) {
    resultState = QuestEvents.emit(
      resultState,
      createStoryFlagAddedQuestEvent({ flag })
    )
  }

  return resultState
}

export const handlePopPendingEvent = (state: GameState): GameState => {
  return { ...state, pendingEvents: state.pendingEvents.slice(1) }
}

export const handleAddCooldown = (
  state: GameState,
  payload: string
): GameState => {
  if (
    typeof payload === 'string' &&
    payload.length > 0 &&
    !isForbiddenKey(payload) &&
    !state.eventCooldowns.includes(payload)
  ) {
    return {
      ...state,
      eventCooldowns: [...state.eventCooldowns, payload]
    }
  }
  return state
}
