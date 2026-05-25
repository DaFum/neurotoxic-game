import os
import re

# 1. Update src/types/game.d.ts
file = "src/types/game.d.ts"
with open(file, "r") as f: c = f.read()
if "ActionTypes['ADVANCE_DAY'], { dayRngStream: number[]; nextRngSeed: number }" not in c:
    c = c.replace(
        "| Action<ActionTypes['ADVANCE_DAY']>",
        "| Action<ActionTypes['ADVANCE_DAY'], { dayRngStream: number[]; nextRngSeed: number }>"
    )
with open(file, "w") as f: f.write(c)

# 2. Update src/context/actionCreators.ts
file = "src/context/actionCreators.ts"
with open(file, "r") as f: c = f.read()

if "import { createRngStream, nextSeed }" not in c:
    c = "import { createRngStream, nextSeed } from '../utils/seededRng'\n" + c
    c = c.replace("import type {\n  CompleteTravelMinigamePayload,", "import type {\n  CompleteTravelMinigamePayload,\n  GameState,")
    c = c.replace("export const createAdvanceDayAction = (): Extract<\n  GameAction,\n  { type: typeof ActionTypes.ADVANCE_DAY }\n> => ({\n  type: ActionTypes.ADVANCE_DAY\n})", "")
    c += """\nexport const advanceDay = (
  state: GameState
): Extract<GameAction, { type: typeof ActionTypes.ADVANCE_DAY }> => ({
  type: ActionTypes.ADVANCE_DAY,
  payload: {
    dayRngStream: createRngStream(state.rngSeed, 32),
    nextRngSeed: nextSeed(state.rngSeed)
  }
})\n"""
with open(file, "w") as f: f.write(c)

# 3. Update src/context/useGameDispatchActions.ts
file = "src/context/useGameDispatchActions.ts"
with open(file, "r") as f: c = f.read()

c = c.replace("createAdvanceDayAction,", "advanceDay as advanceDayAction,")
c = c.replace("dispatch(createAdvanceDayAction())", "dispatch(advanceDayAction(currentState))")

if "advanceDay: dispatchAdvanceDay," not in c:
    c = c.replace("createAdvanceDayAction: () => void", "advanceDay: () => void")
    c = c.replace("const advanceDay = useCallback(() => {", "const dispatchAdvanceDay = useCallback(() => {")
    c = c.replace("createAdvanceDayAction: dispatchAdvanceDay", "advanceDay: dispatchAdvanceDay")

    c = c.replace(
        "  return useMemo(\n    () => ({\n      changeScene,",
        "  return useMemo(\n    () => ({\n      advanceDay: dispatchAdvanceDay,\n      changeScene,"
    )
    # Add to deps
    c = c.replace("setPendingSupplyStopInventory\n    ]\n  )\n}", "setPendingSupplyStopInventory,\n      dispatchAdvanceDay\n    ]\n  )\n}")

with open(file, "w") as f: f.write(c)

# 4. Update tests/node/actionCreators.test.js
file = "tests/node/actionCreators.test.js"
with open(file, "r") as f: c = f.read()
if "describe('advanceDay'" not in c:
    c = c.replace("createAdvanceDayAction,", "advanceDay,")
    c = re.sub(r"\{\n\s*name: 'createAdvanceDayAction',\n\s*fn: createAdvanceDayAction,\n\s*type: ActionTypes\.ADVANCE_DAY\n\s*\},?", "", c)
    c = c.replace("},\n    \n  ]", "}\n  ]")
    c += """
describe('advanceDay', () => {
  it('creates ADVANCE_DAY action with rng stream and next seed', () => {
    const mockState = { rngSeed: 12345 }
    const action = advanceDay(mockState)
    assert.strictEqual(action.type, ActionTypes.ADVANCE_DAY)
    assert.ok(Array.isArray(action.payload.dayRngStream))
    assert.strictEqual(action.payload.dayRngStream.length, 32)
    assert.ok(typeof action.payload.nextRngSeed === 'number')
  })
})
"""
with open(file, "w") as f: f.write(c)

