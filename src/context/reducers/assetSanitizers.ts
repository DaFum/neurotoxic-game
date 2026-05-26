import { finiteNumberOr, isPlainObject } from '../../utils/gameStateUtils'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'
import { CHASSIS_CONFIG } from '../../utils/assetConfig'
import type {
  AssetFlavor,
  AssetSlot,
  AcquisitionMode,
  ChassisTier,
  CrowdfundCampaign,
  Liability,
  LongTermAsset,
  SlotType
} from '../../types/assets'

const VALID_KINDS: ReadonlySet<string> = new Set([
  'tourbus_chassis',
  'studio_chassis',
  'bandhaus_chassis',
  'merch_workshop_chassis'
])
const VALID_FLAVORS: ReadonlySet<string> = new Set(['legit', 'diy'])
const VALID_MODES: ReadonlySet<string> = new Set(['cash', 'loan', 'crowdfund'])
const VALID_SOURCES: ReadonlySet<string> = new Set(['loan', 'crowdfund'])
const VALID_TIERS: ReadonlySet<number> = new Set([1, 2, 3])
const VALID_OUTCOMES: ReadonlySet<string> = new Set(['success', 'fail'])

// Mirror of the SlotType union in src/types/assets.d.ts. Persisted payloads
// (save files, hostile input) must be cross-checked against this allow-list
// before being cast to the type — TypeScript erases the union at runtime.
const VALID_SLOT_TYPES: ReadonlySet<string> = new Set([
  // Tourbus
  'tb_roof',
  'tb_front',
  'tb_side',
  'tb_interior_driver',
  'tb_interior_cabin',
  'tb_audio',
  'tb_decal',
  'tb_trailer_mount',
  'tb_trailer_addon',
  // Studio
  'st_control',
  'st_outboard',
  'st_mic',
  'st_monitoring',
  'st_treatment',
  'st_software',
  'st_vibe',
  'st_iso',
  // Bandhaus
  'bh_stage',
  'bh_sleeping',
  'bh_kitchen',
  'bh_lounge',
  'bh_backyard',
  'bh_security',
  'bh_identity',
  'bh_secret',
  // Merch workshop
  'mw_print',
  'mw_drying',
  'mw_cutting',
  'mw_packaging',
  'mw_storage',
  'mw_specialty',
  'mw_sales',
  'mw_automation'
])

const isValidSlotType = (value: unknown): value is SlotType =>
  typeof value === 'string' && VALID_SLOT_TYPES.has(value)

const HOSTILE_KEYS = ['__proto__', 'constructor', 'prototype']

/**
 * Returns a shallow copy of `obj` with prototype-pollution keys stripped.
 * Used as the first line of defense before reading any persisted asset data.
 */
const stripHostileKeys = <T extends Record<string, unknown>>(obj: T): T => {
  const out: Record<string, unknown> = {}
  for (const k of Object.keys(obj)) {
    if (HOSTILE_KEYS.includes(k)) continue
    if (Object.hasOwn(obj, k)) out[k] = obj[k]
  }
  return out as T
}

const clampCondition = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, value))
}

const sanitizePosition = (raw: unknown): { x: number; y: number } => {
  if (!isPlainObject(raw)) return { x: 0, y: 0 }
  return {
    x: finiteNumberOr(raw.x, 0),
    y: finiteNumberOr(raw.y, 0)
  }
}

