import { HQ_ITEMS } from './hqItems.js'
import { UPGRADES_DB } from './upgrades.js'

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
    ...UPGRADES_DB.van,
    ...UPGRADES_DB.instruments,
    ...UPGRADES_DB.marketing
  ].map(normalizeUpgradeShape)