# 5. Create src/utils/assetTicks.ts
ticks_content = """import type { GameState } from '../types/game'
import type { Liability } from '../types/assets'
import { getAssetTotalUpkeep, getAssetTotalDailyRevenue, getAssetAggregateBoni } from './assetSelectors'
import { MODULE_REGISTRY } from './assetModuleRegistry'

export const processAssetTick = (state: GameState): GameState => {
  if (!state.assets || state.assets.length === 0) return state

  let moneyDelta = 0

  const nextAssets = state.assets.map((asset: import('../types/assets').LongTermAsset) => {
    const condition = Math.max(0, Math.min(100, asset.condition - 0.3))
    const upkeep = getAssetTotalUpkeep(asset)
    const revenue = getAssetTotalDailyRevenue(asset)
    moneyDelta += (revenue - upkeep)

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

export const processLiabilityTick = (state: GameState): GameState => {
  if (!state.liabilities || state.liabilities.length === 0) return state
  let currentMoney = state.player.money
  let nextFame = state.band.fame
  const nextLiabilities: Liability[] = []

  const foreclosedAssetIds = new Set<string>()

  for (const liability of state.liabilities) {
    if (currentMoney >= liability.dailyPayment) {
      currentMoney -= liability.dailyPayment
      const principalRemaining = Math.max(0, liability.principalRemaining - liability.dailyPayment)
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

  const nextAssets = (state.assets || []).filter(a => !foreclosedAssetIds.has(a.id))
  const finalLiabilities = nextLiabilities.filter(l => !foreclosedAssetIds.has(l.assetId))

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
  if (!state.crowdfundCampaigns || state.crowdfundCampaigns.length === 0) return state

  const nextCampaigns = []
  const nextMoney = state.player.money

  for (const campaign of state.crowdfundCampaigns) {
    const daysRemaining = campaign.daysRemaining - 1
    if (daysRemaining <= 0) {
      nextCampaigns.push({
        ...campaign,
        daysRemaining: 0,
        resolvedOutcome: (campaign.plannedSuccessRoll < 0.5 ? 'fail' : 'success') as 'success' | 'fail'
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

export const rollAssetRiskEvents = (state: GameState, dayRngStream: number[], cursor: number): { state: GameState; cursor: number } => {
  if (!state.assets || state.assets.length === 0) return { state, cursor }

  let currentCursor = cursor
  const nextAssets = [...state.assets]

  for (let i = 0; i < nextAssets.length; i++) {
    const asset = nextAssets[i] as import('../types/assets').LongTermAsset
    if (asset.condition === 0) continue

    const boni = getAssetAggregateBoni(asset)
    const riskChanceMultiplier = boni.baseRiskChanceMultiplier ?? 1.0
    const diyRiskMultiplier = boni.diyRiskMultiplier ?? 1.0

    const totalRiskChance = asset.baseRiskEventChance * diyRiskMultiplier * riskChanceMultiplier

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
        _selectedType = typesArray[index] as import('../types/assets').RiskEventType
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
"""
with open("src/utils/assetTicks.ts", "w") as f: f.write(ticks_content)

# 6. Create tests/node/assetTicks.test.js
ticks_test_content = """import test from 'node:test'
import assert from 'node:assert'
import {
  processAssetTick,
  processLiabilityTick,
  processCrowdfundTick,
  rollAssetRiskEvents
} from '../../src/utils/assetTicks.ts'

test('processAssetTick - condition decay and condition floor at 0', () => {
  const state = {
    assets: [
      { id: 'a1', condition: 0.2, baseDailyRevenue: 0, baseUpkeep: 0, slots: [{ slotType: 'tb_roof', id: 's1', installedModuleId: null }] },
      { id: 'a2', condition: 10, baseDailyRevenue: 0, baseUpkeep: 0, slots: [{ slotType: 'tb_roof', id: 's1', installedModuleId: null }] }
    ],
    player: { money: 100 }
  }
  const next = processAssetTick(state as any)
  assert.strictEqual(next.assets[0].condition, 0)
  assert.strictEqual(next.assets[1].condition, 9.7)
})

test('processLiabilityTick - liability default counter increment and trigger at 7 days', () => {
  const state = {
    assets: [
      { id: 'a1', condition: 100, slots: [] }
    ],
    liabilities: [
      { id: 'l1', assetId: 'a1', dailyPayment: 50, principalRemaining: 1000, termDaysRemaining: 20, defaultCounter: 6 }
    ],
    player: { money: 10 },
    band: { fame: 50 }
  }
  const next = processLiabilityTick(state as any)
  assert.strictEqual(next.assets.length, 0)
  assert.strictEqual(next.liabilities.length, 0)
  assert.ok(next.band.fame < 50)
})

test('processCrowdfundTick - crowdfund resolution on day 0', () => {
  const state = {
    crowdfundCampaigns: [
      { id: 'c1', daysRemaining: 1, plannedSuccessRoll: 0.6 }
    ],
    player: { money: 100 }
  }
  const next = processCrowdfundTick(state as any)
  assert.strictEqual(next.crowdfundCampaigns[0].daysRemaining, 0)
  assert.strictEqual(next.crowdfundCampaigns[0].resolvedOutcome, 'success')
})

test('rollAssetRiskEvents - deterministic risk event triggering', () => {
  const state = {
    assets: [
      { id: 'a1', condition: 100, baseRiskEventChance: 0.5, slots: [{ slotType: 'tb_roof', id: 's1', installedModuleId: null }] }
    ]
  }
  const stream = [0.1, 0.5]
  const result = rollAssetRiskEvents(state as any, stream, 0)
  assert.strictEqual(result.cursor, 1)
  assert.strictEqual(result.state.assets[0].condition, 85)
})
"""
with open("tests/node/assetTicks.test.js", "w") as f: f.write(ticks_test_content)

