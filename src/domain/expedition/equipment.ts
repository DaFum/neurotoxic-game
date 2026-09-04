/**
 * Expedition performance-gear activation over already-owned HQ purchases.
 *
 * @remarks
 * The Expedition equipment axis is deliberately **not** a new ownership system.
 * `GEAR_LOOKUP`, `isItemOwned`, `band.inventory` and `player.van.upgrades` /
 * `player.hqUpgrades` stay the canonical purchase owners; a run only *activates*
 * up to {@link MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS} items the player already
 * bought. Selecting never mutates persistent ownership, and outside an
 * Expedition the existing global purchase semantics are untouched.
 *
 * The trade-off the design asks for comes from two places: the hard selection
 * cap here, and the technical-gear cargo slot each selected item consumes in G2.
 */

import {
  GEAR_LOOKUP,
  getPrimaryEffect,
  isItemOwned
} from '../../utils/purchaseLogicUtils'
import { isFiniteNumber } from '../../utils/finiteNumber'
import { MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS } from './defaults'
import type { GameState } from '../../types'
import type { PurchaseItem } from '../../types/components'

export { MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS }

/**
 * Gig-modifier stats a committed catalog item may contribute.
 *
 * @remarks
 * Scoped to the three `band.performance` stats the rhythm-game scoring path
 * actually reads. Catalog effects targeting `band` or `van` (luck, harmony,
 * van condition) are Career-wide purchase outcomes, not gig modifiers, and are
 * deliberately left to their existing global owners.
 */
const EXPEDITION_GEAR_PERFORMANCE_STATS = [
  'guitarDifficulty',
  'drumMultiplier',
  'crowdDecay'
] as const

/**
 * One `band.performance` stat an Expedition gear selection can move.
 */
type ExpeditionGearPerformanceStat =
  (typeof EXPEDITION_GEAR_PERFORMANCE_STATS)[number]

/**
 * Additive per-stat contribution of a set of catalog items.
 */
export type ExpeditionGearPerformanceDelta = Record<
  ExpeditionGearPerformanceStat,
  number
>

/**
 * Resolved Expedition equipment profile for the current run.
 */
export interface ExpeditionCommittedGearProfile {
  /** Every owned catalog id legal to select, ascending. */
  ownedGearItemIds: string[]
  /** The committed subset, in commitment order. */
  selectedGearItemIds: string[]
  /**
   * Delta to apply to the live `band.performance` so that only the *selected*
   * owned items contribute: `Σ(selected) − Σ(owned)`.
   *
   * @remarks
   * HQ purchases bake their stat modifier permanently into `band.performance`,
   * so neutralizing the unselected owned items is what makes the Expedition
   * selection a real choice rather than a cosmetic one. Contraband, traits and
   * every other performance source are untouched, because only catalog
   * contributions are subtracted.
   */
  performanceDelta: ExpeditionGearPerformanceDelta
}

const PERFORMANCE_STAT_SET: ReadonlySet<string> = new Set(
  EXPEDITION_GEAR_PERFORMANCE_STATS
)

const createEmptyDelta = (): ExpeditionGearPerformanceDelta => ({
  guitarDifficulty: 0,
  drumMultiplier: 0,
  crowdDecay: 0
})

/**
 * Canonical catalog items the Expedition equipment axis may draw from.
 *
 * @remarks
 * `GEAR_LOOKUP` is keyed by both item id and primary inventory key, so it is
 * deduplicated back to real catalog entries here. Only that identity is a legal
 * selection id — an inventory alias such as `neuroDecimator` must not be
 * selectable.
 */
const getPerformanceGearCatalog = (): PurchaseItem[] => {
  const seen = new Set<string>()
  const out: PurchaseItem[] = []
  for (const item of GEAR_LOOKUP.values()) {
    const id = item.id != null ? String(item.id) : null
    if (id === null || seen.has(id)) continue
    seen.add(id)
    out.push(item)
  }
  return out
}

/**
 * Resolves a selection id to its canonical catalog item.
 *
 * @param itemId - Candidate id from a build commitment.
 * @returns The catalog item whose own `id` matches, or `null`.
 *
 * @remarks
 * The `item.id === itemId` re-check rejects `GEAR_LOOKUP`'s inventory-key
 * aliases, so only a real catalog id can enter a commitment.
 */
export const resolveExpeditionGearItem = (
  itemId: unknown
): PurchaseItem | null => {
  if (typeof itemId !== 'string' || itemId.length === 0) return null
  const item = GEAR_LOOKUP.get(itemId)
  if (!item) return null
  return item.id != null && String(item.id) === itemId ? item : null
}

