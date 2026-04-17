// TODO: Review this file
import { logger } from '../../utils/logger'
import { applyEventDelta } from '../../utils/gameStateUtils'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import type { EventDeltaPayload, GameEvent, GameState } from '../../types/game'

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

  return {
    ...nextState,
    band: traitResult.band,
    toasts: traitResult.toasts
  }
}

export const handlePopPendingEvent = (state: GameState): GameState => {
  return { ...state, pendingEvents: state.pendingEvents.slice(1) }
}

export const handleAddCooldown = (
  state: GameState,
  payload: string
): GameState => {
  if (payload && !state.eventCooldowns.includes(payload)) {
    return {
      ...state,
      eventCooldowns: [...state.eventCooldowns, payload]
    }
  }
  return state
}
