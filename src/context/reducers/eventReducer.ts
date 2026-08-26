import { logger } from '../../utils/logger'
import {
  applyEventDelta,
  finiteNumberOr,
  isFiniteNumber,
  isForbiddenKey
} from '../../utils/gameState'
import { checkTraitUnlocks } from '../../utils/unlockCheck'
import { applyTraitUnlocks } from '../../utils/traitUtils'
import { QuestEvents } from '../../utils/questProgress'
import { createStoryFlagAddedQuestEvent } from '../../quests/producers/storyQuestEvents'
import {
  createFameGainedQuestEvent,
  createMoneyEarnedQuestEvent
} from '../../quests/producers/economyQuestEvents'
import { getRegionKeyForLocation } from '../../utils/mapUtils'
import { GAME_PHASES } from '../gameConstants'
import type {
  EventDeltaPayload,
  GameEvent,
  GameState,
  PopPendingEventPayload
} from '../../types'

/**
 * Sets or clears the active event.
 *
 * @param state - Current game state.
 * @param payload - Event to activate, or null to clear.
 * @returns State with updated active event.
 */
export const handleSetActiveEvent = (
  state: GameState,
  payload: GameEvent | null
): GameState => {
  if (payload) {
    logger.info('GameState', 'Event Triggered', payload.title)
  }
  return { ...state, activeEvent: payload }
}

/**
 * Toggles screenshot mode.
 *
 * @remarks
 * Reducers stay authoritative over their own payloads, so a non-boolean is
 * coerced rather than trusted: the flag only ever gates event rolls, and a
 * truthy object must not leave the game in a half-disabled state.
 *
 * @param state - Current game state.
 * @param payload - Desired screenshot-mode flag.
 * @returns State with screenshot mode applied.
 */
export const handleSetScreenshotMode = (
  state: GameState,
  payload: boolean
): GameState => ({ ...state, isScreenshotMode: payload === true })

/**
 * Applies an event delta and emits trait/story/economy quest side effects.
 *
 * @remarks
 * Money and fame quest events are emitted here rather than at the call sites
 * that build the delta, so every event-driven gain feeds `economy.moneyEarned`
 * / `fame.gained`. The amounts are the *effective* gains measured against the
 * committed state, so an increase the clamps absorb — a sub-unit amount lost to
 * the integer floor, or a rise back toward the non-negative floor — reports
 * nothing. Fame is stamped with the region the player was in when the event
 * resolved, not the destination of a relocating delta.
 *
 * @param state - Current game state.
 * @param payload - Event delta to apply.
 * @returns Updated state after event effects and derived unlock/quest events.
 */
export const handleApplyEventDelta = (
  state: GameState,
  payload: EventDeltaPayload
): GameState => {
  logger.info('GameState', 'Applying Event Delta', payload)
  const appliedState = applyEventDelta(state, payload)
  const currentGigEventScore = finiteNumberOr(state.gigEventScoreDelta, 0)
  const nextState =
    state.currentScene === GAME_PHASES.GIG && isFiniteNumber(payload.score)
      ? {
          ...appliedState,
          gigEventScoreDelta: finiteNumberOr(
            currentGigEventScore + payload.score,
            currentGigEventScore
          )
        }
      : appliedState

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

  // Measure against `nextState`, before quest rewards can move the same
  // counters, so completing a fame-rewarding quest cannot re-feed itself.
  const moneyGain =
    finiteNumberOr(nextState.player?.money, 0) -
    finiteNumberOr(state.player?.money, 0)
  if (moneyGain > 0) {
    resultState = QuestEvents.emit(
      resultState,
      createMoneyEarnedQuestEvent({
        amount: moneyGain,
        reason: 'event_delta'
      })
    )
  }

  const fameGain =
    finiteNumberOr(nextState.player?.fame, 0) -
    finiteNumberOr(state.player?.fame, 0)
  if (fameGain > 0) {
    resultState = QuestEvents.emit(
      resultState,
      createFameGainedQuestEvent({
        amount: fameGain,
        region: getRegionKeyForLocation(state.player?.location) ?? 'Unknown',
        reason: 'event_delta'
      })
    )
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

/**
 * Removes one pending event id from the queue.
 *
 * @param state - Current game state.
 * @param payload - Optional id of the played event. Omit to drop the head.
 * @returns State with that entry removed, or the original state when the id is
 * not queued.
 *
 * @remarks
 * Selection may skip an ineligible head and play a later entry, so the played
 * event is not always at index 0. Only the first occurrence is removed: a
 * duplicated id stays queued and is re-evaluated, which is what its own
 * condition is there to decide.
 */
export const handlePopPendingEvent = (
  state: GameState,
  payload?: PopPendingEventPayload
): GameState => {
  const eventId = payload?.eventId
  if (typeof eventId !== 'string' || eventId.length === 0) {
    return { ...state, pendingEvents: state.pendingEvents.slice(1) }
  }

  const index = state.pendingEvents.indexOf(eventId)
  if (index === -1) return state

  return {
    ...state,
    pendingEvents: [
      ...state.pendingEvents.slice(0, index),
      ...state.pendingEvents.slice(index + 1)
    ]
  }
}

/**
 * Adds an event cooldown key when it is valid and not already present.
 *
 * @param state - Current game state.
 * @param payload - Cooldown key to add.
 * @returns State with updated cooldowns, or the original state when rejected.
 */
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
