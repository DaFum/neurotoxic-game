import { finiteNumberOr } from '../gameState'
import { isFiniteNumber } from '../finiteNumber'
import { logger } from '../logger'
import { getExpeditionSpendableCash } from '../../domain/expedition/spendableCash'
import type { GameState } from '../../types'
import type { EffectShape, EngineEvent, EngineGameState } from './types'

/**
 * Normalizes unknown numeric input for event-engine arithmetic.
 */
export const asNumber = (value: unknown): number => finiteNumberOr(value, 0)

/**
 * The balance a percentage money effect is taken of.
 *
 * @param gameState - Engine state snapshot; without a player slice nothing is
 * spendable.
 * @param runningDelta - Money the effects before this one already added or
 * removed.
 * @returns Spendable cash plus the running delta, never below 0.
 *
 * @remarks
 * During an active run protected Career Cash is not spendable, so a percentage
 * of the raw balance would charge it and the cash floor would then clip the
 * debit to the whole spendable slice. Outside a run this is the full balance.
 * Shared by the `percentage_resource` handler and the option preview, so the
 * price shown is the price charged.
 */
const getPercentageMoneyBase = (
  gameState: EngineGameState | null | undefined,
  runningDelta: unknown
): number => {
  const spendable = gameState?.player
    ? getExpeditionSpendableCash(gameState as unknown as GameState)
    : 0
  return Math.max(0, spendable + asNumber(runningDelta))
}

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
const clampPercentageAmount = (
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
 * The amount a `percentage_resource` money effect asks for, before the balance
 * clamp.
 *
 * @param gameState - Engine state snapshot; callers skip the effect without a
 * player slice.
 * @param runningDelta - Money the effects before this one already added or
 * removed.
 * @param eff - The effect's `percentage` and optional `min`/`max` bounds.
 * @returns The bounded percentage of spendable cash plus the running delta.
 */
export const getPercentageMoneyAmount = (
  gameState: EngineGameState,
  runningDelta: number,
  eff: EffectShape
): number =>
  clampPercentageAmount(
    getPercentageMoneyBase(gameState, runningDelta),
    eff.percentage,
    eff.min,
    eff.max
  )

/**
 * The money change a `percentage_resource` money effect applies.
 *
 * @param gameState - Engine state snapshot; callers skip the effect without a
 * player slice.
 * @param runningDelta - Money the effects before this one already added or
 * removed.
 * @param eff - The effect's `percentage` and optional `min`/`max` bounds.
 * @returns The change to add to the running delta, clamped so effective money
 * never drops below 0.
 *
 * @remarks
 * One implementation for the handler and the option preview, so the price
 * shown is the price charged.
 */
export const getPercentageMoneyChange = (
  gameState: EngineGameState,
  runningDelta: number,
  eff: EffectShape
): number => {
  const amount = getPercentageMoneyAmount(gameState, runningDelta, eff)
  const current = finiteNumberOr(gameState.player?.money, 0)
  return clampMoneyChange(current, runningDelta, amount)
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
