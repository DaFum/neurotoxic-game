import type {
  CareerRivalRecord,
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
    hqFacilityLevels: safeRecord<number>(value.hqFacilityLevels, entry =>
      isFiniteNumber(entry) && entry >= 0 ? Math.floor(entry) : null
    ),
    ascensionUnlocked: value.ascensionUnlocked === true
  }
}
