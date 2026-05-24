import type { GameState } from '../types'
import type {
  AssetBoni,
  AssetModifiers,
  AssetModule,
  LongTermAsset,
  ModuleUnlockReq
} from '../types/assets'
import { MODULE_REGISTRY } from './assetModuleRegistry'
import { calculateGuaranteedDailyCost } from './economyEngine'

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

/** Reads the installed modules of an asset by resolving slot ids against the registry. */
export const getInstalledModules = (asset: LongTermAsset): AssetModule[] => {
  const out: AssetModule[] = []
  for (const s of asset.slots) {
    if (s.installedModuleId !== null) {
      const m = MODULE_REGISTRY[s.installedModuleId]
      if (m) out.push(m)
    }
  }
  return out
}

/**
 * Aggregates the boni from all installed modules on an asset into a single
 * AssetBoni object. Multiplier fields are multiplied (identity 1.0), additive
 * fields summed (identity 0), boolean flags OR-ed.
 *
 * Assets with condition < 20 are treated as broken and contribute no boni —
 * this gives a clear gameplay signal that repair is needed before bonuses
 * apply again.
 */
export const getAssetAggregateBoni = (asset: LongTermAsset): AssetBoni => {
  if (asset.condition < BROKEN_THRESHOLD) return {}
  const agg: AssetBoni = {}
  for (const m of getInstalledModules(asset)) {
    for (const [k, v] of Object.entries(m.boni)) {
      const key = k as keyof AssetBoni
      if (typeof v === 'number') {
        const current = agg[key] as number | undefined
        if (key.endsWith('Multiplier') || key === 'diyRiskMultiplier') {
          ;(agg as Record<string, unknown>)[key] = (current ?? 1.0) * v
        } else {
          ;(agg as Record<string, unknown>)[key] = (current ?? 0) + v
        }
      } else if (typeof v === 'boolean') {
        ;(agg as Record<string, unknown>)[key] = Boolean(agg[key]) || v
      }
    }
  }
  return agg
}

/** Daily upkeep of an asset including module-provided deltas. */
export const getAssetTotalUpkeep = (asset: LongTermAsset): number =>
  asset.baseUpkeep + (getAssetAggregateBoni(asset).upkeepDelta ?? 0)

/**
 * Daily revenue scaled by condition. A broken asset (condition < 20) returns 0
 * because its aggregate boni — including baseDailyRevenueDelta — are
 * neutralized.
 */
export const getAssetTotalDailyRevenue = (asset: LongTermAsset): number => {
  const base = asset.baseDailyRevenue
  const delta = getAssetAggregateBoni(asset).baseDailyRevenueDelta ?? 0
  return (base + delta) * (asset.condition / 100)
}

/**
 * Aggregates modifiers from all assets in the state. Returns
 * NEUTRAL_ASSET_MODIFIERS when no assets exist or all are broken.
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
    if (b.fuelMultiplier) m.fuelMultiplier *= b.fuelMultiplier
    if (b.merchCostMultiplier) m.merchCostMultiplier *= b.merchCostMultiplier
    if (b.songCostMultiplier) m.songCostMultiplier *= b.songCostMultiplier
    if (b.trainingCostMultiplier)
      m.trainingCostMultiplier *= b.trainingCostMultiplier
    if (b.baseRiskChanceMultiplier)
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
 */
export const getTotalDailyObligations = (state: GameState): number => {
  const base = calculateGuaranteedDailyCost(
    state.player,
    state.band,
    state.social
  )
  let assetUpkeep = 0
  let assetRevenue = 0
  for (const a of state.assets) {
    assetUpkeep += getAssetTotalUpkeep(a)
    assetRevenue += getAssetTotalDailyRevenue(a)
  }
  let liabilityPayments = 0
  for (const l of state.liabilities) {
    liabilityPayments += l.dailyPayment
  }
  return base + assetUpkeep - assetRevenue + liabilityPayments
}

const memberHasSkill = (
  state: GameState,
  skill: string,
  tier: number,
  memberId?: string
): boolean => {
  const candidates = memberId
    ? state.band.members.filter(m => m.id === memberId)
    : state.band.members
  for (const m of candidates) {
    const skills = (m as { skills?: Record<string, number> }).skills
    if (skills && (skills[skill] ?? 0) >= tier) return true
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

export const getLockReasons = (
  module: AssetModule,
  state: GameState,
  /** When provided, also evaluates module.unlock.minChassisTier against this asset's tier. */
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
 */
export const getSlotConflicts = (
  asset: LongTermAsset,
  moduleId: string
): { canInstall: boolean; conflictingModuleIds: string[] } => {
  const target = MODULE_REGISTRY[moduleId]
  if (!target || target.exclusiveWithGroup === undefined) {
    return { canInstall: true, conflictingModuleIds: [] }
  }
  const conflicts: string[] = []
  for (const s of asset.slots) {
    if (s.installedModuleId === null) continue
    if (s.installedModuleId === moduleId) continue
    const m = MODULE_REGISTRY[s.installedModuleId]
    if (m && m.exclusiveWithGroup === target.exclusiveWithGroup) {
      conflicts.push(m.id)
    }
  }
  return { canInstall: conflicts.length === 0, conflictingModuleIds: conflicts }
}

export interface ModulePoolEntry {
  module: AssetModule
  unlocked: boolean
  lockReasons: LockReason[]
}

/**
 * Returns the full module pool for the given asset's `kind`, annotated with
 * unlock and exclusivity status for the current state. UI consumers can render
 * directly from this list.
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
