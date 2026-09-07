import type {
  BetweenTourDecisionInstance,
  BetweenTourNextTourPreferences,
  BetweenTourRunState,
  BetweenTourTarget,
  CareerRivalRecord,
  CareerState,
  ExpeditionPendingUnlockPurchase,
  CrewCareerState,
  CrewRecoveryDebt
} from '../../types/career'
import type {
  ExpeditionBandInjuryStage,
  ExpeditionRelationshipTier
} from '../../types/expedition'
import { isFiniteNumber, isLooseRecord } from '../../utils/gameState'
import { isForbiddenKey } from '../../utils/objectUtils'
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
import { isExpeditionLegendaryId } from '../../data/expedition/legendaries'
import {
  BETWEEN_TOUR_OPTIONS,
  MAX_BETWEEN_TOUR_DECISIONS,
  isBetweenTourDecisionType
} from '../../data/expedition/betweenTour'
import {
  EXPEDITION_ARCHIVE_CATEGORIES,
  isCanonicalExpeditionArchiveEntry
} from '../../data/expedition/archive'
import { createEmptyExpeditionArchive } from '../../domain/expedition/archive'

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
    ascensionUnlocked: value.ascensionUnlocked === true,
    // Narrowed to the registry, but not re-derived: unlike Ascension, a
    // Legendary's evidence is a Finale from a run whose outcome
    // `PREPARE_NEXT_EXPEDITION` has already cleared, so there is nothing left
    // on load to recompute it against. The award itself is guarded at the
    // moment it is claimed, against the finalized outcome and the run id.
    legendaryIds: Array.isArray(value.legendaryIds)
      ? [...new Set(value.legendaryIds.filter(isExpeditionLegendaryId))]
      : [],
    legendaryClaimedRunIds: Array.isArray(value.legendaryClaimedRunIds)
      ? [
          ...new Set(
            value.legendaryClaimedRunIds.filter(
              (id): id is string => typeof id === 'string'
            )
          )
        ]
      : [],
    // Narrowed to the registries, but not re-proven: the encounters the
    // Archive records happened in runs whose state is long gone, and the log
    // grants nothing, so a forged entry buys a line of text and no authority.
    // Unknown categories and ids are dropped so the log cannot become a place
    // to store arbitrary strings under a Career's name.
    archiveByCategory: sanitizeExpeditionArchive(value.archiveByCategory),
    // All three are saved with the Career slice and were being replaced by
    // defaults on load, which discarded unanswered decisions, the injuries
    // they were about, and the lean the last answers left. An absent decision
    // set counts as resolved, so that loss also let the next Tour open on a
    // run whose questions were never asked.
    betweenTourByRunId: sanitizeBetweenTourByRunId(value.betweenTourByRunId),
    sponsorAdvance: sanitizeSponsorAdvance(value.sponsorAdvance),
    bandConsequenceByMemberId: sanitizeBandConsequences(
      value.bandConsequenceByMemberId
    ),
    nextTourPreferences: sanitizeNextTourPreferences(value.nextTourPreferences)
  }
}

/** The target kinds a decision may name. */
const BETWEEN_TOUR_TARGET_KINDS: ReadonlySet<string> = new Set([
  'crew',
  'band',
  'rival',
  'sponsor',
  'vehicle',
  'archive'
])

/**
 * Narrows the actor a persisted decision is about.
 *
 * @param value - Raw candidate from the save.
 * @returns The target, or `null` when it names nothing the union allows.
 */
const sanitizeBetweenTourTarget = (
  value: unknown
): BetweenTourTarget | null => {
  if (!isLooseRecord(value)) return null
  const { kind, id } = value
  if (typeof kind !== 'string' || !BETWEEN_TOUR_TARGET_KINDS.has(kind)) {
    return null
  }
  if (typeof id !== 'string' || id === '' || isForbiddenKey(id)) return null
  // The only vehicle a Tour has.
  if (kind === 'vehicle' && id !== 'active_van') return null
  return { kind, id } as BetweenTourTarget
}

