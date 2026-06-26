import {
  calculateChassisGrossSaleValue,
  getTotalDailyObligations,
  getActiveAssetModifiers
} from '../../utils/assetSelectors'
import { finiteNumberOr } from '../../utils/finiteNumber'
import type { GameState } from '../../types'
import type { TravelLogicParams } from './types'

export const getSellableAssets = (
  assets: TravelLogicParams['assets'],
  liabilities: TravelLogicParams['liabilities'],
  playerDay: number
): { id: string; net: number }[] => {
  const sellableAssets: { id: string; net: number }[] = []

  if (assets) {
    for (const asset of assets) {
      const gross = calculateChassisGrossSaleValue(asset, playerDay)
      if (gross !== null) {
        let rawTotalPrincipalRemaining = 0
        if (liabilities) {
          for (const key in liabilities) {
            if (Object.hasOwn(liabilities, key)) {
              const l = liabilities[key]
              if (l && l.assetId === asset.id) {
                rawTotalPrincipalRemaining += Math.max(
                  0,
                  finiteNumberOr(l.principalRemaining, 0)
                )
              }
            }
          }
        }
        if (gross >= rawTotalPrincipalRemaining) {
          const net = gross - rawTotalPrincipalRemaining
          if (net > 0) {
            sellableAssets.push({ id: asset.id, net })
          }
        }
      }
    }
  }

  return sellableAssets
}

export const getPostSaleScenarios = (
  sellableAssets: { id: string; net: number }[],
  assets: TravelLogicParams['assets'],
  liabilities: TravelLogicParams['liabilities'],
  player: TravelLogicParams['player'],
  band: TravelLogicParams['band'],
  social: TravelLogicParams['social']
): {
  assetProceeds: number
  dailyObligations: number
  assetModifiers: import('../../types/assets').AssetModifiers
}[] => {
  const postSaleScenarios: {
    assetProceeds: number
    dailyObligations: number
    assetModifiers: import('../../types/assets').AssetModifiers
  }[] = []

  if (sellableAssets.length > 0 && assets) {
    sellableAssets.sort((a, b) => b.net - a.net)
    // coderabbit:ignore - The 10-asset cap intentionally bounds the exponential combination cost to 1023 iterations, which is acceptable on the travel path.
    const numAssets = Math.min(sellableAssets.length, 10)
    const numCombinations = 1 << numAssets
    for (let i = 1; i < numCombinations; i++) {
      const comboAssetIds: string[] = []
      let comboProceeds = 0
      for (let j = 0; j < numAssets; j++) {
        if ((i & (1 << j)) !== 0) {
          const assetToSell = sellableAssets[j]
          if (assetToSell) {
            comboAssetIds.push(assetToSell.id)
            comboProceeds += assetToSell.net
          }
        }
      }

      const retainedAssets: typeof assets = []
      for (let k = 0, len = assets.length; k < len; k++) {
        const a = assets[k]
        if (a && !comboAssetIds.includes(a.id)) {
          retainedAssets.push(a)
        }
      }

      const retainedLiabilities = Object.create(null) as NonNullable<
        typeof liabilities
      >
      if (liabilities) {
        for (const key in liabilities) {
          if (Object.hasOwn(liabilities, key)) {
            const l = liabilities[key]
            if (l && !comboAssetIds.includes(l.assetId)) {
              retainedLiabilities[key] = l
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
        } as GameState),
        assetModifiers: getActiveAssetModifiers(retainedAssets)
      })
    }
  }

  return postSaleScenarios
}
