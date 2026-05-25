import type { GameState } from '../types/game'
import type { Liability } from '../types/assets'
import {
  getAssetTotalUpkeep,
  getAssetTotalDailyRevenue,
  getAssetAggregateBoni
} from './assetSelectors'
import { MODULE_REGISTRY } from './assetModuleRegistry'

export const processAssetTick = (state: GameState): GameState => {
  if (!state.assets || state.assets.length === 0) return state

  let moneyDelta = 0

  const nextAssets = state.assets.map(
    (asset: import('../types/assets').LongTermAsset) => {
      const condition = Math.max(0, Math.min(100, asset.condition - 0.3))
      const upkeep = getAssetTotalUpkeep(asset)
      const revenue = getAssetTotalDailyRevenue(asset)
      moneyDelta += revenue - upkeep

      return { ...asset, condition }
    }
  )

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money + moneyDelta
    }
  }
}

export const processLiabilityTick = (state: GameState): GameState => {
  if (!state.liabilities || state.liabilities.length === 0) return state
  let currentMoney = state.player.money
  let nextFame = state.band.fame
  const nextLiabilities: Liability[] = []

  const foreclosedAssetIds = new Set<string>()

  for (const liability of state.liabilities) {
    if (currentMoney >= liability.dailyPayment) {
      currentMoney -= liability.dailyPayment
      const principalRemaining = Math.max(
        0,
        liability.principalRemaining - liability.dailyPayment
      )
      const termDaysRemaining = liability.termDaysRemaining - 1

      if (termDaysRemaining <= 0 || principalRemaining <= 0) {
        continue
      }

      nextLiabilities.push({
        ...liability,
        principalRemaining,
        termDaysRemaining,
        defaultCounter: 0
      })
    } else {
      const defaultCounter = liability.defaultCounter + 1
      if (defaultCounter >= 7) {
        foreclosedAssetIds.add(liability.assetId)
        nextFame = Math.max(0, nextFame - 10)
      } else {
        nextLiabilities.push({
          ...liability,
          defaultCounter
        })
      }
    }
  }

  const nextAssets = (state.assets || []).filter(
    a => !foreclosedAssetIds.has(a.id)
  )
  const finalLiabilities = nextLiabilities.filter(
    l => !foreclosedAssetIds.has(l.assetId)
  )

  return {
    ...state,
    player: {
      ...state.player,
      money: currentMoney
    },
    band: {
      ...state.band,
      fame: nextFame
    },
    assets: nextAssets,
    liabilities: finalLiabilities
  }
}

export const processCrowdfundTick = (state: GameState): GameState => {
  if (!state.crowdfundCampaigns || state.crowdfundCampaigns.length === 0)
    return state

  const nextCampaigns = []
  const nextMoney = state.player.money

  for (const campaign of state.crowdfundCampaigns) {
    const daysRemaining = campaign.daysRemaining - 1
    if (daysRemaining <= 0) {
      nextCampaigns.push({
        ...campaign,
        daysRemaining: 0,
        resolvedOutcome: (campaign.plannedSuccessRoll < 0.5
          ? 'fail'
          : 'success') as Extract<
          import('../types/assets').CrowdfundCampaign['resolvedOutcome'],
          string
        >
      })
    } else {
      nextCampaigns.push({
        ...campaign,
        daysRemaining
      })
    }
  }

  return {
    ...state,
    player: {
      ...state.player,
      money: nextMoney
    },
    crowdfundCampaigns: nextCampaigns
  }
}

export const rollAssetRiskEvents = (
  state: GameState,
  dayRngStream: number[],
  cursor: number
): { state: GameState; cursor: number } => {
  if (!state.assets || state.assets.length === 0) return { state, cursor }

  let currentCursor = cursor
  const nextAssets = [...state.assets]

  for (let i = 0; i < nextAssets.length; i++) {
    const asset = nextAssets[i] as import('../types/assets').LongTermAsset
    if (asset.condition === 0) continue

    const boni = getAssetAggregateBoni(asset)
    const riskChanceMultiplier = boni.baseRiskChanceMultiplier ?? 1.0
    const diyRiskMultiplier = boni.diyRiskMultiplier ?? 1.0

    const totalRiskChance =
      asset.baseRiskEventChance * diyRiskMultiplier * riskChanceMultiplier

    const roll = dayRngStream[currentCursor++] || 0
    if (roll < totalRiskChance) {
      const riskEventTypes = new Set<import('../types/assets').RiskEventType>()
      for (const slot of asset.slots) {
        if (slot.installedModuleId) {
          const mod = MODULE_REGISTRY[slot.installedModuleId]
          if (mod?.riskEventTypes) {
            mod.riskEventTypes.forEach(t => riskEventTypes.add(t))
          }
        }
      }

      const typesArray = Array.from(riskEventTypes)
      let _selectedType: import('../types/assets').RiskEventType = 'foreclosure'
      if (typesArray.length > 0) {
        const typeRoll = dayRngStream[currentCursor++] || 0
        const index = Math.floor(typeRoll * typesArray.length)
        _selectedType = typesArray[
          index
        ] as import('../types/assets').RiskEventType
      }

      nextAssets[i] = {
        ...asset,
        condition: Math.max(0, Math.min(100, asset.condition - 15))
      }
    }
  }

  return {
    state: {
      ...state,
      assets: nextAssets
    },
    cursor: currentCursor
  }
}
