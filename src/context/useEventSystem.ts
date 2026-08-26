import {
  type Dispatch,
  type MutableRefObject,
  useCallback,
  useRef
} from 'react'
import type { TFunction } from 'i18next'
import { addUnlock } from '../utils/unlockManager'
import { KNOWN_EVENT_IDS } from '../data/events'
import { eventEngine } from '../utils/eventEngine'
import { logger } from '../utils/logger'
import { GAME_PHASES } from './gameConstants'
import { gameReducer } from './gameReducer'
import {
  createPopPendingEventAction,
  createSetActiveEventAction,
  createSetScreenshotModeAction,
  createUpdatePlayerAction
} from './actionCreators'
import { resolveEvent, type SideEffect } from '../domain/eventResolver'
import { useClock } from './ClockContext'
import { useStorage } from './StorageContext'
import type { GameAction, GameState } from '../types'
import type { IStorageAdapter } from '../utils/storageAdapter'
import type { OptionalToastCallback } from '../types/callbacks'
import type { GamePhase } from '../types'

type ChangeScene = (scene: GamePhase) => void
type SaveGame = (showToast?: boolean, stateSnapshot?: GameState) => void

type UseEventSystemParams = {
  stateRef: MutableRefObject<GameState>
  dispatch: Dispatch<GameAction>
  addToast: OptionalToastCallback
  changeScene: ChangeScene
  saveGame: SaveGame
  tRef: MutableRefObject<TFunction>
}

type SideEffectContext = {
  addToast: OptionalToastCallback
  changeScene: ChangeScene
  saveGame: SaveGame
  tRef: MutableRefObject<TFunction>
  /**
   * Storage adapter that event-earned unlocks are written through. Must be the
   * same adapter `usePersistence` saves and loads with: letting this fall back
   * to the module default would write unlocks to one backend while the save
   * that references them lives in another.
   */
  storage: IStorageAdapter
  /**
   * Materializes the post-resolution state snapshot for `saveGame` effects by
   * replaying the resolution's actions through the reducer (the dispatch above
   * has not re-rendered yet, so `stateRef` still holds the pre-event state).
   * The replayed handlers must stay deterministic — a nondeterministic handler
   * would make the saved snapshot silently diverge from live state.
   */
  getResolvedState: () => GameState
}

function choiceTextFallback(choice: Record<string, unknown> | null): {
  outcomeText: string
  description: string
} {
  return {
    outcomeText:
      choice &&
      Object.hasOwn(choice, 'outcomeText') &&
      typeof choice.outcomeText === 'string'
        ? choice.outcomeText
        : '',
    description:
      choice &&
      Object.hasOwn(choice, 'description') &&
      typeof choice.description === 'string'
        ? choice.description
        : ''
  }
}

function runSideEffects(effects: SideEffect[], ctx: SideEffectContext): void {
  const { addToast, changeScene, saveGame, tRef, storage, getResolvedState } =
    ctx
  const t = tRef.current
  const newlyAddedUnlocks = new Set<string>()

  for (const effect of effects) {
    switch (effect.type) {
      case 'persistUnlock': {
        if (addUnlock(effect.id, storage)) {
          newlyAddedUnlocks.add(effect.id)
        }
        break
      }
      case 'unlockToast': {
        // This relies on `persistUnlock` for the same ID being processed first,
        // which is guaranteed by `resolveEvent`.
        if (newlyAddedUnlocks.has(effect.id)) {
          const unlockKey = `unlocks:${effect.id}`
          const unlockLabel = t(unlockKey, {
            defaultValue: effect.id.toUpperCase()
          })
          addToast(
            t('ui:unlocked', {
              unlock:
                typeof unlockLabel === 'string'
                  ? unlockLabel
                  : String(unlockLabel)
            }),
            'success'
          )
        }
        break
      }
      case 'outcomeToast': {
        if (!effect.outcomeKey && !effect.descriptionKey) {
          logger.warn(
            'EventSystem',
            'Skipping outcomeToast: both keys are empty',
            { effect, context: effect.context }
          )
          break
        }
        const msgOutcome = effect.outcomeKey
          ? t(effect.outcomeKey, effect.context)
          : ''
        const msgDesc = effect.descriptionKey
          ? t(effect.descriptionKey, effect.context)
          : ''
        const message =
          msgOutcome && msgDesc
            ? `${msgOutcome} ${msgDesc}`
            : msgOutcome || msgDesc
        if (message) {
          addToast(
            typeof message === 'string' ? message : String(message),
            'info'
          )
        }
        break
      }
      case 'gameOverToast': {
        const translatedDesc = effect.descriptionKey
          ? t(effect.descriptionKey, effect.context)
          : ''
        addToast(t('ui:game_over', { description: translatedDesc }), 'error')
        break
      }
      case 'changeScene': {
        changeScene(effect.scene)
        break
      }
      case 'saveGame': {
        saveGame(false, getResolvedState())
        break
      }
      default: {
        // Exhaustiveness check
        const _exhaustiveCheck: never = effect
        logger.warn('EventSystem', 'Unhandled side effect type', {
          effect: _exhaustiveCheck as unknown
        })
      }
    }
  }
}

