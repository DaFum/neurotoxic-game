import {
  clamp0to100,
  finiteNumberOr,
  isFiniteNumber,
  isLooseRecord
} from '../../utils/gameState'
import { isForbiddenKey } from '../../utils/objectUtils'
import { logger } from '../../utils/logger'
import { getSecureRandomUint32 } from '../../utils/crypto'
import { MODULE_REGISTRY } from '../../utils/assetModuleRegistry'
import { CHASSIS_CONFIG } from '../../utils/assetConfig'
import {
  VALID_ASSET_ACQUISITION_MODES,
  VALID_ASSET_FLAVORS,
  VALID_ASSET_KINDS,
  VALID_ASSET_TIERS
} from '../../utils/assetValidation'
import type {
  AssetFlavor,
  AssetKind,
  AssetSlot,
  AcquisitionMode,
  ChassisTier,
  CrowdfundCampaign,
  Liability,
  LongTermAsset,
  RiskEventDescriptor,
  RiskEventType,
  SlotType
} from '../../types/assets'

/**
 * Reports entries discarded during load-time sanitization.
 *
 * @remarks
 * Sanitization silently deleting player-owned data is the hardest class of
 * save-corruption bug to diagnose, so every drop path reports here. Drops are
 * aggregated into one warning per collection to keep the sanitizers cheap and
 * the log readable on a badly corrupted save.
 * @param collection - Name of the collection being sanitized.
 * @param dropped - Reason keyed by the dropped entry's id (or index).
 */
const reportDroppedEntries = (
  collection: string,
  dropped: ReadonlyMap<string, string>
): void => {
  if (dropped.size === 0) return
  const details = Array.from(dropped, ([id, reason]) => `${id} (${reason})`)
  logger.warn(
    'Persistence',
    `Dropped ${dropped.size} invalid ${collection} entr${dropped.size === 1 ? 'y' : 'ies'} during load: ${details.join(', ')}`
  )
}

const VALID_SOURCES: ReadonlySet<string> = new Set(['loan', 'crowdfund'])
const VALID_OUTCOMES: ReadonlySet<string> = new Set(['success', 'fail'])
const VALID_RISK_EVENT_TYPES: ReadonlySet<string> = new Set([
  'eviction',
  'fire',
  'theft',
  'police_check',
  'copyright_strike',
  'raid',
  'scam_or_bust',
  'paranormal',
  'foreclosure'
])

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

/**
 * Sanitizes persisted asset-kind lists into unique known asset kinds.
 *
 * @param raw - Raw persisted asset-kind collection.
 * @returns Unique valid asset kinds in their original order.
 */
export const sanitizeAssetKinds = (raw: unknown): AssetKind[] => {
  if (!Array.isArray(raw)) return []
  const out: AssetKind[] = []
  for (const item of raw) {
    if (typeof item !== 'string' || !VALID_ASSET_KINDS.has(item)) continue
    const kind = item as AssetKind
    if (!out.includes(kind)) out.push(kind)
  }
  return out
}

/**
 * Sanitizes a pending risk-event descriptor from persisted or hostile input.
 *
 * @param raw - Raw risk-event descriptor.
 * @returns Valid risk-event descriptor, or null when required fields are invalid.
 */
export const sanitizeRiskEventDescriptor = (
  raw: unknown
): RiskEventDescriptor | null => {
  if (!isLooseRecord(raw)) return null
  const clean = stripHostileKeys(raw)
  if (typeof clean.assetId !== 'string') return null
  if (
    typeof clean.eventType !== 'string' ||
    !VALID_RISK_EVENT_TYPES.has(clean.eventType)
  ) {
    return null
  }
  if (
    typeof clean.conditionLoss !== 'number' ||
    !Number.isFinite(clean.conditionLoss)
  ) {
    return null
  }

  return {
    assetId: clean.assetId,
    eventType: clean.eventType as RiskEventType,
    conditionLoss: clean.conditionLoss
  }
}

/**
 * Returns a shallow copy of `obj` with prototype-pollution keys stripped.
 * Used as the first line of defense before reading any persisted asset data.
 *
 * Intentionally shallow and type-preserving (returns `T`), unlike the recursive
 * `sanitizeTraversableValue` in `src/utils/objectUtils.ts`; both consult the
 * canonical `isForbiddenKey`/`FORBIDDEN_KEYS`.
 */
