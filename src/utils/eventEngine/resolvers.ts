import { finiteNumberOr } from '../gameState'
import { logger } from '../logger'
import { secureRandom } from '../crypto'
import { calculateAppliedDelta } from '../gameState'
import { buildTemplateContext } from './templateResolver'
import { eventEngine } from './eventEngineCore'
import { asNumber, clampMoneyChange, clampPercentageAmount } from './helpers'
import {
  getExpeditionProtectedCash,
  getExpeditionSpendableCash,
  withExpeditionSpendableCash
} from '../../domain/expedition/spendableCash'
import type { GameState } from '../../types'
import type { EffectShape, EngineGameState, EventChoice } from './types'

type MoneyCostOption = { effect?: unknown; effects?: unknown }

/** The money an option's direct effect(s) charge, as a non-negative number. */
const directMoneyCost = (
  option: MoneyCostOption,
  gameState: EngineGameState
): number => {
  // Priced against the real balance so a percentage cost is not read as zero.
  const total = getOptionPreviewMoney(option, gameState)
  return total !== null && total < 0 ? -total : 0
}

const optionKey = (option: EventChoice): string | undefined => {
  const record = option as { id?: unknown; label?: unknown }
  if (typeof record.id === 'string') return record.id
  return typeof record.label === 'string' ? record.label : undefined
}

/**
 * Whether an option's direct money cost may be paid during an active run.
 *
 * @param option - The option being offered or resolved.
 * @param gameState - Engine state snapshot, including the active event's options.
 * @returns False when the option charges money, protected cash would have to
 * cover it, and another option of the event can still be chosen; true otherwise.
 *
 * @remarks
 * Outside a run, or without protected cash, nothing changes. When protected
 * cash is in play, an option that pays can only be chosen from spendable cash,
 * so a partial payment can never buy the full reward. If every option of the
 * event is blocked this way the cost stays payable (clipped at the floor), so
 * an event can never leave the player with nothing to pick.
 */
export const isOptionAffordable = (
  option: EventChoice,
  gameState: EngineGameState
): boolean => {
  const cost = directMoneyCost(option, gameState)
  if (cost <= 0) return true
  const full = gameState as unknown as GameState
  if (getExpeditionProtectedCash(full) === 0) return true
  const spendable = getExpeditionSpendableCash(full)
  if (spendable >= cost) return true

  const view = withExpeditionSpendableCash(gameState)
  const ownKey = optionKey(option)
  const rawSiblings = gameState.activeEvent?.options
  const siblings = (
    Array.isArray(rawSiblings) ? rawSiblings : []
  ) as EventChoice[]
  return !siblings.some(sibling => {
    if (sibling === option) return false
    if (sibling.disabled) return false
    if (ownKey !== undefined && optionKey(sibling) === ownKey) return false
    if (sibling.condition && !sibling.condition(view)) return false
    return directMoneyCost(sibling, gameState) <= spendable
  })
}

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

  // An option whose direct cost protected cash would have to cover is refused
  // here, at resolution time, exactly as the modal disables it.
  const result = isOptionAffordable(choice, gameState)
    ? eventEngine.resolveChoice(choice, gameState, rng)
    : { outcome: 'rejected' }
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

  const ancestors = new WeakSet<object>()
  const visit = (eff: unknown): void => {
    if (!eff || typeof eff !== 'object' || ancestors.has(eff)) return
    ancestors.add(eff)
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
      const current = finiteNumberOr(gameState?.player?.money, 0)
      total += clampPercentageAmount(current, e.percentage, e.min, e.max)
      found = true
    }
    ancestors.delete(eff)
  }

  if (Array.isArray(option.effects)) {
    for (const child of option.effects) visit(child)
  }
  visit(option.effect)

  return found ? total : null
}
