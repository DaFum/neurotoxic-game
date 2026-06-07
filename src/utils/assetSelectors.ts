import type { GameState } from '../types'
import type {
  AssetBoni,
  AssetKind,
  AssetModifiers,
  AssetModule,
  AssetSlot,
  LongTermAsset,
  ModuleUnlockReq
} from '../types/assets'
import { MODULE_REGISTRY } from './assetModuleRegistry'
import { CHASSIS_CONFIG } from './assetConfig'
import { calculateGuaranteedDailyCost } from './economyEngine'
import { finiteNumberOr, isFiniteNumber } from './finiteNumber'

/**
 * Identity element for AssetModifiers aggregation. Multiplicative fields
 * default to 1.0, additive to 0, flags to false. Functions accepting an
 * optional `AssetModifiers` parameter should default to this identity so
 * existing callers see no behavior change.
 */
export const NEUTRAL_ASSET_MODIFIERS: AssetModifiers = Object.freeze({
  fuelMultiplier: 1.0,
  merchCostMultiplier: 1.0,
  songCostMultiplier: 1.0,
  trainingCostMultiplier: 1.0,
  baseRiskChanceMultiplier: 1.0,
  staminaRegenBonusPerDay: 0,
  travelStaminaRegen: 0,
  merchCapacityBonus: 0,
  songQualityBonus: 0,
  avgMerchSalePriceBonus: 0,
  famePassivePerDay: 0,
  bandMoodPerDay: 0,
  tipBonusGigs: 0,
  flags: Object.freeze({
    infightingDamper: false,
    enablesReRecording: false,
    enablesLimitedEditions: false,
    enablesBulkProduction: false,
    reducesTheftRiskTravel: false
  })
}) as AssetModifiers

const BROKEN_THRESHOLD = 20

/**
 * Calculates gross sale value from chassis price, condition, age, and module refunds.
 *
 * @param asset - Long-term asset being valued for sale.
 * @param currentDay - Current in-game day used for age-based depreciation.
 * @returns Gross sale value, or null when the asset's chassis config cannot be resolved.
 */
export const calculateChassisGrossSaleValue = (
  asset: LongTermAsset,
  currentDay: unknown
): number | null => {
  const configTier =
    CHASSIS_CONFIG[asset.kind]?.[asset.chassisFlavor]?.[asset.chassisTier]
  if (!configTier) return null

  const daysOwned = Math.max(
    0,
    finiteNumberOr(currentDay, 0) - finiteNumberOr(asset.acquiredOnDay, 0)
  )
  const conditionFactor = finiteNumberOr(asset.condition, 0) / 100
  const depreciation = Math.max(0.4, 1 - (daysOwned / 365) * 0.4)

  let moduleRefunds = 0
  for (const slot of asset.slots) {
    if (!slot.installedModuleId) continue
    const moduleInfo = MODULE_REGISTRY[slot.installedModuleId]
    if (!moduleInfo) continue
    moduleRefunds +=
      finiteNumberOr(moduleInfo.cost, 0) *
      finiteNumberOr(moduleInfo.removalRefundFraction, 0)
  }

  return configTier.price * conditionFactor * depreciation + moduleRefunds
}

/**
 * Reads the installed modules of an asset by resolving slot ids against the registry.
 *
 * @param asset - Asset whose slots should be inspected.
 * @returns Installed module definitions in slot order, excluding unknown module ids.
 */
export const getInstalledModules = (asset: LongTermAsset): AssetModule[] => {
  const out: AssetModule[] = []
  for (const s of asset.slots) {
    if (s.installedModuleId === null) continue
    // Object.hasOwn guards against hostile module ids like 'hasOwnProperty'
    // or 'constructor' that would otherwise reach prototype properties.
    if (!Object.hasOwn(MODULE_REGISTRY, s.installedModuleId)) continue
    const m = MODULE_REGISTRY[s.installedModuleId]
    if (m) out.push(m)
  }
  return out
}