const stripHostileKeys = <T extends Record<string, unknown>>(obj: T): T => {
  const out: Record<string, unknown> = {}
  // ⚡ BOLT OPTIMIZATION: Replaced Object.keys() with for...in loop.
  // Why: Avoids unnecessary array allocation when checking keys during data sanitization.
  // Impact: Reduces transient GC overhead on hot paths when validating incoming nested properties.
  for (const k in obj) {
    if (!Object.hasOwn(obj, k)) continue
    if (isForbiddenKey(k)) continue
    out[k] = obj[k]
  }
  return out as T
}

const sanitizePosition = (raw: unknown): { x: number; y: number } => {
  if (!isLooseRecord(raw)) return { x: 0, y: 0 }
  return {
    x: Object.hasOwn(raw, 'x') ? finiteNumberOr(raw.x, 0) : 0,
    y: Object.hasOwn(raw, 'y') ? finiteNumberOr(raw.y, 0) : 0
  }
}

const sanitizeSlot = (
  raw: unknown,
  seenModuleIds: Set<string>
): AssetSlot | null => {
  if (!isLooseRecord(raw)) return null
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
  const installedModuleIds = new Set<string>()
  let hasDynamicSlots = false

  for (const entry of raw) {
    const slot = sanitizeSlot(entry, seenModuleIds)
    if (slot !== null) {
      out.push(slot)
      if (slot.installedModuleId !== null) {
        installedModuleIds.add(slot.installedModuleId)
      }
      if (slot.addedByModuleId !== undefined) {
        hasDynamicSlots = true
      }
    }
  }

  if (!hasDynamicSlots) {
    return out
  }

  // Drop child-slots whose parent module is no longer installed on this asset.
  return out.filter(
    s =>
      s.addedByModuleId === undefined ||
      installedModuleIds.has(s.addedByModuleId)
  )
}

const validateChassisKindFlavorTier = (
  kind: unknown,
  flavor: unknown,
  tier: unknown,
  label: string,
  dropped: Map<string, string>,
  prefix = ''
): {
  kind: AssetKind
  flavor: AssetFlavor
  chassisTier: ChassisTier
} | null => {
  if (!VALID_ASSET_KINDS.has(kind as string)) {
    dropped.set(label, `invalid ${prefix}kind ${String(kind)}`)
    return null
  }
  if (!VALID_ASSET_FLAVORS.has(flavor as string)) {
    dropped.set(label, `invalid ${prefix}flavor ${String(flavor)}`)
    return null
  }
  if (!isFiniteNumber(tier) || !VALID_ASSET_TIERS.has(tier)) {
    dropped.set(
      label,
      `invalid ${prefix}${prefix ? 'chassisTier' : 'tier'} ${String(tier)}`
    )
    return null
  }
  return {
    kind: kind as AssetKind,
    flavor: flavor as AssetFlavor,
    chassisTier: tier as ChassisTier
  }
}

/**
 * Sanitizes persisted long-term assets and drops invalid topology entries.
 *
 * @param raw - Raw asset collection from loaded state.
 * @returns Sanitized assets with valid slots, modules, chassis data, and unique ids.
 */
export const sanitizeAssets = (raw: unknown): LongTermAsset[] => {
  if (!Array.isArray(raw)) return []
  const out: LongTermAsset[] = []
  const seenIds = new Set<string>()
  const dropped = new Map<string, string>()
  for (const [index, item] of raw.entries()) {
    if (!isLooseRecord(item)) {
      dropped.set(`#${index}`, 'not an object')
      continue
    }
    const clean = stripHostileKeys(item)
    const label = typeof clean.id === 'string' ? clean.id : `#${index}`
    if (typeof clean.id !== 'string' || seenIds.has(clean.id)) {
      dropped.set(label, 'missing or duplicate id')
      continue
    }
    const spec = validateChassisKindFlavorTier(
      clean.kind,
      clean.chassisFlavor,
      clean.chassisTier,
      label,
      dropped
    )
    if (!spec) continue
    if (!VALID_ASSET_ACQUISITION_MODES.has(clean.acquisitionMode as string)) {
      dropped.set(
        label,
        `invalid acquisitionMode ${String(clean.acquisitionMode)}`
      )
      continue
    }

    const { kind, flavor, chassisTier } = spec
    const configTier = CHASSIS_CONFIG[kind]?.[flavor]?.[chassisTier]
    if (!configTier) {
      // The chassis economics below are re-derived from CHASSIS_CONFIG, so an
      // asset whose tier no longer exists in the catalogue cannot be rebuilt
      // and is discarded. Renaming or removing a shipped tier therefore
      // deletes that asset from every existing save — this warning is the only
      // signal that happened.
      dropped.set(
        label,
        `no CHASSIS_CONFIG entry for ${kind}/${flavor}/${chassisTier}`
      )
      continue
    }
    // Cross-check sanitized slots against the chassis layout: a slot is only
    // allowed if its slotType is either in the chassis config for this
    // kind/flavor/tier OR was dynamically added by an installed module
    // (addedByModuleId is set). Slots violating both rules are dropped to
    // prevent impossible topologies from surviving a load.
    const chassisSlotTypes = new Set<string>(configTier.slots)
    const sanitizedSlots = sanitizeSlots(clean.slots).filter(
      s => s.addedByModuleId !== undefined || chassisSlotTypes.has(s.slotType)
    )

    out.push({
      id: clean.id,
      kind,
      chassisFlavor: flavor,
      chassisTier,
      condition: clamp0to100(finiteNumberOr(clean.condition, 100)),
      baseUpkeep: configTier.upkeep,
      baseDailyRevenue: configTier.revenue,
      slots: sanitizedSlots,
      acquiredOnDay: finiteNumberOr(clean.acquiredOnDay, 0),
      acquisitionMode: clean.acquisitionMode as AcquisitionMode,
      baseRiskEventChance: configTier.baseRiskEventChance
    })
    seenIds.add(clean.id)
  }
  reportDroppedEntries('asset', dropped)
  return out
}