/**
 * Narrows one persisted decision instance.
 *
 * @param value - Raw candidate from the save.
 * @returns The decision, or `null` when it is not answerable.
 *
 * @remarks
 * `optionIds` is the authority at resolve time, so it is narrowed to the
 * options the family actually offers rather than trusted - otherwise a save
 * could add an option the registry has no effect for, and answering it would
 * consume the decision for nothing. A decision left with no valid option is
 * dropped, because an unanswerable decision would block the next Tour forever.
 */
const sanitizeBetweenTourDecision = (
  value: unknown
): BetweenTourDecisionInstance | null => {
  if (!isLooseRecord(value)) return null
  const { id, type, target, optionIds } = value
  if (typeof id !== 'string' || id === '' || isForbiddenKey(id)) return null
  if (!isBetweenTourDecisionType(type)) return null
  const sanitizedTarget = sanitizeBetweenTourTarget(target)
  if (sanitizedTarget === null) return null
  const offered = BETWEEN_TOUR_OPTIONS[type]
  const sanitizedOptionIds = Array.isArray(optionIds)
    ? [
        ...new Set(
          optionIds.filter(
            (option): option is string =>
              typeof option === 'string' && offered.includes(option)
          )
        )
      ]
    : []
  if (sanitizedOptionIds.length === 0) return null
  return { id, type, target: sanitizedTarget, optionIds: sanitizedOptionIds }
}

/**
 * Narrows the persisted Between-Tour decision sets.
 *
 * @param value - Raw candidate from the save.
 * @returns The sets, keyed by the run that generated them.
 *
 * @remarks
 * Preserved rather than defaulted, because an absent set counts as resolved:
 * dropping these on load would let `PREPARE_NEXT_EXPEDITION` clear a run whose
 * decisions were never answered, losing both the questions and the
 * consequences they were about. The entry's `runId` must match its own key, or
 * a resolve addressed by run id would act on a different set.
 */
/**
 * Narrows a persisted Sponsor advance.
 *
 * @param value - Raw persisted advance.
 * @returns The narrowed advance, or `null`.
 *
 * @remarks
 * An advance is a debt, so a malformed one is dropped rather than repaired:
 * inventing an `outstanding` a save did not carry would either forgive a real
 * debt or charge one the Career never took.
 */
const sanitizeSponsorAdvance = (
  value: unknown
): CareerState['sponsorAdvance'] => {
  if (!isLooseRecord(value)) return null
  const { dealId, takenAfterRunId } = value
  if (typeof dealId !== 'string' || isForbiddenKey(dealId)) return null
  if (typeof takenAfterRunId !== 'string') return null
  const { amount, outstanding } = value
  // `isFiniteNumber` rather than coercion: a numeric string or a boolean is a
  // malformed debt, not a small one.
  if (!isFiniteNumber(amount) || amount <= 0) return null
  if (!isFiniteNumber(outstanding) || outstanding < 0) return null
  return {
    dealId,
    amount: Math.round(amount),
    outstanding: Math.round(outstanding),
    takenAfterRunId
  }
}

const sanitizeBetweenTourByRunId = (
  value: unknown
): Record<string, BetweenTourRunState> =>
  safeRecord(value, (entry, key) => {
    if (!isLooseRecord(entry)) return null
    if (entry.runId !== key) return null
    const decisions: BetweenTourDecisionInstance[] = []
    const seen = new Set<string>()
    if (Array.isArray(entry.decisions)) {
      for (const candidate of entry.decisions) {
        const decision = sanitizeBetweenTourDecision(candidate)
        if (decision === null || seen.has(decision.id)) continue
        seen.add(decision.id)
        decisions.push(decision)
      }
    }
    // The generator never produces more than the cap, so a longer set is
    // forged - and truncating one would leave an arbitrary subset.
    if (decisions.length === 0) return null
    if (decisions.length > MAX_BETWEEN_TOUR_DECISIONS) return null
    const resolvedOptionByDecisionId = safeRecord(
      entry.resolvedOptionByDecisionId,
      (option, decisionId) => {
        const decision = decisions.find(item => item.id === decisionId)
        if (!decision) return null
        return typeof option === 'string' && decision.optionIds.includes(option)
          ? option
          : null
      }
    )
    return { runId: key, decisions, resolvedOptionByDecisionId }
  })

