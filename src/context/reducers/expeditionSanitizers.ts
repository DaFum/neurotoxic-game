/**
 * Load-time sanitization for the persisted Expedition slice.
 *
 * @remarks
 * Every value here comes from a save file, so nothing is copied wholesale:
 * unknown discriminants fall back to the canonical default, invalid entries are
 * skipped, and any state whose required run identity is missing collapses to
 * the idle default rather than resuming a half-described run. Numeric narrowing
 * uses `isFiniteNumber`, never `Number(...)` coercion, so booleans, arrays and
 * numeric strings cannot enter the run state.
 */

import { isFiniteNumber } from '../../utils/finiteNumber'
import {
  isForbiddenKey,
  isLooseRecord,
  sanitizeStringArray
} from '../../utils/objectUtils'
import { createDefaultExpeditionState } from '../../domain/expedition/defaults'
import { getExpeditionInsurancePolicy } from '../../domain/expedition/insurance'
import {
  buildExpeditionRewardEntryId,
  isExpeditionRewardSecuredOnEarn,
  resolveExpeditionRewardDefinition
} from '../../domain/expedition/rewardLedger'
import { buildExpeditionMap } from '../../domain/expedition/map'
import type {
  ExpeditionBuildCommitment,
  ExpeditionCargoState,
  ExpeditionContrabandSelection,
  ExpeditionEquipmentCommitment,
  ExpeditionFailureChoiceId,
  ExpeditionFailureReason,
  ExpeditionIntelGrant,
  ExpeditionLoadout,
  ExpeditionMerchSelection,
  ExpeditionNativeContractCommitment,
  ExpeditionOutcome,
  ExpeditionRewardLedgerEntry,
  ExpeditionSettlement,
  ExpeditionState,
  ExpeditionStatus,
  ExpeditionTechnicalCondition,
  HiddenDefectState,
  NodeIntelLevel,
  PendingExpeditionFailure
} from '../../types/expedition'

const EXPEDITION_STATUSES: ReadonlySet<string> = new Set<ExpeditionStatus>([
  'idle',
  'prepared',
  'active',
  'extracted',
  'completed',
  'failed'
])

const TERMINAL_STATUSES: ReadonlySet<string> = new Set<ExpeditionStatus>([
  'extracted',
  'completed',
  'failed'
])

const FAILURE_REASONS: ReadonlySet<string> = new Set<ExpeditionFailureReason>([
  'bankruptcy',
  'fuel_stranded',
  'technical_shutdown',
  'crew_collapse',
  'authority_crisis',
  'critical_contract_breach'
])

const FAILURE_CHOICES: ReadonlySet<string> = new Set<ExpeditionFailureChoiceId>(
  ['refuel', 'tow', 'insurance_claim', 'extract', 'accept_failure']
)

const OUTCOME_KINDS: ReadonlySet<string> = new Set<ExpeditionOutcome['kind']>([
  'extracted',
  'completed',
  'failed'
])

/** Hard bound on persisted intel entries, so a hostile save cannot be walked forever. */
const MAX_INTEL_ENTRIES = 64

/** Hard bound on persisted collection lengths shared by grants/ledger/steps. */
const MAX_COLLECTION_ENTRIES = 256

const readString = (
  record: Record<string, unknown>,
  key: string
): string | null => {
  if (!Object.hasOwn(record, key)) return null
  const raw = record[key]
  return typeof raw === 'string' && raw.length > 0 ? raw : null
}

const readBoolean = (record: Record<string, unknown>, key: string): boolean =>
  Object.hasOwn(record, key) && record[key] === true

/**
 * Reads a non-negative integer, rejecting non-finite and fractional values.
 */
const readCount = (
  record: Record<string, unknown>,
  key: string,
  fallback: number
): number => {
  if (!Object.hasOwn(record, key)) return fallback
  const raw = record[key]
  if (!isFiniteNumber(raw) || !Number.isInteger(raw) || raw < 0) return fallback
  return raw
}

/**
 * Reads a bounded array of unique non-negative integers.
 */
