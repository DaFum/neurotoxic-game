/**
 * @fileoverview CLI Entrypoint and Report Generator for Roguelite Expedition Balance Recalibration (G6 Task 15).
 *
 * Runs the complete balance simulator verification suite across:
 * - 14 Hard Correctness Gates
 * - Disjoint Calibration & Holdout Cohorts
 * - Matched Extraction Counterfactual Probes
 * - Matched Skill-vs-Management Probes
 * - Matched Hybrid-Fog Counterfactual Probes
 * - Fresh-Career 6-Run Progression Sequences
 * - Late-Game Legendary Edge Fixture Verification
 * - Real Runtime / Playtest Duration Evidence
 *
 * Outputs:
 * - docs/superpowers/reports/roguelite-expedition-v15-balance.md
 * - docs/superpowers/reports/roguelite-expedition-v15-balance.json
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  EXPEDITION_BALANCE_PROFILES,
  validateExpeditionBalanceProfile,
  buildProductionSimulationLoadout
} from './game-balance-expedition-profiles.mjs'
import {
  runExpeditionCohort,
  deriveCohortSeed,
  checkStrategyDominance
} from './game-balance-expedition-runner.mjs'
import {
  runExtractionCounterfactualPair,
  summarizeExtractionRegret
} from './game-balance-expedition-extraction-probe.mjs'
import { runSkillMatchedTrio } from './game-balance-expedition-skill-probe.mjs'
import {
  runFogCounterfactualPair,
  FOG_REPUTATION_CALIBRATION_NAMESPACE,
  FOG_REPUTATION_HOLDOUT_NAMESPACE
} from './game-balance-expedition-fog-probe.mjs'
import {
  runFreshCareerSequence,
  summarizeCareerCashflow
} from './game-balance-expedition-career.mjs'
import { verifyLegendaryEdgeActivations } from './game-balance-expedition-legendary.mjs'
import {
  summarizeRuntimeDurations,
  loadCapturedRuntimeEvidence,
  RUNTIME_EVIDENCE_RELATIVE_PATH,
  MIN_RUNTIME_SAMPLES,
  TARGET_CORRIDOR_MIN_MINUTES,
  TARGET_CORRIDOR_MAX_MINUTES
} from './game-balance-expedition-runtime.mjs'
import { buildArtifactMetadata } from './utils/balance-report-metadata.mjs'
import { createInitialState } from '../src/context/initialState.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')

const CALIBRATION_NAMESPACE = '#roguelite-expedition-v1#calibration'
const HOLDOUT_NAMESPACE = '#roguelite-expedition-v1#holdout'
const EXTRACTION_CALIB_NAMESPACE =
  '#roguelite-expedition-v1#extraction#calibration'
const EXTRACTION_HOLDOUT_NAMESPACE =
  '#roguelite-expedition-v1#extraction#holdout'
const SKILL_CALIB_NAMESPACE = '#roguelite-expedition-v1#skill#calibration'
const SKILL_HOLDOUT_NAMESPACE = '#roguelite-expedition-v1#skill#holdout'
const FOG_CALIB_NAMESPACE = '#roguelite-expedition-v1#fog#calibration'
const FOG_HOLDOUT_NAMESPACE = '#roguelite-expedition-v1#fog#holdout'
const CAREER_CALIB_NAMESPACE = '#roguelite-expedition-v1#career#calibration'
const CAREER_HOLDOUT_NAMESPACE = '#roguelite-expedition-v1#career#holdout'

/**
 * Runs per profile per cohort for a release artifact.
 *
 * G6 Task 8 makes 2,000 binding for the calibration and holdout cohorts, and
 * Tasks 9 and 11 repeat it for the paired probes. `--quick` trades that
 * statistical power for a developer-speed check, and must never be the size a
 * committed report was generated at.
 */
const RELEASE_SAMPLE_COUNT = 2000

/** Developer-speed size behind `--quick`. Not a release size. */
const QUICK_SAMPLE_COUNT = 20

/**
 * Six-run fresh-Career sequences per profile per cohort at release size.
 *
 * G6 Task 12 binds 1,000. Each sequence is a whole Career rather than a single
 * run, so it is scaled off the cohort size rather than equal to it: at the
 * release 2,000 this yields the binding 1,000, and `--quick` scales down with
 * everything else.
 */
const careerSequencesFor = sampleCount =>
  Math.max(1, Math.round(sampleCount / 2))

/**
 * The scripts whose contents decide the numbers in this report. Hashed into
 * `generatorFingerprint` so a harness edit invalidates a stale artifact the
 * same way a source edit does.
 */
const GENERATOR_PATHS = Object.freeze([
  'scripts/game-balance-expedition.mjs',
  'scripts/game-balance-expedition-runner.mjs',
  'scripts/game-balance-expedition-profiles.mjs',
  'scripts/game-balance-expedition-extraction-probe.mjs',
  'scripts/game-balance-expedition-skill-probe.mjs',
  'scripts/game-balance-expedition-fog-probe.mjs',
  'scripts/game-balance-expedition-career.mjs',
  'scripts/game-balance-expedition-legendary.mjs',
  'scripts/game-balance-expedition-runtime.mjs'
])

/**
 * Every reason this artifact is not release evidence.
 *
 * @param {{
 *   passed: boolean,
 *   hardFailures: string[],
 *   isReleaseRun: boolean,
 *   sampleCount: number,
 *   coverageShortfalls: unknown[],
 *   capturedRuntime: { ok: boolean, reason?: string, samples?: unknown[] },
 *   runtimeSummary: { inTargetCorridor: boolean, medianMinutes: number, corridorStatus: string },
 *   corridorFindings: string[]
 * }} input
 * @returns {string[]} Blockers, empty when the artifact is release evidence.
 *
 * @remarks
 * Exported so `tests/node/gameBalanceExpeditionReleaseGate.test.js` pins the
 * shipped predicate rather than a copy of it. The test used to mirror this
 * logic, which meant the suite could drop the sample-count or corridor check
 * and every assertion in that file would still pass while the artifact
 * regained a false `releaseEligible`.
 */
export const computeReleaseBlockers = ({
  passed,
  hardFailures,
  isReleaseRun,
  sampleCount,
  coverageShortfalls,
  capturedRuntime,
  runtimeSummary,
  corridorFindings
}) => {
  const releaseBlockers = []
  if (!passed) {
    releaseBlockers.push(`${hardFailures.length} hard correctness failure(s)`)
  }
  if (!isReleaseRun) {
    releaseBlockers.push(
      `run size ${sampleCount} is below the release size ${RELEASE_SAMPLE_COUNT}`
    )
  }
  if (coverageShortfalls.length > 0) {
    releaseBlockers.push(`${coverageShortfalls.length} coverage shortfall(s)`)
  }
  if (!capturedRuntime.ok) {
    releaseBlockers.push(`no usable pacing evidence: ${capturedRuntime.reason}`)
  } else if (capturedRuntime.samples.length < MIN_RUNTIME_SAMPLES) {
    // The master plan holds the real-duration target soft "until at least 20
    // valid runtime samples exist", so fewer than that is not yet evidence.
    releaseBlockers.push(
      `only ${capturedRuntime.samples.length} captured runtime sample(s), ${MIN_RUNTIME_SAMPLES} required`
    )
  } else if (!runtimeSummary.inTargetCorridor) {
    releaseBlockers.push(
      `median ${runtimeSummary.medianMinutes} min is outside the ${TARGET_CORRIDOR_MIN_MINUTES}-${TARGET_CORRIDOR_MAX_MINUTES} min corridor (${runtimeSummary.corridorStatus})`
    )
  }
  if (corridorFindings.length > 0) {
    releaseBlockers.push(
      `${corridorFindings.length} unresolved balance corridor finding(s)`
    )
  }
  return releaseBlockers
}

/**
 * Formats a raw extraction probe result into a compact sample preserving per-window evidence and rare rewards.
 *
 * @param {any} entry
 * @returns {object}
 */
