import type { GameState } from '../../types'
import type { AssetSlot, LongTermAsset } from '../../types/assets'

const EMPTY_ASSETS: readonly LongTermAsset[] = []
const assetsMapCache = new WeakMap<
  readonly LongTermAsset[],
  ReadonlyMap<string, LongTermAsset>
>()
const assetSlotsCache = new WeakMap<
  readonly AssetSlot[],
  ReadonlyMap<string, AssetSlot>
>()

/**
 * Selects a memoized slot map keyed by slot id for a given asset.
 *
 * @param asset - The asset containing the slots.
 * @returns Map of slot id to AssetSlot, memoized by the slots array identity.
 */
export const selectAssetSlotsMap = (
  asset: LongTermAsset
): ReadonlyMap<string, AssetSlot> => {
  let cached = assetSlotsCache.get(asset.slots)
  if (!cached) {
    const map = new Map<string, AssetSlot>()
    for (const slot of asset.slots) {
      map.set(slot.id, slot)
    }
    cached = map
    assetSlotsCache.set(asset.slots, cached)
  }
  return cached
}

/**
 * Selects a memoized asset map keyed by asset id.
 *
 * @param state - State slice containing assets.
 * @returns Read-only map of asset id to asset, memoized by assets array identity.
 */
export const selectAssetsMap = (
  state: Pick<GameState, 'assets'>
): ReadonlyMap<string, LongTermAsset> => {
  const assets = state.assets ?? EMPTY_ASSETS
  let cached = assetsMapCache.get(assets)
  if (!cached) {
    const map = new Map<string, LongTermAsset>()
    for (const a of assets) {
      if (!map.has(a.id)) {
        map.set(a.id, a)
      }
    }
    cached = map
    assetsMapCache.set(assets, cached)
  }
  return cached
}
