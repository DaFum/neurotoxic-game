import type { GameState } from '../types/game'
import type {
  CrowdfundCampaign,
  Liability,
  LongTermAsset,
  RiskEventType
} from '../types/assets'
import {
  getAssetTotalUpkeep,
  getAssetTotalDailyRevenue,
  getAssetAggregateBoni
} from './assetSelectors'
import { MODULE_REGISTRY } from './assetModuleRegistry'
import {
  CHASSIS_CONFIG,
  CONDITION_DECAY_PER_DAY,
  FORECLOSURE_FAME_PENALTY,
  RISK_EVENT_CONDITION_LOSS,
  buildDiyTier
} from './assetConfig'
import { getSafeUUID } from './crypto'

/**
 * Daily decay of every asset's condition, plus net cashflow (revenue − upkeep)
 * for productive assets. Broken assets (condition < 20) contribute zero boni
 * via the selector layer; they still decay further until repaired.
 */
export const processAssetTick = (state: GameState): GameState => {
  if (!state.assets || state.assets.length === 0) return state

  let moneyDelta = 0

  const nextAssets = state.assets.map((asset: LongTermAsset) => {
    const condition = Math.max(
      0,
      Math.min(100, asset.condition - CONDITION_DECAY_PER_DAY)
    )
    moneyDelta += getAssetTotalDailyRevenue(asset) - getAssetTotalUpkeep(asset)
    return { ...asset, condition }
  })

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money + moneyDelta
    }
  }
}

/**
 * Settles liability payments. On shortfall, increments defaultCounter; on
 * 7-day default, removes the asset (foreclosure) and applies a fame penalty.
 */
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
      if (termDaysRemaining <= 0 || principalRemaining <= 0) continue
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
        nextFame = Math.max(0, nextFame - FORECLOSURE_FAME_PENALTY)
      } else {
        nextLiabilities.push({ ...liability, defaultCounter })
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
    player: { ...state.player, money: currentMoney },
    band: { ...state.band, fame: nextFame },
    assets: nextAssets,
    liabilities: finalLiabilities
  }
}

/**
 * Resolves expiring crowdfund campaigns. On success: the player receives
 * `targetAmount`, gains `fameStake`, and a fresh asset is materialized from
 * `assetSpec`. On fail: the player loses `fameStake` (clamped at 0). Either
 * way, the campaign is REMOVED from the active list — completed campaigns
 * never linger in state.
 */
export const processCrowdfundTick = (state: GameState): GameState => {
  if (!state.crowdfundCampaigns || state.crowdfundCampaigns.length === 0)
    return state

  const remaining: CrowdfundCampaign[] = []
  const newAssets: LongTermAsset[] = []
  let money = state.player.money
  let fame = state.band.fame

  for (const campaign of state.crowdfundCampaigns) {
    const daysRemaining = campaign.daysRemaining - 1
    if (daysRemaining > 0) {
      remaining.push({ ...campaign, daysRemaining })
      continue
    }

    // Resolution: plannedSuccessRoll was drawn from mulberry32 at start time;
    // we use 0.5 as the success/fail threshold here because the actual
    // success probability formula lives in resolveCrowdfundProbability — for
    // foundation we keep it deterministic on roll < 0.5 = fail. Section
    // plans / balancing can replace this threshold with a formula.
    const success = campaign.plannedSuccessRoll >= 0.5
    if (success) {
      money += campaign.targetAmount
      fame += campaign.fameStake
      // Materialize the asset from the chassis config. legit reads directly;
      // diy derives via buildDiyTier so balancing stays consistent.
      const { kind, flavor, chassisTier } = campaign.assetSpec
      const legitTier = CHASSIS_CONFIG[kind].legit[chassisTier]
      const cfgTier = flavor === 'legit' ? legitTier : buildDiyTier(legitTier)
      newAssets.push({
        id: getSafeUUID(),
        kind,
        chassisFlavor: flavor,
        chassisTier,
        condition: 100,
        baseUpkeep: cfgTier.upkeep,
        baseDailyRevenue: cfgTier.revenue,
        slots: cfgTier.slots.map(slotType => ({
          id: getSafeUUID(),
          slotType,
          position: { x: 0, y: 0 },
          installedModuleId: null
        })),
        acquiredOnDay: 0, // populated from state.player.day below
        acquisitionMode: 'crowdfund',
        baseRiskEventChance: cfgTier.baseRiskEventChance
      })
    } else {
      fame = Math.max(0, fame - campaign.fameStake)
    }
  }

  // Stamp the acquisition day on any newly created assets.
  const day = state.player.day ?? 0
  const newAssetsWithDay = newAssets.map(a => ({ ...a, acquiredOnDay: day }))

  return {
    ...state,
    player: { ...state.player, money },
    band: { ...state.band, fame },
    assets: [...(state.assets ?? []), ...newAssetsWithDay],
    crowdfundCampaigns: remaining
  }
}