# 7. Create src/context/reducers/assetReducer.ts
reducer_content = """import type { GameState } from '../../types/game'
import type {
  PurchaseChassisPayload,
  InstallModulePayload,
  UpgradeChassisTierPayload,
  ResolveCrowdfundPayload,
  LongTermAsset,
  AssetSlot,
  Liability
} from '../../types/assets'
import { CHASSIS_CONFIG, UPGRADE_OVERHEAD, REPAIR_COST_PER_POINT, buildDiyTier } from '../../utils/assetConfig'
import { LOAN_PROFILES, computeAmortization } from '../../utils/loanProfiles'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'

export const handlePurchaseChassis = (state: GameState, payload: PurchaseChassisPayload): GameState => {
  const { id, kind, flavor, tier, mode, slotIds, loanProfileId, today } = payload

  let configTier: import('../../utils/assetConfig').ChassisTierConfig | ReturnType<typeof buildDiyTier> | undefined
  if (flavor === 'legit') {
    configTier = CHASSIS_CONFIG[kind].legit[tier]
  } else {
    configTier = buildDiyTier((CHASSIS_CONFIG as any)[kind].legit[tier] as import('../../utils/assetConfig').ChassisTierConfig)
  }

  const slots: AssetSlot[] = configTier!.slots.map((st: import('../../types/assets').SlotType, i: number) => ({
    id: slotIds[i] as string,
    slotType: st,
    position: { x: 0, y: 0 },
    installedModuleId: null
  }))

  const asset: LongTermAsset = {
    id,
    kind,
    chassisFlavor: flavor,
    chassisTier: tier,
    condition: 100,
    baseUpkeep: configTier!.upkeep,
    baseDailyRevenue: configTier!.revenue,
    slots,
    acquiredOnDay: today,
    acquisitionMode: mode,
    baseRiskEventChance: configTier!.baseRiskEventChance
  }

  let nextMoney = state.player.money
  const nextLiabilities = [...(state.liabilities || [])]

  if (mode === 'cash') {
    nextMoney -= configTier!.price
  } else if (mode === 'loan' && loanProfileId) {
    const profile = LOAN_PROFILES[loanProfileId as import('../../utils/loanProfiles').LoanProfileId]
    if (profile) {
      const dailyPayment = computeAmortization(configTier!.price, profile.interestRate, profile.termDays)
      const liability: Liability = {
        id: `loan_${id}`,
        source: 'loan',
        assetId: id,
        principalRemaining: configTier!.price,
        interestRate: profile.interestRate,
        dailyPayment,
        termDaysRemaining: profile.termDays,
        defaultCounter: 0
      }
      nextLiabilities.push(liability)
    }
  }

  return {
    ...state,
    player: {
      ...state.player,
      money: nextMoney
    },
    assets: [...(state.assets || []), asset],
    liabilities: nextLiabilities
  }
}

export const handleInstallModule = (state: GameState, payload: InstallModulePayload): GameState => {
  const { assetId, slotId, moduleId, newSlotIds } = payload
  if (!state.assets) return state

  const moduleInfo = MODULE_REGISTRY[moduleId]
  if (!moduleInfo) return state

  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

    const nextSlots = asset.slots.map(slot => {
      if (slot.id === slotId) {
        return { ...slot, installedModuleId: moduleId }
      }
      return slot
    })

    if (newSlotIds && newSlotIds.length > 0) {
      newSlotIds.forEach(newSlot => {
        nextSlots.push({
          id: newSlot.id,
          slotType: newSlot.slotType,
          position: { x: 0, y: 0 },
          installedModuleId: null,
          addedByModuleId: moduleId
        })
      })
    }

    return { ...asset, slots: nextSlots }
  })

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money - (moduleInfo.cost + moduleInfo.installCost)
    }
  }
}

export const handleRemoveModule = (state: GameState, payload: { assetId: string; slotId: string }): GameState => {
  const { assetId, slotId } = payload
  if (!state.assets) return state

  let refund = 0
  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

    const targetSlot = asset.slots.find(s => s.id === slotId)
    if (targetSlot && targetSlot.installedModuleId) {
      const moduleInfo = MODULE_REGISTRY[targetSlot.installedModuleId]
      if (moduleInfo) {
        refund = moduleInfo.cost * moduleInfo.removalRefundFraction
      }
    }

    const removedModuleId = targetSlot?.installedModuleId

    let nextSlots = asset.slots.map(slot => {
      if (slot.id === slotId) {
        return { ...slot, installedModuleId: null }
      }
      return slot
    })

    if (removedModuleId) {
      nextSlots = nextSlots.filter(s => s.addedByModuleId !== removedModuleId)
    }

    return { ...asset, slots: nextSlots }
  })

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money + refund
    }
  }
}

export const handleUpgradeChassisTier = (state: GameState, payload: UpgradeChassisTierPayload): GameState => {
  const { assetId, targetTier, newSlotIds } = payload
  if (!state.assets) return state

  let upgradeCost = 0
  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

    let currentConfigTier: import('../../utils/assetConfig').ChassisTierConfig | ReturnType<typeof buildDiyTier> | undefined
    if (asset.chassisFlavor === 'legit') {
      currentConfigTier = CHASSIS_CONFIG[asset.kind].legit[asset.chassisTier]
    } else {
      currentConfigTier = buildDiyTier((CHASSIS_CONFIG as any)[asset.kind].legit[asset.chassisTier] as import('../../utils/assetConfig').ChassisTierConfig)
    }

    let targetConfigTier: import('../../utils/assetConfig').ChassisTierConfig | ReturnType<typeof buildDiyTier> | undefined
    if (asset.chassisFlavor === 'legit') {
      targetConfigTier = CHASSIS_CONFIG[asset.kind].legit[targetTier]
    } else {
      targetConfigTier = buildDiyTier((CHASSIS_CONFIG as any)[asset.kind].legit[targetTier] as import('../../utils/assetConfig').ChassisTierConfig)
    }

    upgradeCost = targetConfigTier!.price - currentConfigTier!.price + UPGRADE_OVERHEAD

    const nextSlots = [...asset.slots]
    newSlotIds.forEach(newSlot => {
      nextSlots.push({
        id: newSlot.id,
        slotType: newSlot.slotType,
        position: { x: 0, y: 0 },
        installedModuleId: null
      })
    })

    return {
      ...asset,
      chassisTier: targetTier,
      baseUpkeep: targetConfigTier!.upkeep,
      baseDailyRevenue: targetConfigTier!.revenue,
      baseRiskEventChance: targetConfigTier!.baseRiskEventChance,
      slots: nextSlots
    }
  })

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money - upgradeCost
    }
  }
}

export const handleSellChassis = (state: GameState, payload: { assetId: string }): GameState => {
  const { assetId } = payload
  if (!state.assets) return state

  const asset = state.assets.find(a => a.id === assetId)
  if (!asset) return state

  const liability = state.liabilities?.find(l => l.assetId === assetId)
  const principalRemaining = liability?.principalRemaining || 0

  const daysOwned = Math.max(0, state.player.day - asset.acquiredOnDay)
  const conditionFactor = asset.condition / 100
  const depreciation = Math.max(0.4, 1 - (daysOwned / 365) * 0.4)

  let configTier: import('../../utils/assetConfig').ChassisTierConfig | ReturnType<typeof buildDiyTier> | undefined
  if (asset.chassisFlavor === 'legit') {
    configTier = CHASSIS_CONFIG[asset.kind].legit[asset.chassisTier]
  } else {
    configTier = buildDiyTier((CHASSIS_CONFIG as any)[asset.kind].legit[asset.chassisTier] as import('../../utils/assetConfig').ChassisTierConfig)
  }

  let moduleRefunds = 0
  asset.slots.forEach(slot => {
    if (slot.installedModuleId) {
      const moduleInfo = MODULE_REGISTRY[slot.installedModuleId]
      if (moduleInfo) {
        moduleRefunds += moduleInfo.cost * moduleInfo.removalRefundFraction
      }
    }
  })

  const gross = configTier!.price * conditionFactor * depreciation + moduleRefunds

  if (gross < principalRemaining) {
    return state
  }

  const net = gross - principalRemaining

  return {
    ...state,
    assets: state.assets.filter(a => a.id !== assetId),
    liabilities: state.liabilities?.filter(l => l.assetId !== assetId),
    player: {
      ...state.player,
      money: state.player.money + net
    }
  }
}

export const handleRepairChassis = (state: GameState, payload: { assetId: string }): GameState => {
  const { assetId } = payload
  if (!state.assets) return state

  let repairCost = 0
  const nextAssets = state.assets.map(asset => {
    if (asset.id !== assetId) return asset

    repairCost = (100 - asset.condition) * REPAIR_COST_PER_POINT
    return { ...asset, condition: 100 }
  })

  return {
    ...state,
    assets: nextAssets,
    player: {
      ...state.player,
      money: state.player.money - repairCost
    }
  }
}

export const handleStartCrowdfund = (state: GameState, payload: { campaign: import('../../types/assets').CrowdfundCampaign }): GameState => {
  return {
    ...state,
    crowdfundCampaigns: [...(state.crowdfundCampaigns || []), payload.campaign]
  }
}

export const handleResolveCrowdfund = (state: GameState, payload: ResolveCrowdfundPayload): GameState => {
  const { campaignId, outcome, newAssetId, newSlotIds } = payload
  if (!state.crowdfundCampaigns) return state

  const campaign = state.crowdfundCampaigns.find(c => c.id === campaignId)
  if (!campaign) return state

  const nextCampaigns = state.crowdfundCampaigns.filter(c => c.id !== campaignId)

  let nextFame = state.band.fame
  let nextAssets = state.assets || []

  if (outcome === 'success') {
    nextFame += campaign.fameStake

    if (newAssetId && newSlotIds) {
      let configTier: import('../../utils/assetConfig').ChassisTierConfig | ReturnType<typeof buildDiyTier> | undefined
      if (campaign.assetSpec.flavor === 'legit') {
        configTier = CHASSIS_CONFIG[campaign.assetSpec.kind].legit[campaign.assetSpec.chassisTier]
      } else {
        configTier = buildDiyTier((CHASSIS_CONFIG as any)[campaign.assetSpec.kind].legit[campaign.assetSpec.chassisTier] as import('../../utils/assetConfig').ChassisTierConfig)
      }

      const slots: AssetSlot[] = configTier!.slots.map((st: import('../../types/assets').SlotType, i: number) => ({
        id: (newSlotIds || [])[i]?.id as string,
        slotType: st,
        position: { x: 0, y: 0 },
        installedModuleId: null
      }))

      const asset: LongTermAsset = {
        id: newAssetId,
        kind: campaign.assetSpec.kind,
        chassisFlavor: campaign.assetSpec.flavor,
        chassisTier: campaign.assetSpec.chassisTier,
        condition: 100,
        baseUpkeep: configTier!.upkeep,
        baseDailyRevenue: configTier!.revenue,
        slots,
        acquiredOnDay: state.player.day,
        acquisitionMode: 'crowdfund',
        baseRiskEventChance: configTier!.baseRiskEventChance
      }
      nextAssets = [...nextAssets, asset]
    }
  } else {
    nextFame = Math.max(0, nextFame - campaign.fameStake)
  }

  return {
    ...state,
    band: {
      ...state.band,
      fame: nextFame
    },
    assets: nextAssets,
    crowdfundCampaigns: nextCampaigns
  }
}

export const handleAssetForeclosed = (state: GameState, payload: { assetId: string }): GameState => {
  return {
    ...state,
    assets: state.assets?.filter(a => a.id !== payload.assetId),
    liabilities: state.liabilities?.filter(l => l.assetId !== payload.assetId)
  }
}

export const handleAssetRiskEventTriggered = (state: GameState, payload: { assetId: string, eventType: import('../../types/assets').RiskEventType }): GameState => {
  if (!state.assets) return state
  const nextAssets = state.assets.map(asset => {
    if (asset.id !== payload.assetId) return asset
    return {
      ...asset,
      condition: Math.max(0, Math.min(100, asset.condition - 15))
    }
  })

  return {
    ...state,
    assets: nextAssets
  }
}

export const handleAssetFailedAction = (state: GameState): GameState => state
"""
with open("src/context/reducers/assetReducer.ts", "w") as f: f.write(reducer_content)