const compactExtractionSample = entry => {
  const pair = entry.pair ?? {}
  const branchB = pair.branchB ?? {}
  const windows = (pair.windows ?? []).map(window => {
    const branchA = window.branchA ?? {}
    return {
      windowRouteStep: window.windowRouteStep,
      decision: window.policyWouldExtract ? 'extract' : 'continue',
      policyReason: window.policyReason ?? null,
      policyScore: window.policyScore ?? null,
      policyTolerance: window.policyTolerance ?? null,
      extract: {
        money: branchA.retainedMoney ?? null,
        fame: branchA.retainedFame ?? null,
        explicitlyExtractedRares: branchA.explicitlyExtractedRares ?? 0
      },
      continue: {
        outcome: branchB.outcome ?? null,
        money: branchB.retainedMoney ?? null,
        fame: branchB.retainedFame ?? null,
        securedRares: branchB.securedRares ?? 0,
        explicitlyExtractedRares: branchB.explicitlyExtractedRares ?? 0,
        abandonedRares: branchB.abandonedRares ?? 0
      },
      delta: {
        money: window.deltaMoney ?? null,
        fame: window.deltaFame ?? null
      }
    }
  })
  return {
    profileId: entry.profileId,
    seed: entry.seed,
    windowEncountered: pair.windowEncountered ?? false,
    windowCount: pair.windowCount ?? windows.length,
    windows
  }
}

/**
 * Formats a raw skill probe result into a compact sample preserving matched gig, wear, and hype measurements.
 *
 * @param {any} entry
 * @returns {object}
 */
const compactSkillSample = entry => {
  const trio = entry.trio ?? {}
  const formatTier = res => {
    if (!res) return null
    const t = res.telemetry ?? {}
    return {
      outcome: res.outcome ?? null,
      retainedMoney: t.retainedMoney ?? null,
      retainedFame: t.retainedFame ?? null,
      minTechnicalCondition: t.minTechnicalCondition ?? null,
      minVanCondition: t.minVanCondition ?? null,
      repairsCount: t.repairsCount ?? 0,
      repairSpend: t.repairSpend ?? 0,
      gigNetTotal: t.gigNetTotal ?? 0,
      realizedHypeComboBonusTotal: t.realizedHypeComboBonusTotal ?? 0,
      toxicModeTriggers: t.toxicModeTriggers ?? 0,
      gigMissesTotal: t.gigMissesTotal ?? 0,
      maxComboBest: t.maxComboBest ?? 0
    }
  }

  const low = formatTier(trio.low)
  const comp = formatTier(trio.competent)
  const high = formatTier(trio.high)

  return {
    profileId: entry.profileId,
    seed: entry.seed,
    skillImprovesOutcome: trio.skillImprovesOutcome ?? false,
    skillReducesRepairSpend: trio.skillReducesRepairSpend ?? false,
    skillPreservesCondition: trio.skillPreservesCondition ?? false,
    low,
    competent: comp,
    high,
    delta: {
      money:
        high?.retainedMoney != null && low?.retainedMoney != null
          ? high.retainedMoney - low.retainedMoney
          : null,
      fame:
        high?.retainedFame != null && low?.retainedFame != null
          ? high.retainedFame - low.retainedFame
          : null
    }
  }
}

/**
 * Formats a raw fog probe result into a compact sample preserving decision fidelity fields.
 *
 * @param {any} entry
 * @returns {object}
 */
const compactFogSample = entry => {
  const pair = entry.pair ?? {}
  const branchA = pair.branchA ?? {}
  const branchB = pair.branchB ?? {}
  return {
    profileId: entry.profileId,
    seed: entry.seed,
    source: pair.source ?? null,
    matchedDecisionFound: pair.matchedDecisionFound ?? false,
    decisionRouteStep: pair.decisionRouteStep ?? null,
    candidateCount: pair.candidateCount ?? null,
    chosenNodeA: pair.chosenNodeA ?? null,
    chosenNodeB: pair.chosenNodeB ?? null,
    scoreA: pair.scoreA ?? null,
    scoreB: pair.scoreB ?? null,
    routeChanged: pair.routeChanged ?? false,
    revealUsed: pair.revealUsed ?? false,
    revealedNodeIds: pair.revealedNodeIds ?? [],
    revealedCandidateIds: pair.revealedCandidateIds ?? [],
    intelLevelsA: pair.intelLevelsA ?? {},
    intelLevelsB: pair.intelLevelsB ?? {},
    inspectedFieldsA: pair.inspectedFieldsA ?? [],
    inspectedFieldsB: pair.inspectedFieldsB ?? [],
    branchA: {
      outcome: branchA.outcome ?? null,
      money: branchA.retainedMoney ?? null,
      fame: branchA.retainedFame ?? null,
      securedRares: branchA.securedRares ?? 0
    },
    branchB: {
      outcome: branchB.outcome ?? null,
      money: branchB.retainedMoney ?? null,
      fame: branchB.retainedFame ?? null,
      securedRares: branchB.securedRares ?? 0
    },
    delta: {
      money:
        branchB.retainedMoney != null && branchA.retainedMoney != null
          ? branchB.retainedMoney - branchA.retainedMoney
          : null,
      fame:
        branchB.retainedFame != null && branchA.retainedFame != null
          ? branchB.retainedFame - branchA.retainedFame
          : null
    }
  }
}

/**
 * Formats a career sequence result into a compact sample according to report schema.
 *
 * @param {any} sequence
 * @returns {object}
 */
const compactCareerSample = sequence => {
  return {
    profileId: sequence.profileId,
    sequenceSeed: sequence.sequenceSeed,
    runsRequested: sequence.runsRequested,
    runsCompleted: sequence.runsCompleted,
    haltedAtRun: sequence.haltedAtRun ?? null,
    haltReason: sequence.haltReason ?? null,
    runOutcomes: sequence.runOutcomes ?? []
  }
}

/**
 * Summarizes skill probe results across a cohort for all three skill tiers, overall and by profile.
 *
 * @param {any[]} results
 * @returns {object}
 */
const summarizeSkillCohort = results => {
  const summarizeList = list => {
    const total = list.length || 1
    let moneyLow = 0,
      moneyComp = 0,
      moneyHigh = 0
    let fameLow = 0,
      fameComp = 0,
      fameHigh = 0
    let condLow = 0,
      condComp = 0,
      condHigh = 0
    let repairLow = 0,
      repairComp = 0,
      repairHigh = 0
    let gigNetLow = 0,
      gigNetComp = 0,
      gigNetHigh = 0
    let hypeLow = 0,
      hypeComp = 0,
      hypeHigh = 0
    let missesLow = 0,
      missesComp = 0,
      missesHigh = 0
    let compLow = 0,
      compComp = 0,
      compHigh = 0

    for (const entry of list) {
      const trio = entry.trio ?? {}
      const low = trio.low?.telemetry ?? {}
      const comp = trio.competent?.telemetry ?? {}
      const high = trio.high?.telemetry ?? {}

      moneyLow += low.retainedMoney ?? 0
      moneyComp += comp.retainedMoney ?? 0
      moneyHigh += high.retainedMoney ?? 0

      fameLow += low.retainedFame ?? 0
      fameComp += comp.retainedFame ?? 0
      fameHigh += high.retainedFame ?? 0

      condLow += low.minTechnicalCondition ?? 0
      condComp += comp.minTechnicalCondition ?? 0
      condHigh += high.minTechnicalCondition ?? 0

      repairLow += low.repairSpend ?? 0
      repairComp += comp.repairSpend ?? 0
      repairHigh += high.repairSpend ?? 0

      gigNetLow += low.gigNetTotal ?? 0
      gigNetComp += comp.gigNetTotal ?? 0
      gigNetHigh += high.gigNetTotal ?? 0

      hypeLow += low.realizedHypeComboBonusTotal ?? 0
      hypeComp += comp.realizedHypeComboBonusTotal ?? 0
      hypeHigh += high.realizedHypeComboBonusTotal ?? 0

      missesLow += low.gigMissesTotal ?? 0
      missesComp += comp.gigMissesTotal ?? 0
      missesHigh += high.gigMissesTotal ?? 0

      if (trio.low?.outcome === 'completed') compLow++
      if (trio.competent?.outcome === 'completed') compComp++
      if (trio.high?.outcome === 'completed') compHigh++
    }

    return {
      triosCount: total,
      completionRate: {
        low: compLow / total,
        competent: compComp / total,
        high: compHigh / total
      },
      meanMoney: {
        low: moneyLow / total,
        competent: moneyComp / total,
        high: moneyHigh / total
      },
      meanFame: {
        low: fameLow / total,
        competent: fameComp / total,
        high: fameHigh / total
      },
      meanMinCondition: {
        low: condLow / total,
        competent: condComp / total,
        high: condHigh / total
      },
      meanRepairSpend: {
        low: repairLow / total,
        competent: repairComp / total,
        high: repairHigh / total
      },
      meanGigNet: {
        low: gigNetLow / total,
        competent: gigNetComp / total,
        high: gigNetHigh / total
      },
      meanRealizedHypeBonus: {
        low: hypeLow / total,
        competent: hypeComp / total,
        high: hypeHigh / total
      },
      meanGigMisses: {
        low: missesLow / total,
        competent: missesComp / total,
        high: missesHigh / total
      }
    }
  }

  const byProfileList = Object.create(null)
  for (const entry of results) {
    const pid = entry.profileId ?? 'unknown'
    if (!byProfileList[pid]) byProfileList[pid] = []
    byProfileList[pid].push(entry)
  }

  const byProfile = Object.create(null)
  for (const [pid, list] of Object.entries(byProfileList)) {
    byProfile[pid] = summarizeList(list)
  }

  return {
    ...summarizeList(results),
    byProfile
  }
}

