import type { ConsumableRecovery } from '../types/restRecovery'
import { CONTRABAND_BY_ID } from '../data/contraband'
import { INVENTORY_USE_EFFECTS } from '../data/inventoryItems'
import { getStashStackCount } from './contrabandStashUtils'
import { finiteNumberOr } from './finiteNumber'
import { clampPlayerMoney } from './gameState/clamps'
import { isForbiddenKey } from './objectUtils'
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
 * the true net yield if liquidated. By default zero-net sales are included when
 * they remove an obligation; the expanded search includes every legal sale.
 *
 * @param assets - The current list of owned assets from the game state.
 * @param liabilities - The active liabilities dictionary mapping IDs to debt obligations.
 * @param playerDay - The current in-game day to determine depreciation and market value.
 * @param options - Whether to include all legal zero-net sales.
 * @returns An array containing the IDs and calculated net values of sellable assets.
 */
export const getSellableAssets = (
  assets: GameState['assets'],
  liabilities: GameState['liabilities'],
  playerDay: number,
  options: { includeAllZeroNet?: boolean } = {}
): { id: string; net: number }[] => {
  const sellableAssets: { id: string; net: number }[] = []

  if (assets) {
    for (const asset of assets) {
      const { net, blocked } = getAssetSaleQuote(asset, liabilities, playerDay)
      if (blocked || net < 0) continue
      if (
        net > 0 ||
        options.includeAllZeroNet ||
        saleRemovesObligation(asset, liabilities)
      ) {
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
 * of selling up to the 10 most profitable assets. With the optional expanded
 * search, it considers every combination when at most four candidates remain.
 * With more than four, it checks each remaining sale alone and paired with
 * each of the 10, and all remaining sales together with every subset of the 10.
 * The latter search does not exhaust combinations of the remaining sales.
 * It calculates the resulting immediate
 * cash proceeds alongside the adjusted ongoing daily obligations and active asset modifiers
 * that would persist after shedding the liquidated assets and their associated debts.
 *
 * @param sellableAssets - A list of assets with non-negative net yields, sorted to optimize permutations.
 * @param assets - The baseline list of currently owned assets.
 * @param liabilities - The current obligations mapping.
 * @param player - The core player state.
 * @param band - The band state influencing overall obligations.
 * @param social - The social connections influencing overall obligations.
 * @param options - Whether to include bounded additional sale scenarios.
 * @returns Simulated outcomes and whether every sale subset was evaluated.
 * An incomplete search can find an escape, but cannot prove the run stranded.
 */
export const getPostSaleScenarios = (
  sellableAssets: { id: string; net: number }[],
  assets: GameState['assets'],
  liabilities: GameState['liabilities'],
  player: PlayerState,
  band: BandState,
  social: SocialState,
  options: { includeAdditionalCandidates?: boolean } = {}
): {
  assetProceeds: number
  dailyObligations: number
  assetModifiers: import('../types/assets').AssetModifiers
  assets?: GameState['assets']
  liabilities?: GameState['liabilities']
}[] & { exhaustive: boolean } => {
  const postSaleScenarios: {
    assetProceeds: number
    dailyObligations: number
    assetModifiers: import('../types/assets').AssetModifiers
    assets?: GameState['assets']
    liabilities?: GameState['liabilities']
  }[] & { exhaustive: boolean } = Object.assign([], {
    exhaustive:
      sellableAssets.length <= (options.includeAdditionalCandidates ? 14 : 10)
  })

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

    const appendScenario = (
      comboProceeds: number,
      mask: number,
      extraIds?: ReadonlySet<string>
    ) => {
      const retainedAssets: typeof assets = []
      for (let k = 0, len = assets.length; k < len; k++) {
        const a = assets[k]
        if (a) {
          const bit = sellableBitMap[a.id]
          if (
            !extraIds?.has(a.id) &&
            (bit === undefined || (mask & bit) === 0)
          ) {
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
              if (
                !extraIds?.has(l.assetId) &&
                (bit === undefined || (mask & bit) === 0)
              ) {
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
        assetModifiers: getActiveAssetModifiers(retainedAssets),
        assets: retainedAssets,
        liabilities: retainedLiabilities
      })
    }

    for (let i = 1; i < numCombinations; i++) {
      let comboProceeds = 0
      for (let j = 0; j < numAssets; j++) {
        if ((i & (1 << j)) !== 0) comboProceeds += assetNetValues[j] ?? 0
      }
      appendScenario(comboProceeds, i)
    }

    // Bound the complete search at fourteen candidates. Above that, retain
    // the linear additional-candidate search and the all-extras group.
    if (options.includeAdditionalCandidates) {
      const extras = sellableAssets.slice(numAssets)
      const groups: (typeof extras)[] = []
      if (extras.length <= 4) {
        for (let mask = 1; mask < 1 << extras.length; mask++) {
          groups.push(extras.filter((_, index) => (mask & (1 << index)) !== 0))
        }
      } else {
        for (const extra of extras) {
          const oneExtra = new Set([extra.id])
          appendScenario(extra.net, 0, oneExtra)
          for (let j = 0; j < numAssets; j++) {
            appendScenario(
              extra.net + (assetNetValues[j] ?? 0),
              1 << j,
              oneExtra
            )
          }
        }
        groups.push(extras)
      }
      for (const group of groups) {
        const extraIds = new Set(group.map(extra => extra.id))
        for (let mask = 0; mask < numCombinations; mask++) {
          // Each real sale floors cash. Use one concrete sale order rather
          // than summing fractional quotes that could overstate the proceeds.
          const initialMoney = Math.max(0, finiteNumberOr(player.money, 0))
          let afterSales = initialMoney
          for (const extra of group)
            afterSales = clampPlayerMoney(afterSales + extra.net)
          for (let j = 0; j < numAssets; j++) {
            if ((mask & (1 << j)) !== 0) {
              afterSales = clampPlayerMoney(
                afterSales + (assetNetValues[j] ?? 0)
              )
            }
          }
          appendScenario(afterSales - initialMoney, mask, extraIds)
        }
      }
    }
  }

  return postSaleScenarios
}

/**
 * One-use positive recovery from carried stock. Catalogue effects override
 * stored fields. Ignoring stat caps and dividing targeted items optimistically
 * lets the checker credit the best use without ending a recoverable run.
 */
export const getConsumableRecovery = (
  stash: unknown,
  inventory: unknown
): ConsumableRecovery => {
  const recovery = { harmony: 0, targetedStamina: 0, memberStamina: 0 }
  if (stash && typeof stash === 'object') {
    for (const key of Object.keys(stash)) {
      if (isForbiddenKey(key)) continue
      const entry: unknown = (stash as Record<string, unknown>)[key]
      if (
        !entry ||
        typeof entry !== 'object' ||
        (entry as { applied?: unknown }).applied
      )
        continue
      const item = CONTRABAND_BY_ID.get(key)
      if (item?.type !== 'consumable') continue
      const gain =
        Math.max(0, finiteNumberOr(item.value, 0)) *
        getStashStackCount(stash, key)
      const field =
        item.effectType === 'harmony'
          ? 'harmony'
          : item.effectType === 'stamina'
            ? 'targetedStamina'
            : null
      if (field)
        recovery[field] = Math.max(
          0,
          finiteNumberOr(recovery[field] + gain, recovery[field])
        )
    }
  }
  if (inventory && typeof inventory === 'object') {
    for (const key of Object.keys(INVENTORY_USE_EFFECTS)) {
      if (!Object.hasOwn(inventory, key)) continue
      const effect = INVENTORY_USE_EFFECTS[key]
      if (!effect || effect.expeditionPolicyItemId) continue
      const owned = (inventory as Record<string, unknown>)[key]
      const count =
        owned === true ? 1 : Math.max(0, Math.floor(finiteNumberOr(owned, 0)))
      const gain = count * Math.max(0, finiteNumberOr(effect.memberStamina, 0))
      recovery.memberStamina = Math.max(
        0,
        finiteNumberOr(recovery.memberStamina + gain, recovery.memberStamina)
      )
    }
  }
  return recovery
}