const sanitizeSlot = (
  raw: unknown,
  seenModuleIds: Set<string>
): AssetSlot | null => {
  if (!isPlainObject(raw)) return null
  const clean = stripHostileKeys(raw)
  if (typeof clean.id !== 'string' || clean.id.length === 0) return null
  if (!isValidSlotType(clean.slotType)) return null

  const moduleId =
    typeof clean.installedModuleId === 'string' ? clean.installedModuleId : null

  // Referential integrity: the module must exist (own-property check guards
  // against prototype-chain lookups for hostile ids like 'hasOwnProperty')
  // and match the slot type, and it must not already be installed in another
  // slot of the same asset.
  let validModuleId: string | null = null
  if (
    moduleId !== null &&
    !seenModuleIds.has(moduleId) &&
    Object.hasOwn(MODULE_REGISTRY, moduleId)
  ) {
    const moduleEntry = MODULE_REGISTRY[moduleId]
    if (moduleEntry && moduleEntry.slotType === clean.slotType) {
      validModuleId = moduleId
      seenModuleIds.add(moduleId)
    }
  }

  // Slots fall into two categories:
  // 1. Chassis-tier slots: no addedByModuleId — always kept (validated against
  //    the chassis config separately by the install/upgrade flow, not here).
  // 2. Dynamically-added slots: addedByModuleId points at the module that
  //    created them. If that module is no longer in the registry, the slot is
  //    orphaned and must be dropped to avoid dangling references.
  let addedByModuleId: string | undefined
  if (clean.addedByModuleId !== undefined) {
    if (
      typeof clean.addedByModuleId !== 'string' ||
      !Object.hasOwn(MODULE_REGISTRY, clean.addedByModuleId)
    ) {
      // Orphaned dynamic slot — drop it entirely.
      return null
    }
    addedByModuleId = clean.addedByModuleId
  }

  return {
    id: clean.id,
    slotType: clean.slotType as SlotType,
    position: sanitizePosition(clean.position),
    installedModuleId: validModuleId,
    ...(addedByModuleId !== undefined ? { addedByModuleId } : {})
  }
}

const sanitizeSlots = (raw: unknown): AssetSlot[] => {
  if (!Array.isArray(raw)) return []
  const out: AssetSlot[] = []
  const seenModuleIds = new Set<string>()
  for (const entry of raw) {
    const slot = sanitizeSlot(entry, seenModuleIds)
    if (slot !== null) out.push(slot)
  }
  // Drop child-slots whose parent module is no longer installed on this asset.
  const installedModuleIds = new Set(
    out.map(s => s.installedModuleId).filter((id): id is string => id !== null)
  )
  return out.filter(
    s =>
      s.addedByModuleId === undefined ||
      installedModuleIds.has(s.addedByModuleId)
  )
}

export const sanitizeAssets = (raw: unknown): LongTermAsset[] => {
  if (!Array.isArray(raw)) return []
  const out: LongTermAsset[] = []
  const seenIds = new Set<string>()
  for (const item of raw) {
    if (!isPlainObject(item)) continue
    const clean = stripHostileKeys(item)
    if (typeof clean.id !== 'string' || seenIds.has(clean.id)) continue
    if (!VALID_KINDS.has(clean.kind as string)) continue
    if (!VALID_FLAVORS.has(clean.chassisFlavor as string)) continue
    const tier = Number(clean.chassisTier)
    if (!VALID_TIERS.has(tier)) continue
    if (!VALID_MODES.has(clean.acquisitionMode as string)) continue

    const kind = clean.kind as LongTermAsset['kind']
    const flavor = clean.chassisFlavor as AssetFlavor
    const chassisTier = tier as ChassisTier
    // Cross-check sanitized slots against the chassis layout: a slot is only
    // allowed if its slotType is either in the chassis config for this
    // kind/flavor/tier OR was dynamically added by an installed module
    // (addedByModuleId is set). Slots violating both rules are dropped to
    // prevent impossible topologies from surviving a load.
    const chassisSlotTypes = new Set<string>(
      CHASSIS_CONFIG[kind]?.[flavor]?.[chassisTier]?.slots ?? []
    )
    const sanitizedSlots = sanitizeSlots(clean.slots).filter(
      s => s.addedByModuleId !== undefined || chassisSlotTypes.has(s.slotType)
    )

    out.push({
      id: clean.id,
      kind,
      chassisFlavor: flavor,
      chassisTier,
      condition: clampCondition(finiteNumberOr(clean.condition, 100)),
      baseUpkeep: finiteNumberOr(clean.baseUpkeep, 0),
      baseDailyRevenue: finiteNumberOr(clean.baseDailyRevenue, 0),
      slots: sanitizedSlots,
      acquiredOnDay: finiteNumberOr(clean.acquiredOnDay, 0),
      acquisitionMode: clean.acquisitionMode as AcquisitionMode,
      baseRiskEventChance: finiteNumberOr(clean.baseRiskEventChance, 0)
    })
    seenIds.add(clean.id)
  }
  return out
}

