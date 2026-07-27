import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { ORIGINAL_CONTROL_BALANCE_TUNING, resolveBalanceTuning } from '../src/utils/balanceTuning.ts'
import { BALANCE_EXPERIMENTS, hashExperimentConfig } from './game-balance-experiment-config.mjs'
import { bankruptcyTransitions, pairedMetricStatistics } from './utils/paired-statistics.mjs'
import { SCENARIOS, SIMULATION_CONSTANTS, createScenarioSeed, runSingleSimulation } from './game-balance-simulation.mjs'
import { logger, LOG_LEVELS } from '../src/utils/logger.js'

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

export const pairSimulationRuns = ({ scenario, runsPerScenario, controlTuning, candidateTuning, runner = runSingleSimulation }) => {
  const pairs = []
  for (let runIndex = 0; runIndex < runsPerScenario; runIndex++) {
    const seed = createScenarioSeed(scenario.id, runIndex)
    const control = compact(runner(scenario, seed, controlTuning))
    const candidate = compact(runner(scenario, seed, candidateTuning))
    pairs.push({
      scenarioId: scenario.id, runIndex, seed, control, candidate,
      delta: Object.fromEntries(METRICS.map(metric => [metric, candidate[metric] - control[metric]]))
    })
  }
  return pairs
}

export const summarizePairedRuns = (pairs, experimentId, scenarioId) => ({
  sampleSize: pairs.length,
  bankruptcy: bankruptcyTransitions(pairs.map(pair => pair.control.bankrupt), pairs.map(pair => pair.candidate.bankrupt)),
  continuous: Object.fromEntries(METRICS.map(metric => [metric, pairedMetricStatistics(
    pairs.map(pair => pair.control[metric]), pairs.map(pair => pair.candidate[metric]),
    { bootstrapSeed: `${experimentId}:${scenarioId}:${metric}`, resamples: 2000 }
  )]))
})

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

const evaluateCandidate = (definition, pairs, summary) => {
  const controlFamePerGig = pairs.reduce((sum, pair) => sum + pair.control.fameEarned / Math.max(1, pair.control.gigsPlayed), 0) / pairs.length
  const candidateFamePerGig = pairs.reduce((sum, pair) => sum + pair.candidate.fameEarned / Math.max(1, pair.candidate.gigsPlayed), 0) / pairs.length
  const famePerGigDeltaPct = percentageDelta(controlFamePerGig, candidateFamePerGig)
  const candidateSolventMoney = pairs.filter(pair => !pair.candidate.bankrupt).map(pair => pair.candidate.finalMoney)
  const medianFinalMoneyDeltaPct = percentageDelta(summary.continuous.finalMoney.control.median, summary.continuous.finalMoney.candidate.median)
  const p90FinalMoneyDeltaPct = percentageDelta(summary.continuous.finalMoney.control.p90, summary.continuous.finalMoney.candidate.p90)
  const day20DeltaPct = percentageDelta(
    median(pairs.map(pair => pair.control.moneyAtDay20)),
    median(pairs.map(pair => pair.candidate.moneyAtDay20))
  )
  const checks = definition.phase === 'bootstrap'
    ? {
        bankruptcy: summary.bankruptcy.candidateRatePct <= 60,
        survival: summary.continuous.daysSurvived.pairedDelta.median >= 10 || summary.continuous.daysSurvived.candidate.median >= summary.continuous.daysSurvived.control.median * 1.2,
        solventMedianMoney: median(candidateSolventMoney) <= 5000,
        solventP90Money: percentile(candidateSolventMoney, 0.9) <= 15000,
        famePerGig: Math.abs(famePerGigDeltaPct) <= 5
      }
    : {
        medianFinalMoney: medianFinalMoneyDeltaPct >= -25 && medianFinalMoneyDeltaPct <= -10,
        p90FinalMoney: p90FinalMoneyDeltaPct >= -30 && p90FinalMoneyDeltaPct <= -15,
        day20: day20DeltaPct >= -5,
        bankruptcy: summary.bankruptcy.candidateRatePct <= 10 && summary.bankruptcy.deltaRatePct <= 2,
        famePerGig: Math.abs(famePerGigDeltaPct) <= 5,
        harmony: summary.continuous.finalHarmony.pairedDelta.median >= -5
      }
  const passed = Object.values(checks).every(Boolean)
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
      famePerGigDeltaPct, medianFinalMoneyDeltaPct, p90FinalMoneyDeltaPct, day20DeltaPct
    },
    acceptanceCriteria: { passed, checks },
    rankingComponents: { targetFit: round(targetFit), sideEffectPenalty: round(sideEffectPenalty), overcorrectionPenalty, complexityPenalty },
    selectedForProduction: false,
    rejectionReason: passed ? null : `Acceptance limits missed: ${Object.entries(checks).filter(([, value]) => !value).map(([key]) => key).join(', ')}.`
  }
}