const sanitizeIntegerList = (value: unknown): number[] => {
  if (!Array.isArray(value)) return []
  const seen = new Set<number>()
  const out: number[] = []
  for (const entry of value.slice(0, MAX_COLLECTION_ENTRIES)) {
    if (!isFiniteNumber(entry) || !Number.isInteger(entry) || entry < 0)
      continue
    if (seen.has(entry)) continue
    seen.add(entry)
    out.push(entry)
  }
  return out
}

/**
 * Deduplicates a string array while preserving order.
 */
const sanitizeUniqueStrings = (value: unknown): string[] => {
  const seen = new Set<string>()
  const out: string[] = []
  for (const entry of sanitizeStringArray(value).slice(
    0,
    MAX_COLLECTION_ENTRIES
  )) {
    if (entry.length === 0 || isForbiddenKey(entry) || seen.has(entry)) continue
    seen.add(entry)
    out.push(entry)
  }
  return out
}

/**
 * Sanitizes the persisted node-intel map.
 *
 * @param value - Untrusted `intelByNodeId` record from a save.
 * @returns Null-prototype record of node id to a legal intel level.
 */
export const sanitizeExpeditionIntelMap = (
  value: unknown
): ExpeditionState['intelByNodeId'] => {
  const out = Object.create(null) as Record<string, NodeIntelLevel>
  if (!isLooseRecord(value)) return out
  let accepted = 0
  for (const key of Object.keys(value)) {
    if (accepted >= MAX_INTEL_ENTRIES) break
    if (!Object.hasOwn(value, key) || isForbiddenKey(key) || key.length === 0) {
      continue
    }
    const raw = value[key]
    if (raw !== 0 && raw !== 1 && raw !== 2) continue
    out[key] = raw
    accepted += 1
  }
  return out
}

const sanitizeIntelGrant = (value: unknown): ExpeditionIntelGrant | null => {
  if (!isLooseRecord(value)) return null
  const id = readString(value, 'id')
  const nodeId = readString(value, 'nodeId')
  const sourceProofId = readString(value, 'sourceProofId')
  const source = readString(value, 'source')
  if (!id || !nodeId || !sourceProofId) return null
  if (source !== 'social' && source !== 'contact') return null
  const targetLevel = value.targetLevel
  if (targetLevel !== 1 && targetLevel !== 2) return null
  return {
    id,
    source,
    sourceProofId,
    nodeId,
    targetLevel,
    consumed: readBoolean(value, 'consumed')
  }
}

/**
 * Sanitizes one persisted reward-ledger entry.
 *
 * @param value - Untrusted ledger entry from a save.
 * @returns The entry with its definition-owned fields re-derived, or `null`.
 *
 * @remarks
 * A save must not be able to author a reward. The reward id is resolved through
 * the canonical registry and rejected when unknown, and `sourceType` plus
 * `secured` are re-derived from that definition rather than read from the file:
 * otherwise a crafted entry marked `secured: true, materialized: false` would
 * be retained on failure and then granted by the terminal handler, bypassing
 * the reducer's source-proof checks entirely.
 *
 * `id` must still be the derived `<definition>::<source>` key the reducer
 * produces, so a save cannot smuggle two ledger rows for the same source past
 * the duplicate check.
 */
const sanitizeRewardEntry = (
  value: unknown
): ExpeditionRewardLedgerEntry | null => {
  if (!isLooseRecord(value)) return null
  const id = readString(value, 'id')
  const rewardDefinitionId = readString(value, 'rewardDefinitionId')
  const sourceId = readString(value, 'sourceId')
  if (!id || !rewardDefinitionId || !sourceId) return null

  const definition = resolveExpeditionRewardDefinition(rewardDefinitionId)
  if (!definition) return null
  if (id !== buildExpeditionRewardEntryId(definition.id, sourceId)) return null

  return {
    id,
    rewardDefinitionId: definition.id,
    // Definition-owned, never save-owned.
    sourceType: definition.sourceType,
    sourceId,
    secured: isExpeditionRewardSecuredOnEarn(definition),
    earnedAtRouteStep: readCount(value, 'earnedAtRouteStep', 0),
    materialized: readBoolean(value, 'materialized')
  }
}

