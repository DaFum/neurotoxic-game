import type {
  CareerState,
  CrewCareerState,
  CrewRecoveryDebt
} from '../../types/career'
import type { ExpeditionRelationshipTier } from '../../types/expedition'
import { isFiniteNumber, isLooseRecord } from '../../utils/gameState'
import { createInitialCareerState } from '../../domain/expedition/career'
import { EXPEDITION_CREW_BY_ID } from '../../data/expedition/crew'
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
    hqFacilityLevels: safeRecord<number>(value.hqFacilityLevels, entry =>
      isFiniteNumber(entry) && entry >= 0 ? Math.floor(entry) : null
    ),
    ascensionUnlocked: value.ascensionUnlocked === true
  }
}