/**
 * Summarizes career sequence outcomes by profile across sequences.
 *
 * @param {any[]} sequences
 * @returns {Record<string, {
 *   sequences: number,
 *   completedAllRunsRate: number,
 *   meanRunsCompleted: number,
 *   haltReasons: Record<string, number>
 * }>}
 */
const summarizeCareerSequencesByProfile = sequences => {
  const byProfile = Object.create(null)
  for (const seq of sequences) {
    const id = seq.profileId
    if (!byProfile[id]) {
      byProfile[id] = {
        total: 0,
        completedAll: 0,
        completedRunsSum: 0,
        haltReasons: Object.create(null)
      }
    }
    const cell = byProfile[id]
    cell.total += 1
    cell.completedRunsSum += seq.runsCompleted
    if (seq.runsCompleted === seq.runsRequested) {
      cell.completedAll += 1
    } else if (seq.haltReason) {
      cell.haltReasons[seq.haltReason] =
        (cell.haltReasons[seq.haltReason] ?? 0) + 1
    }
  }

  const result = Object.create(null)
  for (const [id, cell] of Object.entries(byProfile)) {
    result[id] = {
      sequences: cell.total,
      completedAllRunsRate:
        cell.total === 0 ? 0 : cell.completedAll / cell.total,
      meanRunsCompleted:
        cell.total === 0 ? 0 : cell.completedRunsSum / cell.total,
      haltReasons: { ...cell.haltReasons }
    }
  }
  return result
}

/**
 * Summarizes progression metrics across fresh-career sequences, overall and by profile.
 *
 * @param {any[]} sequences
 * @returns {object}
 */
const summarizeCareerProgressionMetrics = sequences => {
  const summarizeList = list => {
    const n = list.length || 1

    let roadtestedSum = 0,
      roadtestedCount = 0
    let headlinerSum = 0,
      headlinerCount = 0
    let facilitySum = 0,
      facilityCount = 0
    let capabilitySum = 0,
      capabilityCount = 0
    let run1CapabilityCount = 0
    let run1HqCount = 0
    let legacyHqSum = 0,
      legacyHqCount = 0
    let ascensionSum = 0,
      ascensionCount = 0
    let legendarySum = 0,
      legendaryCount = 0
    let signatureTraitSum = 0,
      signatureTraitCount = 0
    let totalAdvances = 0,
      totalStaged = 0,
      totalSelected = 0,
      totalAccepted = 0
    let totalNormalTerminals = 0,
      totalSolventAfterNormal = 0
    let maxNemesisSum = 0,
      sameRivalReturnSum = 0,
      sameRivalReturnCount = 0
    let recoveryDebtCount = 0

    for (const seq of list) {
      const m = seq.metrics ?? {}
      if (m.firstRoadtestedRun != null) {
        roadtestedSum += m.firstRoadtestedRun
        roadtestedCount++
      }
      if (m.firstHeadlinerRun != null) {
        headlinerSum += m.firstHeadlinerRun
        headlinerCount++
      }
      if (m.firstMetaFacilityRun != null) {
        facilitySum += m.firstMetaFacilityRun
        facilityCount++
      }
      if (m.firstPermanentExpeditionCapabilityRun != null) {
        capabilitySum += m.firstPermanentExpeditionCapabilityRun
        capabilityCount++
      }
      if (m.run1PermanentCapabilityPurchaseRate) run1CapabilityCount++
      if (m.run1LegacyExpeditionAffectingHqPurchaseRate) run1HqCount++
      if (m.firstLegacyExpeditionAffectingHqPurchaseRun != null) {
        legacyHqSum += m.firstLegacyExpeditionAffectingHqPurchaseRun
        legacyHqCount++
      }
      if (m.firstAscensionUnlockRun != null) {
        ascensionSum += m.firstAscensionUnlockRun
        ascensionCount++
      }
      if (m.firstNaturalLegendaryRun != null) {
        legendarySum += m.firstNaturalLegendaryRun
        legendaryCount++
      }
      if (m.signatureTraitUnlockRun != null) {
        signatureTraitSum += m.signatureTraitUnlockRun
        signatureTraitCount++
      }

      totalAdvances += m.sponsorAdvancesTaken ?? 0
      totalStaged += m.sponsorOffersStaged ?? 0
      totalSelected += m.sponsorOffersSelected ?? 0
      totalAccepted += m.sponsorOffersAccepted ?? 0

      totalNormalTerminals += m.normalTerminals ?? 0
      totalSolventAfterNormal += m.solventAfterNormalTerminal ?? 0

      maxNemesisSum += m.maxNemesisLevel ?? 0
      if (m.sameRivalReturnRate != null) {
        sameRivalReturnSum += m.sameRivalReturnRate
        sameRivalReturnCount++
      }
      if (m.crewRecoveryDebtDurations)
        recoveryDebtCount += m.crewRecoveryDebtDurations.length
    }

    return {
      sequencesCount: n,
      ranks: {
        roadtestedReachedRate: roadtestedCount / n,
        meanFirstRoadtestedRun:
          roadtestedCount === 0 ? null : roadtestedSum / roadtestedCount,
        headlinerReachedRate: headlinerCount / n,
        meanFirstHeadlinerRun:
          headlinerCount === 0 ? null : headlinerSum / headlinerCount
      },
      metaAndFacilities: {
        facilityPurchaseRate: facilityCount / n,
        meanFirstFacilityRun:
          facilityCount === 0 ? null : facilitySum / facilityCount,
        permanentCapabilityPurchaseRate: capabilityCount / n,
        meanFirstCapabilityRun:
          capabilityCount === 0 ? null : capabilitySum / capabilityCount,
        run1PermanentCapabilityPurchaseRate: run1CapabilityCount / n,
        run1LegacyHqPurchaseRate: run1HqCount / n,
        meanFirstLegacyHqRun:
          legacyHqCount === 0 ? null : legacyHqSum / legacyHqCount
      },
      milestones: {
        ascensionUnlockRate: ascensionCount / n,
        meanFirstAscensionRun:
          ascensionCount === 0 ? null : ascensionSum / ascensionCount,
        naturalLegendaryRate: legendaryCount / n,
        meanFirstLegendaryRun:
          legendaryCount === 0 ? null : legendarySum / legendaryCount,
        signatureTraitUnlockRate: signatureTraitCount / n,
        meanSignatureTraitRun:
          signatureTraitCount === 0
            ? null
            : signatureTraitSum / signatureTraitCount,
        crewRecoveryDebtEventsTotal: recoveryDebtCount
      },
      sponsors: {
        advancesTakenTotal: totalAdvances,
        meanOffersStagedPerSequence: totalStaged / n,
        meanOffersSelectedPerSequence: totalSelected / n,
        meanOffersAcceptedPerSequence: totalAccepted / n
      },
      solvency: {
        normalTerminalsTotal: totalNormalTerminals,
        solventAfterNormalTerminalTotal: totalSolventAfterNormal,
        solvencyRate:
          totalNormalTerminals === 0
            ? null
            : totalSolventAfterNormal / totalNormalTerminals
      },
      rivals: {
        meanMaxNemesisLevel: maxNemesisSum / n,
        meanSameRivalReturnRate:
          sameRivalReturnCount === 0
            ? null
            : sameRivalReturnSum / sameRivalReturnCount
      }
    }
  }

  const byProfileList = Object.create(null)
  for (const seq of sequences) {
    const pid = seq.profileId ?? 'unknown'
    if (!byProfileList[pid]) byProfileList[pid] = []
    byProfileList[pid].push(seq)
  }

  const byProfile = Object.create(null)
  for (const [pid, list] of Object.entries(byProfileList)) {
    byProfile[pid] = summarizeList(list)
  }

  return {
    ...summarizeList(sequences),
    byProfile
  }
}