/**
 * Aggregates the boni from all installed modules on an asset into a single
 * AssetBoni object. Multiplier fields are multiplied (identity 1.0), additive
 * fields summed (identity 0), boolean flags OR-ed.
 *
 * Assets with condition less than 20 are treated as broken and contribute no boni —
 * this gives a clear gameplay signal that repair is needed before bonuses
 * apply again.
 *
 * @param asset - Asset whose installed modules should be aggregated.
 * @returns Combined boni contributed by active installed modules, or an empty object when the asset is broken.
 */
export const getAssetAggregateBoni = (asset: LongTermAsset): AssetBoni => {
  if (asset.condition < BROKEN_THRESHOLD) return {}
  const agg: AssetBoni = {}
  for (const m of getInstalledModules(asset)) {
    const b = m.boni
    if (b.baseDailyRevenueDelta !== undefined)
      agg.baseDailyRevenueDelta =
        (agg.baseDailyRevenueDelta ?? 0) + b.baseDailyRevenueDelta
    if (b.upkeepDelta !== undefined)
      agg.upkeepDelta = (agg.upkeepDelta ?? 0) + b.upkeepDelta
    if (b.fuelMultiplier !== undefined)
      agg.fuelMultiplier = (agg.fuelMultiplier ?? 1.0) * b.fuelMultiplier
    if (b.merchCostMultiplier !== undefined)
      agg.merchCostMultiplier =
        (agg.merchCostMultiplier ?? 1.0) * b.merchCostMultiplier
    if (b.songCostMultiplier !== undefined)
      agg.songCostMultiplier =
        (agg.songCostMultiplier ?? 1.0) * b.songCostMultiplier
    if (b.trainingCostMultiplier !== undefined)
      agg.trainingCostMultiplier =
        (agg.trainingCostMultiplier ?? 1.0) * b.trainingCostMultiplier
    if (b.baseRiskChanceMultiplier !== undefined)
      agg.baseRiskChanceMultiplier =
        (agg.baseRiskChanceMultiplier ?? 1.0) * b.baseRiskChanceMultiplier
    if (b.diyRiskMultiplier !== undefined)
      agg.diyRiskMultiplier =
        (agg.diyRiskMultiplier ?? 1.0) * b.diyRiskMultiplier
    if (b.staminaRegenBonusPerDay !== undefined)
      agg.staminaRegenBonusPerDay =
        (agg.staminaRegenBonusPerDay ?? 0) + b.staminaRegenBonusPerDay
    if (b.travelStaminaRegen !== undefined)
      agg.travelStaminaRegen =
        (agg.travelStaminaRegen ?? 0) + b.travelStaminaRegen
    if (b.merchCapacityBonus !== undefined)
      agg.merchCapacityBonus =
        (agg.merchCapacityBonus ?? 0) + b.merchCapacityBonus
    if (b.songQualityBonus !== undefined)
      agg.songQualityBonus = (agg.songQualityBonus ?? 0) + b.songQualityBonus
    if (b.avgMerchSalePriceBonus !== undefined)
      agg.avgMerchSalePriceBonus =
        (agg.avgMerchSalePriceBonus ?? 0) + b.avgMerchSalePriceBonus
    if (b.famePassivePerDay !== undefined)
      agg.famePassivePerDay = (agg.famePassivePerDay ?? 0) + b.famePassivePerDay
    if (b.bandMoodPerDay !== undefined)
      agg.bandMoodPerDay = (agg.bandMoodPerDay ?? 0) + b.bandMoodPerDay
    if (b.tipBonusGigs !== undefined)
      agg.tipBonusGigs = (agg.tipBonusGigs ?? 0) + b.tipBonusGigs
    if (b.infightingDamper !== undefined)
      agg.infightingDamper = agg.infightingDamper || b.infightingDamper
    if (b.enablesReRecording !== undefined)
      agg.enablesReRecording = agg.enablesReRecording || b.enablesReRecording
    if (b.enablesLimitedEditions !== undefined)
      agg.enablesLimitedEditions =
        agg.enablesLimitedEditions || b.enablesLimitedEditions
    if (b.enablesBulkProduction !== undefined)
      agg.enablesBulkProduction =
        agg.enablesBulkProduction || b.enablesBulkProduction
    if (b.reducesTheftRiskTravel !== undefined)
      agg.reducesTheftRiskTravel =
        agg.reducesTheftRiskTravel || b.reducesTheftRiskTravel
  }
  return agg
}

