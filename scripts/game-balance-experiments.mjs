import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { BALANCE_RECOMMENDATION_HOLD, ORIGINAL_CONTROL_BALANCE_TUNING, resolveBalanceTuning } from '../src/utils/balanceTuning.ts'
import { BALANCE_EXPERIMENTS } from './game-balance-experiment-config.mjs'
import { bankruptcyTransitions, pairedMetricStatistics } from './utils/paired-statistics.mjs'
import { KPI_TARGETS, RISK_TARGETS, SCENARIOS, SHIPPED_GIG_CADENCE_POLICY, SIMULATION_CONSTANTS, buildDescriptiveCohortComparison, buildHoldoutSafetyValidation, calculateAverageFameEarnedPerGig, createScenarioSeed, runSingleSimulation } from './game-balance-simulation.mjs'
import { logger, LOG_LEVELS } from '../src/utils/logger.js'
import { buildArtifactMetadata } from './utils/balance-report-metadata.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_JSON = path.join(ROOT, 'reports/game-balance-experiments-results.json')
const OUTPUT_MARKDOWN = path.join(ROOT, 'reports/game-balance-experiments-analysis.md')
const METRICS = ['daysSurvived', 'finalMoney', 'finalFame', 'fameEarned', 'gigsPlayed', 'finalHarmony', 'maxDrawdownPct']
const PAIRING_STRATEGY = 'same-scenario-same-run-index-same-seed'
const GENERATOR_PATHS = Object.freeze([
  'scripts/game-balance-experiments.mjs',
  'scripts/game-balance-experiment-config.mjs',
  'scripts/game-balance-simulation.mjs',
  'scripts/utils/paired-statistics.mjs',
  'scripts/utils/balance-report-metadata.mjs'
])

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
  refuels: run.refuels,
  finaleCompleted: run.finaleCompleted,
  harmonyRecovery: run.harmonyRecovery
})

export const pairSimulationRuns = ({ scenario, runsPerScenario, controlTuning, candidateTuning, controlRuns, runner = runSingleSimulation, stream = 'calibration' }) => {
  if (controlRuns && controlRuns.length !== runsPerScenario) throw new RangeError('Control cohort size must match runsPerScenario')
  const pairs = []
  for (let runIndex = 0; runIndex < runsPerScenario; runIndex++) {
    const seed = streamSeed(stream, scenario.id, runIndex)
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
  )])),
  harmonyRecovery: {
    control: summarizeHarmonyRecovery(pairs.map(pair => pair.control)),
    candidate: summarizeHarmonyRecovery(pairs.map(pair => pair.candidate))
  }
})

const summarizeHarmonyRecovery = runs => Object.fromEntries(
  ['evaluations', 'activations', 'harmonyRestored', 'moneySpent', 'daysConsumed', 'gigOpportunitiesForgone']
    .map(key => [key, round(runs.reduce((sum, run) => sum + (run.harmonyRecovery?.[key] ?? 0), 0) / Math.max(1, runs.length))])
)

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
      famePerGig: famePerGigWithinLimit(result.famePerGig, 5),
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
    famePerGig: results.every(result => famePerGigWithinLimit(result.famePerGig, 5)),
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

/**
 * The scenarios the holdout gate covers, ordered by ascending hard cap.
 *
 * The order is an efficiency choice, not a semantic one: screening aborts at the
 * first breach, and the tightest cap is the likeliest to break, so a doomed
 * tuning is rejected after a few hundred runs instead of the full 1820. The
 * verdict is unaffected — a breach anywhere fails the gate regardless of when it
 * is found — and the order is derived from `KPI_TARGETS`, so it tracks the
 * configuration rather than a hand-picked sequence.
 */
export const holdoutGateScenarios = () =>
  SCENARIOS.filter(scenario => Number.isFinite(KPI_TARGETS[scenario.id]?.bankruptcyMax))
    .sort((left, right) => KPI_TARGETS[left.id].bankruptcyMax - KPI_TARGETS[right.id].bankruptcyMax)

/**
 * The three disjoint seed streams, and what each is allowed to decide.
 *
 * `calibration` carries the paired candidate-vs-control comparison. `selection` is
 * where the search may try as many candidates as it likes against the hard caps.
 * `validation` is measured exactly once, on the combination the search already
 * settled on, and never feeds another candidate decision.
 *
 * The split exists because a stream that chose the candidate cannot also be the
 * evidence that the candidate generalises. Running the cap check inside the search
 * fixed a real control-flow bug — the gate used to be applied after selection, so
 * 125 of 126 pairs were never asked whether they would hold — but pointing that
 * search at the published `#holdout` stream turned it into a selection set: trying
 * 154 candidates against one cohort and keeping the first that clears it makes
 * sampling noise part of the selection criterion, and the surviving figure is then
 * reported as independent robustness. Both gates still run inside the search; they
 * just run on `selection`, which leaves `validation` untouched.
 *
 * `validation` keeps the `#holdout` marker so it stays the same stream the
 * simulation report's `kpiHoldoutValidation` measures.
 */
export const SEED_STREAMS = Object.freeze({
  calibration: id => `${id}${SIMULATION_CONSTANTS.seedNamespace}`,
  selection: id => `${id}${SIMULATION_CONSTANTS.seedNamespace}#selection`,
  validation: id => `${id}${SIMULATION_CONSTANTS.seedNamespace}#holdout`
})

export const streamSeed = (stream, scenarioId, runIndex) => {
  const label = SEED_STREAMS[stream]
  if (!label) throw new RangeError(`Unknown seed stream: ${stream}`)
  return createScenarioSeed(label(scenarioId), runIndex)
}

/**
 * Measures one tuning against the hard insolvency caps on a given stream.
 *
 * The search used to check this only for the tuning it had already chosen, so a
 * combination was selected on the calibration stream and only then discovered to
 * breach a cap — with 125 of 126 pairs never asked whether they would have held.
 * Now every considered combination is screened here, which makes "no candidate
 * clears both gates" a measured statement rather than an untested assumption.
 *
 * `abortOnBreach` stops at the first breached cap, which is what screening wants:
 * a failed gate cannot be un-failed by measuring more scenarios. It must be off
 * for the tuning the report is written against — the resulting partial coverage is
 * correctly treated as a gate failure by `buildHoldoutSafetyValidation`, but it
 * would publish five of seven caps as "unmeasured" when they were simply never
 * needed, and a reader cannot tell that from real config drift.
 */
export const measureHoldoutGate = ({
  tuning,
  runsPerScenario,
  runner = runSingleSimulation,
  scenarios = holdoutGateScenarios(),
  abortOnBreach = true,
  // Defaults to the search stream: the caller that measures the reserved
  // validation stream has to say so explicitly, so it cannot happen by accident.
  stream = 'selection'
}) => {
  const measured = []
  let runsSpent = 0
  for (const scenario of scenarios) {
    const runs = Array.from({ length: runsPerScenario }, (_, runIndex) =>
      compact(runner(scenario, streamSeed(stream, scenario.id, runIndex), tuning)))
    runsSpent += runs.length
    const count = runs.filter(run => run.bankrupt).length
    const ratePct = round((count / Math.max(1, runs.length)) * 100)
    measured.push({ id: scenario.id, holdoutBankruptcy: { count, sampleSize: runs.length, ratePct } })
    if (abortOnBreach && ratePct > KPI_TARGETS[scenario.id].bankruptcyMax) break
  }
  return { validation: buildHoldoutSafetyValidation(measured), measured, runsSpent, stream }
}

/**
 * Fame per gig, compared over pairs where BOTH sides actually played a gig.
 *
 * The side-effect limit asks whether a lever accelerates Fame per gig. The cohort
 * metric it used to be measured with (`calculateAverageFameEarnedPerGig`, which
 * scores a gig-less run as 0) cannot answer that whenever a lever changes how many
 * runs play at all — and a liquidity lever changes exactly that. Measured on
 * `bootstrap_struggle`, the €500 emergency grant cut gig-less runs from 61 to 5 and
 * read as +25.7% Fame per gig, so it was rejected as accelerating Fame; over the
 * runs that played, the same comparison is −1.9%. It was the only lever that
 * brought `cult_hypergrowth` inside its holdout cap, and it was vetoed by an
 * artifact of the denominator.
 *
 * A pair where either side never played carries no per-gig information, so it is
 * excluded rather than folded in as a zero.
 *
 * Excluding those pairs opens a second hole if the result is not also gated on
 * coverage: a candidate that removes every comparable gig leaves zero pairs, the
 * delta reads 0, and `Math.abs(0) <= 5` passes it as "no Fame side effect" on no
 * evidence at all. So the delta is `null` when coverage is short, and
 * `sufficientEvidence` has to be true for the limit to be satisfied — a missing
 * measurement fails closed. The threshold is a share of the cohort rather than a
 * fixed count so it tracks `runsPerScenario` instead of silently becoming
 * unreachable on small probe runs.
 */