export interface RiskEventDescriptor {
  assetId: string
  eventType: RiskEventType
  conditionLoss: number
}

export interface RollAssetRiskEventsResult {
  state: GameState
  cursor: number
  events: RiskEventDescriptor[]
}

/**
 * Rolls a chance per asset against the dayRngStream. When triggered, picks a
 * concrete event type from the union of riskEventTypes contributed by
 * installed modules on that asset. Returns the descriptors so the caller can
 * dispatch follow-up actions (toast, story flags).
 *
 * RNG-exhaustion behavior: if the caller under-sized `dayRngStream`, missing
 * rolls fall back to `1.0` (a neutral non-triggering value), NOT 0 — a 0
 * fallback would auto-fire every remaining asset's event since totalRiskChance
 * is always < 1.0.
 */
export const rollAssetRiskEvents = (
  state: GameState,
  dayRngStream: number[],
  cursor: number
): RollAssetRiskEventsResult => {
  if (!state.assets || state.assets.length === 0) {
    return { state, cursor, events: [] }
  }

  const nextAssets = [...state.assets]
  const events: RiskEventDescriptor[] = []
  let i = cursor

  for (let idx = 0; idx < nextAssets.length; idx++) {
    const asset = nextAssets[idx]!
    if (asset.condition === 0) continue

    const boni = getAssetAggregateBoni(asset)
    const riskChanceMult = boni.baseRiskChanceMultiplier ?? 1.0
    const diyRiskMult = boni.diyRiskMultiplier ?? 1.0
    const totalRiskChance =
      asset.baseRiskEventChance * diyRiskMult * riskChanceMult

    const roll = dayRngStream[i++] ?? 1.0
    if (roll >= totalRiskChance) continue

    // Build the candidate event-type pool from installed modules.
    const riskEventTypes = new Set<RiskEventType>()
    for (const slot of asset.slots) {
      if (!slot.installedModuleId) continue
      if (!Object.hasOwn(MODULE_REGISTRY, slot.installedModuleId)) continue
      const mod = MODULE_REGISTRY[slot.installedModuleId]
      if (mod?.riskEventTypes) {
        for (const t of mod.riskEventTypes) riskEventTypes.add(t)
      }
    }

    const typesArray = Array.from(riskEventTypes)
    // Default to 'foreclosure' as a generic catch-all when no module exposes
    // a specific event type — keeps behavior defined for legit-only chassis.
    let selectedType: RiskEventType = 'foreclosure'
    if (typesArray.length > 0) {
      const typeRoll = dayRngStream[i++] ?? 0
      const index = Math.min(
        typesArray.length - 1,
        Math.floor(typeRoll * typesArray.length)
      )
      selectedType = typesArray[index]!
    }

    nextAssets[idx] = {
      ...asset,
      condition: Math.max(
        0,
        Math.min(100, asset.condition - RISK_EVENT_CONDITION_LOSS)
      )
    }
    events.push({
      assetId: asset.id,
      eventType: selectedType,
      conditionLoss: RISK_EVENT_CONDITION_LOSS
    })
  }

  return {
    state: { ...state, assets: nextAssets },
    cursor: i,
    events
  }
}