/**
 * Calculates daily upkeep of an asset including module-provided deltas.
 *
 * @param asset - Asset whose upkeep should be calculated.
 * @returns Daily upkeep after installed module boni are applied.
 */
export const getAssetTotalUpkeep = (asset: LongTermAsset): number =>
  asset.baseUpkeep + (getAssetAggregateBoni(asset).upkeepDelta ?? 0)

/**
 * Daily revenue scaled by condition. A broken asset (condition less than 20) returns
 * 0 — the aggregate-boni neutralization only zeroes the delta, but
 * `baseDailyRevenue` is a chassis field and would otherwise still pay out
 * `base * (condition/100)`. Explicit guard keeps broken assets fully silent
 * so the bankruptcy check sees the real obligation.
 *
 * @param asset - Asset whose revenue should be calculated.
 * @returns Daily revenue after module deltas and condition scaling.
 */
export const getAssetTotalDailyRevenue = (asset: LongTermAsset): number => {
  if (asset.condition < BROKEN_THRESHOLD) return 0
  const base = asset.baseDailyRevenue
  const delta = getAssetAggregateBoni(asset).baseDailyRevenueDelta ?? 0
  return (base + delta) * (asset.condition / 100)
}

/**
 * Checks whether an asset kind is already owned or pending through crowdfunding.
 *
 * @param state - State slice containing owned assets and active crowdfund campaigns.
 * @param kind - Asset kind to look up.
 * @returns True when the kind is already owned or has an active acquisition campaign.
 */
export const hasActiveAssetAcquisition = (
  state: Pick<GameState, 'assets' | 'crowdfundCampaigns'>,
  kind: AssetKind
): boolean => {
  const assets = Array.isArray(state.assets) ? state.assets : []
  if (assets.some(asset => asset.kind === kind)) return true

  const campaigns = Array.isArray(state.crowdfundCampaigns)
    ? state.crowdfundCampaigns
    : []
  return campaigns.some(campaign => campaign.assetSpec.kind === kind)
}

/**
 * Aggregates modifiers from all assets in the state. Returns
 * NEUTRAL_ASSET_MODIFIERS when no assets exist or all are broken.
 *
 * @param assets - Assets whose active module boni should be combined.
 * @returns Aggregate modifiers with neutral defaults for fields no asset changes.
 */
export const getActiveAssetModifiers = (
  assets: readonly LongTermAsset[]
): AssetModifiers => {
  const m: AssetModifiers = {
    ...NEUTRAL_ASSET_MODIFIERS,
    flags: { ...NEUTRAL_ASSET_MODIFIERS.flags }
  }
  for (const a of assets) {
    if (a.condition < BROKEN_THRESHOLD) continue
    const b = getAssetAggregateBoni(a)
    // Use !== undefined rather than truthy checks: a multiplier of 0 is
    // semantically valid (e.g., a module granting "free fuel") and must be
    // applied. Truthy checks would silently drop it as if undefined.
    if (b.fuelMultiplier !== undefined) m.fuelMultiplier *= b.fuelMultiplier
    if (b.merchCostMultiplier !== undefined)
      m.merchCostMultiplier *= b.merchCostMultiplier
    if (b.songCostMultiplier !== undefined)
      m.songCostMultiplier *= b.songCostMultiplier
    if (b.trainingCostMultiplier !== undefined)
      m.trainingCostMultiplier *= b.trainingCostMultiplier
    if (b.baseRiskChanceMultiplier !== undefined)
      m.baseRiskChanceMultiplier *= b.baseRiskChanceMultiplier
    m.staminaRegenBonusPerDay += b.staminaRegenBonusPerDay ?? 0
    m.travelStaminaRegen += b.travelStaminaRegen ?? 0
    m.merchCapacityBonus += b.merchCapacityBonus ?? 0
    m.songQualityBonus += b.songQualityBonus ?? 0
    m.avgMerchSalePriceBonus += b.avgMerchSalePriceBonus ?? 0
    m.famePassivePerDay += b.famePassivePerDay ?? 0
    m.bandMoodPerDay += b.bandMoodPerDay ?? 0
    m.tipBonusGigs += b.tipBonusGigs ?? 0
    m.flags.infightingDamper ||= b.infightingDamper ?? false
    m.flags.enablesReRecording ||= b.enablesReRecording ?? false
    m.flags.enablesLimitedEditions ||= b.enablesLimitedEditions ?? false
    m.flags.enablesBulkProduction ||= b.enablesBulkProduction ?? false
    m.flags.reducesTheftRiskTravel ||= b.reducesTheftRiskTravel ?? false
  }
  return m
}