export const FAME_EVIDENCE_MIN_SHARE = 0.5
export const pairedFamePerGig = pairs => {
  const comparable = pairs.filter(
    pair => pair.control.gigsPlayed > 0 && pair.candidate.gigsPlayed > 0
  )
  const minimumSampleSize = Math.max(1, Math.ceil(pairs.length * FAME_EVIDENCE_MIN_SHARE))
  const sufficientEvidence = comparable.length >= minimumSampleSize
  const average = side =>
    comparable.length
      ? comparable.reduce((sum, pair) => sum + pair[side].fameEarned / pair[side].gigsPlayed, 0) /
        comparable.length
      : 0
  const control = average('control')
  const candidate = average('candidate')
  return {
    control: round(control),
    candidate: round(candidate),
    // Null rather than 0 when coverage is short: a delta nothing measured must not
    // be comparable against the limit.
    deltaPct: sufficientEvidence ? percentageDelta(control, candidate) : null,
    sampleSize: comparable.length,
    minimumSampleSize,
    sufficientEvidence,
    excludedPairs: pairs.length - comparable.length
  }
}

/** The Fame side-effect limit, failing closed when the comparison has no evidence. */
export const famePerGigWithinLimit = (famePerGig, maximumAbsDeltaPct) =>
  Boolean(famePerGig?.sufficientEvidence) &&
  Math.abs(famePerGig.deltaPct) <= maximumAbsDeltaPct

// Staged obligation relief is expressed as cumulative `throughDay` boundaries, so
// each stage's weight is its own segment length, not `throughDay` itself.
const stagedObligationRelief = stages => stages.reduce((sum, stage, index) => {
  const previousThroughDay = index === 0 ? 0 : stages[index - 1].throughDay
  return sum + (stage.throughDay - previousThroughDay) * (1 - stage.multiplier)
}, 0)

export const combinationImpact = ({ bootstrap, touring }) => {
  const early = bootstrap.overrides.earlyGame ?? {}
  const late = touring.overrides.touring ?? {}
  const recovery = touring.overrides.recovery ?? {}
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
  const recoveryDecision = (recovery.threshold ?? 0) / 100 +
    (recovery.costType === 'day' ? 1 : 0) + (recovery.moneyCost ?? 0) / 1000
  return relief + saturation + denseSchedule + recoveryDecision
}

export const evaluateCandidate = (definition, pairs, summary) => {
  const famePerGig = pairedFamePerGig(pairs)
  const famePerGigDeltaPct = famePerGig.deltaPct
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
        famePerGig: famePerGigWithinLimit(famePerGig, criteria.famePerGigMaximumAbsDeltaPct)
      }
    : {
        medianFinalMoney: medianFinalMoneyDeltaPct >= criteria.medianFinalMoneyDeltaPct[0] && medianFinalMoneyDeltaPct <= criteria.medianFinalMoneyDeltaPct[1],
        p90FinalMoney: p90FinalMoneyDeltaPct >= criteria.p90FinalMoneyDeltaPct[0] && p90FinalMoneyDeltaPct <= criteria.p90FinalMoneyDeltaPct[1],
        earlyCheckpoint: earlyCheckpointDeltaPct >= criteria.earlyCheckpointMinimumDeltaPct,
        midCheckpoint: midCheckpointDeltaPct >= criteria.midCheckpointMinimumDeltaPct,
        bankruptcy: summary.bankruptcy.candidateRatePct <= criteria.candidateBankruptcyRateMaxPct && summary.bankruptcy.deltaRatePct <= criteria.bankruptcyMaximumDeltaPct,
        famePerGig: famePerGigWithinLimit(famePerGig, criteria.famePerGigMaximumAbsDeltaPct),
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
  const sideEffectPenalty = Math.abs(famePerGigDeltaPct ?? 0) + Math.max(0, -summary.continuous.finalHarmony.pairedDelta.median)
  const complexityPenalty = definition.id.includes('staged') || definition.id.includes('recovery') ? 2 : 1
  return {
    ...definition,
    resultsByScenario: { [pairs[0]?.scenarioId ?? definition.scenarios[0]]: summary },
    aggregateResults: {
      ...summary,
      solventMedianMoney: round(median(candidateSolventMoney)), solventP90Money: round(percentile(candidateSolventMoney, 0.9)),
      famePerGigDeltaPct, famePerGig, medianFinalMoneyDeltaPct, p90FinalMoneyDeltaPct, earlyCheckpointDeltaPct, midCheckpointDeltaPct
    },
    acceptanceCriteria: { ...definition.acceptanceCriteria, passed, checks },
    rankingComponents: { targetFit: round(targetFit), sideEffectPenalty: round(sideEffectPenalty), overcorrectionPenalty, complexityPenalty },
    selectedForProduction: false,
    rejectionReason: passed ? null : `Acceptance limits missed: ${Object.entries(checks).filter(([, value]) => !value).map(([key]) => key).join(', ')}.`
  }
}