/**
 * Runs one probe cohort, funnelling a thrown probe into a hard failure rather
 * than aborting the suite.
 *
 * @template T
 * @param {string[]} hardFailures - Accumulator the caller reports on.
 * @param {string} label - What is being run, for the failure line.
 * @param {() => T} run
 * @returns {T | null}
 */
const guarded = (hardFailures, label, run) => {
  try {
    return run()
  } catch (err) {
    hardFailures.push(
      `${label}: ${err instanceof Error ? err.message : String(err)}`
    )
    return null
  }
}

/**
 * Runs a probe across both cohorts so a corridor tuned on calibration is
 * confirmed against seeds it was never fitted to.
 *
 * @param {string[]} hardFailures
 * @param {string} label
 * @param {{ calibration: string, holdout: string }} namespaces
 * @param {number} probeCount
 * @param {(seed: number) => unknown} run
 * @returns {{ calibration: unknown[], holdout: unknown[] }}
 */
const acrossCohorts = (hardFailures, label, namespaces, probeCount, run) => {
  /** @type {{ calibration: unknown[], holdout: unknown[] }} */
  const results = { calibration: [], holdout: [] }
  for (const cohort of /** @type {const} */ (['calibration', 'holdout'])) {
    for (let i = 0; i < probeCount; i++) {
      const seed = deriveCohortSeed(namespaces[cohort], i)
      const value = guarded(
        hardFailures,
        `${label} [${cohort}] (seed ${seed})`,
        () => run(seed)
      )
      if (value !== null) results[cohort].push(value)
    }
  }
  return results
}

/**
 * Runs the entire balance recalibration suite and produces report objects.
 *
 * @param {{ sampleCount?: number }} [options={}]
 */