/**
 * Sanitizes persisted liabilities and drops entries not tied to active assets.
 *
 * @param raw - Raw liability collection from loaded state.
 * @param assets - Sanitized assets used to validate liability ownership.
 * @returns Valid liabilities with unique ids; malformed financial entries are dropped.
 */
export const sanitizeLiabilities = (
  raw: unknown,
  assets: ReadonlyArray<{ id: string }>
): Record<string, Liability> => {
  if (typeof raw !== 'object' || raw === null) return {}
  const items = Array.isArray(raw) ? raw : Object.values(raw)
  const assetIds = new Set<string>(
    assets
      .map(asset => asset?.id)
      .filter((id): id is string => typeof id === 'string')
  )
  const out: Record<string, Liability> = Object.create(null)
  const dropped = new Map<string, string>()
  for (const [index, item] of items.entries()) {
    if (!isLooseRecord(item)) {
      dropped.set(`#${index}`, 'not an object')
      continue
    }
    const clean = stripHostileKeys(item)
    const label = typeof clean.id === 'string' ? clean.id : `#${index}`
    if (typeof clean.id !== 'string') {
      dropped.set(label, 'missing id')
      continue
    }
    if (!VALID_SOURCES.has(clean.source as string)) {
      dropped.set(label, `invalid source ${String(clean.source)}`)
      continue
    }
    if (typeof clean.assetId !== 'string' || !assetIds.has(clean.assetId)) {
      dropped.set(
        label,
        `assetId ${String(clean.assetId)} has no surviving asset`
      )
      continue
    }

    const principalRemaining = clean.principalRemaining
    const interestRate = clean.interestRate
    const dailyPayment = clean.dailyPayment
    const termDaysRemaining = clean.termDaysRemaining
    const defaultCounter = clean.defaultCounter
    if (
      !isFiniteNumber(principalRemaining) ||
      principalRemaining <= 0 ||
      !isFiniteNumber(interestRate) ||
      interestRate < 0 ||
      !isFiniteNumber(dailyPayment) ||
      dailyPayment < 0 ||
      (clean.source === 'loan' && dailyPayment === 0) ||
      !isFiniteNumber(termDaysRemaining) ||
      termDaysRemaining <= 0 ||
      !isFiniteNumber(defaultCounter) ||
      defaultCounter < 0
    ) {
      dropped.set(label, 'malformed financial fields')
      continue
    }
    // The field only exists on crowdfund-generated liabilities. A 'loan' entry
    // carrying it is malformed or hostile, so it is rejected rather than copied
    // through into sanitized state.
    const hasCrowdfundFamePromised = Object.hasOwn(
      clean,
      'crowdfundFamePromised'
    )
    if (hasCrowdfundFamePromised && clean.source !== 'crowdfund') {
      dropped.set(label, 'crowdfundFamePromised on a non-crowdfund liability')
      continue
    }
    if (
      hasCrowdfundFamePromised &&
      (!isFiniteNumber(clean.crowdfundFamePromised) ||
        clean.crowdfundFamePromised < 0)
    ) {
      dropped.set(label, 'malformed crowdfundFamePromised')
      continue
    }

    const result: Liability = {
      id: clean.id,
      source: clean.source as Liability['source'],
      assetId: clean.assetId,
      principalRemaining,
      interestRate,
      dailyPayment,
      termDaysRemaining,
      defaultCounter
    }
    if (hasCrowdfundFamePromised) {
      result.crowdfundFamePromised = clean.crowdfundFamePromised as number
    }
    out[result.id] = result
  }
  reportDroppedEntries('liability', dropped)
  return out
}

