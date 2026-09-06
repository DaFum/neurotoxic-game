import type {
  CareerRivalRecord,
  CareerState,
  ExpeditionPendingUnlockPurchase,
  CrewCareerState,
  CrewRecoveryDebt
} from '../../types/career'
import type { ExpeditionRelationshipTier } from '../../types/expedition'
import { isFiniteNumber, isLooseRecord } from '../../utils/gameState'
import { createInitialCareerState } from '../../domain/expedition/career'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
import {
  getExpeditionUnlockSet,
  isExpeditionUnlockSetId
} from '../../data/expedition/unlockSets'
import {
  HQ_FACILITY_MAX_IMPLEMENTED_LEVEL,
  isExpeditionHqFacilityId
} from '../../data/expedition/hqFacilities'
import { EXPEDITION_CREW_SIGNATURE_BY_ROLE } from '../../data/expedition/crewSignatureTraits'

const safeRecord = <T>(
  value: unknown,
  map: (value: unknown, key: string) => T | null
): Record<string, T> => {
  const result = Object.create(null) as Record<string, T>
  if (!isLooseRecord(value)) return result
  for (const [key, entry] of Object.entries(value)) {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor')
      continue
    const sanitized = map(entry, key)
    if (sanitized !== null) result[key] = sanitized
  }
  return result
}

/**
 * Narrows a persisted unlock-journal entry.
 *
 * @param value - Raw candidate from the save.
 * @returns The entry, or `null` when it names nothing real.
 *
 * @remarks
 * `debitedTokens` is clamped to the set's registry cost rather than trusted,
 * so a save cannot inflate the refund a rollback pays out.
 */
const sanitizePendingUnlockPurchase = (
  value: unknown
): ExpeditionPendingUnlockPurchase | null => {
  if (!isLooseRecord(value)) return null
  const set = getExpeditionUnlockSet(value.setId)
  if (!set) return null
  const debited = isFiniteNumber(value.debitedTokens)
    ? Math.max(0, Math.floor(value.debitedTokens))
    : 0
  return { setId: set.id, debitedTokens: Math.min(set.cost, debited) }
}

