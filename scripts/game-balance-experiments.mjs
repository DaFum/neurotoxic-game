import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { ORIGINAL_CONTROL_BALANCE_TUNING, resolveBalanceTuning } from '../src/utils/balanceTuning.ts'
import { BALANCE_EXPERIMENTS, hashExperimentConfig } from './game-balance-experiment-config.mjs'
import { bankruptcyTransitions, pairedMetricStatistics } from './utils/paired-statistics.mjs'
import { KPI_TARGETS, SCENARIOS, SIMULATION_CONSTANTS, calculateAverageFameEarnedPerGig, createScenarioSeed, getJsonHash, runSingleSimulation } from './game-balance-simulation.mjs'
import { logger, LOG_LEVELS } from '../src/utils/logger.js'
import { getBalanceSourceHash } from './utils/balance-report-metadata.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_JSON = path.join(ROOT, 'reports/game-balance-experiments-results.json')
const OUTPUT_MARKDOWN = path.join(ROOT, 'reports/game-balance-experiments-analysis.md')
const METRICS = ['daysSurvived', 'finalMoney', 'finalFame', 'fameEarned', 'gigsPlayed', 'finalHarmony', 'maxDrawdownPct']

/**
 * Raised when the experiment legitimately finds nothing shippable. Distinct
 * from a code or infrastructure fault so the CLI can report the two
 * differently: an empty candidate set is a valid outcome, a RangeError from a
 * misconfigured horizon is not.
 */
export class NoViableCandidateError extends Error {
  constructor(message) {
    super(message)
    this.name = 'NoViableCandidateError'
  }
}

const round = value => Number(value.toFixed(2))
const percentageDelta = (control, candidate) => control === 0 ? 0 : round((candidate - control) / Math.abs(control) * 100)
const compact = run => ({
  bankrupt: run.bankrupt,
  daysSurvived: run.daysSurvived,
  finalMoney: run.finalMoney,
  finalFame: run.finalFame,
  fameEarned: run.fameAccounting.earned,
  gigsPlayed: run.gigsPlayed,
  finalHarmony: run.finalHarmony,
  maxDrawdownPct: run.maxPeakToTroughDrop,
  moneyAtEarlyCheckpoint: run.moneyAtEarlyCheckpoint,
  moneyAtMidCheckpoint: run.moneyAtMidCheckpoint,
  totalGigNet: run.totalGigNet,
  clinicVisits: run.clinicVisits,
  repairs: run.repairs,
  refuels: run.refuels
})

export const pairSimulationRuns = ({ scenario, runsPerScenario, controlTuning, candidateTuning, controlRuns, runner = runSingleSimulation }) => {
  if (controlRuns && controlRuns.length !== runsPerScenario) throw new RangeError('Control cohort size must match runsPerScenario')
  const pairs = []
  for (let runIndex = 0; runIndex < runsPerScenario; runIndex++) {
    const seed = createScenarioSeed(scenario.id, runIndex)
    const control = controlRuns?.[runIndex] ?? compact(runner(scenario, seed, controlTuning))
    const candidate = compact(runner(scenario, seed, candidateTuning))
    pairs.push({
      scenarioId: scenario.id, runIndex, seed, control, candidate,
      delta: Object.fromEntries(METRICS.map(metric => [metric, candidate[metric] - control[metric]]))
    })
  }
  return pairs
}

export const assertEqualControlCohorts = candidatePairs => {
  const expected = JSON.stringify(candidatePairs[0]?.map(pair => pair.control) ?? [])
  for (const pairs of candidatePairs.slice(1)) {
    if (JSON.stringify(pairs.map(pair => pair.control)) !== expected) {
      throw new Error('Control cohorts differ across candidates')
    }
  }
}

export const summarizePairedRuns = (pairs, experimentId, scenarioId) => ({
  sampleSize: pairs.length,
  bankruptcy: bankruptcyTransitions(pairs.map(pair => pair.control.bankrupt), pairs.map(pair => pair.candidate.bankrupt)),
  continuous: Object.fromEntries(METRICS.map(metric => [metric, pairedMetricStatistics(
    pairs.map(pair => pair.control[metric]), pairs.map(pair => pair.candidate[metric]),
    { bootstrapSeed: `${experimentId}:${scenarioId}:${metric}`, resamples: 2000 }
  )]))
})

export const kpiStatusForRuns = runs => {
  const target = KPI_TARGETS[runs[0]?.scenarioId]
  if (!target) return { control: 'not_evaluated', candidate: 'not_evaluated' }
  const side = key => runs.map(pair => pair[key])
  const status = key => {
    const cohort = side(key)
    const bankruptcyRate = cohort.filter(run => run.bankrupt).length / Math.max(1, cohort.length) * 100
    const money = cohort.reduce((sum, run) => sum + run.finalMoney, 0) / Math.max(1, cohort.length)
    const famePerGig = calculateAverageFameEarnedPerGig(cohort)
    return bankruptcyRate <= target.bankruptcyMax && money >= target.moneyMin && money <= target.moneyMax && famePerGig >= target.fameProgressPerGigMin && famePerGig <= target.fameProgressPerGigMax ? 'passed' : 'failed'
  }
  return { control: status('control'), candidate: status('candidate') }
}