/**
 * Sanitizes persisted crowdfund campaigns and filters duplicate active acquisitions.
 *
 * @param raw - Raw campaign collection from loaded state.
 * @param activeAssets - Assets whose kinds already block another acquisition.
 * @returns Valid crowdfund campaigns with deterministic materialization ids.
 */
export const sanitizeCrowdfundCampaigns = (
  raw: unknown,
  activeAssets: ReadonlyArray<Pick<LongTermAsset, 'kind'>> = []
): CrowdfundCampaign[] => {
  if (!Array.isArray(raw)) return []
  const out: CrowdfundCampaign[] = []
  const seenIds = new Set<string>()

  const unavailableKinds = new Set<LongTermAsset['kind']>(
    activeAssets
      .map(asset => asset?.kind)
      .filter((kind): kind is LongTermAsset['kind'] => !!kind)
  )

  const seenKinds = new Set<CrowdfundCampaign['assetSpec']['kind']>()
  const dropped = new Map<string, string>()
  for (const [index, item] of raw.entries()) {
    if (!isLooseRecord(item)) {
      dropped.set(`#${index}`, 'not an object')
      continue
    }
    const clean = stripHostileKeys(item)
    const label = typeof clean.id === 'string' ? clean.id : `#${index}`
    if (typeof clean.id !== 'string' || seenIds.has(clean.id)) {
      dropped.set(label, 'missing or duplicate id')
      continue
    }
    if (!isLooseRecord(clean.assetSpec)) {
      dropped.set(label, 'missing assetSpec')
      continue
    }
    const rawSpec = stripHostileKeys(clean.assetSpec)
    const spec = validateChassisKindFlavorTier(
      rawSpec.kind,
      rawSpec.flavor,
      rawSpec.chassisTier,
      label,
      dropped,
      'assetSpec.'
    )
    if (!spec) continue
    const kind = spec.kind as CrowdfundCampaign['assetSpec']['kind']
    if (unavailableKinds.has(kind) || seenKinds.has(kind)) {
      dropped.set(label, `kind ${kind} already owned or campaigned`)
      continue
    }

    const targetAmount = finiteNumberOr(clean.targetAmount, 0)
    const fameStake = finiteNumberOr(clean.fameStake, 0)
    const daysRemaining = finiteNumberOr(clean.daysRemaining, 0)
    if (targetAmount <= 0 || daysRemaining <= 0 || fameStake < 0) {
      dropped.set(label, 'malformed targetAmount/daysRemaining/fameStake')
      continue
    }

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
        kind,
        flavor: spec.flavor as AssetFlavor,
        chassisTier: spec.chassisTier
      },
      targetAmount,
      fameStake,
      daysRemaining,
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
    seenKinds.add(kind)
  }
  reportDroppedEntries('crowdfund campaign', dropped)
  return out
}

/**
 * Sanitizes a persisted RNG seed into the unsigned 32-bit range.
 *
 * @param raw - Raw seed value.
 * @returns Non-negative UInt32 seed suitable for mulberry32.
 */
export const sanitizeRngSeed = (raw: unknown): number => {
  // Always return a non-negative 32-bit integer seed. The unsigned right-shift
  // coerces to UInt32 (0..2^32-1) which is what mulberry32 expects; `| 0` alone
  // would produce a signed 32-bit (potentially negative) value.
  if (isFiniteNumber(raw)) {
    return Math.trunc(raw) >>> 0
  }
  // Deliberate purity exception: only reachable when hydrating a save whose
  // seed is missing/corrupt. A fresh wall-clock seed is preferable to a fixed
  // constant (which would make every recovered save share one RNG timeline).
  return Date.now() >>> 0
}

/**
 * Sanitizes a persisted run seed into the unsigned 32-bit range.
 *
 * @param raw - Raw seed value.
 * @returns Non-negative UInt32 seed used for map generation.
 *
 * @remarks
 * A save that predates `runSeed`, or carries a corrupt one, gets a fresh
 * crypto-derived seed rather than a constant — otherwise every recovered save
 * would generate the same map.
 */
export const sanitizeRunSeed = (raw: unknown): number => {
  if (isFiniteNumber(raw)) {
    return Math.trunc(raw) >>> 0
  }
  return getSecureRandomUint32()
}
