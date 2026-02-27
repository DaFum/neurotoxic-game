import { logger } from '../../utils/logger.js'
import { applyEventDelta } from '../../utils/gameStateUtils.js'
import { checkTraitUnlocks } from '../../utils/unlockCheck.js'
import { applyTraitUnlocks } from '../../utils/traitUtils.js'

export const handleSetActiveEvent = (state, payload) => {
  if (payload) {
    logger.info('GameState', 'Event Triggered', payload.title)
  }
  return { ...state, activeEvent: payload }
}

export const handleApplyEventDelta = (state, payload) => {
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

export const handlePopPendingEvent = state => {
  return { ...state, pendingEvents: state.pendingEvents.slice(1) }
}

export const handleAddCooldown = (state, payload) => {
  if (payload && !state.eventCooldowns.includes(payload)) {
    return {
      ...state,
      eventCooldowns: [...state.eventCooldowns, payload]
    }
  }
  return state
}