export const evaluateFinalCombinedValidation = results => {
  const sampleSizes = new Set(results.map(result => result.sampleSize))
  const scenarioIds = results.map(result => result.scenarioId)
  const configuredScenarioIds = SCENARIOS.map(scenario => scenario.id)
  const kpiScenarioIds = Object.keys(KPI_TARGETS)
  const resultsByScenario = Object.fromEntries(results.map(result => [result.scenarioId, result]))
  for (const result of results) {
    const checks = {
      bankruptcy: result.scenarioId === 'bootstrap_struggle'
        ? result.bankruptcy.candidateRatePct <= 60
        : result.bankruptcy.deltaRatePct <= 2,
      kpi: !(result.controlKpiStatus === 'passed' && result.candidateKpiStatus === 'failed'),
      famePerGig: Math.abs(result.famePerGigDeltaPct) <= 5,
      harmony: result.continuous.finalHarmony.pairedDelta.median >= -5,
      drawdown: result.continuous.maxDrawdownPct.pairedDelta.median <= 10
    }
    const failures = Object.entries(checks).filter(([, passed]) => !passed).map(([check]) => check)
    result.scenarioValidation = { passed: failures.length === 0, checks, failures }
  }
  const checks = {
    requiredScenariosPresent: configuredScenarioIds.every(id => scenarioIds.includes(id)),
    scenarioIdsUnique: new Set(scenarioIds).size === scenarioIds.length,
    allKpiTargetScenariosPresent: kpiScenarioIds.every(id => scenarioIds.includes(id)),
    allConfiguredScenariosPresent: scenarioIds.length === configuredScenarioIds.length && configuredScenarioIds.every(id => scenarioIds.includes(id)),
    bootstrapBankruptcy: (resultsByScenario.bootstrap_struggle?.bankruptcy.candidateRatePct ?? Infinity) <= 60,
    noPassedToFailed: results.every(result => !(result.controlKpiStatus === 'passed' && result.candidateKpiStatus === 'failed')),
    otherScenarioBankruptcy: results.every(result => result.scenarioId === 'bootstrap_struggle' || result.bankruptcy.deltaRatePct <= 2),
    famePerGig: results.every(result => Math.abs(result.famePerGigDeltaPct) <= 5),
    harmony: results.every(result => result.continuous.finalHarmony.pairedDelta.median >= -5),
    drawdown: results.every(result => result.continuous.maxDrawdownPct.pairedDelta.median <= 10),
    sampleSizesMatch: sampleSizes.size <= 1 && !sampleSizes.has(0),
    transitionCountsMatch: results.every(result => Object.values(result.bankruptcy.bankruptcyTransitions).reduce((sum, value) => sum + value, 0) === result.sampleSize)
  }
  const failures = Object.entries(checks).filter(([, passed]) => !passed).map(([check]) => check)
  return { passed: failures.length === 0, checks, resultsByScenario, failures }
}

export const rankCandidates = candidates => [...candidates].sort((left, right) => {
  const passDifference = Number(right.acceptanceCriteria.passed) - Number(left.acceptanceCriteria.passed)
  if (passDifference) return passDifference
  const leftScore = left.rankingComponents.targetFit - left.rankingComponents.sideEffectPenalty - left.rankingComponents.overcorrectionPenalty - left.rankingComponents.complexityPenalty
  const rightScore = right.rankingComponents.targetFit - right.rankingComponents.sideEffectPenalty - right.rankingComponents.overcorrectionPenalty - right.rankingComponents.complexityPenalty
  return rightScore - leftScore || left.id.localeCompare(right.id)
})

const median = values => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const percentile = (values, p) => {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.round((sorted.length - 1) * p)]
}

const pairedCheckpointDelta = (pairs, key) => {
  const valid = pairs.filter(
    pair => Number.isFinite(pair.control[key]) && Number.isFinite(pair.candidate[key])
  )
  if (valid.length === 0) return null
  return percentageDelta(
    median(valid.map(pair => pair.control[key])),
    median(valid.map(pair => pair.candidate[key]))
  )
}

export const selectAcceptedCandidate = ranking =>
  ranking.find(item => item.acceptanceCriteria.passed) ?? null

// Staged obligation relief is expressed as cumulative `throughDay` boundaries, so
// each stage's weight is its own segment length, not `throughDay` itself.
const stagedObligationRelief = stages => stages.reduce((sum, stage, index) => {
  const previousThroughDay = index === 0 ? 0 : stages[index - 1].throughDay
  return sum + (stage.throughDay - previousThroughDay) * (1 - stage.multiplier)
}, 0)

export const combinationImpact = ({ bootstrap, touring }) => {
  const early = bootstrap.overrides.earlyGame ?? {}
  const late = touring.overrides.touring ?? {}
  const obligationRelief = early.obligationStages?.length
    ? stagedObligationRelief(early.obligationStages)
    : (early.durationDays ?? 0) * (1 - (early.dailyObligationMultiplier ?? 1))
  // An emergency grant is an intervention too. Omitting it scored a grant lever
  // as "changes nothing", which then beat the genuine no-op on the alphabetical
  // tie-break and shipped a lever with no measurable effect. The scale here only
  // has to order levers consistently and keep the no-op strictly minimal; it is
  // not a physical quantity.
  const grantRelief =
    ((early.emergencyGrant ?? 0) / 1000) * (early.emergencyGrantMaxDay ?? 0)
  const relief = obligationRelief + grantRelief
  // Dense-schedule pressure is an intervention as well. Every override family
  // must contribute a positive term, otherwise a real lever ties with the
  // genuine no-op and the "first validated pair is the least intervention"
  // guarantee degrades into an alphabetical tie-break.
  // `tests/node/game-balance-experiments.test.js` asserts this for every
  // configured candidate.
  const denseSchedule =
    (late.denseScheduleHarmonyPenalty ?? 0) +
    (1 - (late.denseScheduleRecoveryMultiplier ?? 1)) * 10 +
    ((late.denseScheduleMaintenanceMultiplier ?? 1) - 1) * 10
  const saturation = (late.repeatGigWindowDays ?? 0) * (late.repeatDemandPenaltyPerGig ?? 0) *
    (late.maxRepeatDemandPenalty ?? 0) / Math.max(1, late.repeatDemandStartDay ?? 0)
  return relief + saturation + denseSchedule
}

