import { finiteNumberOr } from '../gameState'
import { isFiniteNumber } from '../finiteNumber'
import { logger } from '../logger'
import type { EngineEvent, EngineGameState } from './types'

/**
 * Normalizes unknown numeric input for event-engine arithmetic.
 */
export const asNumber = (value: unknown): number => finiteNumberOr(value, 0)

/**
 * Computes a percentage-of-resource change, clamped by optional min/max bounds.
 *
 * For negative amounts, `min` acts as the maximum *loss* (a floor for the
 * value, enforced via Math.max) and `max` acts as the minimum *loss* (a
 * ceiling, enforced via Math.min); the pair is swapped if `min > max`. Only
 * finite min/max bounds apply (`isFiniteNumber`) — NaN/Infinity bounds are
 * ignored rather than corrupting the result.
 *
 * @param current - Current resource value the percentage is taken of.
 * @param percentage - Raw percentage (coerced via `asNumber`).
 * @param min - Optional lower bound on the computed amount.
 * @param max - Optional upper bound on the computed amount.
 * @returns The clamped, rounded amount to apply.
 */
export const clampPercentageAmount = (
  current: number,
  percentage: unknown,
  min: unknown,
  max: unknown
): number => {
  let amount = Math.round(current * (asNumber(percentage) / 100))
  let lo = isFiniteNumber(min) ? min : undefined
  let hi = isFiniteNumber(max) ? max : undefined
  if (lo !== undefined && hi !== undefined && lo > hi) {
    ;[lo, hi] = [hi, lo]
  }
  if (lo !== undefined) amount = Math.max(lo, amount)
  if (hi !== undefined) amount = Math.min(hi, amount)
  return amount
}

/**
 * Clamps a raw money change to prevent intermediate debt from swallowing subsequent gains.
 * @param current - Current money in game state.
 * @param runningDelta - Accumulating money change delta.
 * @param rawChange - Raw change from the effect.
 * @returns The clamped change that won't drop effective money below 0.
 */
export const clampMoneyChange = (
  current: number,
  runningDelta: number,
  rawChange: number
): number => {
  if (current + runningDelta + rawChange < 0) {
    return -(current + runningDelta)
  }
  return rawChange
}

/**
 * Converts optional arrays or sets into a string array.
 */
export const toStringArray = (
  value: string[] | Set<string> | undefined
): string[] => {
  if (!value) return []
  return Array.isArray(value) ? value : Array.from(value)
}

/**
 * Logs event condition and processing failures.
 */
export const logEventError = (err: unknown, eventId?: string) => {
  logger.error(
    'EventEngine',
    `Condition check failed for event ${eventId || 'unknown'}`,
    err
  )
}

/**
 * Runs an event condition and returns the event with template context when eligible.
 */
export const processEvent = (
  event: EngineEvent,
  optimizedState: EngineGameState
) => {
  try {
    if (typeof event.condition !== 'function') {
      logEventError(
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
    logEventError(err, event.id)
  }
  return null
}
