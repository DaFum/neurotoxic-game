import {
  getTotalDailyObligations,
  getActiveAssetModifiers
} from './assets/assetSelectors'
import { getAssetTotalUpkeep } from './assets/assetSelectors/assetFinancials'
import { getAssetSaleQuote } from './assets/assetSelectors/assetSaleQuote'
import type { GameState, PlayerState, BandState, SocialState } from '../types'

/**
 * Whether selling the asset drops a daily cost: its upkeep or a loan tied to it.
 *
 * @param asset - Asset under consideration for sale.
 * @param liabilities - Active liabilities keyed by id.
 * @returns True when the asset has upkeep or at least one attached liability.
 */
const saleRemovesObligation = (
  asset: NonNullable<GameState['assets']>[number],
  liabilities: GameState['liabilities']
): boolean => {
  if (getAssetTotalUpkeep(asset) > 0) return true
  const current = liabilities ?? {}
  for (const id in current) {
    if (Object.hasOwn(current, id) && current[id]?.assetId === asset.id) {
      return true
    }
  }
  return false
}

/**
 * Calculates the net sale value for all valid player assets.
 *
 * @remarks
 * Iterates over the player's assets to calculate the gross sale value on the given day,
 * subtracting any outstanding principal remaining on associated liabilities to determine
 * the true net yield if liquidated. Assets with a positive net yield are returned, and so
 * are zero-net assets whose sale sheds a loan or upkeep: the sell reducer accepts any
 * non-blocked quote, and dropping those daily costs can make a route affordable.
 *
 * @param assets - The current list of owned assets from the game state.
 * @param liabilities - The active liabilities dictionary mapping IDs to debt obligations.
 * @param playerDay - The current in-game day to determine depreciation and market value.
 * @returns An array containing the IDs and calculated net values of sellable assets.
 */
export const getSellableAssets = (
  assets: GameState['assets'],
  liabilities: GameState['liabilities'],
  playerDay: number
): { id: string; net: number }[] => {
  const sellableAssets: { id: string; net: number }[] = []

  if (assets) {
    for (const asset of assets) {
      const { net, blocked } = getAssetSaleQuote(asset, liabilities, playerDay)
      if (blocked || net < 0) continue
      if (net > 0 || saleRemovesObligation(asset, liabilities)) {
        sellableAssets.push({ id: asset.id, net })
      }
    }
  }

  return sellableAssets
}

/**
 * Evaluates possible financial scenarios arising from combinations of asset sales.
 *
 * @remarks
 * To evaluate softlock avoidance and strategic solvency, this evaluates permutations
 * of selling up to the 10 most profitable assets. It calculates the resulting immediate
 * cash proceeds alongside the adjusted ongoing daily obligations and active asset modifiers
 * that would persist after shedding the liquidated assets and their associated debts.
 *
 * @param sellableAssets - A list of assets with positive net yields, sorted to optimize permutations.
 * @param assets - The baseline list of currently owned assets.
 * @param liabilities - The current obligations mapping.
 * @param player - The core player state.
 * @param band - The band state influencing overall obligations.
 * @param social - The social connections influencing overall obligations.
 * @returns An array of simulated outcome scenarios, detailing proceeds and resulting daily financial pressure.
 */
export const getPostSaleScenarios = (
  sellableAssets: { id: string; net: number }[],
  assets: GameState['assets'],
  liabilities: GameState['liabilities'],
  player: PlayerState,
  band: BandState,
  social: SocialState
): {
  assetProceeds: number
  dailyObligations: number
  assetModifiers: import('../types/assets').AssetModifiers
}[] => {
  const postSaleScenarios: {
    assetProceeds: number
    dailyObligations: number
    assetModifiers: import('../types/assets').AssetModifiers
  }[] = []

  if (sellableAssets.length > 0 && assets) {
    sellableAssets.sort((a, b) => b.net - a.net)
    // coderabbit:ignore - The 10-asset cap intentionally bounds the exponential combination cost to 1023 iterations, which is acceptable on the travel path.
    const numAssets = Math.min(sellableAssets.length, 10)
    const numCombinations = 1 << numAssets

    // ⚡ BOLT OPTIMIZATION: Precompute bitmasks and net values for sellable assets
    // to eliminate up to 1,023 `comboAssetIds` array allocations and O(N) `.includes()`
    // linear array scans per iteration (~40k+ total array lookups eliminated per scenario evaluation).
    const sellableBitMap = Object.create(null) as Record<string, number>
    const assetNetValues = new Float64Array(numAssets)
    for (let j = 0; j < numAssets; j++) {
      const sa = sellableAssets[j]
      if (sa) {
        sellableBitMap[sa.id] = 1 << j
        assetNetValues[j] = sa.net
      }
    }

    for (let i = 1; i < numCombinations; i++) {
      let comboProceeds = 0
      for (let j = 0; j < numAssets; j++) {
        if ((i & (1 << j)) !== 0) {
          comboProceeds += assetNetValues[j] ?? 0
        }
      }

      const retainedAssets: typeof assets = []
      for (let k = 0, len = assets.length; k < len; k++) {
        const a = assets[k]
        if (a) {
          const bit = sellableBitMap[a.id]
          if (bit === undefined || (i & bit) === 0) {
            retainedAssets.push(a)
          }
        }
      }

      const retainedLiabilities = Object.create(null) as NonNullable<
        typeof liabilities
      >
      if (liabilities) {
        for (const key in liabilities) {
          if (Object.hasOwn(liabilities, key)) {
            const l = liabilities[key]
            if (l) {
              const bit = sellableBitMap[l.assetId]
              if (bit === undefined || (i & bit) === 0) {
                retainedLiabilities[key] = l
              }
            }
          }
        }
      }

      postSaleScenarios.push({
        assetProceeds: comboProceeds,
        dailyObligations: getTotalDailyObligations({
          player,
          band,
          social,
          assets: retainedAssets,
          liabilities: retainedLiabilities
        }),
        assetModifiers: getActiveAssetModifiers(retainedAssets)
      })
    }
  }

  return postSaleScenarios
}
