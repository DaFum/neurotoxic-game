/**
 * The six permanent Expedition HUD resources.
 *
 * @remarks
 * The design deliberately keeps only six values permanently visible so the run
 * HUD never becomes a dashboard of ten bars. Every value here is read from its
 * existing canonical owner — `player.money`, `player.van`, the band roster,
 * `band.harmony` — rather than being mirrored into a second resource store.
 *
 * Two of the six have owners that arrive with a later gate. Each is read
 * through exactly one function below, which that gate extends in place:
 * `getExpeditionConditionSummary` becomes G2's PA/Instruments/Stage-Gear
 * summary, and `getExpeditionHeat` becomes G4's Pressure Heat. Adding a
 * `heat` field to the run state now would create the second Pressure authority
 * G4 would then have to unpick.
 */

import { finiteNumberOr, isFiniteNumber } from '../../utils/finiteNumber'
import { clampPercent } from '../../utils/gameState/clamps'
import { getExpeditionSpendableCash } from './loadout'
import {
  getExpeditionConditionSummary,
  getExpeditionConditionTier
} from './condition'
import type { GameState } from '../../types'
import { getEffectiveExpeditionRules } from './effectiveRules'

/**
 * Semantic condition band shown next to the numeric value.
 */
type ExpeditionConditionBand = 'good' | 'worn' | 'critical' | 'breaking'

/**
 * Resolves a condition value into its semantic band.
 *
 * @param condition - Condition value in `0..100`.
 * @returns The band label.
 *
 * @remarks
 * Thresholds come from `getExpeditionConditionTier`; the HUD does not tell a
 * nearly dead group from a dead one, so `breaking` covers both of those tiers.
 */
const getExpeditionConditionBand = (
  condition: number
): ExpeditionConditionBand => {
  const tier = getExpeditionConditionTier(condition)
  if (tier === 'healthy') return 'good'
  if (tier === 'worn' || tier === 'critical') return tier
  return 'breaking'
}

/**
 * Negative attention accumulated by the run.
 *
 * @param _state - Current game state.
 * @returns Heat in `0..100`.
 *
 * @remarks
 * G4 owns Pressure and extends this in place. It reports `0` until then rather
 * than being hidden, because the design fixes the permanent HUD at exactly
 * these six resources.
 */
const getExpeditionHeat = (state: GameState): number =>
  finiteNumberOr(state.expedition?.pressure?.heat, 0)

/**
 * The single write point for Heat.
 *
 * @param state - Current game state.
 * @param _heatDelta - Signed Heat change requested by a resolved event.
 * @returns The next state.
 *
 * @remarks
 * The counterpart to `getExpeditionHeat`, and extended in place by G4 for the
 * same reason: every Heat producer has to go through one function, or the first
 * one to need a store invents the second Pressure authority. Until G4 owns
 * Pressure there is no Heat field to write, so this returns the state
 * unchanged — the request is accepted and has no effect yet, exactly as the
 * read side reports `0`.
 */
export const applyExpeditionEventHeat = (
  state: GameState,
  heatDelta: number
): GameState => {
  if (!isFiniteNumber(heatDelta) || heatDelta === 0) return state
  const current = getExpeditionHeat(state)
  const multiplier =
    heatDelta > 0
      ? Math.max(
          0,
          finiteNumberOr(
            getEffectiveExpeditionRules(state).numeric.heatGainMultiplier,
            1
          )
        )
      : 1
  const heat = clampPercent(current + heatDelta * multiplier)
  if (heat === current) return state
  return {
    ...state,
    expedition: {
      ...state.expedition,
      pressure: { ...state.expedition.pressure, heat }
    }
  }
}

/**
 * Immediate physical performance capacity across the band.
 *
 * @param state - Current game state.
 * @returns Mean member stamina in `0..100`, or `0` for an empty roster.
 */
const getExpeditionStamina = (state: GameState): number => {
  const members = Array.isArray(state.band.members) ? state.band.members : []
  if (members.length === 0) return 0
  let total = 0
  for (const member of members) {
    total += finiteNumberOr(member?.stamina, 0)
  }
  return Math.round(total / members.length)
}

/**
 * The six permanently visible run resources.
 */
export interface ExpeditionRunResources {
  /** Cash the run may actually spend, i.e. excluding the protected slice. */
  cash: number
  /** Full player balance, shown alongside so the protected slice is legible. */
  totalCash: number
  protectedCash: number
  fuel: number
  stamina: number
  harmony: number
  condition: number
  conditionBand: ExpeditionConditionBand
  heat: number
}

/**
 * Reads the six permanent HUD resources.
 *
 * @param state - Current game state.
 * @returns The resource snapshot the run HUD renders.
 */
export const getExpeditionRunResources = (
  state: GameState
): ExpeditionRunResources => {
  const condition = getExpeditionConditionSummary(state)
  return {
    cash: getExpeditionSpendableCash(state),
    totalCash: Math.max(0, finiteNumberOr(state.player.money, 0)),
    protectedCash:
      state.expedition?.status === 'active'
        ? Math.max(0, finiteNumberOr(state.expedition.protectedCareerCash, 0))
        : 0,
    fuel: clampPercent(state.player.van?.fuel),
    stamina: getExpeditionStamina(state),
    harmony: clampPercent(state.band.harmony),
    condition,
    conditionBand: getExpeditionConditionBand(condition),
    heat: clampPercent(getExpeditionHeat(state))
  }
}
