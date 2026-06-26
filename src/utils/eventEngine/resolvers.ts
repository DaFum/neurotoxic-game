import { finiteNumberOr } from '../gameState'
import { logger } from '../logger'
import { secureRandom } from '../crypto'
import { calculateAppliedDelta } from '../gameState'
import { buildTemplateContext } from './templateResolver'
import { eventEngine } from './eventEngineCore'
import { asNumber, clampMoneyChange } from './helpers'
import { isFiniteNumber } from '../finiteNumber'
import type { EffectShape, EngineGameState, EventChoice } from './types'

/**
 * Resolves an event choice into result and state delta payloads.
 *
 * @param choice - Event choice selected by the player.
 * @param gameState - Snapshot of the current game state.
 * @param rng - Random number generator. Defaults to `secureRandom`.
 * @returns Resolution payload.
 */
export const resolveEventChoice = (
  choice: EventChoice | null | undefined,
  gameState: EngineGameState | null | undefined,
  rng: () => number = secureRandom
) => {
  if (!choice || !gameState) {
    return {
      result: null,
      delta: null,
      appliedDelta: null,
      outcomeText: '',
      description: ''
    }
  }

  const result = eventEngine.resolveChoice(choice, gameState, rng)
  const delta = eventEngine.applyResult(
    result,
    buildTemplateContext(gameState.activeEvent?.context),
    gameState
  )

  let appliedDelta = null
  if (delta) {
    try {
      // Calculate appliedDelta via calculateAppliedDelta which only computes the
      // effective change (clamped) without mutating state.
      appliedDelta = calculateAppliedDelta(gameState, delta)
    } catch (e) {
      logger.error('EventEngine', 'Failed to preview applied delta', e)
    }
  }

  return {
    result,
    delta,
    appliedDelta,
    outcomeText:
      Object.hasOwn(choice, 'outcomeText') &&
      typeof choice.outcomeText === 'string'
        ? choice.outcomeText
        : '',
    description: String(result?.description ?? '')
  }
}

/**
 * Computes the deterministic money delta an option's direct effect(s) would
 * apply, for previewing the cost/reward inside a localized option label via an
 * `{{amount}}` interpolation. Mirrors the `resource` and `percentage_resource`
 * money handlers exactly (no RNG, so the preview is stable across renders).
 * Returns null when the option has no money-affecting effect, letting callers
 * fall back to a zero amount rather than leaking an unresolved placeholder.
 */
export const getOptionPreviewMoney = (
  option: { effect?: unknown; effects?: unknown } | null | undefined,
  gameState: EngineGameState | null | undefined
): number | null => {
  if (!option) return null

  let total = 0
  let found = false

  const visit = (eff: unknown): void => {
    if (!eff || typeof eff !== 'object') return
    const e = eff as EffectShape
    if (Array.isArray(e.effects)) {
      for (const child of e.effects) visit(child)
    }
    if (e.type === 'resource' && e.resource === 'money') {
      let change = asNumber(e.value)
      if (gameState) {
        const current = finiteNumberOr(gameState.player?.money, 0)
        change = clampMoneyChange(current, total, change)
      }
      total += change
      found = true
    } else if (e.type === 'percentage_resource' && e.resource === 'money') {
      const current = gameState?.player?.money ?? 0
      const percentage = asNumber(e.percentage)
      let amount = Math.round(current * (percentage / 100))
      let min = isFiniteNumber(e.min) ? e.min : undefined
      let max = isFiniteNumber(e.max) ? e.max : undefined
      if (min !== undefined && max !== undefined && min > max) {
        ;[min, max] = [max, min]
      }
      if (min !== undefined) amount = Math.max(min, amount)
      if (max !== undefined) amount = Math.min(max, amount)
      total += amount
      found = true
    }
  }

  if (Array.isArray(option.effects)) {
    for (const child of option.effects) visit(child)
  }
  visit(option.effect)

  return found ? total : null
}