const sanitizeEquipmentCommitment = (
  value: unknown
): ExpeditionEquipmentCommitment => ({
  selectedGearItemIds: isLooseRecord(value)
    ? sanitizeUniqueStrings(value.selectedGearItemIds)
    : []
})

const sanitizeMerchSelections = (
  value: unknown
): ExpeditionMerchSelection[] => {
  if (!Array.isArray(value)) return []
  const out: ExpeditionMerchSelection[] = []
  const seen = new Set<string>()
  for (const entry of value.slice(0, MAX_COLLECTION_ENTRIES)) {
    if (!isLooseRecord(entry)) continue
    const inventoryKey = readString(entry, 'inventoryKey')
    if (!inventoryKey || isForbiddenKey(inventoryKey)) continue
    if (seen.has(inventoryKey)) continue
    const quantity = readCount(entry, 'quantity', 0)
    if (quantity <= 0) continue
    seen.add(inventoryKey)
    out.push({ inventoryKey, quantity })
  }
  return out
}

const sanitizeContrabandSelections = (
  value: unknown
): ExpeditionContrabandSelection[] => {
  if (!Array.isArray(value)) return []
  const out: ExpeditionContrabandSelection[] = []
  const seen = new Set<string>()
  for (const entry of value.slice(0, MAX_COLLECTION_ENTRIES)) {
    if (!isLooseRecord(entry)) continue
    const stashKey = readString(entry, 'stashKey')
    if (!stashKey || isForbiddenKey(stashKey)) continue
    const instanceId = readString(entry, 'instanceId')
    const dedupeKey = `${stashKey}::${instanceId ?? ''}`
    if (seen.has(dedupeKey)) continue
    const stacks = readCount(entry, 'stacks', 0)
    if (stacks <= 0) continue
    seen.add(dedupeKey)
    out.push({ stashKey, instanceId, stacks })
  }
  return out
}

const sanitizeNativeContracts = (
  value: unknown
): ExpeditionNativeContractCommitment[] => {
  if (!Array.isArray(value)) return []
  const out: ExpeditionNativeContractCommitment[] = []
  const seen = new Set<string>()
  for (const entry of value.slice(0, MAX_COLLECTION_ENTRIES)) {
    if (!isLooseRecord(entry)) continue
    const templateId = readString(entry, 'templateId')
    if (!templateId || seen.has(templateId)) continue
    seen.add(templateId)
    out.push({ templateId, targetNodeId: readString(entry, 'targetNodeId') })
  }
  return out
}

const sanitizeBuildCommitment = (value: unknown): ExpeditionBuildCommitment => {
  const record = isLooseRecord(value) ? value : {}
  return {
    setlistSongIds: sanitizeUniqueStrings(record.setlistSongIds),
    equipment: sanitizeEquipmentCommitment(record.equipment),
    selectedTourbusModuleIds: sanitizeUniqueStrings(
      record.selectedTourbusModuleIds
    ),
    merch: sanitizeMerchSelections(record.merch),
    contraband: sanitizeContrabandSelections(record.contraband),
    sponsorOfferId: readString(record, 'sponsorOfferId'),
    startingFuelTarget: readCount(record, 'startingFuelTarget', 0),
    protectedCareerCash: readCount(record, 'protectedCareerCash', 0)
  }
}

/**
 * Sanitizes a persisted committed loadout.
 *
 * @param value - Untrusted loadout from a save.
 * @returns A structurally valid loadout, or `null` when the required Tour and
 * Region identity is missing.
 */
const sanitizeExpeditionLoadout = (
  value: unknown
): ExpeditionLoadout | null => {
  if (!isLooseRecord(value)) return null
  const tourTypeId = readString(value, 'tourTypeId')
  const regionId = readString(value, 'regionId')
  if (!tourTypeId || !regionId) return null
  const cargo = isLooseRecord(value.cargo) ? value.cargo : {}
  return {
    tourTypeId,
    regionId,
    activeTourbusAssetId: readString(value, 'activeTourbusAssetId'),
    crewIds: sanitizeUniqueStrings(value.crewIds),
    cargo: {
      spareParts: readCount(cargo, 'spareParts', 0),
      supplies: readCount(cargo, 'supplies', 0)
    },
    starterPerkId: readString(value, 'starterPerkId'),
    nativeContracts: sanitizeNativeContracts(value.nativeContracts),
    insurancePolicyId:
      getExpeditionInsurancePolicy(readString(value, 'insurancePolicyId'))
        ?.id ?? null,
    pressureModifierIds: sanitizeUniqueStrings(value.pressureModifierIds),
    build: sanitizeBuildCommitment(value.build)
  }
}