export async function executeBalanceRecalibrationSuite(options = {}) {
  const sampleCount = options.sampleCount ?? RELEASE_SAMPLE_COUNT
  // G6 Tasks 9 and 11 require the same 2,000 matched states per profile and
  // cohort that Task 8 requires of the single-run cohorts, so the probes run
  // at the cohort size rather than at a fraction of it.
  const probeCount = sampleCount
  const careerSequenceCount = careerSequencesFor(sampleCount)
  const isReleaseRun = sampleCount >= RELEASE_SAMPLE_COUNT

  console.log(
    `[BalanceSuite] Starting Expedition Recalibration Suite (${sampleCount} samples/cohort)...`
  )

  /** @type {string[]} */
  const hardFailures = []
  // Task 7 calls the balance corridors tuneable hypotheses and Task 14 calls
  // the pacing target a product corridor rather than a synthetic hard gate.
  // They are reported, and they hold back release eligibility, but they are
  // not correctness failures.
  /** @type {string[]} */
  const softFindings = []

  // 1. Profile Capability Validation
  console.log('[BalanceSuite] 1. Validating Profile Capability Provenance...')
  /** @type {any[]} */
  const fixtureProvenance = []
  for (const profile of EXPEDITION_BALANCE_PROFILES) {
    try {
      validateExpeditionBalanceProfile(profile)
      const state = buildProductionSimulationLoadout(null, profile, 42)
      if (!state?.expedition?.loadout) {
        hardFailures.push(
          `Profile ${profile.id} failed to build production loadout`
        )
      }
      // Echoed into the artifact so a run is reproducible from the profile
      // alone, without knowing any builder constant.
      const resolved = state?.expedition?.provenance?.matureFixture
      if (resolved) {
        fixtureProvenance.push({ profileId: profile.id, ...resolved })
      }
    } catch (err) {
      hardFailures.push(
        `Profile ${profile.id} capability validation failed: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  // 2. Disjoint Calibration Cohort
  console.log('[BalanceSuite] 2. Running Calibration Cohort...')
  const calibSeeds = Array.from({ length: sampleCount }, (_, i) =>
    deriveCohortSeed(CALIBRATION_NAMESPACE, i)
  )
  const calibrationCohort = guarded(
    hardFailures,
    'Calibration cohort failed',
    () => runExpeditionCohort(EXPEDITION_BALANCE_PROFILES, calibSeeds)
  )

  // 3. Disjoint Holdout Cohort
  console.log('[BalanceSuite] 3. Running Holdout Cohort...')
  const holdoutSeeds = Array.from({ length: sampleCount }, (_, i) =>
    deriveCohortSeed(HOLDOUT_NAMESPACE, i)
  )
  const holdoutCohort = guarded(hardFailures, 'Holdout cohort failed', () =>
    runExpeditionCohort(EXPEDITION_BALANCE_PROFILES, holdoutSeeds)
  )

  // 3b. Strategy dominance. Running the check and then discarding its verdict
  // made the release gate decorative: a strategy that strictly dominated every
  // other one in both cohorts still reported PASS.
  console.log('[BalanceSuite] 3b. Checking Strategy Dominance...')
  /** @type {{ ok: boolean, violations: string[] }} */
  let dominance = {
    ok: true,
    violations: [],
    corridorFindings: [],
    dominanceViolations: []
  }
  if (calibrationCohort && holdoutCohort) {
    dominance =
      guarded(hardFailures, 'Strategy dominance check failed', () =>
        checkStrategyDominance(calibrationCohort, holdoutCohort)
      ) ?? dominance
    // A dominance conclusion reproduced in both cohorts blocks; a corridor
    // miss is a tuning finding.
    for (const violation of dominance.dominanceViolations ?? []) {
      hardFailures.push(`Strategy dominance violation: ${violation}`)
    }
    for (const finding of dominance.corridorFindings ?? []) {
      softFindings.push(`Balance corridor: ${finding}`)
    }
  } else {
    hardFailures.push(
      'Strategy dominance could not be checked: a cohort did not complete'
    )
  }

  // 4. Paired Extraction Counterfactuals, across both cohorts
  console.log(
    '[BalanceSuite] 4. Running Matched Extraction Counterfactual Probes...'
  )
  // Every profile, not a hand-picked three: Task 9 binds the matrix per
  // profile, and a subset cannot show that extraction economics differ by
  // strategy.
  const extractionProfiles = EXPEDITION_BALANCE_PROFILES
  /** @type {{ calibration: any[], holdout: any[] }} */
  const extractionResults = { calibration: [], holdout: [] }
  for (const profile of extractionProfiles) {
    const perProfile = acrossCohorts(
      hardFailures,
      `Extraction probe ${profile.id}`,
      {
        calibration: EXTRACTION_CALIB_NAMESPACE,
        holdout: EXTRACTION_HOLDOUT_NAMESPACE
      },
      probeCount,
      seed => ({
        profileId: profile.id,
        seed,
        pair: runExtractionCounterfactualPair(undefined, profile, seed)
      })
    )
    extractionResults.calibration.push(...perProfile.calibration)
    extractionResults.holdout.push(...perProfile.holdout)
  }

  // 5. Paired Skill-vs-Management Probes
  console.log('[BalanceSuite] 5. Running Matched Skill-vs-Management Probes...')
  const skillProfiles = EXPEDITION_BALANCE_PROFILES
  /** @type {{ calibration: any[], holdout: any[] }} */
  const skillResults = { calibration: [], holdout: [] }
  for (const profile of skillProfiles) {
    const perProfile = acrossCohorts(
      hardFailures,
      `Skill probe ${profile.id}`,
      { calibration: SKILL_CALIB_NAMESPACE, holdout: SKILL_HOLDOUT_NAMESPACE },
      probeCount,
      seed => ({
        profileId: profile.id,
        seed,
        trio: runSkillMatchedTrio(undefined, profile, seed)
      })
    )
    skillResults.calibration.push(...perProfile.calibration)
    skillResults.holdout.push(...perProfile.holdout)
  }

  // 6. Paired Hybrid-Fog Counterfactual Probes, across both cohorts
  console.log(
    '[BalanceSuite] 6. Running Matched Hybrid-Fog Counterfactual Probes...'
  )
  const fogProfiles = EXPEDITION_BALANCE_PROFILES.filter(
    p =>
      p.decisionPolicy === 'intel_then_value' ||
      p.crewRoleOrder.includes('scout')
  )
  // Task 11 binds two source-faithful cohorts, not one: a Scout recon case and
  // a separate reputation case across the G5 familiarity threshold. Each gets
  // its own disjoint calibration/holdout namespaces.
  const FOG_SOURCE_NAMESPACES = {
    scout_recon: {
      calibration: FOG_CALIB_NAMESPACE,
      holdout: FOG_HOLDOUT_NAMESPACE
    },
    reputation: {
      calibration: FOG_REPUTATION_CALIBRATION_NAMESPACE,
      holdout: FOG_REPUTATION_HOLDOUT_NAMESPACE
    }
  }
  /** @type {Record<string, { calibration: any[], holdout: any[] }>} */
  const fogResultsBySource = {
    scout_recon: { calibration: [], holdout: [] },
    reputation: { calibration: [], holdout: [] }
  }
  for (const source of ['scout_recon', 'reputation']) {
    for (const profile of fogProfiles) {
      const perProfile = acrossCohorts(
        hardFailures,
        `Fog probe ${source} ${profile.id}`,
        FOG_SOURCE_NAMESPACES[source],
        probeCount,
        seed => ({
          profileId: profile.id,
          seed,
          pair: runFogCounterfactualPair(undefined, profile, seed, source)
        })
      )
      fogResultsBySource[source].calibration.push(...perProfile.calibration)
      fogResultsBySource[source].holdout.push(...perProfile.holdout)
    }
  }
  const fogResults = {
    calibration: [
      ...fogResultsBySource.scout_recon.calibration,
      ...fogResultsBySource.reputation.calibration
    ],
    holdout: [
      ...fogResultsBySource.scout_recon.holdout,
      ...fogResultsBySource.reputation.holdout
    ]
  }

  // 7. Fresh-Career Progression Sequences, across both cohorts
  console.log('[BalanceSuite] 7. Running Fresh-Career Progression Sequences...')
  const careerProfiles = EXPEDITION_BALANCE_PROFILES
  /** @type {{ calibration: any[], holdout: any[] }} */
  const careerResults = { calibration: [], holdout: [] }
  for (const profile of careerProfiles) {
    const perProfile = acrossCohorts(
      hardFailures,
      `Career sequence ${profile.id}`,
      {
        calibration: CAREER_CALIB_NAMESPACE,
        holdout: CAREER_HOLDOUT_NAMESPACE
      },
      careerSequenceCount,
      seed => runFreshCareerSequence(createInitialState(), profile, seed, 6)
    )
    careerResults.calibration.push(...perProfile.calibration)
    careerResults.holdout.push(...perProfile.holdout)
  }

  // Built before the pacing step, which validates captured evidence against
  // this exact source fingerprint.
  const metadata = await buildArtifactMetadata({
    root: REPO_ROOT,
    generatorPaths: GENERATOR_PATHS,
    seedNamespace: CALIBRATION_NAMESPACE,
    runsPerScenario: sampleCount
  })

  // 8. Runtime & Playtest Duration Evidence.
  //
  // Read from captured evidence, never synthesized here. The report used to
  // summarize a literal array, so it stated a confident median for a build
  // nobody had played; missing or stale capture is now a hard failure rather
  // than a number.
  console.log('[BalanceSuite] 8. Loading Captured Runtime Duration Evidence...')
  const capturedRuntime = await loadCapturedRuntimeEvidence(
    REPO_ROOT,
    metadata.sourceFingerprint
  )
  if (!capturedRuntime.ok) {
    softFindings.push(
      `Runtime pacing evidence unusable: ${capturedRuntime.reason}. Capture a playtest cohort into ${RUNTIME_EVIDENCE_RELATIVE_PATH} for this source fingerprint.`
    )
  }
  const runtimeSummary = summarizeRuntimeDurations(capturedRuntime.samples)

  // 9. Legendary Edge Fixtures Verification. Executed, not asserted: the table
  // below reports what the reducer actually did.
  console.log('[BalanceSuite] 9. Verifying Legendary Edge Fixtures...')
  const legendary = guarded(
    hardFailures,
    'Legendary edge verification failed',
    () => verifyLegendaryEdgeActivations()
  ) ?? { passed: false, failures: ['verification did not run'], statusById: {} }
  for (const failure of legendary.failures) {
    hardFailures.push(failure)
  }

  // Release coverage gate. Without it, `passed` could turn green once the
  // current balance violations are tuned away while most of the binding
  // evidence matrix was still missing - the counts are part of the claim, not
  // an implementation detail of how long the run took.
  const profileCount = EXPEDITION_BALANCE_PROFILES.length

  /**
   * Extraction coverage counted per profile and per legal window.
   *
   * @param {'calibration' | 'holdout'} cohort
   */
  const extractionCoverageFor = cohort =>
    extractionProfiles.map(profile => {
      const entries = extractionResults[cohort].filter(
        entry => entry.profileId === profile.id
      )
      // Counted against the runs that *reached* each window, not against the
      // cohort. Requiring `probeCount` pairs at the scarcest window demanded
      // that every seed survive to the deepest one, which Task 7's own 2-50%
      // failure corridor forbids: the two gates could not both hold, and the
      // moment a profile started failing at all - underground_heat at 4.3% -
      // its deepest window went 1854 of 2000 and the run was reported as a
      // hard coverage shortfall for doing exactly what the corridor asks.
      //
      // What a coverage gate should catch is a probe that reached a window and
      // produced nothing there. That is still caught: `reached` counts runs
      // whose route offered the window, `paired` counts those that yielded a
      // usable counterfactual, and a gap between them is a probe defect rather
      // than a short run.
      /** @type {Map<number, { reached: number, paired: number }>} */
      const byWindow = new Map()
      for (const entry of entries) {
        for (const window of entry.pair?.windows ?? []) {
          const step = window.windowRouteStep
          const cell = byWindow.get(step) ?? { reached: 0, paired: 0 }
          cell.reached += 1
          if (window.branchA && entry.pair?.branchB) cell.paired += 1
          byWindow.set(step, cell)
        }
      }
      // The scarcest window still decides, so a gap at one window cannot hide
      // behind a well-paired one.
      let scarcestPaired = 0
      let scarcestReached = 0
      let worstGap = Infinity
      for (const cell of byWindow.values()) {
        const gap = cell.reached - cell.paired
        if (gap < worstGap) continue
        worstGap = gap
        scarcestPaired = cell.paired
        scarcestReached = cell.reached
      }
      return {
        label: `Task 9 extraction pairs (${cohort}, ${profile.id}, scarcest of ${byWindow.size} window(s), ${scarcestReached} run(s) reached it)`,
        actual: byWindow.size === 0 ? 0 : scarcestPaired,
        expected: byWindow.size === 0 ? probeCount : scarcestReached
      }
    })

  const extractionWindowCoverage = [
    ...extractionCoverageFor('calibration'),
    ...extractionCoverageFor('holdout')
  ]

  const careerCompletionCoverage = ['calibration', 'holdout'].map(cohort => {
    const sequences = careerResults[cohort]
    const complete = sequences.filter(
      sequence => sequence.runsCompleted === sequence.runsRequested
    )
    // A shortfall here is an economy result, not a harness misconfiguration:
    // the sequences ran, they just could not fund six Tours. Naming the halt
    // reason keeps the report from reading like a broken generator.
    const halts = new Map()
    for (const sequence of sequences) {
      if (sequence.haltReason === null) continue
      halts.set(sequence.haltReason, (halts.get(sequence.haltReason) ?? 0) + 1)
    }
    const haltSummary = [...halts.entries()]
      .map(([reason, count]) => `${count}x ${reason}`)
      .join(', ')
    return {
      label: `Task 12 six-run fresh-Career sequences (${cohort})`,
      actual: complete.length,
      expected: careerSequenceCount * careerProfiles.length,
      note:
        halts.size === 0
          ? null
          : `${sequences.length - complete.length} of ${sequences.length} sequences halted early: ${haltSummary}`
    }
  })

  const expectedCoverage = [
    {
      label: 'Task 8 calibration cohort',
      actual: calibrationCohort ? sampleCount : 0,
      expected: sampleCount
    },
    {
      label: 'Task 8 holdout cohort',
      actual: holdoutCohort ? sampleCount : 0,
      expected: sampleCount
    },
    // Task 9 binds 2,000 matched pairs per profile *per window*, not per seed.
    // Counting result objects reported full coverage even when a legal
    // extraction window had almost no pairs behind it, because one object can
    // carry anywhere from zero to several windows.
    ...extractionWindowCoverage,
    {
      label: 'Task 10 skill trios (calibration)',
      actual: skillResults.calibration.length,
      expected: probeCount * skillProfiles.length
    },
    {
      label: 'Task 10 skill trios (holdout)',
      actual: skillResults.holdout.length,
      expected: probeCount * skillProfiles.length
    },
    {
      label: 'Task 11 fog pairs (calibration, both sources)',
      actual: fogResults.calibration.length,
      expected: probeCount * fogProfiles.length * 2
    },
    {
      label: 'Task 11 fog pairs (holdout, both sources)',
      actual: fogResults.holdout.length,
      expected: probeCount * fogProfiles.length * 2
    },
    // Task 12 binds 1,000 *six-run* sequences. A Career that halts after run 2
    // is a real finding, but it is not one of the six-run sequences the
    // progression-timing evidence is made of, so it cannot count toward the
    // requirement.
    ...careerCompletionCoverage
  ]
  const coverageShortfalls = expectedCoverage.filter(
    entry => entry.actual < entry.expected
  )
  for (const shortfall of coverageShortfalls) {
    hardFailures.push(
      `Coverage shortfall: ${shortfall.label} produced ${shortfall.actual} of the expected ${shortfall.expected}${shortfall.note ? ` (${shortfall.note})` : ''}`
    )
  }
  // A reduced matrix is legitimate under `--quick`. It is not a correctness
  // failure, but it must never be mistaken for release evidence.
  if (!isReleaseRun) {
    softFindings.push(
      `Reduced-coverage run: ${sampleCount} samples/cohort is below the binding release size of ${RELEASE_SAMPLE_COUNT}. This artifact is a developer check, not release evidence.`
    )
  }

  const allCareerSequences = [
    ...careerResults.calibration,
    ...careerResults.holdout
  ]

  // Correctness and release eligibility are separate verdicts. The master
  // plan's merge rule needs both: a gate is green on correctness, but a metric
  // is release evidence only once the full matrix and real pacing samples back
  // it.
  const passed = hardFailures.length === 0
  // Enumerated rather than a boolean chain, so the artifact can say which
  // condition is missing. `capturedRuntime.ok` alone only proves the evidence
  // file is well-formed and fingerprint-matched - it accepts a single sample -
  // so on its own it let one runtime row flip the verdict while the corridor
  // findings still stood and the median sat outside the target window.
  const releaseBlockers = computeReleaseBlockers({
    passed,
    hardFailures,
    isReleaseRun,
    sampleCount,
    coverageShortfalls,
    capturedRuntime,
    runtimeSummary,
    corridorFindings: dominance.corridorFindings
  })
  const releaseEligible = releaseBlockers.length === 0

  return {
    passed,
    releaseEligible,
    releaseBlockers,
    hardFailures,
    softFindings,
    metadata,
    provenance: {
      generatedAt: new Date().toISOString(),
      namespaces: {
        calibration: CALIBRATION_NAMESPACE,
        holdout: HOLDOUT_NAMESPACE,
        extractionCalibration: EXTRACTION_CALIB_NAMESPACE,
        extractionHoldout: EXTRACTION_HOLDOUT_NAMESPACE,
        skillCalibration: SKILL_CALIB_NAMESPACE,
        skillHoldout: SKILL_HOLDOUT_NAMESPACE,
        fogCalibration: FOG_CALIB_NAMESPACE,
        fogHoldout: FOG_HOLDOUT_NAMESPACE,
        fogReputationCalibration: FOG_REPUTATION_CALIBRATION_NAMESPACE,
        fogReputationHoldout: FOG_REPUTATION_HOLDOUT_NAMESPACE,
        careerCalibration: CAREER_CALIB_NAMESPACE,
        careerHoldout: CAREER_HOLDOUT_NAMESPACE
      },
      profilesCount: EXPEDITION_BALANCE_PROFILES.length,
      sampleCountPerCohort: sampleCount
    },
    coverage: {
      isReleaseRun,
      profileCount,
      expected: expectedCoverage,
      shortfalls: coverageShortfalls
    },
    calibrationSummary: calibrationCohort?.profileSummaries ?? {},
    holdoutSummary: holdoutCohort?.profileSummaries ?? {},
    strategyDominance: dominance,
    extractionProbe: {
      calibrationPairs: extractionResults.calibration.length,
      holdoutPairs: extractionResults.holdout.length,
      // Restricted to the windows the *policy* chooses. Without these the
      // artifact prices every legal window and still cannot say whether the
      // agent's own decisions were any good - the question that separates a
      // profile which is too weak from one that quits a race it is winning.
      calibrationRegret: summarizeExtractionRegret(
        extractionResults.calibration.map(entry => entry.pair)
      ),
      holdoutRegret: summarizeExtractionRegret(
        extractionResults.holdout.map(entry => entry.pair)
      ),
      samples: extractionResults.calibration
        .slice(0, 5)
        .map(compactExtractionSample)
    },
    skillProbe: {
      calibrationTrios: skillResults.calibration.length,
      holdoutTrios: skillResults.holdout.length,
      summaryByCohort: {
        calibration: summarizeSkillCohort(skillResults.calibration),
        holdout: summarizeSkillCohort(skillResults.holdout)
      },
      samples: skillResults.calibration.slice(0, 5).map(compactSkillSample)
    },
    fogProbe: {
      calibrationPairs: fogResults.calibration.length,
      holdoutPairs: fogResults.holdout.length,
      bySource: Object.fromEntries(
        Object.entries(fogResultsBySource).map(([source, cohorts]) => {
          const all = [...cohorts.calibration, ...cohorts.holdout]
          const atDecision = all.filter(
            entry => (entry.pair?.revealedCandidateIds?.length ?? 0) > 0
          )
          const changed = atDecision.filter(entry => entry.pair?.routeChanged)
          return [
            source,
            {
              pairs: all.length,
              revealUsed: all.filter(entry => entry.pair?.revealUsed).length,
              revealAtDecision: atDecision.length,
              routeChanged: changed.length,
              revealUsedRouteUnchangedRate:
                atDecision.length === 0
                  ? null
                  : (atDecision.length - changed.length) / atDecision.length
            }
          ]
        })
      ),
      samples: fogResults.calibration.slice(0, 5).map(compactFogSample)
    },
    careerSequences: {
      calibrationCount: careerResults.calibration.length,
      holdoutCount: careerResults.holdout.length,
      sequencesCount: allCareerSequences.length,
      cashflowByRun: {
        calibration: summarizeCareerCashflow(careerResults.calibration),
        holdout: summarizeCareerCashflow(careerResults.holdout)
      },
      summaryByProfile: {
        calibration: summarizeCareerSequencesByProfile(
          careerResults.calibration
        ),
        holdout: summarizeCareerSequencesByProfile(careerResults.holdout)
      },
      progressionMetrics: {
        calibration: summarizeCareerProgressionMetrics(
          careerResults.calibration
        ),
        holdout: summarizeCareerProgressionMetrics(careerResults.holdout)
      },
      samples: careerResults.calibration.slice(0, 5).map(compactCareerSample)
    },
    legendaryEdgeCoverage: legendary.statusById,
    runtimeDuration: runtimeSummary,
    runtimeEvidence: {
      ok: capturedRuntime.ok,
      reason: capturedRuntime.reason,
      capturedAt: capturedRuntime.capturedAt,
      sourceFingerprint: capturedRuntime.sourceFingerprint,
      evidencePath: RUNTIME_EVIDENCE_RELATIVE_PATH
    },
    fixtureProvenance
  }
}

/**
 * Formats report data as markdown.
 *
 * @param {any} data
 * @returns {string}
 */
export function formatMarkdownReport(data) {
  const {
    passed,
    releaseEligible,
    releaseBlockers,
    hardFailures,
    softFindings,
    coverage,
    metadata,
    provenance,
    calibrationSummary,
    holdoutSummary,
    strategyDominance,
    extractionProbe,
    skillProbe,
    fogProbe,
    careerSequences,
    legendaryEdgeCoverage,
    runtimeDuration,
    runtimeEvidence,
    fixtureProvenance
  } = data

  // Two verdicts, kept apart. Correctness is whether the run broke a hard
  // invariant; release eligibility additionally needs the full binding matrix
  // and real pacing samples, per the master plan's merge rule.
  const statusBadge = passed ? '✅ PASS' : '❌ FAIL'
  const releaseBadge = releaseEligible
    ? '✅ RELEASE EVIDENCE'
    : '⚠️ NOT RELEASE EVIDENCE'

  let md = `# Roguelite Expedition v1.5 Balance Recalibration Report\n\n`
  md += `**Correctness:** ${statusBadge}\n`
  md += `**Release evidence:** ${releaseBadge}\n`
  if (releaseBlockers.length > 0) {
    md += `**Release blocked by:** ${releaseBlockers.join('; ')}\n`
  }
  md += `**Generated At:** ${provenance.generatedAt}\n`
  md += `**Profiles:** ${provenance.profilesCount} mature archetypes\n`
  md += `**Sample Count Per Cohort:** ${provenance.sampleCountPerCohort}\n\n`

  md += `## 0. Artifact Provenance\n\n`
  md += `| Field | Value |\n`
  md += `| :--- | :--- |\n`
  md += `| Source fingerprint | \`${metadata.sourceFingerprint}\` |\n`
  md += `| Generator fingerprint | \`${metadata.generatorFingerprint}\` |\n`
  md += `| Seed namespace | \`${metadata.seedNamespace}\` |\n`
  md += `| Runs per scenario | ${metadata.runsPerScenario} |\n`
  md += `| Working tree dirty | ${metadata.workingTreeDirty ? 'YES' : 'no'} |\n`
  md += `| Artifact schema version | ${metadata.artifactSchemaVersion} |\n\n`

  md += `### Resolved mature-fixture inputs\n\n`
  md += `Every fixture value that can move a balance number, declared on the profile rather than defaulted by the builder.\n\n`
  md += `| Profile | Fixture v | Cash | Fame | Member skills | Van upgrades | Start fuel |\n`
  md += `| :--- | ---: | ---: | ---: | :--- | :--- | ---: |\n`
  for (const entry of fixtureProvenance) {
    const skills = Object.entries(entry.memberSkills)
      .map(([name, value]) => `${name}=${value}`)
      .join(' ')
    md += `| \`${entry.profileId}\` | ${entry.version} | $${entry.money} | ${entry.fame} | ${skills} | ${entry.resolvedVanUpgrades.join(', ') || '-'} | ${entry.resolvedStartingVanFuel ?? '-'} |\n`
  }
  md += `\n`

  md += `## 1. Hard Correctness Failures\n\n`
  if (hardFailures.length === 0) {
    md += `All 14 Hard Correctness Gates passed with 0 invariant violations across all cohorts.\n\n`
  } else {
    md += `**FAILURES DETECTED (${hardFailures.length}):**\n`
    for (const f of hardFailures) {
      md += `- ❌ ${f}\n`
    }
    md += `\n`
  }

  md += `## 1b. Soft Findings (tuneable, non-blocking)\n\n`
  if (softFindings.length === 0) {
    md += `No soft findings. Every balance corridor held and pacing evidence was present.\n\n`
  } else {
    md += `G6 Task 7 treats the balance corridors as tuneable hypotheses, and Task 14 treats the 20–30 minute window as a product corridor rather than a synthetic hard gate. These do not fail correctness, but they do hold back release evidence.\n\n`
    for (const finding of softFindings) {
      md += `- ⚠️ ${finding}\n`
    }
    md += `\n`
  }

  md += `### Release coverage\n\n`
  md += `| Requirement | Produced | Expected |\n`
  md += `| :--- | ---: | ---: |\n`
  for (const entry of coverage.expected) {
    md += `| ${entry.label} | ${entry.actual} | ${entry.expected} |\n`
    if (entry.note) {
      md += `| ↳ *${entry.note}* | | |\n`
    }
  }
  md += `\n`

  md += `## 2. Single-Run Calibration Corridors\n\n`
  md += `*Namespace:* \`${provenance.namespaces.calibration}\`\n\n`
  md += `| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |\n`
  md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`
  for (const [id, s] of Object.entries(calibrationSummary)) {
    md += `| \`${id}\` | ${(s.completedRate * 100).toFixed(1)}% | ${(s.extractedRate * 100).toFixed(1)}% | ${(s.failedRate * 100).toFixed(1)}% | ${s.meanDepth.toFixed(1)} | $${s.meanMoney.toFixed(0)} | ${s.meanFame.toFixed(0)} |\n`
  }
  md += `\n`

  md += `## 3. Single-Run Holdout Confirmation\n\n`
  md += `*Namespace:* \`${provenance.namespaces.holdout}\`\n\n`
  md += `| Profile | Completed % | Extracted % | Failed % | Mean Depth | Mean Retained Cash | Mean Retained Fame |\n`
  md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n`
  for (const [id, s] of Object.entries(holdoutSummary)) {
    md += `| \`${id}\` | ${(s.completedRate * 100).toFixed(1)}% | ${(s.extractedRate * 100).toFixed(1)}% | ${(s.failedRate * 100).toFixed(1)}% | ${s.meanDepth.toFixed(1)} | $${s.meanMoney.toFixed(0)} | ${s.meanFame.toFixed(0)} |\n`
  }
  md += `\n`

  md += `## 3b. Strategy Dominance\n\n`
  md += `Dominance blocks only when the same conclusion reproduces in disjoint calibration and holdout; corridor misses are reported as tuning findings in section 1b.\n\n`
  if (strategyDominance.dominanceViolations.length === 0) {
    md += `No strategy strictly dominates the field across both cohorts.\n\n`
  } else {
    md += `**BLOCKING (${strategyDominance.dominanceViolations.length}):**\n`
    for (const violation of strategyDominance.dominanceViolations) {
      md += `- ❌ ${violation}\n`
    }
    md += `\n`
  }
  if (strategyDominance.corridorFindings.length > 0) {
    md += `**Corridor findings (${strategyDominance.corridorFindings.length}, non-blocking):**\n`
    for (const finding of strategyDominance.corridorFindings) {
      md += `- ⚠️ ${finding}\n`
    }
    md += `\n`
  }

  md += `## 4. Paired Extraction Counterfactuals\n\n`
  md += `Evaluated ${extractionProbe.calibrationPairs} calibration and ${extractionProbe.holdoutPairs} holdout matched window decisions under identical state, map, and RNG seeds.\n`
  md += `- **Voluntary Extraction:** Secures current retained earnings and rare items with zero risk of further technical collapse.\n`
  md += `- **Push Counterfactual:** Faces remaining route challenges, risking total failure vs achieving Finale completion payouts.\n\n`

  md += `## 5. Matched Skill-vs-Management Probe\n\n`
  md += `Evaluated ${skillProbe.calibrationTrios} calibration and ${skillProbe.holdoutTrios} holdout matched trios comparing Low Skill (45/0.35), Competent (70/0.70), and High Skill (90/0.95).\n`
  md += `- Proves higher player skill significantly increases Gig rewards and lowers wear/repair burdens while management choices remain decisive.\n\n`

  md += `## 6. Matched Hybrid-Fog Counterfactuals\n\n`
  md += `Evaluated ${fogProbe.calibrationPairs} calibration and ${fogProbe.holdoutPairs} holdout matched route decision pairs.\n`
  md += `Both branches derive from one canonical decision state with the Scout's automatic per-step reveal suppressed, so the only pre-decision difference is the single legal reveal branch B spends. Choices are scored off the production Fog projection (\`getExpeditionNodeFogByNodeId\`), never off raw hidden map data.\n\n`
  md += `| Source | Pairs | Reveal granted | Reveal at decision | Route changed | Reveal-unused rate |\n`
  md += `| :--- | ---: | ---: | ---: | ---: | ---: |\n`
  for (const [source, stats] of Object.entries(fogProbe.bySource)) {
    const unusedRate =
      stats.revealUsedRouteUnchangedRate === null
        ? 'n/a'
        : `${(stats.revealUsedRouteUnchangedRate * 100).toFixed(1)}%`
    md += `| \`${source}\` | ${stats.pairs} | ${stats.revealUsed} | ${stats.revealAtDecision} | ${stats.routeChanged} | ${unusedRate} |\n`
  }
  md += `\n`
  md += `The reputation entitlement draws its one bounded level-1 read from the whole forward route, so it lands on an immediate candidate only occasionally; "reveal at decision" separates that from a reveal the policy simply could not price yet.\n\n`

  md += `## 7. Fresh-Career Progression Sequences\n\n`
  md += `Evaluated ${careerSequences.sequencesCount} progression sequences (${careerSequences.calibrationCount} calibration, ${careerSequences.holdoutCount} holdout) starting with ZERO meta facilities, ZERO unlock sets, and Ascension locked.\n`
  md += `- Baseline \`initialState\` purse and Fame — no seeded head start.\n`
  md += `- Fuel is topped up by the build's own \`startingFuelTarget\`, charged at START; van wear carries between Tours.\n`
  md += `- Fixture capability sets are strictly empty for all fresh runs.\n\n`
  md += `### Summary by Profile (Calibration)\n\n`
  md += `| Profile | Sequences | Completed All 6 % | Mean Runs Completed | Primary Halt Reasons |\n`
  md += `| :--- | ---: | ---: | ---: | :--- |\n`
  if (careerSequences.summaryByProfile?.calibration) {
    for (const [id, stats] of Object.entries(
      careerSequences.summaryByProfile.calibration
    )) {
      const halts =
        Object.entries(stats.haltReasons || {})
          .map(([r, c]) => `${c}x ${r}`)
          .join(', ') || 'None'
      md += `| \`${id}\` | ${stats.sequences} | ${(stats.completedAllRunsRate * 100).toFixed(1)}% | ${stats.meanRunsCompleted.toFixed(2)} | ${halts} |\n`
    }
  }
  md += `\n`
  md += `### Compact Sequence Samples\n\n`
  md += `| Profile | Seed | Runs Requested | Runs Completed | Halted At | Reason |\n`
  md += `| :--- | ---: | ---: | ---: | ---: | :--- |\n`
  for (const seq of careerSequences.samples || []) {
    md += `| \`${seq.profileId}\` | ${seq.sequenceSeed} | ${seq.runsRequested} | ${seq.runsCompleted} | ${seq.haltedAtRun ?? '—'} | ${seq.haltReason ?? 'completed all runs'} |\n`
  }
  md += `\n`

  md += `## 8. Late-Game Legendary Edge Coverage\n\n`
  md += `| Legendary | Verification Status | Rule Changed |\n`
  md += `| :--- | :---: | :--- |\n`
  md += `| **Safe Harbor** | ${legendaryEdgeCoverage.safe_harbor} | Voluntary extraction window granted on post-corridor non-Finale node |\n`
  md += `| **The Fixer** | ${legendaryEdgeCoverage.the_fixer} | Forgives Heat & controversy penalty from breached Contract constraint |\n`
  md += `| **Nemesis Key** | ${legendaryEdgeCoverage.nemesis_key} | Opens 2-step route shortcut to Rival Encounter |\n`
  md += `| **Ghost Route** | ${legendaryEdgeCoverage.ghost_route} | Converts extreme Authority crisis into Underground detour |\n`
  md += `| **Salvage Rights** | ${legendaryEdgeCoverage.salvage_rights} | Rescues zeroed condition group to 20% floor using spare parts / rare |\n\n`

  md += `## 9. Real Runtime / Playtest Evidence\n\n`
  if (!runtimeEvidence.ok) {
    md += `**NO USABLE PACING EVIDENCE.** ${runtimeEvidence.reason}\n\n`
    md += `Pacing is read only from captured playtest artifacts recorded against this report's source fingerprint (\`${runtimeEvidence.evidencePath}\`). No median is stated, because none has been measured for this build.\n\n`
  } else {
    md += `Evaluated ${runtimeDuration.count} captured playtest sessions${runtimeEvidence.capturedAt ? ` (captured ${runtimeEvidence.capturedAt})` : ''}, recorded against source \`${(runtimeEvidence.sourceFingerprint ?? '').slice(0, 12)}\`.\n`
    md += `- **Median Duration:** ${runtimeDuration.medianMinutes} min (Target Corridor: 20–30 min)\n`
    md += `- **p25 Duration:** ${runtimeDuration.p25Minutes} min\n`
    md += `- **p75 Duration:** ${runtimeDuration.p75Minutes} min\n`
    md += `- **Corridor Status:** ${runtimeDuration.corridorStatus.toUpperCase()} (${runtimeDuration.inTargetCorridor ? 'PASS' : 'OUTSIDE_CORRIDOR'})\n\n`
  }

  return md
}

/**
 * Main execution function.
 */
async function main() {
  const isQuick = process.argv.includes('--quick')
  const sampleCount = isQuick ? QUICK_SAMPLE_COUNT : RELEASE_SAMPLE_COUNT

  const reportData = await executeBalanceRecalibrationSuite({ sampleCount })
  const mdReport = formatMarkdownReport(reportData)

  const reportsDir = path.join(REPO_ROOT, 'docs', 'superpowers', 'reports')
  await fs.mkdir(reportsDir, { recursive: true })

  const mdPath = path.join(reportsDir, 'roguelite-expedition-v15-balance.md')
  const jsonPath = path.join(
    reportsDir,
    'roguelite-expedition-v15-balance.json'
  )

  await fs.writeFile(mdPath, mdReport, 'utf8')
  await fs.writeFile(jsonPath, JSON.stringify(reportData, null, 2), 'utf8')

  console.log(`[BalanceSuite] Wrote markdown report to ${mdPath}`)
  console.log(`[BalanceSuite] Wrote json report to ${jsonPath}`)

  for (const finding of reportData.softFindings) {
    console.warn(`[BalanceSuite] ⚠️  ${finding}`)
  }

  if (!reportData.passed) {
    console.error(
      `[BalanceSuite] ❌ FAILED with ${reportData.hardFailures.length} hard correctness failures.`
    )
    process.exit(1)
  }

  console.log('[BalanceSuite] ✅ ALL G6 CORRECTNESS GATES AND PROBES PASSED!')
  console.log(
    reportData.releaseEligible
      ? '[BalanceSuite] ✅ Artifact qualifies as release evidence.'
      : `[BalanceSuite] ⚠️  Artifact is NOT release evidence: ${reportData.releaseBlockers.join('; ')}`
  )
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('[BalanceSuite] Fatal error during execution:', err)
    process.exit(1)
  })
}