export const sanitizeLiabilities = (
  raw: unknown,
  assets: ReadonlyArray<{ id: string }>
): Liability[] => {
  if (!Array.isArray(raw)) return []
  const assetIds = new Set(assets.map(a => a.id))
  const out: Liability[] = []
  const seenIds = new Set<string>()
  for (const item of raw) {
    if (!isPlainObject(item)) continue
    const clean = stripHostileKeys(item)
    if (typeof clean.id !== 'string' || seenIds.has(clean.id)) continue
    if (!VALID_SOURCES.has(clean.source as string)) continue
    if (typeof clean.assetId !== 'string' || !assetIds.has(clean.assetId))
      continue

    const result: Liability = {
      id: clean.id,
      source: clean.source as Liability['source'],
      assetId: clean.assetId,
      principalRemaining: finiteNumberOr(clean.principalRemaining, 0),
      interestRate: finiteNumberOr(clean.interestRate, 0),
      dailyPayment: finiteNumberOr(clean.dailyPayment, 0),
      termDaysRemaining: finiteNumberOr(clean.termDaysRemaining, 0),
      defaultCounter: finiteNumberOr(clean.defaultCounter, 0)
    }
    if (typeof clean.crowdfundFamePromised === 'number') {
      result.crowdfundFamePromised = finiteNumberOr(
        clean.crowdfundFamePromised,
        0
      )
    }
    out.push(result)
    seenIds.add(clean.id)
  }
  return out
}

export const sanitizeCrowdfundCampaigns = (
  raw: unknown
): CrowdfundCampaign[] => {
  if (!Array.isArray(raw)) return []
  const out: CrowdfundCampaign[] = []
  const seenIds = new Set<string>()
  for (const item of raw) {
    if (!isPlainObject(item)) continue
    const clean = stripHostileKeys(item)
    if (typeof clean.id !== 'string' || seenIds.has(clean.id)) continue
    if (!isPlainObject(clean.assetSpec)) continue
    const spec = stripHostileKeys(clean.assetSpec)
    if (!VALID_KINDS.has(spec.kind as string)) continue
    if (!VALID_FLAVORS.has(spec.flavor as string)) continue
    const tier = Number(spec.chassisTier)
    if (!VALID_TIERS.has(tier)) continue

    const outcome = clean.resolvedOutcome
    // Materialized ids are required fields on the type (so processCrowdfundTick
    // can consume them without runtime UUID generation). On a save from a
    // pre-materialized-ids build, we synthesize stable fallback ids from the
    // campaign id so loaded campaigns still resolve deterministically.
    const rawAssetId =
      typeof clean.materializedAssetId === 'string'
        ? clean.materializedAssetId
        : `${clean.id}_materialized_asset`
    const rawSlotIds = Array.isArray(clean.materializedSlotIds)
      ? clean.materializedSlotIds.filter(
          (s: unknown): s is string => typeof s === 'string'
        )
      : []

    const result: CrowdfundCampaign = {
      id: clean.id,
      assetSpec: {
        kind: spec.kind as CrowdfundCampaign['assetSpec']['kind'],
        flavor: spec.flavor as AssetFlavor,
        chassisTier: tier as ChassisTier
      },
      targetAmount: finiteNumberOr(clean.targetAmount, 0),
      fameStake: finiteNumberOr(clean.fameStake, 0),
      daysRemaining: finiteNumberOr(clean.daysRemaining, 0),
      // Clamp to [0, 1] so a hostile/legacy save can't plant a roll outside
      // the mulberry32 output range and skew tick resolution.
      plannedSuccessRoll: Math.max(
        0,
        Math.min(1, finiteNumberOr(clean.plannedSuccessRoll, 0))
      ),
      // Re-clamp into the same [0.05, 0.95] window the action creator enforces
      // so legacy saves (pre-`plannedSuccessProbability`) get a 50/50 default.
      plannedSuccessProbability: Math.max(
        0.05,
        Math.min(0.95, finiteNumberOr(clean.plannedSuccessProbability, 0.5))
      ),
      materializedAssetId: rawAssetId,
      materializedSlotIds: rawSlotIds
    }
    if (typeof outcome === 'string' && VALID_OUTCOMES.has(outcome)) {
      result.resolvedOutcome = outcome as CrowdfundCampaign['resolvedOutcome']
    }
    out.push(result)
    seenIds.add(clean.id)
  }
  return out
}

export const sanitizeRngSeed = (raw: unknown): number => {
  // Always return a non-negative 32-bit integer seed. The unsigned right-shift
  // coerces to UInt32 (0..2^32-1) which is what mulberry32 expects; `| 0` alone
  // would produce a signed 32-bit (potentially negative) value.
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.trunc(raw) >>> 0
  }
  return Date.now() >>> 0
}