const buildGapAnalysis = (baseScenario, tuning, runsPerScenario, runner = runSingleSimulation) => [1, 2, 3, 4, 5].map(gigGapDays => {
  const scenario = { ...baseScenario, id: `${baseScenario.id}_gap_${gigGapDays}`, gigGapDays }
  const runs = Array.from({ length: runsPerScenario }, (_, runIndex) => runner(scenario, streamSeed('calibration', scenario.id, runIndex), tuning)).map(compact)
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
    const belowTarget = after < minimum
    if (!withinTarget) {
      // Naming the direction matters: an advantage under the band and one over it
      // call for opposite responses, and "outside the target" alone reads as a
      // dominance problem either way.
      shortfalls.push(`${profile} money-per-day advantage ${after}% is ${belowTarget ? 'below' : 'above'} the ${minimum}-${maximum}% target (was ${before}%)`)
    }
    return { before, after, reductionPct: round(before - after), withinTarget, belowTarget }
  }

  const profiles = {
    baseline_touring: profileObjective('baseline_touring'),
    low_resource_touring: profileObjective('low_resource_touring')
  }
  const objectiveMet = shortfalls.length === 0
  const missing = Object.values(profiles).filter(profile => !profile.withinTarget)
  const allBelowTarget =
    missing.length > 0 && missing.every(profile => profile.belowTarget)
  const allAboveTarget =
    missing.length > 0 && missing.every(profile => !profile.belowTarget)
  // Profiles can now miss the band in opposite directions, in which case no
  // single lever serves both and saying "dominance is unchanged" is wrong.
  const mixedDirections = missing.length > 0 && !allBelowTarget && !allAboveTarget
  return {
    objectiveMet,
    allBelowTarget,
    allAboveTarget,
    mixedDirections,
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

/**
 * Prose for the Gap-1 objective, in the same priority order the flags are
 * evaluated: inside the band, both profiles under it, profiles on opposite
 * sides, merely reduced, unchanged. Five outcomes had grown into a nested
 * ternary whose last two branches were dedented, so the fall-through order read
 * backwards from the way it ran.
 */
const describeObjective = validation => {
  const [minimum, maximum] = GIG_GAP_TARGET_RANGE_PCT
  if (validation.objectiveMet) {
    return `Gap-1 money-per-day dominance was brought inside the ${minimum}-${maximum}% target band for both profiles.`
  }
  if (validation.allBelowTarget) {
    return `Gap-1 money-per-day advantage now sits BELOW the ${minimum}-${maximum}% target band. No dampener is warranted — a lever here would push dense touring below paced touring. The target band was set when the simulator gated travel on the gig cadence, which made the advantage look far larger than it is; the band itself is what wants revisiting.`
  }
  if (validation.mixedDirections) {
    return `The two profiles miss the ${minimum}-${maximum}% target band in OPPOSITE directions. No single late-game dampener can serve both: the same lever that pulls the resource-constrained profile down would push the well-funded one further below the band. This is a target-definition question, not a tuning one.`
  }
  if (validation.improved) {
    return 'Late-game compounding was reduced, but structural Gap-1 dominance remains unresolved.'
  }
  return 'Gap-1 dominance is unchanged. The selected combination applies no late-game dampener, so the remaining advantage reflects simply playing more gig nodes rather than a compounding effect a lever could remove.'
}

const RECOVERY_TARGET_SCENARIO_IDS = Object.freeze([
  'bootstrap_struggle',
  'chaos_tour'
])

const recoveryScenarioResult = (pairs, definition, scenarioId) => {
  const summary = summarizePairedRuns(pairs, definition.id, scenarioId)
  const activationRuns = pairs.filter(
    pair => (pair.candidate.harmonyRecovery?.activations ?? 0) > 0
  ).length
  const minimumActivationRuns = Math.max(1, Math.ceil(pairs.length * 0.05))
  const finaleRate = side =>
    round(
      pairs.filter(pair => pair[side].finaleCompleted).length /
        Math.max(1, pairs.length) * 100
    )
  const famePerGig = pairedFamePerGig(pairs)
  const recovery = summary.harmonyRecovery.candidate
  const costType = definition.overrides.recovery?.costType ?? 'none'
  const costsMeasured = costType === 'money'
    ? activationRuns === 0 || recovery.moneySpent > 0
    : costType === 'day'
      ? activationRuns === 0 ||
        (recovery.daysConsumed > 0 && recovery.gigOpportunitiesForgone >= 0)
      : true
  return {
    ...summary,
    activationEvidence: { activationRuns, minimumActivationRuns },
    harmonyMedianDelta: summary.continuous.finalHarmony.pairedDelta.median,
    finaleCompletedDeltaPct: round(
      finaleRate('candidate') - finaleRate('control')
    ),
    bankruptcyDeltaPct: summary.bankruptcy.deltaRatePct,
    famePerGig,
    costsMeasured
  }
}

export const evaluateRecoveryAcceptance = ({ resultsByScenario }) => {
  const results = Object.values(resultsByScenario ?? {})
  const checks = {
    targetProfilesMeasured:
      results.length === RECOVERY_TARGET_SCENARIO_IDS.length,
    activationEvidence:
      results.length > 0 &&
      results.every(
        result =>
          result.activationEvidence.activationRuns >=
          result.activationEvidence.minimumActivationRuns
      ),
    harmonyBenefit:
      results.some(result => result.harmonyMedianDelta >= 3) &&
      results.every(result => result.harmonyMedianDelta >= 0),
    finaleNotWorse: results.every(
      result => result.finaleCompletedDeltaPct >= 0
    ),
    bankruptcy: results.every(result => result.bankruptcyDeltaPct <= 1),
    famePerGig: results.every(result => famePerGigWithinLimit(result.famePerGig, 5)),
    costsMeasured: results.every(result => result.costsMeasured === true)
  }
  return { passed: Object.values(checks).every(Boolean), checks }
}

export const evaluateRecoveryGlobalSafety = ({ resultsByScenario }) => {
  const results = Object.values(resultsByScenario ?? {})
  const checks = {
    completeScenarioMatrix: results.length === SCENARIOS.length,
    finaleNotWorse: results.every(
      result => result.finaleCompletedDeltaPct >= 0
    ),
    bankruptcy: results.every(result => result.bankruptcyDeltaPct <= 1),
    famePerGig: results.every(result => famePerGigWithinLimit(result.famePerGig, 5)),
    costsMeasured: results.every(result => result.costsMeasured === true)
  }
  return { passed: Object.values(checks).every(Boolean), checks }
}

export const runHarmonyRecoveryPhase = ({
  runsPerScenario,
  runner = runSingleSimulation
}) => {
  const definitions = BALANCE_EXPERIMENTS.filter(
    definition => definition.phase === 'recovery'
  )
  const scenarios = RECOVERY_TARGET_SCENARIO_IDS.map(id =>
    SCENARIOS.find(scenario => scenario.id === id)
  )
  if (scenarios.some(scenario => !scenario)) {
    throw new Error('Harmony recovery target scenario is missing')
  }
  const controlCache = new Map()
  const controlRunsFor = (scenario, stream) => {
    const key = `${stream}:${scenario.id}`
    if (!controlCache.has(key)) {
      controlCache.set(
        key,
        Array.from({ length: runsPerScenario }, (_, runIndex) =>
          compact(
            runner(
              scenario,
              streamSeed(stream, scenario.id, runIndex),
              ORIGINAL_CONTROL_BALANCE_TUNING
            )
          )
        )
      )
    }
    return controlCache.get(key)
  }

  const measure = (definition, stream, measuredScenarios = scenarios) => {
    const tuning = resolveBalanceTuning(
      { recovery: definition.overrides.recovery },
      ORIGINAL_CONTROL_BALANCE_TUNING
    )
    const resultsByScenario = Object.fromEntries(
      measuredScenarios.map(scenario => {
        const controlRuns = controlRunsFor(scenario, stream)
        const pairs = pairSimulationRuns({
          scenario,
          runsPerScenario,
          controlTuning: ORIGINAL_CONTROL_BALANCE_TUNING,
          candidateTuning: tuning,
          controlRuns,
          runner,
          stream
        })
        return [scenario.id, recoveryScenarioResult(pairs, definition, scenario.id)]
      })
    )
    const aggregateResults = {
      harmonyRecovery: {
        control: summarizeHarmonyRecovery(
          Object.values(resultsByScenario).map(result => ({
            harmonyRecovery: result.harmonyRecovery.control
          }))
        ),
        candidate: summarizeHarmonyRecovery(
          Object.values(resultsByScenario).map(result => ({
            harmonyRecovery: result.harmonyRecovery.candidate
          }))
        )
      },
      meanHarmonyMedianDelta: round(
        Object.values(resultsByScenario).reduce(
          (sum, result) => sum + result.harmonyMedianDelta,
          0
        ) / measuredScenarios.length
      )
    }
    return {
      ...definition,
      tuning,
      stream,
      resultsByScenario,
      aggregateResults,
      acceptance: definition.id.endsWith('-none')
        ? { passed: false, checks: { controlOnly: true } }
        : evaluateRecoveryAcceptance({
            resultsByScenario: Object.fromEntries(
              Object.entries(resultsByScenario).filter(([scenarioId]) =>
                RECOVERY_TARGET_SCENARIO_IDS.includes(scenarioId)
              )
            )
          })
    }
  }

  const calibration = definitions.map(definition =>
    measure(definition, 'calibration')
  )
  const selection = definitions.map(definition => measure(definition, 'selection'))
  const candidates = calibration.map(candidate => {
    const selectionCandidate = selection.find(item => item.id === candidate.id)
    return {
      ...candidate,
      selectionAcceptance: selectionCandidate.acceptance,
      selectionResultsByScenario: selectionCandidate.resultsByScenario
    }
  })
  const eligible = candidates
    .filter(
      candidate =>
        candidate.acceptance.passed && candidate.selectionAcceptance.passed
    )
    .sort(
      (left, right) =>
        right.aggregateResults.meanHarmonyMedianDelta -
          left.aggregateResults.meanHarmonyMedianDelta ||
        combinationImpact({
          bootstrap: { overrides: { earlyGame: {} } },
          touring: left
        }) -
          combinationImpact({
            bootstrap: { overrides: { earlyGame: {} } },
            touring: right
          }) ||
        left.id.localeCompare(right.id)
    )
  const selected = eligible[0] ?? null
  const validation = selected
    ? measure(
        definitions.find(definition => definition.id === selected.id),
        'validation',
        SCENARIOS
      )
    : null
  const globalSafety = validation
    ? evaluateRecoveryGlobalSafety({
        resultsByScenario: validation.resultsByScenario
      })
    : null
  return {
    id: 'phase6E',
    targetScenarioIds: RECOVERY_TARGET_SCENARIO_IDS,
    runsPerScenario,
    candidates,
    selectedCandidateId:
      validation?.acceptance.passed === true && globalSafety?.passed === true
        ? selected.id
        : null,
    outcome: !selected
      ? 'no-production-recommendation-no-candidate-passed'
      : validation.acceptance.passed && globalSafety.passed
        ? 'candidate-validated-for-runtime-prototyping'
        : 'no-production-recommendation-final-validation-failed',
    validation,
    globalSafety
  }
}

export const tryReadJson = async file => {
  try {
    const parsed = JSON.parse(await fs.readFile(file, 'utf8'))
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed
      : null
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      Object.hasOwn(error, 'code') &&
      error.code === 'ENOENT'
    ) {
      return null
    }
    throw error
  }
}

const experimentReportIdentity = report => ({
  generatedAt: report?.generatedAt ?? null,
  sourceFingerprint: report?.metadata?.sourceFingerprint ?? null,
  runsPerScenario: report?.controlSnapshot?.runsPerScenario ?? null,
  seedNamespace: report?.metadata?.seedNamespace ?? null,
  seedStrategy: report?.metadata?.seedStrategy ?? null,
  shippedGigCadencePolicy: report?.metadata?.shippedGigCadencePolicy ?? null,
  recommendationStatus: report?.recommendation?.status ?? null,
  bootstrapCandidate: report?.recommendation?.bootstrap ?? null,
  touringCandidate: report?.recommendation?.touring ?? null
})

export const buildPreviousExperimentReportComparison = (previous, current) => {
  if (!previous) return null
  const previousIdentity = experimentReportIdentity(previous)
  const currentIdentity = experimentReportIdentity(current)
  const previousScenarios = previous.holdoutBankruptcyByScenario ?? {}
  const currentScenarios = current.holdoutBankruptcyByScenario ?? {}
  const scenarioIds = [
    ...new Set([...Object.keys(previousScenarios), ...Object.keys(currentScenarios)])
  ].sort()
  return {
    ...buildDescriptiveCohortComparison(previousIdentity, currentIdentity),
    previous: previousIdentity,
    current: currentIdentity,
    scenarios: scenarioIds.map(id => {
      const previousMeasurement = previousScenarios[id] ?? {}
      const currentMeasurement = currentScenarios[id] ?? {}
      const previousRatePct = previousMeasurement.ratePct ?? null
      const currentRatePct = currentMeasurement.ratePct ?? null
      return {
        id,
        previousRatePct,
        currentRatePct,
        deltaPct:
          previousRatePct == null || currentRatePct == null
            ? null
            : round(currentRatePct - previousRatePct),
        previousSampleSize: previousMeasurement.sampleSize ?? null,
        currentSampleSize: currentMeasurement.sampleSize ?? null
      }
    })
  }
}

const SELECTION_RATIONALE =
  'Candidate pairs are ordered by `combinationImpact`, which is derived from the candidate overrides alone, and the search stops at the first pair that clears BOTH blocking gates — the paired calibration validation and the hard holdout insolvency caps. The remaining pairs carry higher impact and so could not have been selected. A pair rejected by the holdout gate skips the paired comparison, so its calibration verdict is reported as not measured rather than as a pass.'

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

const NO_CHANGE_NOTE =
  ' Der gewählte Kandidat ist der neutrale No-Op: Es wird kein Hebel ausgeliefert, die Produktions-Tuning-Werte bleiben unverändert auf dem Kontrollzustand.'

export const renderExperimentMarkdown = report => {
  const gap = report.phases.phase3C.gigFrequencyValidation
  const noChangeNote = report.combinationSearch.selectedAppliesNoChange ? NO_CHANGE_NOTE : ''
  // Evaluated and skipped have to add up to the pairs available, and the gate
  // breakdown belongs to the evaluated side only — appending it to the skipped
  // count read as a breakdown of pairs that were never measured at all.
  const search = report.combinationSearch
  const holdoutRejected = search.pairsRejectedBySelectionGate ?? 0
  const calibrationRejected = search.pairsRejectedByCalibrationGate ?? 0
  const selectedPairs = Math.max(0, search.pairsEvaluated - holdoutRejected - calibrationRejected)
  const pairAccounting =
    `Of ${search.pairsAvailable} available pairs, ${search.pairsEvaluated} were evaluated on the \`selection\` stream ` +
    `(${holdoutRejected} rejected by the hard caps, ${calibrationRejected} by the calibration gate, ` +
    `${selectedPairs} clearing both) and ${search.pairsSkipped} were never reached, because the search stops ` +
    `at the first pair that clears both gates and every remaining pair carries higher impact. The reserved ` +
    `\`validation\` stream is measured once, on that pair alone.`
  // The search rejects on the hard caps first and only reaches calibration for
  // pairs that already cleared them, so a `pairsRejectedByCalibrationGate` pair is
  // not a cap failure. Blaming every rejection on the caps names the wrong blocker
  // and points the next phase at the wrong problem.
  const noCombinationNote = (() => {
    const reached = `Die Messimplementierung ist vollständig, und die Suche hat jede der ${search.pairsEvaluated} erreichten Kombinationen geprüft — keine besteht beide Gates.`
    const capsNextStep = 'Die an den Caps gescheiterten Szenarien müssen neu balanciert werden, bevor eine Empfehlung möglich ist.'
    const calibrationNextStep = 'Für die am Kalibrierungs-Gate gescheiterten Kombinationen sind die Caps nicht die bindende Grenze; dort braucht es eine Kandidatenfamilie, die die gepaarten Kalibrierungskriterien erfüllt.'
    if (search.pairsEvaluated === 0) {
      return '**Keine Produktionsempfehlung.** Es wurde keine Kombination erreicht, also ist kein Gate gemessen — das ist kein bestandenes Gate.'
    }
    if (calibrationRejected === 0) {
      return `**Keine Produktionsempfehlung.** ${reached} Alle ${holdoutRejected} Ablehnungen fielen an den harten Caps auf dem \`selection\`-Strom. ${capsNextStep}`
    }
    if (holdoutRejected === 0) {
      return `**Keine Produktionsempfehlung.** ${reached} Alle ${calibrationRejected} Ablehnungen fielen am gepaarten Kalibrierungs-Gate, nicht an den harten Caps. ${calibrationNextStep}`
    }
    return `**Keine Produktionsempfehlung.** ${reached} ${holdoutRejected} davon fielen an den harten Caps auf dem \`selection\`-Strom, ${calibrationRejected} am gepaarten Kalibrierungs-Gate. ${capsNextStep} ${calibrationNextStep}`
  })()
  const selectionOutcomeNote =
    report.combinationSearch.selectionOutcome === 'no-combination-cleared-both-gates'
      ? ' **Keine Kombination hat beide Gates bestanden.** Die genannte Kombination ist nur die Basis, gegen die dieser Bericht geschrieben ist — sie wird nicht zur Auslieferung empfohlen.'
      : ''
  const bootstrapRows = report.phases.phase3B.candidates.map(item => `| ${item.id} | ${item.aggregateResults.bankruptcy.controlRatePct}% | ${item.aggregateResults.bankruptcy.candidateRatePct}% | ${item.aggregateResults.bankruptcy.deltaRatePct} pp | ${item.aggregateResults.continuous.daysSurvived.pairedDelta.median} | €${item.aggregateResults.solventMedianMoney} | ${item.aggregateResults.famePerGigDeltaPct}% | ${item.acceptanceCriteria.passed ? 'Pass' : 'Fail'} |`).join('\n')
  const gapRows = Object.entries(report.phases.phase3C.gigFrequencyAnalysis).flatMap(([tuning, profiles]) => profiles.flatMap(profile => profile.results.map(item => `| ${tuning} | ${profile.profile} | ${item.gigGapDays} | ${item.gigsPlayed} | ${item.moneyPerDay} | ${item.gigNetPerDay} | ${item.fameEarnedPerDay} | ${item.fameEarnedPerGig} | ${item.finalHarmony} | ${item.repairs} | ${item.refuels} | ${item.maxDrawdownPct}% | ${item.bankruptcyRatePct}% | ${item.daysSurvived} |`))).join('\n')
  const touringRows = report.phases.phase3C.candidates.map(item => `| ${item.id} | ${item.aggregateResults.medianFinalMoneyDeltaPct}% | ${item.aggregateResults.p90FinalMoneyDeltaPct}% | ${item.aggregateResults.earlyCheckpointDeltaPct}% | ${item.aggregateResults.bankruptcy.deltaRatePct} pp | ${item.aggregateResults.continuous.finalHarmony.pairedDelta.median} | ${item.acceptanceCriteria.passed ? 'Pass' : 'Fail'} |`).join('\n')
  const holdoutMeasurements = Object.entries(report.holdoutBankruptcyByScenario ?? {})
  const holdoutRows = holdoutMeasurements.length
    ? `| Szenario | Holdout-Insolvenz | harte Grenze | Status |
|---|---:|---:|---|
${holdoutMeasurements
        .map(
          ([scenarioId, item]) =>
            `| ${scenarioId} | ${item.ratePct}% (${item.count}/${item.sampleSize}) | ${item.maximumPct ?? '—'}% | ${
              item.maximumPct == null ? '—' : item.ratePct <= item.maximumPct ? 'bestanden' : 'überschritten'
            } |`
        )
        .join('\n')}`
    : '_Keine Holdout-Messungen im Artefakt._'
  const corridor = report.designRiskCorridors
  const corridorNote = !corridor
    ? '_Keine Korridorauswertung im Artefakt._'
    : `Die harten Caps sind Obergrenzen. Ein Hebel kann sie alle bestehen und trotzdem das Risiko entfernen, für das ein Szenario existiert — diese Liste macht "sicherer als beabsichtigt" sichtbar.

| Szenario | Holdout-Insolvenz | Designkorridor | Lage |
|---|---:|---:|---|
${corridor.scenarios
        .map(
          item =>
            `| ${item.scenarioId} | ${item.ratePct}% | ${
              item.corridorPct ? `${item.corridorPct[0]}–${item.corridorPct[1]}%` : '—'
            } | ${
              { below: 'unter Korridor', above: 'über Korridor', inside: 'im Korridor', 'no-corridor': '—' }[
                item.position
              ]
            } |`
        )
        .join('\n')}
${
  corridor.belowCorridor.length
    ? `\n**Sicherer als beabsichtigt:** ${corridor.belowCorridor
        .map(id => `\`${id}\``)
        .join(', ')}. Die harten Caps sind bestanden, aber diese Szenarien erzeugen nicht mehr das Risiko, für das sie existieren. Kein Gate prüft die Untergrenze — diese Entscheidung liegt beim Design.`
    : ''
}${
  corridor.aboveCorridor.length
    ? `\n**Riskanter als beabsichtigt:** ${corridor.aboveCorridor.map(id => `\`${id}\``).join(', ')}.`
    : ''
}`
  const previousComparison = report.previousReportComparison
  const previousComparisonSection = previousComparison
    ? `## Alt/Neu-Vergleich der vollständigen Reports

Dieser Vergleich ist **deskriptiv und ungepaart**. ${previousComparison.note}

| Kennzahl | Alt | Neu |
|---|---|---|
| Source-Fingerprint | \`${previousComparison.previous.sourceFingerprint ?? '—'}\` | \`${previousComparison.current.sourceFingerprint ?? '—'}\` |
| Runs je Szenario | ${previousComparison.previous.runsPerScenario ?? '—'} | ${previousComparison.current.runsPerScenario ?? '—'} |
| Seed-Namensraum | \`${previousComparison.previous.seedNamespace ?? 'legacy'}\` | \`${previousComparison.current.seedNamespace ?? '—'}\` |
| Empfehlung | \`${previousComparison.previous.recommendationStatus ?? '—'}\` | \`${previousComparison.current.recommendationStatus ?? '—'}\` |

| Szenario | Insolvenz alt | Insolvenz neu | Delta | Stichprobe alt/neu |
|---|---:|---:|---:|---:|
${previousComparison.scenarios
  .map(
    scenario =>
      `| \`${scenario.id}\` | ${scenario.previousRatePct ?? '—'}% | ${scenario.currentRatePct ?? '—'}% | ${scenario.deltaPct ?? '—'} pp | ${scenario.previousSampleSize ?? '—'} / ${scenario.currentSampleSize ?? '—'} |`
  )
  .join('\n')}