/**
 * Lists every owned catalog performance-gear id, ascending.
 *
 * @param state - Current game state; `player`/`band` remain the ownership owners.
 * @returns Sorted owned catalog ids legal to commit.
 */
export const getExpeditionOwnedPerformanceGear = (
  state: GameState
): string[] => {
  const owned: string[] = []
  for (const item of getPerformanceGearCatalog()) {
    if (!isItemOwned(item, state.player, state.band)) continue
    owned.push(String(item.id))
  }
  return owned.sort()
}

/**
 * Sums the `band.performance` contribution of a set of catalog ids.
 *
 * @param itemIds - Catalog ids to sum; unknown ids contribute nothing.
 * @returns Additive per-stat contribution.
 */
export const getExpeditionGearPerformanceContribution = (
  itemIds: readonly string[]
): ExpeditionGearPerformanceDelta => {
  const delta = createEmptyDelta()
  for (const itemId of itemIds) {
    const item = resolveExpeditionGearItem(itemId)
    if (!item) continue
    const effect = getPrimaryEffect(item)
    if (!effect || effect.type !== 'stat_modifier') continue
    // `applyStatModifier` routes anything that is not `player`/`band` into
    // `band.performance`, so the same default branch decides membership here.
    if (effect.target === 'player' || effect.target === 'band') continue
    const stat = effect.stat
    if (typeof stat !== 'string' || !PERFORMANCE_STAT_SET.has(stat)) continue
    if (!isFiniteNumber(effect.value)) continue
    delta[stat as ExpeditionGearPerformanceStat] += effect.value
  }
  return delta
}

/**
 * Resolves the committed Expedition gear profile for the current run.
 *
 * @param state - Current game state.
 * @returns Owned ids, the committed subset, and the performance delta.
 *
 * @remarks
 * Selection is read from the committed loadout, never from a caller argument,
 * so a UI cannot widen the active run's gear profile. Ids that are unknown,
 * unowned, duplicated, or beyond the cap are dropped rather than trusted; the
 * canonical build validator rejects such a commitment outright at START, and
 * this is the defense-in-depth read for an already-committed run.
 */
export const getExpeditionCommittedGearProfile = (
  state: GameState
): ExpeditionCommittedGearProfile => {
  const ownedGearItemIds = getExpeditionOwnedPerformanceGear(state)
  const ownedSet = new Set(ownedGearItemIds)
  const committed =
    state.expedition?.loadout?.build.equipment.selectedGearItemIds ?? []

  const selectedGearItemIds: string[] = []
  const seen = new Set<string>()
  for (const itemId of committed) {
    if (selectedGearItemIds.length >= MAX_EXPEDITION_PERFORMANCE_GEAR_ITEMS) {
      break
    }
    if (seen.has(itemId) || !ownedSet.has(itemId)) continue
    seen.add(itemId)
    selectedGearItemIds.push(itemId)
  }

  const selectedContribution =
    getExpeditionGearPerformanceContribution(selectedGearItemIds)
  const ownedContribution =
    getExpeditionGearPerformanceContribution(ownedGearItemIds)

  const performanceDelta = createEmptyDelta()
  for (const stat of EXPEDITION_GEAR_PERFORMANCE_STATS) {
    performanceDelta[stat] =
      selectedContribution[stat] - ownedContribution[stat]
  }

  return { ownedGearItemIds, selectedGearItemIds, performanceDelta }
}

/**
 * Applies a gear profile's delta to a live performance snapshot.
 *
 * @param performance - Live `band.performance`-shaped values (plus any extras).
 * @param delta - Delta produced by {@link getExpeditionCommittedGearProfile}.
 * @returns A new object with the three gig-modifier stats adjusted.
 *
 * @remarks
 * `crowdDecay`/`drumMultiplier` are multipliers whose neutral value is `1`, and
 * `guitarDifficulty` is a divisor with the same neutral value, so each is
 * floored at zero: a hostile or retuned catalog must not be able to drive a
 * scoring divisor negative.
 */
export const applyExpeditionGearPerformanceDelta = <
  T extends Partial<Record<ExpeditionGearPerformanceStat, number>>
>(
  performance: T,
  delta: ExpeditionGearPerformanceDelta
): T => {
  const next = { ...performance }
  for (const stat of EXPEDITION_GEAR_PERFORMANCE_STATS) {
    if (delta[stat] === 0) continue
    const base = isFiniteNumber(performance[stat]) ? performance[stat] : 1
    next[stat] = Math.max(0, base + delta[stat]) as T[typeof stat]
  }
  return next
}
