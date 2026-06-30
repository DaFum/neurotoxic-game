import type { GameState } from '../../types'
import type {
  AssetModule,
  LongTermAsset,
  SlotType,
  ModuleUnlockReq
} from '../../types/assets'
import { MODULE_REGISTRY } from '../assetModuleRegistry'
import { isFiniteNumber } from '../finiteNumber'

const SKILL_ALIASES: Record<string, readonly string[]> = {
  tech: ['tech', 'technical']
}

const storyFlagsCache = new WeakMap<readonly string[], Set<string>>()
const EMPTY_FLAGS: readonly string[] = []

const hasStoryFlag = (
  flags: readonly string[] | undefined,
  flag: string
): boolean => {
  const safeFlags = Array.isArray(flags) ? flags : EMPTY_FLAGS
  let set = storyFlagsCache.get(safeFlags)
  if (!set) {
    set = new Set(safeFlags)
    storyFlagsCache.set(safeFlags, set)
  }
  return set.has(flag)
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
  const assets = Array.isArray(state.assets) ? state.assets : []
  for (const a of assets) {
    for (const s of a.slots) {
      if (s.installedModuleId !== null) set.add(s.installedModuleId)
    }
  }
  return set
}

/**
 * Pure validator: returns true iff every AND-combined condition in
 * `module.unlock` is currently met by the game state. Note: `minChassisTier`
 * is explicitly excluded from this check as it requires context of a specific asset.
 * Lock reasons are NOT collected here — use `getLockReasons` for that.
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
    for (let i = 0, len = u.requiredStoryFlags.length; i < len; i++) {
      const f = u.requiredStoryFlags[i]
      if (f !== undefined && !hasStoryFlag(state.activeStoryFlags, f))
        return false
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
    for (let i = 0, len = u.requiredStoryFlags.length; i < len; i++) {
      const f = u.requiredStoryFlags[i]
      if (f !== undefined && !hasStoryFlag(state.activeStoryFlags, f)) {
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
    // ⚡ BOLT OPTIMIZATION: Replaced Array.some() with procedural loop to avoid closure allocations.
    let anySatisfied = false
    for (let i = 0; i < required.length; i++) {
      const req = required[i]
      if (req !== undefined && installed.has(req)) {
        anySatisfied = true
        break
      }
    }
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
  state: GameState,
  slotTypeFilter?: SlotType
): ModulePoolEntry[] => {
  const out: ModulePoolEntry[] = []
  for (const key in MODULE_REGISTRY) {
    if (!Object.hasOwn(MODULE_REGISTRY, key)) continue
    const m = MODULE_REGISTRY[key as keyof typeof MODULE_REGISTRY]
    if (!m || m.ownerKind !== asset.kind) continue
    if (slotTypeFilter && m.slotType !== slotTypeFilter) continue
    const lockReasons = getLockReasons(m, state, asset)
    out.push({
      module: m,
      unlocked: lockReasons.length === 0,
      lockReasons
    })
  }
  return out
}