export const evaluateCandidate = (definition, pairs, summary) => {
  const controlFamePerGig = pairs.reduce((sum, pair) => sum + pair.control.fameEarned / Math.max(1, pair.control.gigsPlayed), 0) / pairs.length
  const candidateFamePerGig = pairs.reduce((sum, pair) => sum + pair.candidate.fameEarned / Math.max(1, pair.candidate.gigsPlayed), 0) / pairs.length
  const famePerGigDeltaPct = percentageDelta(controlFamePerGig, candidateFamePerGig)
  const candidateSolventMoney = pairs.filter(pair => !pair.candidate.bankrupt).map(pair => pair.candidate.finalMoney)
  const medianFinalMoneyDeltaPct = percentageDelta(summary.continuous.finalMoney.control.median, summary.continuous.finalMoney.candidate.median)
  const p90FinalMoneyDeltaPct = percentageDelta(summary.continuous.finalMoney.control.p90, summary.continuous.finalMoney.candidate.p90)
  // Checkpoints are horizon-relative (`progressionCheckpointDays`). A null here
  // means the waypoint lies outside the simulated horizon, which is a
  // misconfiguration rather than a candidate failure — surface it instead of
  // silently failing every candidate.
  const earlyCheckpointDeltaPct = pairedCheckpointDelta(pairs, 'moneyAtEarlyCheckpoint')
  const midCheckpointDeltaPct = pairedCheckpointDelta(pairs, 'moneyAtMidCheckpoint')
  if (definition.phase === 'touring' && (earlyCheckpointDeltaPct == null || midCheckpointDeltaPct == null)) {
    throw new RangeError('Progression checkpoints fall outside the simulated horizon; check SIMULATION_CONSTANTS.progressionCheckpointDays against daysPerRun')
  }
  const criteria = definition.acceptanceCriteria
  const checks = definition.phase === 'bootstrap'
    ? {
        bankruptcy: summary.bankruptcy.candidateRatePct <= criteria.bankruptcyRateMaxPct,
        bankruptcyDelta: summary.bankruptcy.deltaRatePct <= criteria.bankruptcyMaximumDeltaPct,
        solventMedianMoney: median(candidateSolventMoney) <= criteria.solventMedianMoneyMax,
        solventP90Money: percentile(candidateSolventMoney, 0.9) <= criteria.solventP90MoneyMax,
        famePerGig: Math.abs(famePerGigDeltaPct) <= criteria.famePerGigMaximumAbsDeltaPct
      }
    : {
        medianFinalMoney: medianFinalMoneyDeltaPct >= criteria.medianFinalMoneyDeltaPct[0] && medianFinalMoneyDeltaPct <= criteria.medianFinalMoneyDeltaPct[1],
        p90FinalMoney: p90FinalMoneyDeltaPct >= criteria.p90FinalMoneyDeltaPct[0] && p90FinalMoneyDeltaPct <= criteria.p90FinalMoneyDeltaPct[1],
        earlyCheckpoint: earlyCheckpointDeltaPct >= criteria.earlyCheckpointMinimumDeltaPct,
        midCheckpoint: midCheckpointDeltaPct >= criteria.midCheckpointMinimumDeltaPct,
        bankruptcy: summary.bankruptcy.candidateRatePct <= criteria.candidateBankruptcyRateMaxPct && summary.bankruptcy.deltaRatePct <= criteria.bankruptcyMaximumDeltaPct,
        famePerGig: Math.abs(famePerGigDeltaPct) <= criteria.famePerGigMaximumAbsDeltaPct,
        harmony: summary.continuous.finalHarmony.pairedDelta.median >= criteria.harmonyMinimumDelta
      }
  const passed = Object.values(checks).every(value => value === true)
  // Anchors derive from the live acceptance criteria. The bootstrap anchor used
  // to be a literal 50% insolvency, inherited from an economy where the control
  // sat near there; against the current tolerance most candidates fell outside
  // the 100/3 window and tied at zero, which made the ranking look ordered while
  // carrying no information. Midpoint of the tolerated band keeps the original
  // shape — a relief lever should land inside the band, not at either extreme.
  // Each phase reads only its own criteria: the two criteria shapes are
  // disjoint, so computing both anchors eagerly throws on the missing one.
  const bootstrapAnchorPct = (criteria.bankruptcyRateMaxPct ?? 0) / 2
  const targetFit = definition.phase === 'bootstrap'
    ? Math.max(0, 100 - Math.abs(bootstrapAnchorPct - summary.bankruptcy.candidateRatePct) * 3)
    : Math.max(0, 100 - Math.abs(
        ((criteria.medianFinalMoneyDeltaPct?.[0] ?? 0) + (criteria.medianFinalMoneyDeltaPct?.[1] ?? 0)) / 2 -
          medianFinalMoneyDeltaPct
      ) * 4)
  const overcorrectionPenalty = definition.phase === 'bootstrap' && summary.bankruptcy.candidateRatePct < bootstrapAnchorPct / 2 ? 50 : 0
  const sideEffectPenalty = Math.abs(famePerGigDeltaPct) + Math.max(0, -summary.continuous.finalHarmony.pairedDelta.median)
  const complexityPenalty = definition.id.includes('staged') || definition.id.includes('recovery') ? 2 : 1
  return {
    ...definition,
    resultsByScenario: { [pairs[0]?.scenarioId ?? definition.scenarios[0]]: summary },
    aggregateResults: {
      ...summary,
      solventMedianMoney: round(median(candidateSolventMoney)), solventP90Money: round(percentile(candidateSolventMoney, 0.9)),
      famePerGigDeltaPct, medianFinalMoneyDeltaPct, p90FinalMoneyDeltaPct, earlyCheckpointDeltaPct, midCheckpointDeltaPct
    },
    acceptanceCriteria: { ...definition.acceptanceCriteria, passed, checks },
    rankingComponents: { targetFit: round(targetFit), sideEffectPenalty: round(sideEffectPenalty), overcorrectionPenalty, complexityPenalty },
    selectedForProduction: false,
    rejectionReason: passed ? null : `Acceptance limits missed: ${Object.entries(checks).filter(([, value]) => !value).map(([key]) => key).join(', ')}.`
  }
}

