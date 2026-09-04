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
import { getExpeditionSpendableCash } from './loadout'
import type { GameState } from '../../types'

/**
 * Condition bands the design specifies for decision-level readouts.
 */
const EXPEDITION_CONDITION_BANDS = {
  good: 70,
  worn: 40,
  critical: 20
} as const

/**
 * Semantic condition band shown next to the numeric value.
 */
type ExpeditionConditionBand = 'good' | 'worn' | 'critical' | 'breaking'

/**
 * Resolves a condition value into its semantic band.
 *
 * @param condition - Condition value in `0..100`.
 * @returns The band label.
 */
const getExpeditionConditionBand = (
  condition: number
): ExpeditionConditionBand => {
  const value = finiteNumberOr(condition, 0)
  if (value >= EXPEDITION_CONDITION_BANDS.good) return 'good'
  if (value >= EXPEDITION_CONDITION_BANDS.worn) return 'worn'
  if (value >= EXPEDITION_CONDITION_BANDS.critical) return 'critical'
  return 'breaking'
}

/**
 * Summarized equipment readiness for the run HUD.
 *
 * @param state - Current game state.
 * @returns Condition in `0..100`.
 *
 * @remarks
 * G1 reads the existing canonical `player.van.condition`. G2 extends this into
 * the summary across its Vehicle/PA/Instruments/Stage-Gear groups; keeping the
 * read in one place is what lets it do so without a second condition owner.
 */
const getExpeditionConditionSummary = (state: GameState): number =>
  Math.max(0, Math.min(100, finiteNumberOr(state.player.van?.condition, 0)))

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
const getExpeditionHeat = (_state: GameState): number => 0

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
    fuel: Math.max(0, Math.min(100, finiteNumberOr(state.player.van?.fuel, 0))),
    stamina: getExpeditionStamina(state),
    harmony: Math.max(
      0,
      Math.min(100, isFiniteNumber(state.band.harmony) ? state.band.harmony : 0)
    ),
    condition,
    conditionBand: getExpeditionConditionBand(condition),
    heat: Math.max(0, Math.min(100, getExpeditionHeat(state)))
  }
}