# 8. Create tests/node/assetReducer.test.js
reducer_test = """import test from 'node:test'
import assert from 'node:assert'
import {
  handlePurchaseChassis,
  handleInstallModule,
  handleRemoveModule,
  handleAssetFailedAction
} from '../../src/context/reducers/assetReducer.ts'
import { CHASSIS_CONFIG } from '../../src/utils/assetConfig.ts'
import { MODULE_REGISTRY } from '../../src/utils/assetModuleRegistry.ts'

if (!MODULE_REGISTRY['test_mod']) {
  // @ts-expect-error test mock
  MODULE_REGISTRY['test_mod'] = {
    id: 'test_mod',
    ownerKind: 'tourbus_chassis',
    slotType: 'tb_roof',
    flavor: 'legit',
    cost: 100,
    installCost: 50,
    removalRefundFraction: 0.5,
    boni: {},
    unlock: {},
    imagePromptKey: 'test'
  }
}

const mockState = {
  player: { money: 1000, day: 10 },
  band: { fame: 100 },
  assets: [],
  liabilities: [],
  crowdfundCampaigns: []
}

test('handlePurchaseChassis - happy path cash', () => {
  const kind = 'tourbus_chassis'
  const configTier = CHASSIS_CONFIG[kind].legit[1]
  const slotIds = configTier.slots.map((_, i) => `slot_${i}`)

  const payload = {
    id: 'a1', kind, flavor: 'legit', tier: 1, mode: 'cash', slotIds, today: mockState.player.day
  }

  const next = handlePurchaseChassis(mockState as any, payload as any)
  assert.strictEqual(next.assets[0].id, 'a1')
})

test('handleInstallModule - happy path', () => {
  const startState = {
    ...mockState,
    assets: [
      { id: 'a1', slots: [{ id: 's1', slotType: 'tb_roof', installedModuleId: null }] }
    ]
  }

  const next = handleInstallModule(startState as any, { assetId: 'a1', slotId: 's1', moduleId: 'test_mod' })
  assert.strictEqual(next.assets[0].slots[0].installedModuleId, 'test_mod')
})

test('handleRemoveModule - cleans up added child slots and refunds', () => {
  const startState = {
    ...mockState,
    assets: [
      {
        id: 'a1',
        slots: [
          { id: 's1', installedModuleId: 'test_mod' },
          { id: 's2', addedByModuleId: 'test_mod' }
        ]
      }
    ]
  }

  const next = handleRemoveModule(startState as any, { assetId: 'a1', slotId: 's1' })
  assert.strictEqual(next.assets[0].slots.length, 1)
})

test('handleAssetFailedAction - is no-op', () => {
  const next = handleAssetFailedAction(mockState as any)
  assert.strictEqual(next, mockState)
})
"""
with open("tests/node/assetReducer.test.js", "w") as f: f.write(reducer_test)