`
    : ''
  const combinedRows = Object.values(report.finalCombinedValidation.resultsByScenario).map(item => `| ${item.scenarioId} | ${item.controlKpiStatus} | ${item.candidateKpiStatus} | ${item.bankruptcy.controlRatePct}% | ${item.bankruptcy.candidateRatePct}% | ${item.bankruptcy.deltaRatePct} pp | ${item.continuous.finalMoney.pairedDelta.median} | ${item.famePerGigDeltaPct}% | ${item.continuous.finalHarmony.pairedDelta.median} | ${item.continuous.maxDrawdownPct.pairedDelta.median} | ${item.scenarioValidation.passed ? 'Pass' : 'Fail'} |`).join('\n')
  const recoveryPhase = report.phases.phase6E ?? {
    candidates: [],
    outcome: 'not-measured',
    selectedCandidateId: null
  }
  const recoveryRows = recoveryPhase.candidates.flatMap(candidate =>
    Object.entries(candidate.resultsByScenario).map(([scenarioId, result]) =>
      `| ${candidate.id} | ${scenarioId} | ${result.activationEvidence.activationRuns}/${result.sampleSize} | ${result.harmonyMedianDelta} | ${result.finaleCompletedDeltaPct} pp | ${result.bankruptcyDeltaPct} pp | ${result.famePerGig.deltaPct ?? '—'}% | €${result.harmonyRecovery.candidate.moneySpent} | ${result.harmonyRecovery.candidate.daysConsumed} | ${result.harmonyRecovery.candidate.gigOpportunitiesForgone} | ${candidate.acceptance.passed && candidate.selectionAcceptance.passed ? 'Pass' : 'Fail'} |`
    )
  ).join('\n')
  const recoveryGlobalRows = Object.entries(
    recoveryPhase.validation?.resultsByScenario ?? {}
  ).map(
    ([scenarioId, result]) =>
      `| ${scenarioId} | ${result.activationEvidence.activationRuns}/${result.sampleSize} | ${result.harmonyMedianDelta} | ${result.finaleCompletedDeltaPct} pp | ${result.bankruptcyDeltaPct} pp | ${result.famePerGig.deltaPct ?? '—'}% | ${result.costsMeasured ? 'Pass' : 'Fail'} |`
  ).join('\n')
  return `# Game Balance Experiments – Phase 3

