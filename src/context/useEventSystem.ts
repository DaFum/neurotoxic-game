import { type Dispatch, type MutableRefObject, useCallback } from 'react'
import type { TFunction } from 'i18next'
import { addUnlock } from '../utils/unlockManager'
import { eventEngine } from '../utils/eventEngine'
import { logger } from '../utils/logger'
import { GAME_PHASES } from './gameConstants'
import {
  createPopPendingEventAction,
  createSetActiveEventAction,
  createUpdatePlayerAction,
} from './actionCreators'
import { resolveEvent, type SideEffect } from '../domain/eventResolver'
import type { GameAction, GameState } from '../types/game'
import type { OptionalToastCallback } from '../types/callbacks'
import type { GamePhase } from '../types/game'

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
}

function runSideEffects(effects: SideEffect[], ctx: SideEffectContext): void {
  const { addToast, changeScene, saveGame, tRef } = ctx
  const t = tRef.current

  for (const effect of effects) {
    switch (effect.type) {
      case 'persistUnlock': {
        // We track if the unlock was newly added on the effect object temporarily
        // so that the unlockToast knows whether to show up.
        const added = addUnlock(effect.id)
        ;(effect as any)._added = added
        break
      }
      case 'unlockToast': {
        // Find the persistUnlock effect for the same id to see if it was newly added.
        // We rely on the fact that sideEffects are processed in order and persistUnlock precedes unlockToast.
        const persistEffect = effects.find(e => e.type === 'persistUnlock' && e.id === effect.id)
        const added = persistEffect ? (persistEffect as any)._added : true

        if (added) {
          const unlockKey = `unlocks:${effect.id}`
          const unlockLabel = t(unlockKey, { defaultValue: effect.id.toUpperCase() })
          addToast(
            t('ui:unlocked', {
              unlock: typeof unlockLabel === 'string' ? unlockLabel : String(unlockLabel),
            }),
            'success'
          )
        }
        break
      }
      case 'outcomeToast': {
        const msgOutcome = effect.outcomeKey ? t(effect.outcomeKey, effect.context) : ''
        const msgDesc = effect.descriptionKey ? t(effect.descriptionKey, effect.context) : ''
        const message = msgOutcome && msgDesc ? `${msgOutcome} ${msgDesc}` : msgOutcome || msgDesc
        if (message) {
          addToast(typeof message === 'string' ? message : String(message), 'info')
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
        saveGame(false, effect.state)
        break
      }
    }
  }
}

export function useEventSystem({
  stateRef,
  dispatch,
  addToast,
  changeScene,
  saveGame,
  tRef,
}: UseEventSystemParams) {
  const setActiveEvent = useCallback(
    (event: Parameters<typeof createSetActiveEventAction>[0]) =>
      dispatch(createSetActiveEventAction(event)),
    [dispatch]
  )

  const triggerEvent = useCallback(
    (category: string, triggerPoint: string | null = null) => {
      const currentState = stateRef.current
      if (currentState.currentScene === GAME_PHASES.GIG) return false
      if ((currentState.player?.eventsTriggeredToday ?? 0) >= 2) return false

      const event = eventEngine.checkEvent(category, currentState, triggerPoint)
      if (!event) return false

      const processedEvent = eventEngine.processOptions(event, currentState)
      if (!processedEvent) return false

      const processedEventId =
        typeof processedEvent.id === 'string' ? processedEvent.id : undefined

      setActiveEvent(processedEvent)
      dispatch(
        createUpdatePlayerAction({
          eventsTriggeredToday: (currentState.player?.eventsTriggeredToday ?? 0) + 1,
        })
      )

      if (
        typeof processedEventId === 'string' &&
        currentState.pendingEvents[0] === processedEventId
      ) {
        dispatch(createPopPendingEventAction())
      }
      return true
    },
    [dispatch, setActiveEvent, stateRef]
  )

  const resolveEventCallback = useCallback(
    (
      choice: Record<string, unknown> | null
    ): { outcomeText: string; description: string; result: unknown } => {
      try {
        const resolution = resolveEvent(choice, stateRef.current)
        resolution.actions.forEach(dispatch)
        runSideEffects(resolution.sideEffects, { addToast, changeScene, saveGame, tRef })
        return {
          outcomeText: resolution.outcomeText,
          description: resolution.description,
          result: resolution.result,
        }
      } catch (error) {
        logger.error('Event', 'Failed to resolve event choice:', error)
        addToast(tRef.current('ui:event_error'), 'error')
        dispatch(createSetActiveEventAction(null))
        return {
          outcomeText: (choice as Record<string, unknown> | null)?.outcomeText as string ?? '',
          description:
            typeof (choice as Record<string, unknown> | null)?.description === 'string'
              ? tRef.current((choice as Record<string, unknown>).description as string)
              : '',
          result: null,
        }
      }
    },
    [addToast, changeScene, dispatch, saveGame, setActiveEvent, stateRef, tRef]
  )

  return { setActiveEvent, triggerEvent, resolveEvent: resolveEventCallback }
}