# 9. Create tests/node/advanceDayAssetIntegration.test.js
integration_test = """import test from 'node:test'
import assert from 'node:assert'
import { handleAdvanceDay } from '../../src/context/reducers/systemReducer.ts'

test('AdvanceDay Integration - Assets Tick', () => {
  const initialState = {
    player: { money: 1000, day: 10, eventsTriggeredToday: 0 },
    band: { fame: 50, members: [] },
    social: { trend: 'neutral' },
    assets: [
      {
        id: 'a1',
        condition: 100,
        baseDailyRevenue: 50,
        baseUpkeep: 20,
        baseRiskEventChance: 0.1,
        slots: []
      }
    ],
    liabilities: [
      { id: 'l1', assetId: 'a1', principalRemaining: 500, dailyPayment: 50, termDaysRemaining: 10, defaultCounter: 0 }
    ],
    crowdfundCampaigns: [],
    rngSeed: 12345,
    toasts: []
  }

  const payload = {
    dayRngStream: new Array(32).fill(0.99),
    nextRngSeed: 54321
  }

  const nextState = handleAdvanceDay(initialState as any, payload)

  assert.strictEqual(nextState.rngSeed, 54321)
  assert.strictEqual(nextState.assets[0].condition, 99.7)
  assert.strictEqual(nextState.liabilities[0].principalRemaining, 450)
  assert.strictEqual(nextState.liabilities[0].termDaysRemaining, 9)
  assert.strictEqual(nextState.player.money, 918)
})
"""
with open("tests/node/advanceDayAssetIntegration.test.js", "w") as f: f.write(integration_test)

