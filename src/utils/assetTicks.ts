import type { GameState } from '../types/game'
import type { BandMember } from '../types/band'
import type {
  CrowdfundCampaign,
  Liability,
  LongTermAsset,
  AssetKind,
  RiskEventDescriptor,
  RiskEventType
} from '../types/assets'
import {
  getAssetTotalUpkeep,
  getAssetTotalDailyRevenue,
  getAssetAggregateBoni
} from './assetSelectors'
import {
  calculateFameLevel,
  clampMemberMood,
  clampMemberStamina,
  finiteNumberOr
} from './gameState'
import { MODULE_REGISTRY } from './assetModuleRegistry'
import { clampUnit } from './numberUtils'
import {
  CHASSIS_CONFIG,
  CONDITION_DECAY_PER_DAY,
  FORECLOSURE_FAME_PENALTY,
  RISK_EVENT_CONDITION_LOSS
} from './assetConfig'

/**
 * Success probability for a crowdfund campaign, given current fame, scene
 * presence, and the funding target.
 *
 * Shared by the setup-modal preview and `processCrowdfundTick` resolution so
 * the number the player sees IS the number that resolves the campaign.
 *
 * Shape: a linear combination of normalized fame and scene presence minus a
 * difficulty penalty proportional to the target. Clamped to [0.05, 0.95] so
 * neither side is a foregone conclusion.
 */
export const resolveCrowdfundProbability = (
  fame: number,
  scenePresence: number,
  targetAmount: number
): number => {
  const fameComponent = clampUnit(fame / 200)
  const sceneComponent = clampUnit(scenePresence / 100)
  const difficulty = clampUnit(targetAmount / 30000)
  const raw =
    0.25 + 0.5 * fameComponent + 0.3 * sceneComponent - 0.4 * difficulty
  return Math.max(0.05, Math.min(0.95, raw))
}

/**
 * Applies daily asset decay, revenue, upkeep, liabilities, and risk events.
 *
 * @remarks
 * Broken assets (condition less than 20) produce no revenue modifiers, but they
 * still decay and continue to incur upkeep until repaired or sold.
 */
export const processAssetTick = (state: GameState): GameState => {
  if (!state.assets || state.assets.length === 0) return state

  let moneyDelta = 0
  let fameDelta = 0
  let moodDelta = 0
  let staminaDelta = 0

  const nextAssets = state.assets.map((asset: LongTermAsset) => {
    const boni = getAssetAggregateBoni(asset)
    const condition = Math.max(
      0,
      Math.min(100, asset.condition - CONDITION_DECAY_PER_DAY)
    )
    moneyDelta += getAssetTotalDailyRevenue(asset) - getAssetTotalUpkeep(asset)
    fameDelta += boni.famePassivePerDay ?? 0
    moodDelta += boni.bandMoodPerDay ?? 0
    staminaDelta += boni.staminaRegenBonusPerDay ?? 0
    return { ...asset, condition }
  })

  const currentFame = finiteNumberOr(state.player.fame, 0)
  const nextFame = Math.max(0, currentFame + fameDelta)
  // Money is deliberately NOT clamped here: a transiently negative balance
  // must survive until later day-tick stages (e.g. merch/newsletter income in
  // calculateDailyUpdates) have been applied — clamping per stage would
  // silently forgive debt. handleAdvanceDay's final calculateDailyUpdates
  // pass owns the clamp; this function must only run inside that pipeline.
  const nextPlayer =
    fameDelta !== 0
      ? {
          ...state.player,
          money: state.player.money + moneyDelta,
          fame: nextFame,
          fameLevel: calculateFameLevel(nextFame)
        }
      : {
          ...state.player,
          money: state.player.money + moneyDelta
        }

  const nextBand =
    (moodDelta !== 0 || staminaDelta !== 0) &&
    state.band &&
    Array.isArray(state.band.members)
      ? {
          ...state.band,
          members: state.band.members.map((member: BandMember) => ({
            ...member,
            ...(moodDelta !== 0
              ? {
                  mood: clampMemberMood(
                    finiteNumberOr(member.mood, 0) + moodDelta
                  )
                }
              : {}),
            ...(staminaDelta !== 0
              ? {
                  stamina: clampMemberStamina(
                    finiteNumberOr(member.stamina, 0) + staminaDelta,
                    finiteNumberOr(member.staminaMax, 100)
                  )
                }
              : {})
          }))
        }
      : state.band

  return {
    ...state,
    assets: nextAssets,
    player: nextPlayer,
    ...(nextBand !== state.band ? { band: nextBand } : {})
  }
}