export const sanitizeCareerState = (value: unknown): CareerState => {
  const defaults = createInitialCareerState()
  if (!isLooseRecord(value)) return defaults
  const boundedInt = (candidate: unknown, fallback = 0): number =>
    isFiniteNumber(candidate) ? Math.max(0, Math.floor(candidate)) : fallback
  const crewById = safeRecord<CrewCareerState>(value.crewById, (entry, key) => {
    if (!Object.hasOwn(EXPEDITION_CREW_BY_ID, key) || !isLooseRecord(entry)) {
      return null
    }
    const crew = EXPEDITION_CREW_BY_ID[key]
    if (!crew) return null
    const canonicalSignature = EXPEDITION_CREW_SIGNATURE_BY_ROLE[crew.role]
    return {
      loyalty: Math.min(100, boundedInt(entry.loyalty)),
      storyProgress: boundedInt(entry.storyProgress),
      signatureTraitId:
        entry.signatureTraitId === canonicalSignature
          ? canonicalSignature
          : null,
      unavailableUntilCompletedRunCount: boundedInt(
        entry.unavailableUntilCompletedRunCount
      )
    }
  })
  const expeditionRelationshipByPair = safeRecord<ExpeditionRelationshipTier>(
    value.expeditionRelationshipByPair,
    entry =>
      isFiniteNumber(entry) &&
      Number.isInteger(entry) &&
      entry >= -2 &&
      entry <= 2
        ? (entry as ExpeditionRelationshipTier)
        : null
  )
  const crewRecoveryDebtById = safeRecord<CrewRecoveryDebt>(
    value.crewRecoveryDebtById,
    (entry, key) => {
      if (
        !isLooseRecord(entry) ||
        entry.crewId !== key ||
        typeof entry.createdFromRunId !== 'string' ||
        entry.severity !== 'serious' ||
        entry.toursRemaining !== 1
      )
        return null
      return {
        crewId: key,
        createdFromRunId: entry.createdFromRunId,
        severity: 'serious',
        toursRemaining: 1
      }
    }
  )
  return {
    ...defaults,
    crewById,
    expeditionRelationshipByPair,
    crewRecoveryDebtById,
    settledCrewRunIds: Array.isArray(value.settledCrewRunIds)
      ? [
          ...new Set(
            value.settledCrewRunIds.filter(
              (id): id is string => typeof id === 'string'
            )
          )
        ]
      : [],
    // Kept even though the ids themselves are save-authored: this list only
    // ever *refuses* a settlement, so a forged entry costs the player a Token
    // rather than minting one, and dropping it would let a replayed settlement
    // pay twice.
    settledExpeditionRunIds: Array.isArray(value.settledExpeditionRunIds)
      ? [
          ...new Set(
            value.settledExpeditionRunIds.filter(
              (id): id is string => typeof id === 'string'
            )
          )
        ]
      : [],
    rivalsById: safeRecord<CareerRivalRecord>(
      value.rivalsById,
      (entry, key) => {
        if (
          !isLooseRecord(entry) ||
          !isLooseRecord(entry.snapshot) ||
          !isLooseRecord(entry.history)
        )
          return null
        const snapshot = entry.snapshot
        const history = entry.history
        if (
          snapshot.id !== key ||
          typeof snapshot.name !== 'string' ||
          typeof snapshot.style !== 'string' ||
          typeof snapshot.preferredRegionId !== 'string' ||
          typeof snapshot.signatureBehavior !== 'string' ||
          !['aggressive', 'showboat', 'saboteur', 'dealbreaker'].includes(
            snapshot.signatureBehavior
          ) ||
          !isFiniteNumber(snapshot.seed)
        )
          return null
        if (
          typeof history.relationship !== 'string' ||
          ![
            'unknown',
            'competitive',
            'rival',
            'nemesis',
            'respect',
            'alliance'
          ].includes(history.relationship) ||
          !isFiniteNumber(history.nemesisLevel) ||
          !Number.isInteger(history.nemesisLevel) ||
          history.nemesisLevel < 0 ||
          history.nemesisLevel > 4 ||
          !isFiniteNumber(history.encounterCount) ||
          history.encounterCount < 0
        )
          return null
        const lastOutcome = history.lastOutcome
        if (
          lastOutcome !== null &&
          (typeof lastOutcome !== 'string' ||
            !['hostile_win', 'hostile_loss', 'respect', 'alliance'].includes(
              lastOutcome
            ))
        )
          return null
        return {
          snapshot: {
            id: key,
            name: snapshot.name,
            style: snapshot.style,
            preferredRegionId: snapshot.preferredRegionId,
            signatureBehavior:
              snapshot.signatureBehavior as CareerRivalRecord['snapshot']['signatureBehavior'],
            seed: snapshot.seed
          },
          history: {
            relationship:
              history.relationship as CareerRivalRecord['history']['relationship'],
            nemesisLevel:
              history.nemesisLevel as CareerRivalRecord['history']['nemesisLevel'],
            encounterCount: Math.floor(history.encounterCount),
            lastOutcome:
              lastOutcome as CareerRivalRecord['history']['lastOutcome'],
            lastSeenRunId:
              typeof history.lastSeenRunId === 'string'
                ? history.lastSeenRunId
                : null,
            lastNemesisAdvanceRunId:
              typeof history.lastNemesisAdvanceRunId === 'string'
                ? history.lastNemesisAdvanceRunId
                : null
          }
        }
      }
    ),
    tourTokens: boundedInt(value.tourTokens),
    finalizedExpeditionRuns: boundedInt(value.finalizedExpeditionRuns),
    completedExpeditionRuns: boundedInt(value.completedExpeditionRuns),
    completedExpeditionRegionIds: Array.isArray(
      value.completedExpeditionRegionIds
    )
      ? [
          ...new Set(
            value.completedExpeditionRegionIds.filter(
              (id): id is string => typeof id === 'string'
            )
          )
        ]
      : [],
    // Clamped to what is actually built, not just to a non-negative number: a
    // save naming a level the registry never implemented would buy capability
    // that has no consumer, and an unknown facility id would persist forever.
    hqFacilityLevels: safeRecord<number>(
      value.hqFacilityLevels,
      (entry, key) => {
        if (!isExpeditionHqFacilityId(key)) return null
        if (!isFiniteNumber(entry) || entry < 0) return null
        return Math.min(
          HQ_FACILITY_MAX_IMPLEMENTED_LEVEL[key],
          Math.floor(entry)
        )
      }
    ),
    unlockedSetIds: Array.isArray(value.unlockedSetIds)
      ? [
          ...new Set(
            value.unlockedSetIds.filter((id): id is string =>
              isExpeditionUnlockSetId(id)
            )
          )
        ]
      : [],
    // Kept even though the save authors it: an open journal entry only ever
    // *owes* the Career a refund or a set it already paid for, so a forged one
    // cannot mint Tokens - `debitedTokens` is clamped to what the named set
    // actually costs, and dropping the entry outright would lose a real
    // balance when a process died mid-purchase.
    pendingUnlockPurchase: sanitizePendingUnlockPurchase(
      value.pendingUnlockPurchase
    ),
    ascensionUnlocked: value.ascensionUnlocked === true
  }
}