/** The injury stages a carried Band consequence may hold. */
const BAND_INJURY_STAGES: ReadonlySet<string> = new Set([
  'none',
  'light',
  'serious',
  'critical'
])

/**
 * Narrows the Band consequences carried past the run that caused them.
 *
 * @param value - Raw candidate from the save.
 * @returns The stages, keyed by member id.
 *
 * @remarks
 * A consequence only ever gives a Between-Tour decision something to treat, so
 * a forged stage buys a question rather than a capability - but dropping the
 * record would silently heal an injury the run really recorded.
 */
const sanitizeBandConsequences = (
  value: unknown
): Record<string, ExpeditionBandInjuryStage> =>
  safeRecord(value, entry =>
    typeof entry === 'string' && BAND_INJURY_STAGES.has(entry)
      ? (entry as ExpeditionBandInjuryStage)
      : null
  )

/** Narrows a persisted Rival stance to the two the union allows. */
const asRivalStance = (value: unknown): 'confront' | 'cool_down' | null =>
  value === 'confront' || value === 'cool_down' ? value : null

/** Narrows a persisted Sponsor bias to the single step either way. */
const asSponsorBias = (value: unknown): 1 | -1 | null =>
  value === 1 || value === -1 ? value : null

/**
 * Narrows what the last Between-Tour answers left for the next Tour.
 *
 * @param value - Raw candidate from the save.
 * @returns The preferences, with any malformed slot emptied.
 *
 * @remarks
 * Both slots are single and bounded by design - a lean on the next Tour rather
 * than a purchase - so each is either a well-formed preference or absent. A
 * partial one is dropped rather than half-applied.
 */
const sanitizeNextTourPreferences = (
  value: unknown
): BetweenTourNextTourPreferences => {
  const empty: BetweenTourNextTourPreferences = { rival: null, sponsor: null }
  if (!isLooseRecord(value)) return empty
  const rivalRaw = isLooseRecord(value.rival) ? value.rival : null
  const sponsorRaw = isLooseRecord(value.sponsor) ? value.sponsor : null
  const rivalId = rivalRaw?.rivalId
  const dealId = sponsorRaw?.dealId
  const stance = asRivalStance(rivalRaw?.stance)
  const bias = asSponsorBias(sponsorRaw?.bias)
  return {
    rival:
      typeof rivalId === 'string' &&
      rivalId !== '' &&
      !isForbiddenKey(rivalId) &&
      stance !== null
        ? { rivalId, stance }
        : null,
    sponsor:
      typeof dealId === 'string' &&
      dealId !== '' &&
      !isForbiddenKey(dealId) &&
      bias !== null
        ? { dealId, bias }
        : null
  }
}

/** Keeps only canonical entries, under categories the Archive has. */
const sanitizeExpeditionArchive = (
  value: unknown
): CareerState['archiveByCategory'] => {
  const archive = createEmptyExpeditionArchive()
  if (!isLooseRecord(value)) return archive
  for (const category of EXPEDITION_ARCHIVE_CATEGORIES) {
    if (!Object.hasOwn(value, category)) continue
    const entries = value[category]
    if (!Array.isArray(entries)) continue
    archive[category] = [
      ...new Set(
        entries.filter(
          (id): id is string =>
            typeof id === 'string' &&
            // `rival` has no static registry, so its ids are the Career's own
            // generated Rivals: narrowed to a plain non-forbidden string here
            // and re-proven against `rivalsById` when one is recorded.
            (category === 'rival'
              ? id.length > 0 && !isForbiddenKey(id)
              : isCanonicalExpeditionArchiveEntry(category, id))
        )
      )
    ]
  }
  return archive
}