/**
 * Settles liability payments. Each payment is split into an interest portion
 * (`principalRemaining × interestRate / 365`) and a principal reduction, so
 * `principalRemaining` tracks the amortization balance that priced
 * `dailyPayment`; the final payment charges only the remaining payoff. On
 * shortfall, increments defaultCounter; on 7-day default, removes the asset
 * (foreclosure) and applies a fame penalty.
 */
export const processLiabilityTick = (
  state: GameState
): { state: GameState; foreclosedKinds: AssetKind[] } => {
  if (!state.liabilities || Object.keys(state.liabilities).length === 0) {
    return { state, foreclosedKinds: [] }
  }
  let currentMoney = state.player.money
  let nextFame = state.player.fame
  const nextLiabilities: Record<string, Liability> = {}
  const foreclosedAssetIds = new Set<string>()

  for (const liability of Object.values(state.liabilities)) {
    // Split the payment into interest and principal so the tracked balance
    // matches the amortization model that priced `dailyPayment`
    // (computeAmortization, annualRate / 365). On the final day, charge only
    // the actual payoff instead of a full payment.
    const dailyRate = finiteNumberOr(liability.interestRate, 0) / 365
    const interestPortion = liability.principalRemaining * dailyRate
    const payoff = liability.principalRemaining + interestPortion
    const payment = Math.min(liability.dailyPayment, payoff)
    if (currentMoney >= payment) {
      currentMoney -= payment
      const principalRemaining = Math.max(
        0,
        liability.principalRemaining - (payment - interestPortion)
      )
      const termDaysRemaining = liability.termDaysRemaining - 1
      if (termDaysRemaining <= 0 || principalRemaining <= 0) continue
      nextLiabilities[liability.id] = {
        ...liability,
        principalRemaining,
        termDaysRemaining,
        defaultCounter: 0
      }
    } else {
      const defaultCounter = liability.defaultCounter + 1
      if (defaultCounter >= 7) {
        // Apply the fame penalty exactly once per newly foreclosed asset:
        // a single asset may have multiple liabilities (e.g. loan + future
        // crowdfund top-up). Without this guard the player would lose
        // 2× FORECLOSURE_FAME_PENALTY for the same asset.
        if (!foreclosedAssetIds.has(liability.assetId)) {
          foreclosedAssetIds.add(liability.assetId)
          nextFame = Math.max(0, nextFame - FORECLOSURE_FAME_PENALTY)
        }
      } else {
        nextLiabilities[liability.id] = { ...liability, defaultCounter }
      }
    }
  }

  const nextAssets = (state.assets || []).filter(
    a => !foreclosedAssetIds.has(a.id)
  )
  for (const id of Object.keys(nextLiabilities)) {
    const l = nextLiabilities[id]
    if (l && foreclosedAssetIds.has(l.assetId)) {
      delete nextLiabilities[id]
    }
  }
  const finalLiabilities = nextLiabilities
  const foreclosedKindsSet = new Set<AssetKind>()
  for (const asset of state.assets || []) {
    if (foreclosedAssetIds.has(asset.id)) {
      foreclosedKindsSet.add(asset.kind)
    }
  }
  const foreclosedKinds = Array.from(foreclosedKindsSet)

  return {
    state: {
      ...state,
      player: {
        ...state.player,
        money: currentMoney,
        fame: nextFame,
        fameLevel: calculateFameLevel(nextFame)
      },
      assets: nextAssets,
      liabilities: finalLiabilities
    },
    foreclosedKinds
  }
}

/**
 * Resolves expiring crowdfund campaigns. On success: the player gains
 * `fameStake` and a fresh asset is materialized from `assetSpec` — the raised
 * `targetAmount` pays for the build and is NOT paid out as cash on top (that
 * would double-count the funding versus cash/loan acquisition). On fail: the
 * player loses `fameStake` (clamped at 0). Either way, the campaign is
 * REMOVED from the active list — completed campaigns never linger in state.
 */
