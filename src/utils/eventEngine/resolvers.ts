import { logger } from '../logger'
import { secureRandom } from '../crypto'
import { calculateAppliedDelta } from '../gameStateUtils'
import { buildTemplateContext } from './templateResolver'
import { eventEngine } from './eventEngineCore'
import { asNumber } from './helpers'
import type { EffectShape, EngineGameState, EventChoice } from './types'

/**
 * Resolves an event choice into result and state delta payloads.
 *
 * @param {object} choice - Event choice selected by the player.
 * @param {object} gameState - Snapshot of the current game state.
 * @param {function} [rng=secureRandom] - Random number generator.
 * @returns {{ result: object | null, delta: object | null, outcomeText: string, description: string }} Resolution payload.
 */
export const resolveEventChoice = (
  choice: EventChoice | null | undefined,
  gameState: EngineGameState | null | undefined,
  rng: () => number = secureRandom
) => {
  if (!choice || !gameState) {
    return { result: null, delta: null, outcomeText: '', description: '' }
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
    outcomeText: choice.outcomeText ?? '',
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
      total += asNumber(e.value)
      found = true
    } else if (e.type === 'percentage_resource' && e.resource === 'money') {
      const current = gameState?.player?.money ?? 0
      const percentage = asNumber(e.percentage)
      let amount = Math.round(current * (percentage / 100))
      let min =
        typeof e.min === 'number' && Number.isFinite(e.min) ? e.min : undefined
      let max =
        typeof e.max === 'number' && Number.isFinite(e.max) ? e.max : undefined
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