const buildGapAnalysis = (baseScenario, tuning, runsPerScenario, runner = runSingleSimulation) => [1, 2, 3, 4, 5].map(gigGapDays => {
  const scenario = { ...baseScenario, id: `${baseScenario.id}_gap_${gigGapDays}`, gigGapDays }
  const runs = Array.from({ length: runsPerScenario }, (_, runIndex) => runner(scenario, createScenarioSeed(scenario.id, runIndex), tuning)).map(compact)
  const average = key => runs.reduce((sum, run) => sum + run[key], 0) / Math.max(1, runs.length)
  const days = Math.max(1, average('daysSurvived'))
  return {
    profile: baseScenario.id, gigGapDays, sampleSize: runs.length,
    bankruptcyRatePct: round(runs.filter(run => run.bankrupt).length / runs.length * 100),
    finalMoneyMean: round(average('finalMoney')), finalMoneyMedian: round(median(runs.map(run => run.finalMoney))), finalMoneyP90: round(percentile(runs.map(run => run.finalMoney), 0.9)),
    moneyPerDay: round(average('finalMoney') / days), gigNetPerDay: round(average('totalGigNet') / days), fameEarnedPerDay: round(average('fameEarned') / days),
    fameEarnedPerGig: round(calculateAverageFameEarnedPerGig(runs)), gigsPlayed: round(average('gigsPlayed')), finalHarmony: round(average('finalHarmony')),
    clinicVisits: round(average('clinicVisits')), repairs: round(average('repairs')), refuels: round(average('refuels')), maxDrawdownPct: round(average('maxDrawdownPct')), daysSurvived: round(average('daysSurvived'))
  }
})

const buildGapTradeoff = profiles => Object.fromEntries(profiles.map(profile => {
  const gap1 = profile.results.find(result => result.gigGapDays === 1)
  const gap2 = profile.results.find(result => result.gigGapDays === 2)
  return [profile.profile, {
    moneyPerDayAdvantagePct: percentageDelta(gap2.moneyPerDay, gap1.moneyPerDay),
    famePerDayAdvantagePct: percentageDelta(gap2.fameEarnedPerDay, gap1.fameEarnedPerDay),
    harmonyDelta: round(gap1.finalHarmony - gap2.finalHarmony),
    repairsDelta: round(gap1.repairs - gap2.repairs),
    bankruptcyDeltaPct: round(gap1.bankruptcyRatePct - gap2.bankruptcyRatePct)
  }]
}))


const GIG_GAP_TARGET_RANGE_PCT = [20, 25]

/**
 * Measures the Phase 3C *objective*: how far Gap-1 vs Gap-2 money-per-day
 * dominance was reduced towards the 20-25% target band.
 *
 * This is deliberately NOT a release gate. Production readiness is decided by
 * `finalCombinedValidation` (the safety gates: bankruptcy, KPI non-regression,
 * fame/gig, harmony, drawdown). A tuning that improves dominance without
 * reaching the target band is a partial result, not a failed run — see
 * `recommendation.status`.
 */
const evaluateGigGap = (controlTradeoff, finalTradeoff) => {
  const [minimum, maximum] = GIG_GAP_TARGET_RANGE_PCT
  const shortfalls = []
  const profileObjective = profile => {
    const before = controlTradeoff[profile].moneyPerDayAdvantagePct
    const after = finalTradeoff[profile].moneyPerDayAdvantagePct
    const withinTarget = after >= minimum && after <= maximum
    if (!withinTarget) {
      shortfalls.push(`${profile} money-per-day advantage ${after}% is outside the ${minimum}-${maximum}% target (was ${before}%)`)
    }
    return { before, after, reductionPct: round(before - after), withinTarget }
  }

  const profiles = {
    baseline_touring: profileObjective('baseline_touring'),
    low_resource_touring: profileObjective('low_resource_touring')
  }
  const objectiveMet = shortfalls.length === 0
  return {
    objectiveMet,
    isReleaseGate: false,
    targetRangePct: GIG_GAP_TARGET_RANGE_PCT,
    shortfalls,
    profiles,
    improved: Object.values(profiles).every(profile => profile.reductionPct > 0),
    checks: {
      baselineMoneyPerDayAdvantage: profiles.baseline_touring.after,
      lowResourceMoneyPerDayAdvantage: profiles.low_resource_touring.after,
      famePerDayTradeoff: finalTradeoff.baseline_touring.famePerDayAdvantagePct,
      harmonyTradeoff: finalTradeoff.baseline_touring.harmonyDelta,
      repairsTradeoff: finalTradeoff.baseline_touring.repairsDelta,
      bankruptcyTradeoff: finalTradeoff.baseline_touring.bankruptcyDeltaPct
    }
  }
}