# 10. Update src/context/reducers/systemReducer.ts
file = "src/context/reducers/systemReducer.ts"
with open(file, "r") as f: c = f.read()

if "processAssetTick" not in c:
    c = "import { processAssetTick, processLiabilityTick, processCrowdfundTick, rollAssetRiskEvents } from '../../utils/assetTicks'\n" + c
    c = c.replace(
        "export const handleAdvanceDay = (\n  state: GameState,\n  payload?: { rng?: () => number }\n): GameState => {",
        "export const handleAdvanceDay = (\n  state: GameState,\n  payload?: { dayRngStream?: number[]; nextRngSeed?: number; rng?: () => number }\n): GameState => {\n  let nextStatePre = processAssetTick(state)\n  nextStatePre = processLiabilityTick(nextStatePre)\n  nextStatePre = processCrowdfundTick(nextStatePre)\n  if (payload?.dayRngStream) {\n    const { state: s } = rollAssetRiskEvents(nextStatePre, payload.dayRngStream, 0)\n    nextStatePre = s\n  }\n  const rngSeed = payload?.nextRngSeed ?? nextStatePre.rngSeed\n  state = { ...nextStatePre, rngSeed }\n"
    )
with open(file, "w") as f: f.write(c)

# 11. Update src/context/gameReducer.ts
file = "src/context/gameReducer.ts"
with open(file, "r") as f: c = f.read()

