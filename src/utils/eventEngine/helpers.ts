import { finiteNumberOr } from '../gameStateUtils'
import { logger } from '../logger'
import type { EngineEvent, EngineGameState } from './types'

export const asNumber = (value: unknown): number => finiteNumberOr(value, 0)

export const toStringArray = (value: string[] | Set<string> | undefined): string[] => {
  if (!value) return []
  return Array.isArray(value) ? value : Array.from(value)
}

export const handleError = (err: unknown, eventId?: string) => {
  logger.error(
    'EventEngine',
    `Condition check failed for event ${eventId || 'unknown'}`,
    err
  )
}

export const processEvent = (event: EngineEvent, optimizedState: EngineGameState) => {
  try {
    if (typeof event.condition !== 'function') {
      handleError(
        new TypeError(
          `Invalid condition for event ${event.id}: expected function`
        ),
        event.id
      )
      return null
    }
    const condResult = event.condition(optimizedState)
    if (condResult) {
      return {
        event: event,
        contextvars:
          condResult && typeof condResult === 'object'
            ? (condResult as Record<string, string>)
            : {}
      }
    }
  } catch (err) {
    handleError(err, event.id)
  }
  return null
}