const sanitizePendingFailure = (
  value: unknown
): PendingExpeditionFailure | null => {
  if (!isLooseRecord(value)) return null
  const id = readString(value, 'id')
  const sourceId = readString(value, 'sourceId')
  const reason = readString(value, 'reason')
  if (!id || !sourceId || !reason || !FAILURE_REASONS.has(reason)) return null
  const choices = sanitizeUniqueStrings(value.choices).filter(choice =>
    FAILURE_CHOICES.has(choice)
  ) as ExpeditionFailureChoiceId[]
  // A crisis with no legal response would be an unrecoverable softlock, which
  // the design forbids; drop it rather than resume it.
  if (choices.length === 0) return null
  return {
    id,
    reason: reason as ExpeditionFailureReason,
    sourceId,
    raisedAtRouteStep: readCount(value, 'raisedAtRouteStep', 0),
    choices
  }
}

const readRate = (
  record: Record<string, unknown>,
  key: string,
  fallback: number
): number => {
  if (!Object.hasOwn(record, key)) return fallback
  const raw = record[key]
  if (!isFiniteNumber(raw) || raw < 0 || raw > 1) return fallback
  return raw
}

const sanitizeSettlement = (value: unknown): ExpeditionSettlement => {
  const record = isLooseRecord(value) ? value : {}
  return {
    retentionRate: readRate(record, 'retentionRate', 0),
    moneyEarned: readCount(record, 'moneyEarned', 0),
    moneyRetained: readCount(record, 'moneyRetained', 0),
    moneyForfeited: readCount(record, 'moneyForfeited', 0),
    fameEarned: readCount(record, 'fameEarned', 0),
    fameRetained: readCount(record, 'fameRetained', 0),
    fameForfeited: readCount(record, 'fameForfeited', 0),
    retainedRewardEntryIds: sanitizeUniqueStrings(
      record.retainedRewardEntryIds
    ),
    abandonedRewardEntryIds: sanitizeUniqueStrings(
      record.abandonedRewardEntryIds
    )
  }
}

const sanitizeOutcome = (value: unknown): ExpeditionOutcome | null => {
  if (!isLooseRecord(value)) return null
  const runId = readString(value, 'runId')
  const kind = readString(value, 'kind')
  if (!runId || !kind || !OUTCOME_KINDS.has(kind)) return null
  const rawReason = readString(value, 'reason')
  const reason =
    rawReason && FAILURE_REASONS.has(rawReason)
      ? (rawReason as ExpeditionFailureReason)
      : null
  // A failed run must name the failure family that ended it: the design
  // requires attributable failure reasons.
  if (kind === 'failed' && reason === null) return null
  return {
    runId,
    kind: kind as ExpeditionOutcome['kind'],
    reason: kind === 'failed' ? reason : null,
    finalizedAtRouteStep: readCount(value, 'finalizedAtRouteStep', 0),
    settlement: sanitizeSettlement(value.settlement),
    finaleResultId: readString(value, 'finaleResultId')
  }
}

/**
 * Sanitizes the persisted Expedition cargo slice.
 */
const sanitizeExpeditionCargo = (
  value: unknown
): ExpeditionCargoState | null => {
  if (!isLooseRecord(value)) return null
  const spareParts = readCount(value, 'spareParts', 0)
  const supplies = readCount(value, 'supplies', 0)
  const technicalGearItemIds = sanitizeUniqueStrings(value.technicalGearItemIds)
  const merch = sanitizeMerchSelections(value.merch)
  const contraband = sanitizeContrabandSelections(value.contraband)
  return {
    spareParts,
    supplies,
    technicalGearItemIds,
    merch,
    contraband
  }
}

