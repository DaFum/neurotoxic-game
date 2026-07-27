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
  moneyAtDay20: run.moneyAtDay20,
  moneyAtDay40: run.moneyAtDay40,
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

const combinationImpact = ({ bootstrap, touring }) => {
  const early = bootstrap.overrides.earlyGame ?? {}
  const late = touring.overrides.touring ?? {}
  const relief = (early.durationDays ?? 0) * (1 - (early.dailyObligationMultiplier ?? 1))
  const saturation = (late.repeatGigWindowDays ?? 0) * (late.repeatDemandPenaltyPerGig ?? 0) *
    (late.maxRepeatDemandPenalty ?? 0) / Math.max(1, late.repeatDemandStartDay ?? 0)
  return relief + saturation
}

export const evaluateCandidate = (definition, pairs, summary) => {
  const controlFamePerGig = pairs.reduce((sum, pair) => sum + pair.control.fameEarned / Math.max(1, pair.control.gigsPlayed), 0) / pairs.length
  const candidateFamePerGig = pairs.reduce((sum, pair) => sum + pair.candidate.fameEarned / Math.max(1, pair.candidate.gigsPlayed), 0) / pairs.length
  const famePerGigDeltaPct = percentageDelta(controlFamePerGig, candidateFamePerGig)
  const candidateSolventMoney = pairs.filter(pair => !pair.candidate.bankrupt).map(pair => pair.candidate.finalMoney)
  const medianFinalMoneyDeltaPct = percentageDelta(summary.continuous.finalMoney.control.median, summary.continuous.finalMoney.candidate.median)
  const p90FinalMoneyDeltaPct = percentageDelta(summary.continuous.finalMoney.control.p90, summary.continuous.finalMoney.candidate.p90)
  const day20DeltaPct = pairedCheckpointDelta(pairs, 'moneyAtDay20')
  const day40DeltaPct = pairedCheckpointDelta(pairs, 'moneyAtDay40')
  const criteria = definition.acceptanceCriteria
  const checks = definition.phase === 'bootstrap'
    ? {
        bankruptcy: summary.bankruptcy.candidateRatePct <= criteria.bankruptcyRateMaxPct,
        survival: summary.continuous.daysSurvived.pairedDelta.median >= criteria.medianSurvivalMinimumDeltaDays || percentageDelta(summary.continuous.daysSurvived.control.median, summary.continuous.daysSurvived.candidate.median) >= criteria.medianSurvivalMinimumDeltaPct,
        solventMedianMoney: median(candidateSolventMoney) <= criteria.solventMedianMoneyMax,
        solventP90Money: percentile(candidateSolventMoney, 0.9) <= criteria.solventP90MoneyMax,
        famePerGig: Math.abs(famePerGigDeltaPct) <= criteria.famePerGigMaximumAbsDeltaPct
      }
    : {
        medianFinalMoney: medianFinalMoneyDeltaPct >= criteria.medianFinalMoneyDeltaPct[0] && medianFinalMoneyDeltaPct <= criteria.medianFinalMoneyDeltaPct[1],
        p90FinalMoney: p90FinalMoneyDeltaPct >= criteria.p90FinalMoneyDeltaPct[0] && p90FinalMoneyDeltaPct <= criteria.p90FinalMoneyDeltaPct[1],
        day20: day20DeltaPct == null ? null : day20DeltaPct >= criteria.day20MinimumDeltaPct,
        day40: day40DeltaPct == null ? null : day40DeltaPct >= criteria.day40MinimumDeltaPct,
        bankruptcy: summary.bankruptcy.candidateRatePct <= criteria.candidateBankruptcyRateMaxPct && summary.bankruptcy.deltaRatePct <= criteria.bankruptcyMaximumDeltaPct,
        famePerGig: Math.abs(famePerGigDeltaPct) <= criteria.famePerGigMaximumAbsDeltaPct,
        harmony: summary.continuous.finalHarmony.pairedDelta.median >= criteria.harmonyMinimumDelta
      }
  const passed = Object.values(checks).every(value => value === true)
  const targetFit = definition.phase === 'bootstrap'
    ? Math.max(0, 100 - Math.abs(50 - summary.bankruptcy.candidateRatePct) * 3)
    : Math.max(0, 100 - Math.abs(-17.5 - medianFinalMoneyDeltaPct) * 4)
  const overcorrectionPenalty = definition.phase === 'bootstrap' && summary.bankruptcy.candidateRatePct < 30 ? 50 : 0
  const sideEffectPenalty = Math.abs(famePerGigDeltaPct) + Math.max(0, -summary.continuous.finalHarmony.pairedDelta.median)
  const complexityPenalty = definition.id.includes('staged') || definition.id.includes('recovery') ? 2 : 1
  return {
    ...definition,
    resultsByScenario: { [pairs[0]?.scenarioId ?? definition.scenarios[0]]: summary },
    aggregateResults: {
      ...summary,
      solventMedianMoney: round(median(candidateSolventMoney)), solventP90Money: round(percentile(candidateSolventMoney, 0.9)),
      famePerGigDeltaPct, medianFinalMoneyDeltaPct, p90FinalMoneyDeltaPct, day20DeltaPct, day40DeltaPct
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
    fameEarnedPerGig: round(average('fameEarned') / Math.max(1, average('gigsPlayed'))), gigsPlayed: round(average('gigsPlayed')), finalHarmony: round(average('finalHarmony')),
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

const hashFile = async file => crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex')
const git = command => { try { return execSync(command, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return null } }

const markdown = report => {
  const bootstrapRows = report.phases.phase3B.candidates.map(item => `| ${item.id} | ${item.aggregateResults.bankruptcy.controlRatePct}% | ${item.aggregateResults.bankruptcy.candidateRatePct}% | ${item.aggregateResults.bankruptcy.deltaRatePct} pp | ${item.aggregateResults.continuous.daysSurvived.pairedDelta.median} | €${item.aggregateResults.solventMedianMoney} | ${item.aggregateResults.famePerGigDeltaPct}% | ${item.acceptanceCriteria.passed ? 'Pass' : 'Fail'} |`).join('\n')
  const gapRows = Object.entries(report.phases.phase3C.gigFrequencyAnalysis).flatMap(([tuning, profiles]) => profiles.flatMap(profile => profile.results.map(item => `| ${tuning} | ${profile.profile} | ${item.gigGapDays} | ${item.gigsPlayed} | ${item.moneyPerDay} | ${item.gigNetPerDay} | ${item.fameEarnedPerDay} | ${item.fameEarnedPerGig} | ${item.finalHarmony} | ${item.repairs} | ${item.refuels} | ${item.maxDrawdownPct}% | ${item.bankruptcyRatePct}% | ${item.daysSurvived} |`))).join('\n')
  const touringRows = report.phases.phase3C.candidates.map(item => `| ${item.id} | ${item.aggregateResults.medianFinalMoneyDeltaPct}% | ${item.aggregateResults.p90FinalMoneyDeltaPct}% | ${item.aggregateResults.day20DeltaPct}% | ${item.aggregateResults.bankruptcy.deltaRatePct} pp | ${item.aggregateResults.continuous.finalHarmony.pairedDelta.median} | ${item.acceptanceCriteria.passed ? 'Pass' : 'Fail'} |`).join('\n')
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

${report.phases.phase3B.ranking.map((item, index) => `${index + 1}. ${item.id}`).join('\n')}

## Gewählter Bootstrap-Hebel

\`${report.phases.phase3B.selectedCandidateId}\` showed the best accepted paired outcome.

## Phase 3C – Gig-Frequenz
## Gig-Gap-Analyse

| Tuning | Profile | Gig Gap | Gigs | Money/Day | Gig Net/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Refuels | Drawdown | Bankruptcy | Days Survived |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
${gapRows}

Gap 1 vs Gap 2 advantage before: ${JSON.stringify(report.phases.phase3C.gapTradeoff.gap1VsGap2.control)}

Gap 1 vs Gap 2 advantage after: ${JSON.stringify(report.phases.phase3C.gapTradeoff.gap1VsGap2.finalTuning)}

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Day 20 Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
${touringRows}

## Late-Game-Ranking

${report.phases.phase3C.ranking.map((item, index) => `${index + 1}. ${item.id}`).join('\n')}

## Gewählter Late-Game-Hebel

\`${report.phases.phase3C.selectedCandidateId}\` had the best snowball-reduction versus side-effect trade-off.

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
${combinedRows}

Final gate: **${report.finalCombinedValidation.passed ? 'PASS' : 'FAIL'}**. Bootstrap Struggle bankruptcy must remain <= 60%.

## Nebenwirkungen

Fame per gig, harmony, bankruptcy, drawdown, and day-20/day-40 money are explicit acceptance checks.

## Verworfene Kandidaten

Every unselected candidate carries a machine-readable rejection reason in the JSON artifact.

## Produktionsänderungen

Only the selected bootstrap and touring defaults are intended for production.

## Fazit

Selection is based on paired deltas, distributions, deterministic bootstrap intervals, transition matrices, and explicit side-effect limits.
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
  const evaluateCombination = (bootstrap, touring) => {
    const tuning = resolveBalanceTuning({ earlyGame: bootstrap.overrides.earlyGame, touring: touring.overrides.touring }, ORIGINAL_CONTROL_BALANCE_TUNING)
    const results = SCENARIOS.map(scenario => {
      const pairs = pairSimulationRuns({ scenario, runsPerScenario, controlTuning: ORIGINAL_CONTROL_BALANCE_TUNING, candidateTuning: tuning, runner })
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
  if (!acceptedBootstrap.length) throw new Error('No Phase 3B candidate satisfies acceptance criteria')

  const combinations = []
  const touringByBootstrap = new Map()
  for (const bootstrap of acceptedBootstrap) {
    const intermediateTuning = resolveBalanceTuning(bootstrap.overrides, ORIGINAL_CONTROL_BALANCE_TUNING)
    const candidates = runCandidates(touringDefinitions, baselineScenario, intermediateTuning)
    touringByBootstrap.set(bootstrap.id, candidates)
    for (const touring of rankCandidates(candidates).filter(item => item.acceptanceCriteria.passed)) {
      combinations.push(evaluateCombination(bootstrap, touring))
    }
  }
  const acceptedCombinations = combinations.filter(item => item.validation.passed).sort((left, right) =>
    combinationImpact(left) - combinationImpact(right) ||
    left.bootstrap.id.localeCompare(right.bootstrap.id) || left.touring.id.localeCompare(right.touring.id)
  )
  const selected = acceptedCombinations[0] ?? null
  if (!selected) throw new Error('No combined Phase 3 candidate satisfies final validation')
  const selectedBootstrap = selected.bootstrap
  const selectedTouring = selected.touring
  selectedBootstrap.selectedForProduction = true
  selectedTouring.selectedForProduction = true
  for (const item of bootstrapCandidates) if (!item.selectedForProduction && !item.rejectionReason) item.rejectionReason = 'A lower-impact fully validated combination ranked higher.'
  const touringCandidates = touringByBootstrap.get(selectedBootstrap.id)
  for (const item of touringCandidates) if (!item.selectedForProduction && !item.rejectionReason) item.rejectionReason = 'A lower-impact fully validated combination ranked higher.'

  const intermediateTuning = resolveBalanceTuning(selectedBootstrap.overrides, ORIGINAL_CONTROL_BALANCE_TUNING)
  const finalTuning = selected.tuning
  const finalCombinedValidation = selected.validation
  const lowResource = { ...baselineScenario, id: 'low_resource_touring', initialOverrides: { ...baselineScenario.initialOverrides, player: { money: 250, fame: 0 } } }
  const gapProfiles = tuning => [baselineScenario, lowResource].map(profile => ({ profile: profile.id, runsPerScenario, seedStrategy: 'scenario-id-plus-run-index', results: buildGapAnalysis(profile, tuning, runsPerScenario, runner) }))
  const controlGapProfiles = gapProfiles(intermediateTuning)
  const finalGapProfiles = gapProfiles(finalTuning)
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
      scenarioConfigSha256: crypto.createHash('sha256').update(JSON.stringify(SCENARIOS)).digest('hex'),
      kpiConfigSha256: getJsonHash(KPI_TARGETS),
      seedStrategy: 'scenario-id-plus-run-index', pairingStrategy: 'same-scenario-same-run-index-same-seed'
    },
    controlSnapshot: { tuning: ORIGINAL_CONTROL_BALANCE_TUNING, runsPerScenario },
    phases: {
      phase3B: { hypothesis: 'Temporary early liquidity relief reduces bootstrap insolvency without accelerating Fame.', candidates: bootstrapCandidates, ranking: bootstrapRanking.map(item => ({ id: item.id, ...item.rankingComponents, passed: item.acceptanceCriteria.passed })), selectedCandidateId: selectedBootstrap.id },
      phase3C: { hypothesis: 'A bounded dense-tour trade-off reduces late compounding while preserving early viability.', gigFrequencyAnalysis: { control: controlGapProfiles, finalTuning: finalGapProfiles }, gapTradeoff: { gap1VsGap2: { control: buildGapTradeoff(controlGapProfiles), finalTuning: buildGapTradeoff(finalGapProfiles) } }, candidates: touringCandidates, ranking: rankCandidates(touringCandidates).map(item => ({ id: item.id, ...item.rankingComponents, passed: item.acceptanceCriteria.passed })), selectedCandidateId: selectedTouring.id }
    },
    finalCombinedValidation,
    combinationRanking: [...combinations].sort((left, right) =>
      Number(right.validation.passed) - Number(left.validation.passed) || combinationImpact(left) - combinationImpact(right)
    ).map(item => ({ bootstrap: item.bootstrap.id, touring: item.touring.id, impact: round(combinationImpact(item)), passed: item.validation.passed, failures: item.validation.failures })),
    recommendation: { status: 'accepted-for-production', bootstrap: selectedBootstrap.id, touring: selectedTouring.id, tuning: finalTuning },
    runtime: { durationMs: Date.now() - started, candidates: BALANCE_EXPERIMENTS.length, totalRuns }
  }
  if (writeReports && finalCombinedValidation.passed) {
    await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true })
    await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`)
    await fs.writeFile(OUTPUT_MARKDOWN, markdown(report))
  }
  return report
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const report = await runExperimentSuite()
  console.log(`[balance-experiments] ${report.runtime.candidates} candidates / ${report.runtime.totalRuns} runs / ${report.runtime.durationMs} ms`)
  process.exit(report.finalCombinedValidation.passed === true ? 0 : 1)
}