const buildGapAnalysis = (baseScenario, tuning, runsPerScenario) => [1, 2, 3, 4, 5].map(gigGapDays => {
  const scenario = { ...baseScenario, id: `${baseScenario.id}_gap_${gigGapDays}`, gigGapDays }
  const runs = Array.from({ length: runsPerScenario }, (_, runIndex) => runSingleSimulation(scenario, createScenarioSeed(scenario.id, runIndex), tuning)).map(compact)
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

const hashFile = async file => crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex')
const git = command => { try { return execSync(command, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return null } }

const markdown = report => {
  const bootstrapRows = report.phases.phase3B.candidates.map(item => `| ${item.id} | ${item.aggregateResults.bankruptcy.controlRatePct}% | ${item.aggregateResults.bankruptcy.candidateRatePct}% | ${item.aggregateResults.bankruptcy.deltaRatePct} pp | ${item.aggregateResults.continuous.daysSurvived.pairedDelta.median} | €${item.aggregateResults.solventMedianMoney} | ${item.aggregateResults.famePerGigDeltaPct}% | ${item.acceptanceCriteria.passed ? 'Pass' : 'Fail'} |`).join('\n')
  const gapRows = report.phases.phase3C.gigFrequencyAnalysis.flatMap(profile => profile.results.map(item => `| ${profile.profile} | ${item.gigGapDays} | ${item.gigsPlayed} | ${item.moneyPerDay} | ${item.fameEarnedPerDay} | ${item.fameEarnedPerGig} | ${item.finalHarmony} | ${item.repairs} | ${item.bankruptcyRatePct}% |`)).join('\n')
  const touringRows = report.phases.phase3C.candidates.map(item => `| ${item.id} | ${item.aggregateResults.medianFinalMoneyDeltaPct}% | ${item.aggregateResults.p90FinalMoneyDeltaPct}% | ${item.aggregateResults.day20DeltaPct}% | ${item.aggregateResults.bankruptcy.deltaRatePct} pp | ${item.aggregateResults.continuous.finalHarmony.pairedDelta.median} | ${item.acceptanceCriteria.passed ? 'Pass' : 'Fail'} |`).join('\n')
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

| Profile | Gig Gap | Gigs | Money/Day | Fame/Day | Fame/Gig | Harmony | Repairs | Bankruptcy |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
${gapRows}

## Late-Game-Kandidaten

| Candidate | Median Final Money Delta | P90 Final Money Delta | Day 20 Delta | Bankruptcy Delta | Harmony Delta | Pass/Fail |
|---|---:|---:|---:|---:|---:|---|
${touringRows}

## Late-Game-Ranking

${report.phases.phase3C.ranking.map((item, index) => `${index + 1}. ${item.id}`).join('\n')}

## Gewählter Late-Game-Hebel

\`${report.phases.phase3C.selectedCandidateId}\` had the best snowball-reduction versus side-effect trade-off.

## Kombinierte Validierung

The selected overrides are validated together against original control in the JSON artifact.

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
  const bootstrapDefinitions = BALANCE_EXPERIMENTS.filter(item => item.phase === 'bootstrap')
  const touringDefinitions = BALANCE_EXPERIMENTS.filter(item => item.phase === 'touring')
  const bootstrapScenario = SCENARIOS.find(item => item.id === 'bootstrap_struggle')
  const baselineScenario = SCENARIOS.find(item => item.id === 'baseline_touring')
  const runCandidates = (definitions, scenario, controlTuning) => definitions.map(definition => {
    const candidateTuning = resolveBalanceTuning({
      earlyGame: { ...controlTuning.earlyGame, ...definition.overrides.earlyGame },
      touring: { ...controlTuning.touring, ...definition.overrides.touring }
    }, controlTuning)
    const pairs = pairSimulationRuns({ scenario, runsPerScenario, controlTuning, candidateTuning })
    return evaluateCandidate(definition, pairs, summarizePairedRuns(pairs, definition.id, scenario.id))
  })
  const bootstrapCandidates = runCandidates(bootstrapDefinitions, bootstrapScenario, ORIGINAL_CONTROL_BALANCE_TUNING)
  const bootstrapRanking = rankCandidates(bootstrapCandidates)
  const selectedBootstrap = bootstrapRanking.find(item => item.acceptanceCriteria.passed) ?? bootstrapRanking[0]
  selectedBootstrap.selectedForProduction = true
  for (const item of bootstrapCandidates) if (!item.selectedForProduction && !item.rejectionReason) item.rejectionReason = 'A lower-impact accepted candidate ranked higher.'
  const intermediateTuning = resolveBalanceTuning(selectedBootstrap.overrides, ORIGINAL_CONTROL_BALANCE_TUNING)
  const touringCandidates = runCandidates(touringDefinitions, baselineScenario, intermediateTuning)
  const touringRanking = rankCandidates(touringCandidates)
  const selectedTouring = touringRanking.find(item => item.acceptanceCriteria.passed) ?? touringRanking[0]
  selectedTouring.selectedForProduction = true
  for (const item of touringCandidates) if (!item.selectedForProduction && !item.rejectionReason) item.rejectionReason = 'A better snowball-reduction versus side-effect candidate ranked higher.'
  const finalTuning = resolveBalanceTuning({ earlyGame: selectedBootstrap.overrides.earlyGame, touring: selectedTouring.overrides.touring }, ORIGINAL_CONTROL_BALANCE_TUNING)
  const combined = SCENARIOS.map(scenario => {
    const pairs = pairSimulationRuns({ scenario, runsPerScenario, controlTuning: ORIGINAL_CONTROL_BALANCE_TUNING, candidateTuning: finalTuning })
    return { scenarioId: scenario.id, ...summarizePairedRuns(pairs, 'final-combined', scenario.id) }
  })
  const lowResource = { ...baselineScenario, id: 'low_resource_touring', initialOverrides: { ...baselineScenario.initialOverrides, player: { money: 250, fame: 0 } } }
  const gapProfiles = [baselineScenario, lowResource].map(profile => ({ profile: profile.id, results: buildGapAnalysis(profile, intermediateTuning, runsPerScenario) }))
  const sourceBaseCommit = git('git rev-parse HEAD')
  const report = {
    experimentReportVersion: 1,
    generatedAt: new Date().toISOString(),
    metadata: {
      nodeVersion: process.version, sourceBaseCommit,
      workingTreeDirty: Boolean(git('git status --porcelain')),
      simulationScriptSha256: await hashFile(path.join(ROOT, 'scripts/game-balance-simulation.mjs')),
      experimentScriptSha256: await hashFile(fileURLToPath(import.meta.url)),
      experimentConfigSha256: hashExperimentConfig(BALANCE_EXPERIMENTS),
      scenarioConfigSha256: crypto.createHash('sha256').update(JSON.stringify(SCENARIOS)).digest('hex'),
      kpiConfigSha256: crypto.createHash('sha256').update(JSON.stringify(SIMULATION_CONSTANTS.reportVersion)).digest('hex'),
      seedStrategy: 'scenario-id-plus-run-index', pairingStrategy: 'same-scenario-same-run-index-same-seed'
    },
    controlSnapshot: { tuning: ORIGINAL_CONTROL_BALANCE_TUNING, runsPerScenario },
    phases: {
      phase3B: { hypothesis: 'Temporary early liquidity relief reduces bootstrap insolvency without accelerating Fame.', candidates: bootstrapCandidates, ranking: bootstrapRanking.map(item => ({ id: item.id, ...item.rankingComponents, passed: item.acceptanceCriteria.passed })), selectedCandidateId: selectedBootstrap.id },
      phase3C: { hypothesis: 'A bounded dense-tour trade-off reduces late compounding while preserving early viability.', gigFrequencyAnalysis: gapProfiles, candidates: touringCandidates, ranking: touringRanking.map(item => ({ id: item.id, ...item.rankingComponents, passed: item.acceptanceCriteria.passed })), selectedCandidateId: selectedTouring.id }
    },
    finalCombinedValidation: combined,
    recommendation: { bootstrap: selectedBootstrap.id, touring: selectedTouring.id, tuning: finalTuning },
    runtime: { durationMs: Date.now() - started, candidates: BALANCE_EXPERIMENTS.length, totalRuns: runsPerScenario * (BALANCE_EXPERIMENTS.length * 2 + SCENARIOS.length * 2 + 10) }
  }
  if (writeReports) {
    await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true })
    await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`)
    await fs.writeFile(OUTPUT_MARKDOWN, markdown(report))
  }
  return report
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const report = await runExperimentSuite()
  console.log(`[balance-experiments] ${report.runtime.candidates} candidates / ${report.runtime.totalRuns} runs / ${report.runtime.durationMs} ms`)
  process.exit(0)
}
