import { gear } from './hqItems/gear'
import { instruments } from './hqItems/instruments'
import { van } from './hqItems/van'
import { hq } from './hqItems/hq'

/** HQ shop item catalog grouped by shop category. */
export const HQ_ITEMS = {
  gear,
  instruments,
  van,
  hq
}

/**
 * Flattened list of every HQ item across all categories.
 * Deliberate public utility for consumers that need flat iteration.
 * Precomputed once at module load to avoid repeated `Object.values(HQ_ITEMS).flat()` calls.
 */
export const ALL_HQ_ITEMS = [
  ...HQ_ITEMS.gear,
  ...HQ_ITEMS.instruments,
  ...HQ_ITEMS.van,
  ...HQ_ITEMS.hq
]

/**
 * Lookup map from `effect.item` (e.g. merch key like 'shirts') to the HQ item definition
 * that restocks it. Built once at module load to eliminate O(N) `.find()` scans on each
 * merch restock click / pregig render.
 */
export const HQ_ITEMS_BY_MERCH_KEY: ReadonlyMap<
  string,
  (typeof ALL_HQ_ITEMS)[number]
> = (() => {
  const map = new Map<string, (typeof ALL_HQ_ITEMS)[number]>()
  for (const item of ALL_HQ_ITEMS) {
    const effect = item.effect
    if (
      typeof effect === 'object' &&
      effect !== null &&
      Object.hasOwn(effect, 'item')
    ) {
      const key = (effect as { item?: unknown }).item
      if (typeof key === 'string' && !map.has(key)) {
        map.set(key, item)
      }
    }
  }
  return map
})()