## Reproduzierbarkeit

Pairing: \`${report.pairingStrategy}\`; ${report.runtime.totalRuns} simulation runs in ${report.runtime.durationMs} ms.

${previousComparisonSection}
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

\`${report.phases.phase3B.selectedCandidateId}\` was selected by the combination search. ${SELECTION_RATIONALE} ${pairAccounting}${selectionOutcomeNote}${noChangeNote}

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

\`${report.phases.phase3C.selectedCandidateId}\` was selected by the combination search. ${SELECTION_RATIONALE} ${pairAccounting}${selectionOutcomeNote}${noChangeNote}

## Phase 6E – Harmony Recovery

Alle fünf Varianten werden auf \`bootstrap_struggle\` und \`chaos_tour\` vollständig auf den getrennten \`calibration\`- und \`selection\`-Strömen gemessen. Nur der bereits ausgewählte Kandidat wird einmal auf \`validation\` geprüft.

| Candidate | Scenario | Activation runs | Median Harmony delta | Finale delta | Bankruptcy delta | Fame/Gig delta | Avg money cost | Avg days | Avg gigs forgone | Calibration + Selection |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
${recoveryRows}

Outcome: **${recoveryPhase.outcome}**. Selected candidate: \`${recoveryPhase.selectedCandidateId ?? 'none'}\`.

### Globale Sicherheitsvalidierung des Gewinners

Der fest ausgewählte Gewinner wird auf dem reservierten \`validation\`-Strom genau einmal über die vollständige Hauptszenario-Matrix geprüft; es findet keine Ersatzsuche statt.

| Scenario | Activation runs | Median Harmony delta | Finale delta | Bankruptcy delta | Fame/Gig delta | Costs measured |
|---|---:|---:|---:|---:|---:|---|
${recoveryGlobalRows}

Global safety: **${recoveryPhase.globalSafety?.passed ? 'PASS' : 'FAIL'}**.

## Kombinierte Validierung

| Scenario | Control KPI Status | Final KPI Status | Control Bankruptcy | Final Bankruptcy | Bankruptcy Delta | Final Money Delta | Fame/Gig Delta | Harmony Delta | Drawdown Delta | Pass/Fail |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
${combinedRows}

Kalibrierungs-Gate: **${report.finalCombinedValidation.passed ? 'PASS' : 'FAIL'}**. Bootstrap Struggle bankruptcy must remain <= 60%. Dies ist nur das erste von zwei blockierenden Gates — das Gesamturteil steht unter „Release-Gesamtstatus“.

### Harte Sicherheitsgrenzen auf dem Holdout-Strom

Drei disjunkte Seed-Ströme, mit getrennten Aufgaben: \`calibration\` trägt den gepaarten Vergleich, \`selection\` trägt die Kandidatensuche gegen die harten \`KPI_TARGETS.bankruptcyMax\`-Obergrenzen, und \`validation\` wird **genau einmal** gemessen — auf der Kombination, die die Suche bereits gewählt hat. Ein Strom, auf dem bis zu ${report.combinationSearch.pairsAvailable} Kandidaten ausprobiert werden, kann nicht gleichzeitig belegen, dass der Gewinner generalisiert; deshalb entscheidet die Suche auf \`selection\` und \`validation\` bleibt unberührt.

Suchstrom-Gate (\`selection\`, nicht der Unabhängigkeitsbeleg): **${report.selectionGateValidation?.passed ? 'PASS' : report.selectionGateValidation ? 'FAIL' : '—'}**

Holdout-Sicherheitsgate: **${report.holdoutSafetyValidation?.passed ? 'PASS' : 'FAIL'}**${report.holdoutSafetyValidation?.failures?.length ? ` — ${report.holdoutSafetyValidation.failures.map(failure => `\`${failure.scenarioId}\` ${failure.metric} ${failure.holdoutValuePct}% > ${failure.maximumPct}% (n=${failure.sampleSize ?? '—'})`).join('; ')}` : ''}${report.holdoutSafetyValidation?.missingScenarioIds?.length ? ` — nicht gemessen: ${report.holdoutSafetyValidation.missingScenarioIds.map(id => `\`${id}\``).join(', ')} (unvollständige Abdeckung ist kein bestandenes Gate)` : ''}${report.holdoutSafetyValidation && !report.holdoutSafetyValidation.passed && !report.holdoutSafetyValidation.failures?.length && !report.holdoutSafetyValidation.missingScenarioIds?.length ? ' — kein Szenario auswertbar, das ist kein bestandenes Gate' : ''}

${holdoutRows}

#### Designkorridore (nicht blockierend)

${corridorNote}

${
  report.holdoutSafetyValidation?.passed
    ? ''
    : report.combinationSearch.selectionOutcome === 'selection-validated-final-validation-failed'
      ? `**Keine Produktionsempfehlung.** Die gewählte Kombination hat das Suchstrom-Gate bestanden und bricht auf dem reservierten \`validation\`-Strom (${(
          report.combinationSearch.selectedFinalValidationFailures ?? []
        ).join('; ')}). Auf diesem Strom wird nicht weitergesucht — das würde genau die Unabhängigkeit verbrauchen, für die er existiert. Der nächste Schritt ist eine neu vorab definierte Kandidatenfamilie.`
      : noCombinationNote
}

### Release-Gesamtstatus