export const processCrowdfundTick = (state: GameState): GameState => {
  if (!state.crowdfundCampaigns || state.crowdfundCampaigns.length === 0)
    return state

  const remaining: CrowdfundCampaign[] = []
  const newAssets: LongTermAsset[] = []
  const unavailableKinds = new Set(
    (state.assets ?? []).map(asset => asset.kind)
  )
  const seenCampaignKinds = new Set<CrowdfundCampaign['assetSpec']['kind']>()
  let fame = state.player.fame

  for (const campaign of state.crowdfundCampaigns) {
    const { kind, flavor, chassisTier } = campaign.assetSpec
    if (unavailableKinds.has(kind) || seenCampaignKinds.has(kind)) continue
    seenCampaignKinds.add(kind)

    const daysRemaining = campaign.daysRemaining - 1
    if (daysRemaining > 0) {
      remaining.push({ ...campaign, daysRemaining })
      continue
    }

    // Resolution: the campaign was stamped at start time with both a
    // pre-rolled `plannedSuccessRoll` (mulberry32, 0..1) and the
    // `plannedSuccessProbability` the UI promised the player. Success when
    // the roll falls inside the promised odds, so the displayed chance IS
    // the realized chance.
    const success =
      campaign.plannedSuccessRoll < campaign.plannedSuccessProbability
    if (success) {
      fame += campaign.fameStake
      // Materialize the asset deterministically from pre-generated ids
      // (stamped by startCrowdfund at campaign creation). No UUID generation
      // here — the reducer must stay pure.
      // Read the resolved tier directly from CHASSIS_CONFIG so the price /
      // upkeep / slot list stay in sync with whatever the section plan
      // configured — recomputing via buildDiyTier here would drift if
      // CHASSIS_CONFIG.diy were ever tuned independently of legit.
      const cfgTier = CHASSIS_CONFIG[kind][flavor][chassisTier]
      newAssets.push({
        id: campaign.materializedAssetId,
        kind,
        chassisFlavor: flavor,
        chassisTier,
        condition: 100,
        baseUpkeep: cfgTier.upkeep,
        baseDailyRevenue: cfgTier.revenue,
        slots: cfgTier.slots.map((slotType, i) => ({
          // Bounds-safe fallback: if startCrowdfund was called before the
          // section plan populated CHASSIS_CONFIG (so slot count was 0 then,
          // non-zero now), synthesize a deterministic id from the asset id.
          id:
            campaign.materializedSlotIds[i] ??
            `${campaign.materializedAssetId}_slot_${i}`,
          slotType,
          position: { x: 0, y: 0 },
          installedModuleId: null
        })),
        acquiredOnDay: 0, // populated from state.player.day below
        acquisitionMode: 'crowdfund',
        baseRiskEventChance: cfgTier.baseRiskEventChance
      })
      unavailableKinds.add(kind)
    } else {
      fame = Math.max(0, fame - campaign.fameStake)
    }
  }

  // Stamp the acquisition day on any newly created assets.
  const day = state.player.day ?? 0
  const newAssetsWithDay = newAssets.map(a => ({ ...a, acquiredOnDay: day }))

  return {
    ...state,
    player: {
      ...state.player,
      fame,
      fameLevel: calculateFameLevel(fame)
    },
    assets: [...(state.assets ?? []), ...newAssetsWithDay],
    crowdfundCampaigns: remaining
  }
}

/**
 * Result of rolling daily asset risk events against a deterministic RNG stream.
 */
export interface RollAssetRiskEventsResult {
  /** State after condition losses from triggered risk events are applied. */
  state: GameState
  /** Next unread index in the day RNG stream. */
  cursor: number
  /** Risk event descriptors triggered during the roll. */
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
 * is always less than 1.0.
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
    if (boni.reducesTheftRiskTravel) {
      riskEventTypes.delete('theft')
    }

    const typesArray = Array.from(riskEventTypes)
    // Default to 'fire' as a generic catch-all when no module exposes a
    // specific event type. Avoids confusingly displaying 'Foreclosure!' for
    // cash-purchased assets with no liabilities.
    let selectedType: RiskEventType = 'fire'
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