const hashFile = async file => crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex')
const git = command => { try { return execSync(command, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return null } }

const SELECTION_RATIONALE =
  'Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that passes final combined validation; the remaining pairs carry higher impact and so could not have been selected.'

// The ranking is ordered by targetFit minus penalties. When most candidates tie
// on the same score the order is decided by the id tie-break alone, which reads
// as a meaningful ranking but is not one — say so rather than let the reader
// infer significance from the sequence.
const describeRanking = ranking => {
  // rankCandidates orders passing candidates ahead of failing ones before it
  // compares scores, so acceptance is part of what makes an order meaningful.
  // Keying on the score alone would describe a real pass/fail ordering as a
  // pure id tie-break.
  const keys = ranking.map(item =>
    `${item.passed === false ? 0 : 1}:${(
      item.targetFit - item.sideEffectPenalty - item.overcorrectionPenalty - item.complexityPenalty
    ).toFixed(4)}`
  )
  const distinct = new Set(keys).size
  return distinct <= 1
    ? '\n\n> Alle Kandidaten erreichen denselben Rangwert; die Reihenfolge entsteht ausschliesslich aus dem ID-Tie-Break und ist nicht aussagekraeftig.'
    : distinct < Math.ceil(ranking.length / 2)
      ? `\n\n> Nur ${distinct} verschiedene Rangwerte bei ${ranking.length} Kandidaten: die Reihenfolge ist innerhalb gleichwertiger Gruppen ein ID-Tie-Break.`
      : ''
}

export const renderExperimentMarkdown = report => {
  const gap = report.phases.phase3C.gigFrequencyValidation
  const bootstrapRows = report.phases.phase3B.candidates.map(item => `| ${item.id} | ${item.aggregateResults.bankruptcy.controlRatePct}% | ${item.aggregateResults.bankruptcy.candidateRatePct}% | ${item.aggregateResults.bankruptcy.deltaRatePct} pp | ${item.aggregateResults.continuous.daysSurvived.pairedDelta.median} | €${item.aggregateResults.solventMedianMoney} | ${item.aggregateResults.famePerGigDeltaPct}% | ${item.acceptanceCriteria.passed ? 'Pass' : 'Fail'} |`).join('\n')
  const gapRows = Object.entries(report.phases.phase3C.gigFrequencyAnalysis).flatMap(([tuning, profiles]) => profiles.flatMap(profile => profile.results.map(item => `| ${tuning} | ${profile.profile} | ${item.gigGapDays} | ${item.gigsPlayed} | ${item.moneyPerDay} | ${item.gigNetPerDay} | ${item.fameEarnedPerDay} | ${item.fameEarnedPerGig} | ${item.finalHarmony} | ${item.repairs} | ${item.refuels} | ${item.maxDrawdownPct}% | ${item.bankruptcyRatePct}% | ${item.daysSurvived} |`))).join('\n')
  const touringRows = report.phases.phase3C.candidates.map(item => `| ${item.id} | ${item.aggregateResults.medianFinalMoneyDeltaPct}% | ${item.aggregateResults.p90FinalMoneyDeltaPct}% | ${item.aggregateResults.earlyCheckpointDeltaPct}% | ${item.aggregateResults.bankruptcy.deltaRatePct} pp | ${item.aggregateResults.continuous.finalHarmony.pairedDelta.median} | ${item.acceptanceCriteria.passed ? 'Pass' : 'Fail'} |`).join('\n')
  const combinedRows = Object.values(report.finalCombinedValidation.resultsByScenario).map(item => `| ${item.scenarioId} | ${item.controlKpiStatus} | ${item.candidateKpiStatus} | ${item.bankruptcy.controlRatePct}% | ${item.bankruptcy.candidateRatePct}% | ${item.bankruptcy.deltaRatePct} pp | ${item.continuous.finalMoney.pairedDelta.median} | ${item.famePerGigDeltaPct}% | ${item.continuous.finalHarmony.pairedDelta.median} | ${item.continuous.maxDrawdownPct.pairedDelta.median} | ${item.scenarioValidation.passed ? 'Pass' : 'Fail'} |`).join('\n')
  return `# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: \`${report.metadata.pairingStrategy}\`; ${report.runtime.totalRuns} simulation runs in ${report.runtime.durationMs} ms.

## Kontrollzustand

Original production-neutral tuning is the control for Phase 3B and final validation.

## Phase 3B – Bootstrap-Struggle
## Bootstrap-Kandidaten

| Candidate | Control Bankruptcy | Candidate Bankruptcy | Delta | Median Days Survived Delta | Solvent Median Money | Fame/Gig Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---:|---|
${bootstrapRows}

## Bootstrap-Ranking

${report.phases.phase3B.ranking.map((item, index) => `${index + 1}. ${item.id}`).join('\n')}${describeRanking(report.phases.phase3B.ranking)}

## Gewählter Bootstrap-Hebel

\`${report.phases.phase3B.selectedCandidateId}\` was selected by the combination search. ${SELECTION_RATIONALE} ${report.combinationSearch.pairsEvaluated} of ${report.combinationSearch.pairsAvailable} pairs were evaluated, ${report.combinationSearch.pairsSkipped} skipped.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
${gapRows}

Gap 1 vs Gap 2 advantage before: ${JSON.stringify(report.phases.phase3C.gapTradeoff.gap1VsGap2.control)}

Gap 1 vs Gap 2 advantage after: ${JSON.stringify(report.phases.phase3C.gapTradeoff.gap1VsGap2.finalTuning)}

### Phase-3C-Ziel (Gap-1-Dominanz)

Target band: **${gap.targetRangePct[0]}–${gap.targetRangePct[1]}%** money-per-day advantage of Gap 1 over Gap 2. This objective is a measurement, not a release gate.

| Profile | Before | After | Reduction | Within target |
|---|---:|---:|---:|---|
${Object.entries(gap.profiles).map(([profile, item]) => `| ${profile} | ${item.before}% | ${item.after}% | ${item.reductionPct} pp | ${item.withinTarget ? 'Yes' : 'No'} |`).join('\n')}

Objective status: **${report.phases.phase3C.objectiveStatus}**${gap.shortfalls.length ? `\n\n${gap.shortfalls.map(item => `- ${item}`).join('\n')}` : ''}

${report.phases.phase3C.objectiveNote}

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Early Checkpoint Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
${touringRows}

## Late-Game-Ranking

${report.phases.phase3C.ranking.map((item, index) => `${index + 1}. ${item.id}`).join('\n')}${describeRanking(report.phases.phase3C.ranking)}

## Gewählter Late-Game-Hebel

\`${report.phases.phase3C.selectedCandidateId}\` was selected by the combination search. ${SELECTION_RATIONALE} ${report.combinationSearch.pairsEvaluated} of ${report.combinationSearch.pairsAvailable} pairs were evaluated, ${report.combinationSearch.pairsSkipped} skipped.

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
${combinedRows}

Final gate: **${report.finalCombinedValidation.passed ? 'PASS' : 'FAIL'}**. Bootstrap Struggle bankruptcy must remain <= 60%.

## Nebenwirkungen

Fame per gig, harmony, bankruptcy, drawdown, and the early/mid progression checkpoints (days ${SIMULATION_CONSTANTS.progressionCheckpointDays[0]} and ${SIMULATION_CONSTANTS.progressionCheckpointDays[1]}) are explicit acceptance checks.

## Verworfene Kandidaten

Every unselected candidate carries a machine-readable rejection reason in the JSON artifact.

## Produktionsänderungen

Only the selected bootstrap and touring defaults are intended for production.

Recommendation: **${report.recommendation.status}**

## Fazit

Selection is based on paired deltas, distributions, deterministic bootstrap intervals, transition matrices, and explicit side-effect limits.

| Ergebnis | Status |
|---|---|
| Phase 3B (Bootstrap-Insolvenz) | ${report.finalCombinedValidation.resultsByScenario.bootstrap_struggle?.scenarioValidation.passed ? 'bestanden' : 'fehlgeschlagen'} |
| Finale Sicherheits-Gates | ${report.finalCombinedValidation.passed ? 'bestanden' : 'fehlgeschlagen'} |
| Late-Game-Snowball | ${gap.improved ? 'verbessert' : 'nicht verbessert'} |
| Gap-1-Dominanz im Zielband | ${gap.objectiveMet ? 'erreicht' : 'nicht gelöst'} |
| Phase 3C Gesamtstatus | ${report.phases.phase3C.objectiveStatus} |
| Produktionskandidat | ${report.recommendation.status} |
`
}

export const runExperimentSuite = async ({ runsPerScenario = SIMULATION_CONSTANTS.runsPerScenario, writeReports = true } = {}) => {
  logger.setLevel(LOG_LEVELS.ERROR)
  const started = Date.now()
  let totalRuns = 0
  const runner = (...args) => {
    totalRuns++
    return runSingleSimulation(...args)
  }
  const bootstrapDefinitions = BALANCE_EXPERIMENTS.filter(item => item.phase === 'bootstrap')
  const touringDefinitions = BALANCE_EXPERIMENTS.filter(item => item.phase === 'touring')
  const bootstrapScenario = SCENARIOS.find(item => item.id === 'bootstrap_struggle')
  const baselineScenario = SCENARIOS.find(item => item.id === 'baseline_touring')
  const runCandidates = (definitions, scenario, controlTuning) => {
    const controlRuns = Array.from({ length: runsPerScenario }, (_, runIndex) => compact(runner(scenario, createScenarioSeed(scenario.id, runIndex), controlTuning)))
    const pairedCandidates = definitions.map(definition => {
      const candidateTuning = resolveBalanceTuning({
        earlyGame: { ...controlTuning.earlyGame, ...definition.overrides.earlyGame },
        touring: { ...controlTuning.touring, ...definition.overrides.touring }
      }, controlTuning)
      const pairs = pairSimulationRuns({ scenario, runsPerScenario, controlTuning, candidateTuning, controlRuns, runner })
      return { definition, pairs }
    })
    assertEqualControlCohorts(pairedCandidates.map(candidate => candidate.pairs))
    return pairedCandidates.map(({ definition, pairs }) => evaluateCandidate(definition, pairs, summarizePairedRuns(pairs, definition.id, scenario.id)))
  }
  // Every combination pairs against the same control: same scenarios, same
  // seeds, same ORIGINAL_CONTROL tuning. Since a run is a pure function of
  // (scenario, seed, tuning), re-simulating it per combination burns roughly
  // half the suite's runtime reproducing identical cohorts.
  const controlCohortByScenario = new Map()
  const controlCohortFor = scenario => {
    if (!controlCohortByScenario.has(scenario.id)) {
      controlCohortByScenario.set(scenario.id, Array.from({ length: runsPerScenario },
        (_, runIndex) => compact(runner(scenario, createScenarioSeed(scenario.id, runIndex), ORIGINAL_CONTROL_BALANCE_TUNING))))
    }
    return controlCohortByScenario.get(scenario.id)
  }

  const evaluateCombination = (bootstrap, touring) => {
    const tuning = resolveBalanceTuning({ earlyGame: bootstrap.overrides.earlyGame, touring: touring.overrides.touring }, ORIGINAL_CONTROL_BALANCE_TUNING)
    const results = SCENARIOS.map(scenario => {
      const pairs = pairSimulationRuns({ scenario, runsPerScenario, controlTuning: ORIGINAL_CONTROL_BALANCE_TUNING, candidateTuning: tuning, controlRuns: controlCohortFor(scenario), runner })
      const summary = summarizePairedRuns(pairs, `${bootstrap.id}+${touring.id}`, scenario.id)
      const statuses = kpiStatusForRuns(pairs)
      const controlFamePerGig = calculateAverageFameEarnedPerGig(pairs.map(pair => pair.control))
      const candidateFamePerGig = calculateAverageFameEarnedPerGig(pairs.map(pair => pair.candidate))
      return { scenarioId: scenario.id, ...summary, controlKpiStatus: statuses.control, candidateKpiStatus: statuses.candidate, famePerGigDeltaPct: percentageDelta(controlFamePerGig, candidateFamePerGig) }
    })
    return { bootstrap, touring, tuning, validation: evaluateFinalCombinedValidation(results) }
  }

  const bootstrapCandidates = runCandidates(bootstrapDefinitions, bootstrapScenario, ORIGINAL_CONTROL_BALANCE_TUNING)
  const bootstrapRanking = rankCandidates(bootstrapCandidates)
  const acceptedBootstrap = bootstrapRanking.filter(item => item.acceptanceCriteria.passed)
  if (!acceptedBootstrap.length) throw new NoViableCandidateError('No Phase 3B candidate satisfies acceptance criteria')

  // Selection takes the least-impact fully validated combination, and
  // `combinationImpact` reads only the candidate overrides — no simulation. So
  // order the pairs by impact up front and stop at the first that validates:
  // the winner is identical to evaluating all of them, at a fraction of the
  // cost. Evaluating the whole Cartesian product meant ~1560 runs per
  // combination for results that could never change the outcome.
  const combinations = []
  const touringByBootstrap = new Map()
  const screenTouringFor = bootstrap => {
    if (!touringByBootstrap.has(bootstrap.id)) {
      const intermediateTuning = resolveBalanceTuning(bootstrap.overrides, ORIGINAL_CONTROL_BALANCE_TUNING)
      touringByBootstrap.set(bootstrap.id, runCandidates(touringDefinitions, baselineScenario, intermediateTuning))
    }
    return touringByBootstrap.get(bootstrap.id)
  }
  const orderedPairs = acceptedBootstrap
    .flatMap(bootstrap => touringDefinitions.map(touring => ({ bootstrap, touring })))
    .sort((left, right) =>
      combinationImpact(left) - combinationImpact(right) ||
      left.bootstrap.id.localeCompare(right.bootstrap.id) || left.touring.id.localeCompare(right.touring.id)
    )

  let selected = null
  let pairsConsidered = 0
  for (const pair of orderedPairs) {
    const touring = screenTouringFor(pair.bootstrap).find(item => item.id === pair.touring.id)
    if (!touring?.acceptanceCriteria.passed) continue
    pairsConsidered++
    const combination = evaluateCombination(pair.bootstrap, touring)
    combinations.push(combination)
    if (combination.validation.passed) {
      selected = combination
      break
    }
  }
  if (!selected) throw new NoViableCandidateError('No combined Phase 3 candidate satisfies final validation')
  const combinationsSkipped = orderedPairs.length - pairsConsidered
  const selectedBootstrap = selected.bootstrap
  const selectedTouring = selected.touring
  selectedBootstrap.selectedForProduction = true
  selectedTouring.selectedForProduction = true



  // Search stops at the first validated combination, so an unselected candidate
  // was either evaluated and failed, or never reached. Say which.
  const describeRejection = (item, side) => {
    const evaluated = combinations.filter(c => c[side].id === item.id)
    if (!evaluated.length) {
      return 'Not evaluated: a lower-impact combination already passed final combined validation.'
    }
    return evaluated.some(c => c.validation.passed)
      ? 'A lower-impact fully validated combination ranked higher.'
      : `Did not pass final combined validation (${[...new Set(evaluated.flatMap(c => c.validation.failures))].join(', ')}).`
  }

  for (const item of bootstrapCandidates) {
    if (!item.selectedForProduction && !item.rejectionReason) {
      item.rejectionReason = describeRejection(item, 'bootstrap')
    }
  }

  // The selected bootstrap always came through screenTouringFor, so its entry
  // exists. Assert rather than silently substituting another candidate's
  // screening results, which would misreport the touring table.
  const touringCandidates = touringByBootstrap.get(selectedBootstrap.id)
  if (!touringCandidates) {
    throw new Error(`No touring screening recorded for selected bootstrap ${selectedBootstrap.id}`)
  }

  for (const item of touringCandidates) {
    if (!item.selectedForProduction && !item.rejectionReason) {
      item.rejectionReason = describeRejection(item, 'touring')
    }
  }


  const intermediateTuning = resolveBalanceTuning(selectedBootstrap.overrides, ORIGINAL_CONTROL_BALANCE_TUNING)
  const finalTuning = selected.tuning
  const finalCombinedValidation = selected.validation
  const lowResource = { ...baselineScenario, id: 'low_resource_touring', initialOverrides: { ...baselineScenario.initialOverrides, player: { money: 250, fame: 0 } } }
  const gapProfiles = tuning => [baselineScenario, lowResource].map(profile => ({ profile: profile.id, runsPerScenario, seedStrategy: 'scenario-id-plus-run-index', results: buildGapAnalysis(profile, tuning, runsPerScenario, runner) }))
  const controlGapProfiles = gapProfiles(intermediateTuning)
  const finalGapProfiles = gapProfiles(finalTuning)
  const gapTradeoff = { gap1VsGap2: { control: buildGapTradeoff(controlGapProfiles), finalTuning: buildGapTradeoff(finalGapProfiles) } }
  const gigFrequencyValidation = evaluateGigGap(gapTradeoff.gap1VsGap2.control, gapTradeoff.gap1VsGap2.finalTuning)
  const objectiveStatus = gigFrequencyValidation.objectiveMet ? 'met' : 'partial'
  const objectiveNote = gigFrequencyValidation.objectiveMet
    ? `Gap-1 money-per-day dominance was brought inside the ${GIG_GAP_TARGET_RANGE_PCT[0]}-${GIG_GAP_TARGET_RANGE_PCT[1]}% target band for both profiles.`
    : gigFrequencyValidation.improved
      ? `Late-game compounding was reduced (${gigFrequencyValidation.shortfalls.join('; ')}), but structural Gap-1 dominance remains unresolved.`
      : `Gap-1 dominance is unchanged (${gigFrequencyValidation.shortfalls.join('; ')}). The selected combination applies no late-game dampener, so the remaining advantage reflects simply playing more gig nodes rather than a compounding effect a lever could remove.`
  const sourceBaseCommit = git('git rev-parse HEAD')
  const report = {
    experimentReportVersion: 1,
    generatedAt: new Date().toISOString(),
    metadata: {
      nodeVersion: process.version, sourceBaseCommit,
      workingTreeDirty: Boolean(git('git status --porcelain')),
      simulationScriptSha256: await hashFile(path.join(ROOT, 'scripts/game-balance-simulation.mjs')),
      balanceSourceSha256: await getBalanceSourceHash(ROOT),
      experimentScriptSha256: await hashFile(fileURLToPath(import.meta.url)),
      experimentConfigSha256: hashExperimentConfig(BALANCE_EXPERIMENTS),
      // Same helper the simulation report uses, so the two artifacts can be
      // compared hash-for-hash. Hashing the array directly here produced a
      // different digest for identical scenario data.
      scenarioConfigSha256: getJsonHash(SCENARIOS),
      kpiConfigSha256: getJsonHash(KPI_TARGETS),
      seedStrategy: 'scenario-id-plus-run-index', pairingStrategy: 'same-scenario-same-run-index-same-seed'
    },
    controlSnapshot: { tuning: ORIGINAL_CONTROL_BALANCE_TUNING, runsPerScenario },
    phases: {
      phase3B: { hypothesis: 'Temporary early liquidity relief reduces bootstrap insolvency without accelerating Fame.', candidates: bootstrapCandidates, ranking: bootstrapRanking.map(item => ({ id: item.id, ...item.rankingComponents, passed: item.acceptanceCriteria.passed })), selectedCandidateId: selectedBootstrap.id },
      phase3C: { hypothesis: 'Expiring regional demand saturation reduces Gap-1 gig-frequency dominance without penalising paced touring.', gigFrequencyAnalysis: { control: controlGapProfiles, finalTuning: finalGapProfiles }, gapTradeoff, gigFrequencyValidation, candidates: touringCandidates, ranking: rankCandidates(touringCandidates).map(item => ({ id: item.id, ...item.rankingComponents, passed: item.acceptanceCriteria.passed })), selectedCandidateId: selectedTouring.id, objectiveStatus, objectiveNote }
    },
    finalCombinedValidation,
    combinationSearch: {
      strategy: 'ascending-impact-first-validated',
      pairsAvailable: orderedPairs.length,
      pairsEvaluated: pairsConsidered,
      pairsSkipped: combinationsSkipped,
      note: SELECTION_RATIONALE
    },
    combinationRanking: [...combinations].sort((left, right) =>
      Number(right.validation.passed) - Number(left.validation.passed) || combinationImpact(left) - combinationImpact(right)
    ).map(item => ({ bootstrap: item.bootstrap.id, touring: item.touring.id, impact: round(combinationImpact(item)), passed: item.validation.passed, failures: item.validation.failures })),
    recommendation: {
      // Release readiness is decided by the safety gates alone. The Phase 3C
      // objective only distinguishes a full from a partial acceptance, so the
      // status, the objective status and the process exit code always agree.
      status: finalCombinedValidation.passed
        ? gigFrequencyValidation.objectiveMet ? 'accepted-for-production' : 'accepted-for-production-partial'
        : 'rejected',
      objectiveStatus,
      objectiveNote,
      bootstrap: selectedBootstrap.id,
      touring: selectedTouring.id,
      tuning: finalTuning
    },
    runtime: { durationMs: Date.now() - started, candidates: BALANCE_EXPERIMENTS.length, totalRuns }
  }
  if (writeReports && finalCombinedValidation.passed) {
    await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true })
    await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`)
    await fs.writeFile(OUTPUT_MARKDOWN, renderExperimentMarkdown(report))
  }
  return report
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  // The suite throws when no candidate clears Phase 3B or no combination clears
  // final validation. That is a legitimate experiment outcome, not a crash, so
  // report it as a failed run instead of an unhandled rejection stack.
  let report
  try {
    report = await runExperimentSuite()
  } catch (error) {
    // Only an empty candidate set is a legitimate outcome. Anything else is a
    // fault and must keep its stack, otherwise a misconfigured horizon or a
    // simulation regression reads in CI as "the experiment found nothing".
    if (error instanceof NoViableCandidateError) {
      console.error(`[balance-experiments] no production candidate: ${error.message}`)
      process.exit(1)
    }
    throw error
  }
  console.log(`[balance-experiments] ${report.runtime.candidates} candidates / ${report.runtime.totalRuns} runs / ${report.runtime.durationMs} ms`)
  console.log(`[balance-experiments] recommendation: ${report.recommendation.status} (Phase 3C objective: ${report.recommendation.objectiveStatus})`)
  if (report.recommendation.objectiveStatus !== 'met') {
    console.warn(`[balance-experiments] ${report.recommendation.objectiveNote}`)
  }
  process.exit(report.finalCombinedValidation.passed ? 0 : 1)
}