/**
 * Sum of all daily obligations that the bankruptcy check must cover:
 *
 *   guaranteedDailyCost + assetUpkeep - assetRevenue + liabilityPayments
 *
 * Asset revenue offsets upkeep when assets are productive (rented rehearsal
 * space, studio session bookings). Liability payments are flat loan
 * installments (or zero for active crowdfund campaigns, since crowdfund
 * resolution doesn't bill daily).
 *
 * @param state - Current game state containing player, band, social, asset, and liability slices.
 * @returns Guaranteed daily cost plus asset upkeep and liability payments, minus asset revenue.
 */
export const getTotalDailyObligations = (state: GameState): number => {
  const base = calculateGuaranteedDailyCost(
    state.player,
    state.band,
    state.social
  )
  let assetUpkeep = 0
  let assetRevenue = 0
  const assets = Array.isArray(state.assets) ? state.assets : []
  for (const a of assets) {
    assetUpkeep += getAssetTotalUpkeep(a)
    assetRevenue += getAssetTotalDailyRevenue(a)
  }
  let liabilityPayments = 0
  if (state.liabilities) {
    for (const key in state.liabilities) {
      if (Object.hasOwn(state.liabilities, key)) {
        const l = state.liabilities[key]
        if (l) liabilityPayments += l.dailyPayment
      }
    }
  }
  return base + assetUpkeep - assetRevenue + liabilityPayments
}

const SKILL_ALIASES: Record<string, readonly string[]> = {
  tech: ['tech', 'technical']
}

const readOwnFiniteNumber = (
  source: unknown,
  key: string
): number | undefined => {
  if (!source || typeof source !== 'object') return undefined
  const record = source as Record<string, unknown>
  if (!Object.hasOwn(record, key)) return undefined
  const value = record[key]
  return isFiniteNumber(value) ? value : undefined
}

const readMemberSkillValue = (
  member: unknown,
  skill: string
): number | undefined => {
  if (!member || typeof member !== 'object') return undefined
  const record = member as Record<string, unknown>
  const skillKeys = SKILL_ALIASES[skill] ?? [skill]

  for (const key of skillKeys) {
    const legacySkill = readOwnFiniteNumber(record.skills, key)
    if (legacySkill !== undefined) return legacySkill
  }
  for (const key of skillKeys) {
    const baseStat = readOwnFiniteNumber(record.baseStats, key)
    if (baseStat !== undefined) return baseStat
  }
  for (const key of skillKeys) {
    const topLevelStat = readOwnFiniteNumber(record, key)
    if (topLevelStat !== undefined) return topLevelStat
  }
  return undefined
}

const memberHasSkill = (
  state: GameState,
  skill: string,
  tier: number,
  memberId?: string
): boolean => {
  const candidates = memberId
    ? state.band.members.filter((m: { id?: string }) => m.id === memberId)
    : state.band.members
  for (const m of candidates) {
    if ((readMemberSkillValue(m, skill) ?? 0) >= tier) return true
  }
  return false
}

const allInstalledModuleIds = (state: GameState): Set<string> => {
  const set = new Set<string>()
  for (const a of state.assets) {
    for (const s of a.slots) {
      if (s.installedModuleId !== null) set.add(s.installedModuleId)
    }
  }
  return set
}

