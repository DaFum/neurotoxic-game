import { HQ_ITEMS } from './hqItems.js'
import { UPGRADES_DB } from './upgrades.js'

// Design note: UPGRADES_DB (fame-based) and HQ_ITEMS (money-based) intentionally
// contain overlapping upgrade concepts (e.g. van_suspension / hq_van_suspension).
// This is a deliberate dual-currency design — the same capability can be unlocked
// through fame OR money at different price points.  Both sources are unified below
// into a single catalog for UI consumption; the IDs remain distinct.

const normalizeUpgradeShape = item => {
  return {
    ...item,
    effects: Array.isArray(item.effects)
      ? [...item.effects]
      : item.effect
        ? [item.effect]
        : []
  }
}

/**
 * Returns the active purchase catalog for the BandHQ upgrades tab.
 * Keeps source ownership explicit while exposing a single selector for UI usage.
 *
 * @returns {Array<object>} Unified list of upgrade/shop entries.
 */
export const getUnifiedUpgradeCatalog = () =>
  [
    ...HQ_ITEMS.van,
    ...HQ_ITEMS.hq,
    ...HQ_ITEMS.gear,
    ...HQ_ITEMS.instruments,
    ...UPGRADES_DB.van,
    ...UPGRADES_DB.instruments,
    ...UPGRADES_DB.marketing
  ].map(normalizeUpgradeShape)