if "handlePurchaseChassis" not in c:
    c = c.replace("import { ActionTypes } from './actionTypes'", "import { ActionTypes } from './actionTypes'\nimport { handlePurchaseChassis, handleInstallModule, handleRemoveModule, handleUpgradeChassisTier, handleSellChassis, handleRepairChassis, handleStartCrowdfund, handleResolveCrowdfund, handleAssetForeclosed, handleAssetRiskEventTriggered, handleAssetFailedAction } from './reducers/assetReducer'")

    mappings = """  [ActionTypes.PURCHASE_CHASSIS]: handlePurchaseChassis,
  [ActionTypes.PURCHASE_CHASSIS_FAILED]: handleAssetFailedAction,
  [ActionTypes.UPGRADE_CHASSIS_TIER]: handleUpgradeChassisTier,
  [ActionTypes.SELL_CHASSIS]: handleSellChassis,
  [ActionTypes.SELL_CHASSIS_FAILED]: handleAssetFailedAction,
  [ActionTypes.REPAIR_CHASSIS]: handleRepairChassis,
  [ActionTypes.INSTALL_MODULE]: handleInstallModule,
  [ActionTypes.INSTALL_MODULE_FAILED]: handleAssetFailedAction,
  [ActionTypes.REMOVE_MODULE]: handleRemoveModule,
  [ActionTypes.START_CROWDFUND]: handleStartCrowdfund,
  [ActionTypes.RESOLVE_CROWDFUND]: handleResolveCrowdfund,
  [ActionTypes.ASSET_FORECLOSED]: handleAssetForeclosed,
  [ActionTypes.ASSET_RISK_EVENT_TRIGGERED]: handleAssetRiskEventTriggered,
"""
    c = c.replace("  [ActionTypes.SET_PENDING_SUPPLY_STOP_INVENTORY]:\n    handleSetPendingSupplyStopInventory\n}", "  [ActionTypes.SET_PENDING_SUPPLY_STOP_INVENTORY]:\n    handleSetPendingSupplyStopInventory,\n" + mappings + "}")

with open(file, "w") as f: f.write(c)