/**
 * Sanitizes the persisted Expedition technical condition slice.
 */
const sanitizeExpeditionTechnicalCondition = (
  value: unknown
): ExpeditionTechnicalCondition | null => {
  if (!isLooseRecord(value)) return null
  const pa = readCount(value, 'pa', 100)
  const instruments = readCount(value, 'instruments', 100)
  const stageGear = readCount(value, 'stageGear', 100)

  const defects: HiddenDefectState[] = []
  if (Array.isArray(value.defects)) {
    for (const raw of value.defects.slice(0, MAX_COLLECTION_ENTRIES)) {
      if (!isLooseRecord(raw)) continue
      const id = readString(raw, 'id')
      const group = readString(raw, 'group')
      const severity = raw.severity
      const status = readString(raw, 'status')
      const source = readString(raw, 'source')
      const createdAtRouteStep = readCount(raw, 'createdAtRouteStep', 0)
      const triggerAt = readString(raw, 'triggerAt')
      const triggerRouteStep = readCount(raw, 'triggerRouteStep', 0)

      if (
        !id ||
        !group ||
        (group !== 'pa' && group !== 'instruments' && group !== 'stageGear')
      ) {
        continue
      }
      if (severity !== 1 && severity !== 2 && severity !== 3) continue
      if (
        status !== 'hidden' &&
        status !== 'revealed' &&
        status !== 'triggered' &&
        status !== 'resolved'
      ) {
        continue
      }
      if (
        source !== 'field_repair' &&
        source !== 'improvise' &&
        source !== 'critical_wear'
      ) {
        continue
      }
      if (
        triggerAt !== 'post_travel' &&
        triggerAt !== 'pre_gig' &&
        triggerAt !== 'post_gig'
      ) {
        continue
      }

      defects.push({
        id,
        group,
        severity,
        status,
        source,
        createdAtRouteStep,
        triggerAt,
        triggerRouteStep
      })
    }
  }

  return {
    pa: Math.max(0, Math.min(100, pa)),
    instruments: Math.max(0, Math.min(100, instruments)),
    stageGear: Math.max(0, Math.min(100, stageGear)),
    defects
  }
}

/**
 * Sanitizes the persisted Expedition slice.
 *
 * @param value - Untrusted `expedition` value from a save.
 * @returns A consistent {@link ExpeditionState}; the idle default whenever the
 * persisted status lacks the run identity it requires.
 *
 * @remarks
 * No `runSeed` is read or written here — the root `GameState.runSeed` remains
 * the single map/run seed owner, so a save can never resume with two seeds.
 */