Beide Gates müssen bestehen. Kalibrierung: **${report.finalCombinedValidation.passed ? 'PASS' : 'FAIL'}** · Holdout-Sicherheit: **${report.holdoutSafetyValidation?.passed ? 'PASS' : 'FAIL'}** → Gesamt: **${report.finalCombinedValidation.passed && report.holdoutSafetyValidation?.passed ? 'PASS' : 'FAIL'}** (\`${report.recommendation.status}\`).

## Nebenwirkungen

Fame per gig, harmony, bankruptcy, drawdown, and the early/mid progression checkpoints (days ${SIMULATION_CONSTANTS.progressionCheckpointDays[0]} and ${SIMULATION_CONSTANTS.progressionCheckpointDays[1]}) are explicit acceptance checks.

## Verworfene Kandidaten

Every unselected candidate carries a machine-readable rejection reason in the JSON artifact.

## Produktionsänderungen

Only the selected bootstrap and touring defaults are intended for production.

Recommendation: **${report.recommendation.status}**${
    report.recommendation.productionHold?.held === true
      ? `

> **Nicht ausgeliefert.** \`BALANCE_RECOMMENDATION_HOLD\` in \`src/utils/balanceTuning.ts\` hält diese Empfehlung zurück, die Produktionswerte bleiben neutral${
          report.recommendation.productionHold.matchesRecommendation === false
            ? ' — und der Hold wurde gegen ein anderes Kandidatenpaar geprüft (`' +
              report.recommendation.productionHold.heldFor.bootstrap +
              '` + `' +
              report.recommendation.productionHold.heldFor.touring +
              '`), deckt dieses also nicht ab'
            : ''
        }: ${report.recommendation.productionHold.reason}`
      : ''
  }

## Fazit

Selection is based on paired deltas, distributions, deterministic bootstrap intervals, transition matrices, and explicit side-effect limits.

| Ergebnis | Status |
|---|---|
| Phase 3B (Bootstrap-Insolvenz) | ${report.finalCombinedValidation.resultsByScenario.bootstrap_struggle?.scenarioValidation.passed ? 'bestanden' : 'fehlgeschlagen'} |
| Finale Sicherheits-Gates | ${report.finalCombinedValidation.passed ? 'bestanden' : 'fehlgeschlagen'} |
| Holdout-Sicherheitsgrenzen (harte Caps) | ${report.holdoutSafetyValidation?.passed ? 'bestanden' : 'fehlgeschlagen'} |
| Late-Game-Snowball | ${gap.improved ? 'verbessert' : 'nicht verbessert'} |
| Gap-1-Dominanz im Zielband | ${gap.objectiveMet ? 'erreicht' : 'nicht gelöst'} |
| Phase 3C Gesamtstatus | ${report.phases.phase3C.objectiveStatus} |
| Kombinationssuche | ${report.combinationSearch.selectionOutcome ?? '—'} |
| Produktionskandidat | ${report.recommendation.status} |
`
}

/**
 * `simulate` exists for the same reason every helper in this module takes a
 * `runner`: the search's control flow — which gate rejects which pair, and in
 * what order — is worth testing without a 120k-run simulation behind it. The
 * counter wraps whatever is injected, so `runtime.totalRuns` stays truthful.
 */