/**
 * Builds event selection and resolution callbacks for the game state provider.
 *
 * @param params - Current state ref, dispatch, side-effect callbacks, save callback, and translator ref.
 * @returns Stable callbacks for setting, triggering, and resolving game events.
 */
export function useEventSystem({
  stateRef,
  dispatch,
  addToast,
  changeScene,
  saveGame,
  tRef
}: UseEventSystemParams) {
  const clock = useClock()
  const storage = useStorage()

  const setActiveEvent = useCallback(
    (event: Parameters<typeof createSetActiveEventAction>[0]) =>
      dispatch(createSetActiveEventAction(event)),
    [dispatch]
  )

  const setScreenshotMode = useCallback(
    (enabled: boolean) => dispatch(createSetScreenshotModeAction(enabled)),
    [dispatch]
  )

  // Queue instance that already received a drain pop. Callers chain
  // triggerEvent fallbacks synchronously against the same stale stateRef
  // snapshot; without this guard each chained call would pop again and
  // remove valid pending events behind the unknown head.
  const drainedQueueRef = useRef<unknown>(null)

  const triggerEvent = useCallback(
    (category: string, triggerPoint: string | null = null) => {
      const currentState = stateRef.current
      // gig_intro / gig_mid events are the one class that fires DURING the gig:
      // the rhythm loop pauses the audio while `activeEvent` is set (see
      // processRhythmGameTick). They are tied to the gig moment rather than the
      // daily random-event budget, so they bypass both the GIG-scene block and
      // the per-day cap that gate every other event.
      const isGigTrigger =
        triggerPoint === 'gig_intro' || triggerPoint === 'gig_mid'
      if (!isGigTrigger) {
        if (currentState.currentScene === GAME_PHASES.GIG) return false
        if ((currentState.player?.eventsTriggeredToday ?? 0) >= 2) return false
      }

      // Drain orphaned queue heads: an id that exists in no event pool can
      // never be selected, and while selection now scans past it, leaving it
      // queued would keep it at index 0 for the rest of the run.
      const pendingHead = currentState.pendingEvents?.[0]
      if (
        typeof pendingHead === 'string' &&
        !KNOWN_EVENT_IDS.has(pendingHead)
      ) {
        if (drainedQueueRef.current !== currentState.pendingEvents) {
          drainedQueueRef.current = currentState.pendingEvents
          logger.warn(
            'EventSystem',
            `Dropping unknown pending event id: ${pendingHead}`
          )
          dispatch(createPopPendingEventAction())
        }
        // Stop here rather than selecting against the stale snapshot: the
        // caller retries once the queue is drained.
        return false
      }

      const event = eventEngine.checkEvent(category, currentState, triggerPoint)
      if (!event) return false

      const processedEvent = eventEngine.processOptions(event, currentState)
      if (!processedEvent) return false

      const processedEventId =
        typeof processedEvent.id === 'string' ? processedEvent.id : undefined

      setActiveEvent(processedEvent)
      // Gig events are exempt from the daily budget, so they don't consume it.
      if (!isGigTrigger) {
        dispatch(
          createUpdatePlayerAction({
            eventsTriggeredToday:
              (currentState.player?.eventsTriggeredToday ?? 0) + 1
          })
        )
      }

      // Selection may skip an ineligible head, so the played event is not
      // necessarily the head — remove it by id wherever it sits.
      if (
        typeof processedEventId === 'string' &&
        currentState.pendingEvents.includes(processedEventId)
      ) {
        dispatch(createPopPendingEventAction(processedEventId))
      }
      return true
    },
    [dispatch, setActiveEvent, stateRef]
  )

  const resolveEventCallback = useCallback(
    (
      choice: Record<string, unknown> | null
    ): { outcomeText: string; description: string; result: unknown } => {
      if (!stateRef.current.activeEvent) {
        return { ...choiceTextFallback(choice), result: null }
      }
      try {
        const resolution = resolveEvent(choice, stateRef.current, clock)
        // ⚡ BOLT OPTIMIZATION: Replaced .forEach() and .reduce() with procedural loops to avoid callback-invocation overhead on the event resolution hot path.
        // Why: Eliminates callback-invocation overhead during state materialization.
        // Impact: Speeds up event processing slightly by avoiding function calls per element.
        let resolvedStateSnapshot = stateRef.current
        for (let i = 0; i < resolution.actions.length; i++) {
          const action = resolution.actions[i]
          if (action) {
            resolvedStateSnapshot = gameReducer(resolvedStateSnapshot, action)
            dispatch(action)
          }
        }
        runSideEffects(resolution.sideEffects, {
          addToast,
          changeScene,
          saveGame,
          tRef,
          storage,
          getResolvedState: () => resolvedStateSnapshot
        })
        return {
          outcomeText: resolution.outcomeText,
          description: resolution.description,
          result: resolution.result
        }
      } catch (error) {
        logger.error('Event', 'Failed to resolve event choice:', error)
        addToast(tRef.current('ui:event_error'), 'error')
        setActiveEvent(null)
        return { ...choiceTextFallback(choice), result: null }
      }
    },
    [
      addToast,
      changeScene,
      clock,
      dispatch,
      saveGame,
      setActiveEvent,
      stateRef,
      storage,
      tRef
    ]
  )

  return {
    setActiveEvent,
    setScreenshotMode,
    triggerEvent,
    resolveEvent: resolveEventCallback
  }
}