export const sanitizeExpeditionState = (
  value: unknown,
  runSeed?: number
): ExpeditionState => {
  const fallback = createDefaultExpeditionState()
  if (!isLooseRecord(value)) return fallback

  const rawStatus = readString(value, 'status')
  const status: ExpeditionStatus =
    rawStatus && EXPEDITION_STATUSES.has(rawStatus)
      ? (rawStatus as ExpeditionStatus)
      : 'idle'
  if (status === 'idle') return fallback

  const prepId = isLooseRecord(value.prep)
    ? readString(value.prep, 'prepId')
    : null
  const runId = readString(value, 'runId')
  const loadout = sanitizeExpeditionLoadout(value.loadout)
  const outcome = sanitizeOutcome(value.outcome)

  // Identity requirements per status. A save that fails one of these describes
  // a run that cannot be resumed or settled, so it collapses to idle instead of
  // leaving the player mid-run with no committed build or terminal record.
  if (status === 'prepared' && !prepId) return fallback
  if (status === 'active' && (!runId || !loadout)) return fallback
  if (TERMINAL_STATUSES.has(status)) {
    if (!runId || !loadout || !outcome) return fallback
    if (outcome.runId !== runId || outcome.kind !== status) return fallback
  }

  const visitedNodeIds = sanitizeUniqueStrings(value.visitedNodeIds)

  const rewardLedger: ExpeditionRewardLedgerEntry[] = []
  const seenRewardIds = new Set<string>()
  if (Array.isArray(value.rewardLedger)) {
    let preparedMap: ReturnType<typeof buildExpeditionMap> | null = null
    if (isFiniteNumber(runSeed) && loadout) {
      preparedMap = buildExpeditionMap(runSeed, loadout.tourTypeId, loadout.regionId)
    }

    for (const raw of value.rewardLedger.slice(0, MAX_COLLECTION_ENTRIES)) {
      const entry = sanitizeRewardEntry(raw)
      if (!entry || seenRewardIds.has(entry.id)) continue

      // Hardening against forged persisted ledger entries in G1A/G2:
      // Reward families whose genuine producers only exist in G3/G4
      // ('contract', 'crew_contact', 'finale_nonlegendary', 'event_rare')
      // cannot have valid source-proof state yet and MUST be dropped.
      if (
        entry.sourceType === 'contract' ||
        entry.sourceType === 'crew_contact' ||
        entry.sourceType === 'finale_nonlegendary' ||
        entry.sourceType === 'event_rare'
      ) {
        continue
      }

      // 'route_rare' entries require proof that the source node was visited
      // and that the canonical node reward matches definition.id.
      if (entry.sourceType === 'route_rare') {
        if (!visitedNodeIds.includes(entry.sourceId)) continue
        if (preparedMap) {
          const node = preparedMap.meta[entry.sourceId]
          if (!node || node.hidden.rareRewardId !== entry.rewardDefinitionId) {
            continue
          }
        }
      }

      seenRewardIds.add(entry.id)
      rewardLedger.push(entry)
    }
  }

  const intelGrants: ExpeditionIntelGrant[] = []
  const seenGrantIds = new Set<string>()
  if (Array.isArray(value.intelGrants)) {
    for (const raw of value.intelGrants.slice(0, MAX_COLLECTION_ENTRIES)) {
      const grant = sanitizeIntelGrant(raw)
      if (!grant || seenGrantIds.has(grant.id)) continue
      seenGrantIds.add(grant.id)
      intelGrants.push(grant)
    }
  }

  return {
    status,
    prep: prepId ? { prepId } : null,
    runId,
    routeStep: readCount(value, 'routeStep', 0),
    visitedNodeIds: sanitizeUniqueStrings(value.visitedNodeIds),
    intelByNodeId: sanitizeExpeditionIntelMap(value.intelByNodeId),
    intelGrants,
    scoutReconUsedRouteSteps: sanitizeIntegerList(
      value.scoutReconUsedRouteSteps
    ),
    loadout,
    startingMoney: readCount(value, 'startingMoney', 0),
    startingFame: readCount(value, 'startingFame', 0),
    // The protected slice is authoritative for every Expedition spend, so it
    // comes from the committed build rather than a free-standing save field a
    // hostile payload could raise on its own.
    protectedCareerCash: loadout
      ? loadout.build.protectedCareerCash
      : readCount(value, 'protectedCareerCash', 0),
    rewardLedger,
    extractionWindowsSeen: sanitizeIntegerList(value.extractionWindowsSeen),
    pendingFailure: sanitizePendingFailure(value.pendingFailure),
    // A carried shortfall is a debt, so a save cannot make it negative and
    // quietly turn it into credit.
    unpaidDailyObligation: readCount(value, 'unpaidDailyObligation', 0),
    outcome,
    insurancePolicyId:
      getExpeditionInsurancePolicy(
        readString(value, 'insurancePolicyId') ?? loadout?.insurancePolicyId
      )?.id ?? null,
    insuranceClaimConsumed:
      readBoolean(value, 'insuranceClaimConsumed') ||
      readBoolean(value, 'claimConsumed'),
    claimConsumed:
      readBoolean(value, 'claimConsumed') ||
      readBoolean(value, 'insuranceClaimConsumed'),
    technicalFailureAccepted: readBoolean(value, 'technicalFailureAccepted'),
    ...(value.cargo !== undefined
      ? { cargo: sanitizeExpeditionCargo(value.cargo) }
      : {}),
    ...(value.technicalCondition !== undefined
      ? {
          technicalCondition: sanitizeExpeditionTechnicalCondition(
            value.technicalCondition
          )
        }
      : {})
  }
}
