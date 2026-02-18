import { HQ_ITEMS } from './hqItems'
import { UPGRADES_DB } from './upgrades'

const normalizeUpgradeShape = item => {
  if (Array.isArray(item.effects)) {
    return item
  }

  return {
    ...item,
    effects: item.effect ? [item.effect] : []
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