export const runExperimentSuite = async ({ runsPerScenario = SIMULATION_CONSTANTS.runsPerScenario, writeReports = true, simulate = runSingleSimulation, previousReport } = {}) => {
  logger.setLevel(LOG_LEVELS.ERROR)
  const started = Date.now()
  const previousReportSnapshot =
    previousReport === undefined && writeReports
      ? await tryReadJson(OUTPUT_JSON)
      : previousReport ?? null
  let totalRuns = 0
  const runner = (...args) => {
    totalRuns++
    return simulate(...args)
  }
  const bootstrapDefinitions = BALANCE_EXPERIMENTS.filter(item => item.phase === 'bootstrap')
  const touringDefinitions = BALANCE_EXPERIMENTS.filter(item => item.phase === 'touring')
  const bootstrapScenario = SCENARIOS.find(item => item.id === 'bootstrap_struggle')
  const baselineScenario = SCENARIOS.find(item => item.id === 'baseline_touring')
  const runCandidates = (definitions, scenario, controlTuning) => {
    const controlRuns = Array.from({ length: runsPerScenario }, (_, runIndex) => compact(runner(scenario, streamSeed('calibration', scenario.id, runIndex), controlTuning)))
    const pairedCandidates = definitions.map(definition => {
      const candidateTuning = resolveBalanceTuning({
        earlyGame: { ...controlTuning.earlyGame, ...definition.overrides.earlyGame },
        touring: { ...controlTuning.touring, ...definition.overrides.touring },
        recovery: { ...controlTuning.recovery, ...definition.overrides.recovery }
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
        (_, runIndex) => compact(runner(scenario, streamSeed('calibration', scenario.id, runIndex), ORIGINAL_CONTROL_BALANCE_TUNING))))
    }
    return controlCohortByScenario.get(scenario.id)
  }

  const evaluateCombination = (bootstrap, touring) => {
    const tuning = resolveBalanceTuning({ earlyGame: bootstrap.overrides.earlyGame, touring: touring.overrides.touring, recovery: touring.overrides.recovery }, ORIGINAL_CONTROL_BALANCE_TUNING)
    const results = SCENARIOS.map(scenario => {
      const pairs = pairSimulationRuns({ scenario, runsPerScenario, controlTuning: ORIGINAL_CONTROL_BALANCE_TUNING, candidateTuning: tuning, controlRuns: controlCohortFor(scenario), runner })
      const summary = summarizePairedRuns(pairs, `${bootstrap.id}+${touring.id}`, scenario.id)
      const statuses = kpiStatusForRuns(pairs)
      const famePerGig = pairedFamePerGig(pairs)
      return { scenarioId: scenario.id, ...summary, controlKpiStatus: statuses.control, candidateKpiStatus: statuses.candidate, famePerGigDeltaPct: famePerGig.deltaPct, famePerGig }
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

  // Both blocking gates decide a combination, so both are evaluated per pair.
  // The holdout screen runs first purely because it is the cheaper rejection
  // (it aborts at the first breached cap); the selection rule is unchanged by the
  // order, since a pair has to clear both to be selectable.
  let selected = null
  let pairsConsidered = 0
  let selectionRejections = 0
  let calibrationRejections = 0
  let leastImpactPair = null
  for (const pair of orderedPairs) {
    const touring = screenTouringFor(pair.bootstrap).find(item => item.id === pair.touring.id)
    if (!touring?.acceptanceCriteria.passed) continue
    pairsConsidered++
    leastImpactPair ??= { bootstrap: pair.bootstrap, touring }
    const tuning = resolveBalanceTuning(
      { earlyGame: pair.bootstrap.overrides.earlyGame, touring: touring.overrides.touring, recovery: touring.overrides.recovery },
      ORIGINAL_CONTROL_BALANCE_TUNING
    )
    const selectionGate = measureHoldoutGate({
      tuning,
      runsPerScenario,
      runner,
      stream: 'selection'
    })
    if (!selectionGate.validation.passed) {
      selectionRejections++
      // Recorded without calibration figures: the pair cannot ship, so paying
      // 2860 more runs to describe how it would have compared is waste. The
      // `calibrationEvaluated` flag keeps that visible instead of letting an
      // absent verdict read as a passed one.
      combinations.push({
        bootstrap: pair.bootstrap,
        touring,
        tuning,
        validation: null,
        calibrationEvaluated: false,
        selectionGateValidation: selectionGate.validation,
        selectionGateMeasured: selectionGate.measured
      })
      continue
    }
    const combination = evaluateCombination(pair.bootstrap, touring)
    combination.calibrationEvaluated = true
    combination.selectionGateValidation = selectionGate.validation
    combination.selectionGateMeasured = selectionGate.measured
    combinations.push(combination)
    if (combination.validation.passed) {
      selected = combination
      break
    }
    calibrationRejections++
  }

  // Nothing cleared both gates. The artifacts still have to be produced — that is
  // how the breach becomes visible — so they are reported against the
  // least-impact pair, which is the production-neutral baseline the reader
  // expects to see judged. Its calibration verdict may not have been measured yet
  // (its holdout screen can have failed first), so measure it now.
  let reported = selected
  if (!reported) {
    reported =
      combinations.find(item => item.calibrationEvaluated && item.validation?.passed) ?? null
    if (!reported && leastImpactPair) {
      const existing = combinations.find(
        item =>
          item.bootstrap.id === leastImpactPair.bootstrap.id &&
          item.touring.id === leastImpactPair.touring.id
      )
      const baseline = existing?.calibrationEvaluated
        ? existing
        : Object.assign(
            evaluateCombination(leastImpactPair.bootstrap, leastImpactPair.touring),
            {
              calibrationEvaluated: true,
              // Both halves, or `selectionBankruptcyByScenario` and
              // `capVerdictDisagreements` render empty exactly in the case they
              // exist to explain.
              selectionGateValidation: existing?.selectionGateValidation ?? null,
              selectionGateMeasured: existing?.selectionGateMeasured ?? null
            }
          )
      if (!existing?.calibrationEvaluated) {
        if (existing) combinations[combinations.indexOf(existing)] = baseline
        else combinations.push(baseline)
      }
      if (baseline.validation.passed) reported = baseline
    }
  }
  if (!reported) throw new NoViableCandidateError('No combined Phase 3 candidate satisfies final validation')
  const combinationsSkipped = orderedPairs.length - pairsConsidered
  const selectedBootstrap = reported.bootstrap
  const selectedTouring = reported.touring
  // Ordering by ascending impact makes the neutral pair the first thing tried,
  // so "nothing ships" is a legitimate and expected outcome — but the selection
  // sections then name a candidate id where a reader expects a lever. Flag it
  // so the reports say outright that production tuning does not move.
  const selectedAppliesNoChange = combinationImpact({ bootstrap: selectedBootstrap, touring: selectedTouring }) === 0
  // "Selected for production" has to mean it cleared every gate, and the reserved
  // validation stream has not been measured yet at this point — so the flag is set
  // below, once it has. Until then only the reporting role is known.
  selectedBootstrap.reportedAsBaseline = true
  selectedTouring.reportedAsBaseline = true



  // Search stops at the first combination that clears both gates, so an unselected
  // candidate was either evaluated and rejected, or never reached. Say which.
  const describeRejection = (item, side) => {
    const evaluated = combinations.filter(c => c[side].id === item.id)
    if (!evaluated.length) {
      return 'Not evaluated: a lower-impact combination already cleared both gates.'
    }
    if (evaluated.some(c => c.validation?.passed && c.selectionGateValidation?.passed)) {
      return 'A lower-impact combination cleared both gates and ranked higher.'
    }
    const calibrationFailures = [
      ...new Set(evaluated.filter(c => c.calibrationEvaluated).flatMap(c => c.validation.failures))
    ]
    // Naming the partner keeps each failure traceable to one evaluated pair. A bare
    // list of rates cannot be cross-referenced back to a combination, which is the
    // whole point of a rejection reason.
    const partnerOf = combination =>
      side === 'bootstrap' ? combination.touring.id : combination.bootstrap.id
    const holdoutFailures = [
      ...new Set(
        evaluated.flatMap(c =>
          (c.selectionGateValidation?.failures ?? []).map(
            failure =>
              `with ${partnerOf(c)}: ${failure.scenarioId} ${failure.holdoutValuePct}% > ${failure.maximumPct}%`
          )
        )
      )
    ]
    return [
      holdoutFailures.length ? `Breached the holdout safety caps (${holdoutFailures.join('; ')}).` : '',
      calibrationFailures.length ? `Did not pass final combined validation (${calibrationFailures.join(', ')}).` : ''
    ]
      .filter(Boolean)
      .join(' ') || 'Did not clear both blocking gates.'
  }

  for (const item of bootstrapCandidates) {
    if (!item.reportedAsBaseline && !item.rejectionReason) {
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
    if (!item.reportedAsBaseline && !item.rejectionReason) {
      item.rejectionReason = describeRejection(item, 'touring')
    }
  }


  const intermediateTuning = resolveBalanceTuning(selectedBootstrap.overrides, ORIGINAL_CONTROL_BALANCE_TUNING)
  const finalTuning = reported.tuning
  const finalCombinedValidation = reported.validation
  const lowResource = { ...baselineScenario, id: 'low_resource_touring', initialOverrides: { ...baselineScenario.initialOverrides, player: { money: 250, fame: 0 } } }
  const gapProfiles = tuning => [baselineScenario, lowResource].map(profile => ({ profile: profile.id, runsPerScenario, seedStrategy: `${SEED_STREAMS.calibration('scenario-id')}-plus-run-index`, results: buildGapAnalysis(profile, tuning, runsPerScenario, runner) }))
  const controlGapProfiles = gapProfiles(intermediateTuning)
  const finalGapProfiles = gapProfiles(finalTuning)
  const gapTradeoff = { gap1VsGap2: { control: buildGapTradeoff(controlGapProfiles), finalTuning: buildGapTradeoff(finalGapProfiles) } }
  const gigFrequencyValidation = evaluateGigGap(gapTradeoff.gap1VsGap2.control, gapTradeoff.gap1VsGap2.finalTuning)
  const objectiveStatus = gigFrequencyValidation.objectiveMet ? 'met' : 'partial'
  const objectiveNote = describeObjective(gigFrequencyValidation)
  // The hard safety layer for the tuning being reported. Every considered
  // combination was already screened against it inside the search, so this is that
  // combination's own verdict rather than a second measurement — the two used to
  // be able to disagree, since the search selected on the calibration stream and
  // the gate was only applied afterwards: cult_hypergrowth passed at 10.38% while
  // its holdout sat above the 12% ceiling and the suite still reported
  // `accepted-for-production-partial`.
  //
  // A reported baseline that reached this point without a screen (the search never
  // needed one), or whose screen stopped early at a breach, is measured across the
  // full set here: the artifact has to show all seven caps, not the prefix the
  // search happened to need.
  // Measured exactly once, on the reserved `validation` stream, against the
  // combination the search already settled on. It is never reused from the search
  // and never feeds another candidate decision — that is the whole point of keeping
  // it separate. `abortOnBreach: false` so the artifact reports all seven caps
  // instead of the prefix a breach would have stopped at.
  const reportedHoldout = measureHoldoutGate({
    tuning: finalTuning,
    runsPerScenario,
    runner,
    abortOnBreach: false,
    stream: 'validation'
  })
  const holdoutSafetyValidation = reportedHoldout.validation
  // A combination that cleared both search gates and then breached a cap on the
  // untouched stream is not shippable, so nothing may carry the production flag.
  const shippable = Boolean(selected) && holdoutSafetyValidation.passed
  selectedBootstrap.selectedForProduction = shippable
  selectedTouring.selectedForProduction = shippable
  // `buildHoldoutSafetyValidation` names only the breaches, so the passing caps
  // never reached the artifact and a reader could not see how much headroom the
  // other six had. Publish the measured rate for every covered scenario.
  const holdoutBankruptcyByScenario = Object.fromEntries(
    (reportedHoldout.measured ?? []).map(scenario => [
      scenario.id,
      {
        ratePct: scenario.holdoutBankruptcy.ratePct,
        count: scenario.holdoutBankruptcy.count,
        sampleSize: scenario.holdoutBankruptcy.sampleSize,
        maximumPct: KPI_TARGETS[scenario.id]?.bankruptcyMax ?? null
      }
    ])
  )
  // Non-blocking, and deliberately so: the hard caps are ceilings, and a lever can
  // clear every one of them while removing the risk the scenarios exist to create.
  // The €250 emergency grant does exactly that — it pulls five of seven scenarios
  // under the lower bound of their `RISK_TARGETS` corridor. That is not a gate
  // failure, but a reader deciding whether to ship the lever has to see it, and no
  // configured check would otherwise mention it.
  const designRiskCorridors = {
    blocking: false,
    layer: 'design-intent',
    source: 'holdout',
    note: 'The hard caps are ceilings. A lever can clear all of them and still remove the risk a scenario exists to create, so this list makes "safer than intended" visible.',
    scenarios: Object.entries(holdoutBankruptcyByScenario).map(([scenarioId, measurement]) => {
      const corridor = RISK_TARGETS[scenarioId]?.bankruptcyTargetPct ?? null
      return {
        scenarioId,
        ratePct: measurement.ratePct,
        corridorPct: corridor,
        position:
          corridor == null
            ? 'no-corridor'
            : measurement.ratePct < corridor[0]
              ? 'below'
              : measurement.ratePct > corridor[1]
                ? 'above'
                : 'inside'
      }
    })
  }
  designRiskCorridors.belowCorridor = designRiskCorridors.scenarios
    .filter(item => item.position === 'below')
    .map(item => item.scenarioId)
  designRiskCorridors.aboveCorridor = designRiskCorridors.scenarios
    .filter(item => item.position === 'above')
    .map(item => item.scenarioId)
  const recoveryPhase = runHarmonyRecoveryPhase({ runsPerScenario, runner })
  const report = {
    experimentReportVersion: 2,
    generatedAt: new Date().toISOString(),
    metadata: {
      ...(await buildArtifactMetadata({
        root: ROOT,
        generatorPaths: GENERATOR_PATHS,
        seedNamespace: SIMULATION_CONSTANTS.seedNamespace,
        runsPerScenario
      })),
      shippedGigCadencePolicy: SHIPPED_GIG_CADENCE_POLICY,
      seedStrategy: Object.keys(SEED_STREAMS)
        .map(
          stream =>
            `${stream}: ${SEED_STREAMS[stream]('scenario-id')}-plus-run-index`
        )
        .join('; ')
    },
    pairingStrategy: PAIRING_STRATEGY,
    controlSnapshot: { tuning: ORIGINAL_CONTROL_BALANCE_TUNING, runsPerScenario },
    phases: {
      phase3B: { hypothesis: 'Temporary early liquidity relief reduces bootstrap insolvency without accelerating Fame.', candidates: bootstrapCandidates, ranking: bootstrapRanking.map(item => ({ id: item.id, ...item.rankingComponents, passed: item.acceptanceCriteria.passed })), selectedCandidateId: selectedBootstrap.id },
      phase3C: { hypothesis: 'Expiring regional demand saturation reduces Gap-1 gig-frequency dominance without penalising paced touring.', gigFrequencyAnalysis: { control: controlGapProfiles, finalTuning: finalGapProfiles }, gapTradeoff, gigFrequencyValidation, candidates: touringCandidates, ranking: rankCandidates(touringCandidates).map(item => ({ id: item.id, ...item.rankingComponents, passed: item.acceptanceCriteria.passed })), selectedCandidateId: selectedTouring.id, objectiveStatus, objectiveNote },
      phase6E: recoveryPhase
    },
    finalCombinedValidation,
    // The stream each verdict rests on, so a reader never has to infer it. A stream
    // that chose the candidate cannot also be the evidence that it generalises.
    seedStreams: {
      calibration: 'paired candidate-vs-control comparison',
      selection: `candidate search, ${pairsConsidered} of ${orderedPairs.length} pairs measured against the hard caps`,
      validation: 'measured once, on the selected combination only'
    },
    selectionGateValidation: reported.selectionGateValidation ?? null,
    // Both cohorts, side by side. A cap verdict that flips between two equal-size
    // cohorts is not a property of the tuning, and a reader has to be able to see
    // that from the artifact instead of taking one stream's figure as settled.
    selectionBankruptcyByScenario: Object.fromEntries(
      (reported.selectionGateMeasured ?? []).map(scenario => [
        scenario.id,
        {
          ratePct: scenario.holdoutBankruptcy.ratePct,
          count: scenario.holdoutBankruptcy.count,
          sampleSize: scenario.holdoutBankruptcy.sampleSize,
          maximumPct: KPI_TARGETS[scenario.id]?.bankruptcyMax ?? null
        }
      ])
    ),
    // Named where both streams measured the same scenario and disagree about its
    // cap. That is a sample-size statement, not a balance finding.
    capVerdictDisagreements: (reported.selectionGateMeasured ?? [])
      .map(scenario => {
        const cap = KPI_TARGETS[scenario.id]?.bankruptcyMax
        const selectionRate = scenario.holdoutBankruptcy.ratePct
        const validationRate = holdoutBankruptcyByScenario[scenario.id]?.ratePct
        if (cap == null || validationRate == null) return null
        return selectionRate <= cap === validationRate <= cap
          ? null
          : {
              scenarioId: scenario.id,
              maximumPct: cap,
              selectionRatePct: selectionRate,
              validationRatePct: validationRate,
              spreadPct: round(Math.abs(validationRate - selectionRate)),
              note: `Two equal-size cohorts disagree about the ${cap}% cap (${selectionRate}% vs ${validationRate}%). At this sample size the cap is not decidable for this scenario; raise runsPerScenario or revisit the cap before treating either figure as the verdict.`
            }
      })
      .filter(Boolean),
    holdoutSafetyValidation,
    holdoutBankruptcyByScenario,
    designRiskCorridors,
    combinationSearch: {
      strategy: 'ascending-impact-first-clearing-both-gates',
      pairsAvailable: orderedPairs.length,
      pairsEvaluated: pairsConsidered,
      pairsSkipped: combinationsSkipped,
      pairsRejectedBySelectionGate: selectionRejections,
      pairsRejectedByCalibrationGate: calibrationRejections,
      // Selection and reporting are the same thing only when something cleared
      // both gates. Otherwise the artifacts describe the least-impact baseline so
      // the breach is visible, and no lever is being recommended.
      // `fully-validated` may only mean all three gates held. A pair that cleared the
      // search and breached the reserved stream is a different outcome, and leaving
      // it labelled as fully validated made this block disagree with
      // `recommendation.status`.
      selectionOutcome: !selected
        ? 'no-combination-cleared-both-gates'
        : holdoutSafetyValidation.passed
          ? 'fully-validated'
          : 'selection-validated-final-validation-failed',
      selectedFinalValidationFailures: (holdoutSafetyValidation.failures ?? []).map(
        failure => `${failure.scenarioId} ${failure.holdoutValuePct}% > ${failure.maximumPct}%`
      ),
      selectedAppliesNoChange,
      note: SELECTION_RATIONALE
    },
    // No generic `passed` field. It used to mean "cleared calibration and selection",
    // which reads as a release verdict and contradicted
    // `recommendation.status: no-production-recommendation-final-validation-failed`
    // in the same artifact — a parser or a downstream job keying on it would have
    // treated a non-shippable combination as approved. The three facts are now
    // separate, and `finalValidationPassed` is `null` for every combination the
    // reserved stream never judged, which is all but one by design.
    combinationRanking: [...combinations].sort((left, right) =>
      Number(Boolean(right.validation?.passed && right.selectionGateValidation?.passed)) -
        Number(Boolean(left.validation?.passed && left.selectionGateValidation?.passed)) ||
      combinationImpact(left) - combinationImpact(right)
    ).map(item => {
      const isReported =
        item.bootstrap.id === selectedBootstrap.id && item.touring.id === selectedTouring.id
      const selectionPassed = item.selectionGateValidation?.passed ?? null
      const calibrationPassed = item.calibrationEvaluated ? item.validation.passed : null
      const finalValidationPassed = isReported ? holdoutSafetyValidation.passed : null
      return {
        bootstrap: item.bootstrap.id,
        touring: item.touring.id,
        impact: round(combinationImpact(item)),
        // `null` on the calibration side means the pair was rejected by the
        // selection gate before the paired comparison ran, which is different from
        // having failed it.
        calibrationPassed,
        calibrationFailures: item.calibrationEvaluated ? item.validation.failures : null,
        selectionPassed,
        selectionFailures: (item.selectionGateValidation?.failures ?? []).map(
          failure => `${failure.scenarioId} ${failure.holdoutValuePct}% > ${failure.maximumPct}%`
        ),
        finalValidationPassed,
        // Shippable requires all three, and the reserved stream only judged one
        // combination — so this is false everywhere it was never measured.
        shippable: Boolean(calibrationPassed && selectionPassed && finalValidationPassed)
      }
    }),
    recommendation: {
      // Release readiness is decided by the safety gates alone, and there are now
      // two of them. `finalCombinedValidation` judges the candidate against the
      // control on the calibration stream; `holdoutSafetyValidation` judges the
      // shipping tuning against the hard `bankruptcyMax` ceilings on independent
      // seeds. A holdout breach cannot yield any `accepted-for-production-*`
      // status — the measurement is complete, the baseline simply is not safe —
      // but it does not suppress the diagnostic artifacts either. The Phase 3C
      // objective only distinguishes a full from a partial acceptance.
      // A candidate that clears both search gates and then breaches a cap on the
      // untouched validation stream is not a candidate to retry against that stream:
      // searching there is what would destroy its independence. The outcome is "no
      // recommendation", and the next step is a new pre-declared candidate family.
      status: !finalCombinedValidation.passed
        ? 'rejected'
        : !holdoutSafetyValidation.passed
          ? selected
            ? 'no-production-recommendation-final-validation-failed'
            : 'no-production-recommendation-holdout-safety-failed'
          : gigFrequencyValidation.objectiveMet ? 'accepted-for-production' : 'accepted-for-production-partial',
      objectiveStatus,
      objectiveNote,
      bootstrap: selectedBootstrap.id,
      touring: selectedTouring.id,
      tuning: finalTuning,
      // Whether the recommendation is actually shipped. Without this the artifact
      // read as production-ready tuning while `balanceTuning.ts` deliberately kept
      // production neutral, and nothing in the report said so.
      productionHold:
        shippable && BALANCE_RECOMMENDATION_HOLD
          ? {
              adopted: false,
              // `held` and `adopted` are different facts: not shipping because a
              // reviewed hold exists is not the same as a gate refusing. Keying the
              // report's prose on `adopted === false` alone attributed the second
              // case to a hold that was `null` and printed its reason as `null`.
              held: true,
              heldFor: {
                bootstrap: BALANCE_RECOMMENDATION_HOLD.bootstrap,
                touring: BALANCE_RECOMMENDATION_HOLD.touring
              },
              // A hold reviewed against a different pair does not cover this one.
              matchesRecommendation:
                BALANCE_RECOMMENDATION_HOLD.bootstrap === selectedBootstrap.id &&
                BALANCE_RECOMMENDATION_HOLD.touring === selectedTouring.id,
              reason: BALANCE_RECOMMENDATION_HOLD.reason
            }
          : {
              adopted: shippable,
              held: false,
              heldFor: null,
              matchesRecommendation: null,
              reason: null
            }
    },
    runtime: { durationMs: Date.now() - started, candidates: BALANCE_EXPERIMENTS.length, totalRuns }
  }
  report.previousReportComparison = buildPreviousExperimentReportComparison(
    previousReportSnapshot,
    report
  )
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
  if (!report.holdoutSafetyValidation.passed) {
    console.error(`[balance-experiments] holdout safety gate FAILED: ${[(report.holdoutSafetyValidation.failures ?? []).map(failure => `${failure.scenarioId} ${failure.metric} ${failure.holdoutValuePct}% > ${failure.maximumPct}%`).join('; '), (report.holdoutSafetyValidation.missingScenarioIds ?? []).length ? `unmeasured: ${report.holdoutSafetyValidation.missingScenarioIds.join(', ')}` : ''].filter(Boolean).join(' | ') || 'no scenario could be evaluated'}`)
  }
  // Both hard gates decide the exit code. A holdout breach of bankruptcyMax is a
  // release blocker, so it must not exit 0 just because the paired comparison
  // held on the calibration stream.
  process.exit(report.finalCombinedValidation.passed && report.holdoutSafetyValidation.passed ? 0 : 1)
}