/**
 * Pure validator: returns true iff every AND-combined condition in
 * `module.unlock` is currently met by the game state. Lock reasons are
 * NOT collected here — use `getLockReasons` for that.
 *
 * @param module - Asset module whose unlock requirements should be evaluated.
 * @param state - Current game state providing fame, money, flags, skills, and installed modules.
 * @returns True when every unlock requirement is currently satisfied.
 */
export const isModuleUnlocked = (
  module: AssetModule,
  state: GameState
): boolean => {
  const u: ModuleUnlockReq = module.unlock
  if (u.minFame !== undefined && state.player.fame < u.minFame) return false
  if (u.minMoney !== undefined && state.player.money < u.minMoney) return false
  if (u.minScenePresence !== undefined) {
    const scene =
      (state.social as { scenePresence?: number }).scenePresence ?? 0
    if (scene < u.minScenePresence) return false
  }
  if (u.requiredStoryFlags) {
    for (const f of u.requiredStoryFlags) {
      if (!state.activeStoryFlags.includes(f)) return false
    }
  }
  if (u.requiredMemberSkill) {
    const { memberId, skill, tier } = u.requiredMemberSkill
    if (!memberHasSkill(state, skill, tier, memberId)) return false
  }
  if (u.requiredOtherModuleInstalled !== undefined) {
    const required = Array.isArray(u.requiredOtherModuleInstalled)
      ? u.requiredOtherModuleInstalled
      : [u.requiredOtherModuleInstalled]
    const installed = allInstalledModuleIds(state)
    let anySatisfied = false
    for (const r of required) {
      if (installed.has(r)) {
        anySatisfied = true
        break
      }
    }
    if (!anySatisfied) return false
  }
  return true
}

/**
 * Collects the unmet unlock conditions for a module, in a structured form
 * the UI can render as locale-driven badges. Empty array means unlocked.
 */
export interface LockReason {
  /** Locale-key suffix under `assets.module.unlock.<kind>`. */
  kind:
    | 'fame'
    | 'money'
    | 'scene'
    | 'chassisTier'
    | 'story'
    | 'skill'
    | 'skillAny'
    | 'otherModule'
  /** Numeric threshold or count, when applicable. */
  amount?: number
  /** Story flag id or member id or skill name, when applicable. */
  ref?: string
  /** For requiredOtherModuleInstalled OR-sets. */
  refs?: string[]
}

/**
 * Returns unmet unlock requirements for a module in the current state.
 *
 * @param module - Asset module whose requirements should be evaluated.
 * @param state - Current game state used for unlock checks.
 * @param asset - Optional asset used to evaluate chassis-tier requirements.
 * @returns Structured lock reasons; empty when the module is unlocked for the provided context.
 */
export const getLockReasons = (
  module: AssetModule,
  state: GameState,
  asset?: LongTermAsset
): LockReason[] => {
  const reasons: LockReason[] = []
  const u = module.unlock
  if (u.minFame !== undefined && state.player.fame < u.minFame) {
    reasons.push({ kind: 'fame', amount: u.minFame })
  }
  if (u.minMoney !== undefined && state.player.money < u.minMoney) {
    reasons.push({ kind: 'money', amount: u.minMoney })
  }
  if (u.minScenePresence !== undefined) {
    const scene =
      (state.social as { scenePresence?: number }).scenePresence ?? 0
    if (scene < u.minScenePresence) {
      reasons.push({ kind: 'scene', amount: u.minScenePresence })
    }
  }
  if (asset !== undefined && u.minChassisTier !== undefined) {
    if (asset.chassisTier < u.minChassisTier) {
      reasons.push({ kind: 'chassisTier', amount: u.minChassisTier })
    }
  }
  if (u.requiredStoryFlags) {
    for (const f of u.requiredStoryFlags) {
      if (!state.activeStoryFlags.includes(f)) {
        reasons.push({ kind: 'story', ref: f })
      }
    }
  }
  if (u.requiredMemberSkill) {
    const { memberId, skill, tier } = u.requiredMemberSkill
    if (!memberHasSkill(state, skill, tier, memberId)) {
      reasons.push({
        kind: memberId !== undefined ? 'skill' : 'skillAny',
        amount: tier,
        ref: memberId !== undefined ? memberId : skill
      })
    }
  }
  if (u.requiredOtherModuleInstalled !== undefined) {
    const required = Array.isArray(u.requiredOtherModuleInstalled)
      ? u.requiredOtherModuleInstalled
      : [u.requiredOtherModuleInstalled]
    const installed = allInstalledModuleIds(state)
    const anySatisfied = required.some(r => installed.has(r))
    if (!anySatisfied) {
      reasons.push({ kind: 'otherModule', refs: [...required] })
    }
  }
  return reasons
}

/**
 * Identifies modules already installed on the same asset that share
 * `exclusiveWithGroup` with the candidate module. Empty array means the
 * candidate may be installed without exclusivity conflict.
 *
 * @param asset - Asset whose installed modules should be checked.
 * @param moduleId - Candidate module id.
 * @returns Conflict status and ids of installed modules in the same exclusivity group.
 */
export const getSlotConflicts = (
  asset: LongTermAsset,
  moduleId: string
): { canInstall: boolean; conflictingModuleIds: string[] } => {
  if (!Object.hasOwn(MODULE_REGISTRY, moduleId)) {
    return { canInstall: true, conflictingModuleIds: [] }
  }
  const target = MODULE_REGISTRY[moduleId]
  if (!target || target.exclusiveWithGroup === undefined) {
    return { canInstall: true, conflictingModuleIds: [] }
  }
  const conflicts: string[] = []
  for (const s of asset.slots) {
    if (s.installedModuleId === null) continue
    if (s.installedModuleId === moduleId) continue
    if (!Object.hasOwn(MODULE_REGISTRY, s.installedModuleId)) continue
    const m = MODULE_REGISTRY[s.installedModuleId]
    if (m && m.exclusiveWithGroup === target.exclusiveWithGroup) {
      conflicts.push(m.id)
    }
  }
  return { canInstall: conflicts.length === 0, conflictingModuleIds: conflicts }
}

/**
 * Module entry annotated with unlock reasons for asset module UI.
 */
export interface ModulePoolEntry {
  module: AssetModule
  unlocked: boolean
  lockReasons: LockReason[]
}

/**
 * Returns the full module pool for the given asset's `kind`, annotated with
 * unlock and exclusivity status for the current state. UI consumers can render
 * directly from this list.
 *
 * @param asset - Asset whose owner kind determines the module pool.
 * @param state - Current game state used for unlock checks.
 * @returns Module pool entries annotated with unlock status and lock reasons.
 */
export const getModulePoolForAsset = (
  asset: LongTermAsset,
  state: GameState
): ModulePoolEntry[] => {
  const out: ModulePoolEntry[] = []
  for (const m of Object.values(MODULE_REGISTRY)) {
    if (m.ownerKind !== asset.kind) continue
    const lockReasons = getLockReasons(m, state, asset)
    out.push({
      module: m,
      unlocked: lockReasons.length === 0,
      lockReasons
    })
  }
  return out
}

/**
 * Sums all remaining liability principal.
 *
 * @param state - Current game state containing liabilities.
 * @returns Total outstanding debt principal.
 */
export const getTotalDebt = (state: GameState): number => {
  let sum = 0
  if (state.liabilities) {
    for (const key in state.liabilities) {
      if (Object.hasOwn(state.liabilities, key)) {
        const l = state.liabilities[key]
        if (l) sum += l.principalRemaining
      }
    }
  }
  return sum
}

const EMPTY_ASSETS: readonly LongTermAsset[] = []
let lastAssetsForMap: readonly LongTermAsset[] | null = null
let assetsMapCache: Map<string, LongTermAsset> | null = null
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
  const assets = state.assets || EMPTY_ASSETS
  if (assets !== lastAssetsForMap || !assetsMapCache) {
    lastAssetsForMap = assets
    const map = new Map<string, LongTermAsset>()
    for (const a of assets) {
      if (!map.has(a.id)) {
        map.set(a.id, a)
      }
    }
    assetsMapCache = map
  }
  return assetsMapCache
}
