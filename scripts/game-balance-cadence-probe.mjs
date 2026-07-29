/**
 * Phase 5B: independently validate `first-income` against the former
 * `gap-aligned` production control without changing any economy value.
 *
 * The released report has `cult_hypergrowth` at 10.38% insolvency on the
 * calibration stream and 13.85% on the holdout, against a 12% hard cap — and its
 * insolvent runs average 0.04 gigs played, with a median failure on day 4. Those
 * runs fail before the first payout, so the economy the report measures is not
 * what killed them. What decides how many unpaid cost days a run absorbs first is
 * the phase of the gig cadence, and that phase is currently an artifact:
 * `day % gigGapDays === 0` makes a `gigGapDays: 2` scenario decline to play on
 * day 1 and start on day 2.
 *
 * This probe runs the same seeds under all three phases (see
 * `GIG_CADENCE_POLICIES`) and reports the opening of the run rather than its
 * averages. It changes no production value and no shipped scenario: the policy is
 * applied per probe cohort, and `SCENARIOS` keeps its `gap-aligned` default, so
 * the published reports and their config hashes are untouched.
 *
 * Reading the output: a variant that clears the cap is evidence that the phase,
 * not the economy, produced the breach. It is NOT by itself a reason to adopt
 * that variant — the question the verdict asks is which phase the game implies,
 * and "the number improved" does not answer it. The insolvency-before-first-gig
 * share is the discriminator: if it collapses while total insolvency moves little,
 * the opening was the problem.
 *
 * Usage: pnpm run simulate:balance:cadence [--runs <n>] [--no-write]
 */
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { logger, LOG_LEVELS } from '../src/utils/logger.js'
import {
  FAME_EVIDENCE_MIN_SHARE,
  famePerGigWithinLimit,
  pairedFamePerGig
} from './game-balance-experiments.mjs'
import {
  GIG_CADENCE_POLICIES,
  KPI_TARGETS,
  RISK_TARGETS,
  SCENARIOS,
  SIMULATION_CONSTANTS,
  buildHoldoutSafetyValidation,
  calculateAverageFameEarnedPerGig,
  createScenarioSeed,
  getJsonHash,
  runSingleSimulation
} from './game-balance-simulation.mjs'
import { getBalanceSourceHash, getSourceWorkingTreeDirty } from './utils/balance-report-metadata.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_JSON = path.join(ROOT, 'reports/game-balance-cadence-probe-results.json')
const OUTPUT_MARKDOWN = path.join(ROOT, 'reports/game-balance-cadence-probe-analysis.md')
const DIAGNOSTIC_CONTROL_POLICY = 'gap-aligned'

export const PRODUCTION_CADENCE_VALIDATION = Object.freeze({
  policies: Object.freeze(['gap-aligned', 'first-income']),
  seedNamespace: '#production-cadence-validation-v2',
  minimumRunsPerScenario: 2000,
  famePerGigPlayedRunsDeltaMaxPct: 5,
  solventFinalMoneyDeltaMaxPct: 5,
  minimumComparableShare: FAME_EVIDENCE_MIN_SHARE
})

// The breach that motivates the probe is a holdout breach, so that stream is
// measured too — a variant that only helps the calibration cohort has not answered
// the question. Same `#holdout` marker as both published reports, so all three
// artifacts judge the same stream.
//
// `selection` is measured as well, and it is not decoration: the phase conclusion
// would otherwise rest entirely on the one cohort it was found on. Agreement across
// two independent streams is what makes "the phase, not the economy" a finding
// rather than a property of a particular sample. The probe selects nothing, so it
// does not consume the reserved stream's independence — but the eventual cadence
// decision still wants its own confirmation run.
const STREAMS = Object.freeze([
  { id: 'calibration', seedFor: (id, index) => createScenarioSeed(id, index) },
  { id: 'selection', seedFor: (id, index) => createScenarioSeed(`${id}#selection`, index) },
  { id: 'holdout', seedFor: (id, index) => createScenarioSeed(`${id}#holdout`, index) }
])

const round = value => Number(value.toFixed(2))
const mean = values =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
const median = values => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}
const percentile = (values, p) => {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.round((sorted.length - 1) * p)]
}
const rate = (count, total) => round((count / Math.max(1, total)) * 100)
const roundOrNull = value => (value == null ? null : round(value))
const pctDelta = (from, to) =>
  from == null || to == null || from === 0 ? null : round(((to - from) / Math.abs(from)) * 100)
// `pctDelta` is null when a side is missing or the baseline is exactly 0. Folding
// that into the max as 0 would report "not comparable" as "no side effect", which
// is the opposite of a caveat.
const maxAbsDelta = (items, key) => {
  const comparable = items
    .map(item => item[key])
    .filter(value => value != null)
    .map(Math.abs)
  return comparable.length ? round(Math.max(...comparable)) : null
}

/** Scenarios with a hard insolvency cap — the same set the holdout gate covers. */
export const cappedScenarios = () =>
  SCENARIOS.filter(scenario => Number.isFinite(KPI_TARGETS[scenario.id]?.bankruptcyMax))

/**
 * One cohort: a (policy, scenario, stream) cell. Reports the opening of the run
 * next to the tour-level economy, because the whole claim under test is that the
 * two are telling different stories.
 */
export const summarizeCohort = runs => {
  const insolvent = runs.filter(run => run.bankrupt)
  const beforeFirstGig = insolvent.filter(run => run.earlyRunway.bankruptBeforeFirstGig)
  const played = runs.filter(run => run.earlyRunway.firstGigDay != null)
  const solventMoney = runs.filter(run => !run.bankrupt).map(run => run.finalMoney)
  const firstGigDays = played.map(run => run.earlyRunway.firstGigDay)
  return {
    sampleSize: runs.length,
    bankruptcyRatePct: rate(insolvent.length, runs.length),
    bankruptcyCount: insolvent.length,
    // The discriminator. A cap breach carried by this share is an opening
    // problem; one carried by the remainder is an economy problem.
    bankruptBeforeFirstGigCount: beforeFirstGig.length,
    bankruptBeforeFirstGigRatePct: rate(beforeFirstGig.length, runs.length),
    bankruptBeforeFirstGigShareOfInsolvenciesPct: rate(beforeFirstGig.length, insolvent.length),
    neverPlayedCount: runs.length - played.length,
    firstGigDayMedian: median(firstGigDays),
    firstGigDayEarliest: firstGigDays.length ? Math.min(...firstGigDays) : null,
    firstGigDayMean: roundOrNull(mean(firstGigDays)),
    insolventDayMedian: median(insolvent.map(run => run.daysSurvived)),
    insolventDayEarliest: insolvent.length ? Math.min(...insolvent.map(run => run.daysSurvived)) : null,
    insolventGigsPlayedMean: roundOrNull(mean(insolvent.map(run => run.gigsPlayed))),
    moneyBeforeFirstGigMedian: median(played.map(run => run.earlyRunway.moneyBeforeFirstGig)),
    moneyBeforeFirstGigP10: percentile(played.map(run => run.earlyRunway.moneyBeforeFirstGig), 0.1),
    lowestMoneyBeforeFirstGigMedian: median(runs.map(run => run.earlyRunway.lowestMoneyBeforeFirstGig)),
    daysBeforeFirstGigMean: roundOrNull(mean(runs.map(run => run.earlyRunway.daysBeforeFirstGig))),
    obligationsBeforeFirstGigMean: roundOrNull(mean(runs.map(run => run.earlyRunway.obligationsBeforeFirstGig))),
    spendBeforeFirstGigMean: roundOrNull(mean(runs.map(run => run.earlyRunway.spendBeforeFirstGig))),
    blockedTravelBeforeFirstGigRunsPct: rate(
      runs.filter(run => run.earlyRunway.blockedTravelDaysBeforeFirstGig > 0).length,
      runs.length
    ),
    firstBlockedTravelDayMedian: median(
      runs.filter(run => run.earlyRunway.firstBlockedTravel).map(run => run.earlyRunway.firstBlockedTravel.day)
    ),
    firstBlockedTravelReasons: runs.reduce((tally, run) => {
      const reason = run.earlyRunway.firstBlockedTravel?.reason
      if (reason) tally[reason] = (tally[reason] ?? 0) + 1
      return tally
    }, {}),
    // Tour-level economy, so a phase change that quietly moves the payout
    // profile cannot pass as a pure measurement fix.
    gigsPlayedMean: roundOrNull(mean(runs.map(run => run.gigsPlayed))),
    solventFinalMoneyMedian: median(solventMoney),
    solventFinalMoneyP10: percentile(solventMoney, 0.1),
    // `calculateAverageFameEarnedPerGig` scores a run that never played as 0, so
    // any variant that reduces the never-played count raises this figure without
    // a single gig paying more Fame. Kept for comparability with the published
    // reports, which use the same helper; the played-runs figure below is the one
    // a Fame side-effect claim may rest on.
    famePerGig: round(calculateAverageFameEarnedPerGig(runs)),
    famePerGigPlayedRuns: played.length ? round(calculateAverageFameEarnedPerGig(played)) : null,
    finaleReachedPct: rate(runs.filter(run => run.finaleReached).length, runs.length),
    finaleCompletedPct: rate(runs.filter(run => run.finaleCompleted).length, runs.length)
  }
}

export const pairedSolventFinalMoney = pairs => {
  const comparable = pairs.filter(pair => !pair.control.bankrupt && !pair.candidate.bankrupt)
  const minimumSampleSize = Math.max(
    1,
    Math.ceil(pairs.length * PRODUCTION_CADENCE_VALIDATION.minimumComparableShare)
  )
  const sufficientEvidence = comparable.length >= minimumSampleSize
  const control = median(comparable.map(pair => pair.control.finalMoney))
  const candidate = median(comparable.map(pair => pair.candidate.finalMoney))
  return {
    control,
    candidate,
    deltaPct: sufficientEvidence ? pctDelta(control, candidate) : null,
    sampleSize: comparable.length,
    minimumSampleSize,
    sufficientEvidence,
    excludedPairs: pairs.length - comparable.length
  }
}

export const runProductionCadenceValidation = ({
  runsPerScenario = PRODUCTION_CADENCE_VALIDATION.minimumRunsPerScenario,
  runner = runSingleSimulation,
  scenarios = cappedScenarios()
} = {}) => {
  if (runsPerScenario < PRODUCTION_CADENCE_VALIDATION.minimumRunsPerScenario) {
    throw new RangeError(
      `Production cadence validation requires at least ${PRODUCTION_CADENCE_VALIDATION.minimumRunsPerScenario} runs per scenario`
    )
  }

  const runsByPolicy = Object.fromEntries(
    PRODUCTION_CADENCE_VALIDATION.policies.map(policy => [
      policy,
      Object.fromEntries(
        scenarios.map(baseScenario => {
          const scenario = { ...baseScenario, gigCadencePolicy: policy }
          return [
            baseScenario.id,
            Array.from({ length: runsPerScenario }, (_, runIndex) =>
              runner(
                scenario,
                createScenarioSeed(
                  `${baseScenario.id}${PRODUCTION_CADENCE_VALIDATION.seedNamespace}`,
                  runIndex
                )
              )
            )
          ]
        })
      )
    ])
  )
  const cohorts = Object.fromEntries(
    PRODUCTION_CADENCE_VALIDATION.policies.map(policy => [
      policy,
      Object.fromEntries(
        scenarios.map(scenario => [scenario.id, summarizeCohort(runsByPolicy[policy][scenario.id])])
      )
    ])
  )
  const control = cohorts['gap-aligned']
  const candidate = cohorts['first-income']
  const failedGates = []
  const comparisons = Object.fromEntries(
    scenarios.map(scenario => {
      const baseline = control[scenario.id]
      const proposed = candidate[scenario.id]
      const pairs = runsByPolicy['gap-aligned'][scenario.id].map((controlRun, index) => ({
        control: {
          bankrupt: controlRun.bankrupt,
          finalMoney: controlRun.finalMoney,
          fameEarned: controlRun.fameAccounting.earned,
          gigsPlayed: controlRun.gigsPlayed
        },
        candidate: {
          bankrupt: runsByPolicy['first-income'][scenario.id][index].bankrupt,
          finalMoney: runsByPolicy['first-income'][scenario.id][index].finalMoney,
          fameEarned: runsByPolicy['first-income'][scenario.id][index].fameAccounting.earned,
          gigsPlayed: runsByPolicy['first-income'][scenario.id][index].gigsPlayed
        }
      }))
      const fame = pairedFamePerGig(pairs)
      const money = pairedSolventFinalMoney(pairs)
      const comparison = {
        bankruptcyRateDeltaPct: round(proposed.bankruptcyRatePct - baseline.bankruptcyRatePct),
        pairedFamePerGig: fame,
        pairedSolventFinalMoney: money,
        finaleReachedDeltaPct: round(proposed.finaleReachedPct - baseline.finaleReachedPct),
        finaleCompletedDeltaPct: round(
          proposed.finaleCompletedPct - baseline.finaleCompletedPct
        ),
        bankruptBeforeFirstGigRateDeltaPct: round(
          proposed.bankruptBeforeFirstGigRatePct - baseline.bankruptBeforeFirstGigRatePct
        )
      }
      const cap = KPI_TARGETS[scenario.id]?.bankruptcyMax
      if (!Number.isFinite(cap) || proposed.bankruptcyRatePct > cap) {
        failedGates.push(`${scenario.id}:bankruptcy-max`)
      }
      if (
        !famePerGigWithinLimit(
          fame,
          PRODUCTION_CADENCE_VALIDATION.famePerGigPlayedRunsDeltaMaxPct
        )
      ) {
        failedGates.push(`${scenario.id}:fame-per-gig`)
      }
      if (
        !money.sufficientEvidence ||
        Math.abs(money.deltaPct) >
          PRODUCTION_CADENCE_VALIDATION.solventFinalMoneyDeltaMaxPct
      ) {
        failedGates.push(`${scenario.id}:solvent-final-money`)
      }
      if (comparison.finaleCompletedDeltaPct < 0) {
        failedGates.push(`${scenario.id}:finale-completed`)
      }
      if (comparison.bankruptBeforeFirstGigRateDeltaPct > 0) {
        failedGates.push(`${scenario.id}:pre-first-gig-stranded`)
      }
      return [scenario.id, comparison]
    })
  )
  const approvedForProduction = failedGates.length === 0
  const designWarnings = Object.fromEntries(
    scenarios.flatMap(scenario => {
      const corridor = RISK_TARGETS[scenario.id]?.bankruptcyTargetPct
      if (!corridor) return []
      const value = candidate[scenario.id].bankruptcyRatePct
      const classification = value < corridor[0] ? 'below' : value > corridor[1] ? 'above' : 'inside'
      return [[scenario.id, { valuePct: value, corridorPct: corridor, classification }]]
    })
  )

  return {
    productionCadenceValidationVersion: 2,
    runsPerScenario,
    seedNamespace: PRODUCTION_CADENCE_VALIDATION.seedNamespace,
    policies: PRODUCTION_CADENCE_VALIDATION.policies,
    status: approvedForProduction
      ? 'production-cadence-validation-passed'
      : 'no-production-cadence-recommendation-validation-failed',
    approvedForProduction,
    failedGates,
    acceptanceCriteria: {
      allBankruptcyMaxCaps: true,
      famePerGigPlayedRunsDeltaMaxPct:
        PRODUCTION_CADENCE_VALIDATION.famePerGigPlayedRunsDeltaMaxPct,
      solventFinalMoneyDeltaMaxPct:
        PRODUCTION_CADENCE_VALIDATION.solventFinalMoneyDeltaMaxPct,
      minimumComparableShare: PRODUCTION_CADENCE_VALIDATION.minimumComparableShare,
      finaleCompletedMayDecline: false,
      preFirstGigStrandedRateMayIncrease: false
    },
    designWarnings,
    control: { policy: 'gap-aligned', scenarios: control },
    candidate: { policy: 'first-income', scenarios: candidate },
    comparisons
  }
}

export const runCadenceProbe = ({
  runsPerScenario = SIMULATION_CONSTANTS.runsPerScenario,
  runner = runSingleSimulation,
  scenarios = cappedScenarios()
} = {}) => {
  const policies = GIG_CADENCE_POLICIES.map(policy => ({
    policy,
    scenarios: scenarios.map(baseScenario => {
      const scenario = { ...baseScenario, gigCadencePolicy: policy }
      const streams = Object.fromEntries(
        STREAMS.map(stream => [
          stream.id,
          summarizeCohort(
            Array.from({ length: runsPerScenario }, (_, runIndex) =>
              runner(scenario, stream.seedFor(baseScenario.id, runIndex))
            )
          )
        ])
      )
      return {
        scenarioId: baseScenario.id,
        gigGapDays: baseScenario.gigGapDays ?? SIMULATION_CONSTANTS.baseGigGapDays,
        // A gap of 1 plays every day under every phase, so the variants are
        // identical by construction rather than by measurement. Say so, or a
        // reader takes seven unchanged rows for seven confirmations.
        phaseSensitive: (baseScenario.gigGapDays ?? SIMULATION_CONSTANTS.baseGigGapDays) > 1,
        streams
      }
    })
  }))

  // The gate the breach was found on, re-measured per variant. Reuses the
  // published helper so a variant is judged by the same rule the release is.
  const holdoutByPolicy = Object.fromEntries(
    policies.map(entry => [
      entry.policy,
      buildHoldoutSafetyValidation(
        entry.scenarios.map(scenario => ({
          id: scenario.scenarioId,
          holdoutBankruptcy: {
            count: scenario.streams.holdout.bankruptcyCount,
            sampleSize: scenario.streams.holdout.sampleSize,
            ratePct: scenario.streams.holdout.bankruptcyRatePct
          }
        }))
      )
    ])
  )

  const shipped = policies.find(
    entry => entry.policy === DIAGNOSTIC_CONTROL_POLICY
  )
  // Failing loudly beats rendering a report whose baseline silently vanished: with
  // no shipped cohort every delta is null, nothing is `isShipped`, and the shipped
  // policy itself would qualify as a variant that "cleared" the gate.
  if (!shipped) {
    throw new RangeError(
      `Diagnostic control policy ${DIAGNOSTIC_CONTROL_POLICY} is not among the compared policies`
    )
  }
  const cohortOf = (entry, scenarioId, stream) =>
    entry?.scenarios.find(scenario => scenario.scenarioId === scenarioId)?.streams?.[stream]

  // Corridors and caps come from the live configuration: RISK_TARGETS holds the
  // soft design bands, KPI_TARGETS the hard caps. A hardcoded figure here would
  // invert its own verdict the moment either side moved.
  const variants = policies.map(entry => {
    const perScenario = entry.scenarios.map(scenario => {
      const holdout = scenario.streams.holdout
      const base = cohortOf(shipped, scenario.scenarioId, 'holdout')
      const corridor = RISK_TARGETS[scenario.scenarioId]?.bankruptcyTargetPct ?? null
      const cap = KPI_TARGETS[scenario.scenarioId]?.bankruptcyMax ?? null
      return {
        scenarioId: scenario.scenarioId,
        gigGapDays: scenario.gigGapDays,
        phaseSensitive: scenario.phaseSensitive,
        holdoutBankruptcyRatePct: holdout.bankruptcyRatePct,
        shippedHoldoutBankruptcyRatePct: base?.bankruptcyRatePct ?? null,
        hardCapPct: cap,
        withinHardCap: cap == null ? null : holdout.bankruptcyRatePct <= cap,
        designCorridorPct: corridor,
        withinDesignCorridor:
          corridor == null
            ? null
            : holdout.bankruptcyRatePct >= corridor[0] && holdout.bankruptcyRatePct <= corridor[1],
        solventMoneyDeltaPct: pctDelta(base?.solventFinalMoneyMedian, holdout.solventFinalMoneyMedian),
        famePerGigDeltaPct: pctDelta(base?.famePerGig, holdout.famePerGig),
        famePerGigPlayedRunsDeltaPct: pctDelta(
          base?.famePerGigPlayedRuns,
          holdout.famePerGigPlayedRuns
        ),
        gigsPlayedDelta: roundOrNull(
          holdout.gigsPlayedMean == null || base?.gigsPlayedMean == null
            ? null
            : holdout.gigsPlayedMean - base.gigsPlayedMean
        )
      }
    })
    return {
      policy: entry.policy,
      isShipped: entry.policy === DIAGNOSTIC_CONTROL_POLICY,
      holdoutSafetyValidation: holdoutByPolicy[entry.policy],
      // Named separately from the gate because these are diagnostics on the
      // shipped-vs-variant comparison, not release conditions.
      sideEffects: {
        maxAbsSolventMoneyDeltaPct: maxAbsDelta(perScenario, 'solventMoneyDeltaPct'),
        maxAbsFamePerGigDeltaPct: maxAbsDelta(perScenario, 'famePerGigDeltaPct'),
        // The honest Fame comparison: same denominator on both sides. A large
        // gap between this and the figure above is the never-played composition
        // shifting, not Fame per gig moving.
        maxAbsFamePerGigPlayedRunsDeltaPct: maxAbsDelta(
          perScenario,
          'famePerGigPlayedRunsDeltaPct'
        )
      },
      scenariosOutsideDesignCorridor: perScenario
        .filter(item => item.withinDesignCorridor === false)
        .map(item => item.scenarioId),
      scenarios: perScenario
    }
  })

  const cultId = 'cult_hypergrowth'
  const shippedVariant = variants.find(variant => variant.isShipped)
  const cultCap = KPI_TARGETS[cultId]?.bankruptcyMax ?? null
  const cultRateFor = variant =>
    variant.scenarios.find(item => item.scenarioId === cultId)?.holdoutBankruptcyRatePct ?? null
  const shippedCultRate = shippedVariant ? cultRateFor(shippedVariant) : null
  // There is nothing to explain unless the shipped policy actually breaches the
  // cap this probe is about. With a small `--runs`, sampling can put every policy
  // under it — `--runs 1` reads 0% everywhere — and a filter that only asked
  // "which variants pass?" would then publish a FAIL-to-PASS causal claim its own
  // measurements do not support.
  const shippedBreaches =
    shippedVariant != null &&
    !shippedVariant.holdoutSafetyValidation.passed &&
    cultCap != null &&
    shippedCultRate != null &&
    shippedCultRate > cultCap
  const clearing = shippedBreaches
    ? variants.filter(
        variant =>
          !variant.isShipped &&
          variant.holdoutSafetyValidation.passed &&
          (cultRateFor(variant) ?? Infinity) <= cultCap
      )
    : []
  // The same question asked on the independent `selection` cohort. A phase effect
  // that only appears on one stream is a sampling artifact, not a finding.
  // `clearing` holds variants (gate verdicts); the per-stream cohorts live on
  // `policies`. Look the cohort up by policy rather than passing a variant into
  // `cohortOf`, which expects the cohort shape.
  const cultRateOnStream = (policy, stream) =>
    cohortOf(
      policies.find(entry => entry.policy === policy),
      cultId,
      stream
    )?.bankruptcyRatePct ?? null
  const shippedSelectionRate = cultRateOnStream(DIAGNOSTIC_CONTROL_POLICY, 'selection')
  const independentConfirmation = {
    stream: 'selection',
    shippedCultRatePct: shippedSelectionRate,
    variantCultRatePct: Object.fromEntries(
      policies
        .filter(entry => entry.policy !== DIAGNOSTIC_CONTROL_POLICY)
        .map(entry => [entry.policy, cultRateOnStream(entry.policy, 'selection')])
    ),
    // Direction, not magnitude: the streams are different cohorts, so the rates are
    // not expected to match — only the sign of the effect has to.
    agreesWithHoldout:
      shippedBreaches &&
      shippedSelectionRate != null &&
      clearing.length > 0 &&
      clearing.every(variant => {
        const rate = cultRateOnStream(variant.policy, 'selection')
        return rate != null && rate < shippedSelectionRate
      })
  }
  const conclusion = {
    // The question, in one field: did any phase variant turn the failing gate
    // into a passing one on the same seeds — and does a second, independent cohort
    // agree? Reporting a positive conclusion without that agreement would ignore
    // the requirement this probe imposes on itself.
    phaseExplainsBreach: clearing.length > 0 && independentConfirmation.agreesWithHoldout,
    independentConfirmation,
    shippedPolicyBreachesCultCap: shippedBreaches,
    shippedCultHoldoutRatePct: shippedCultRate,
    cultHardCapPct: cultCap,
    clearingPolicies: clearing.map(variant => variant.policy),
    cultBeforeFirstGigShareByPolicy: Object.fromEntries(
      policies.map(entry => [
        entry.policy,
        cohortOf(entry, cultId, 'holdout')?.bankruptBeforeFirstGigShareOfInsolvenciesPct ?? null
      ])
    ),
    cultHoldoutRateByPolicy: Object.fromEntries(
      variants.map(variant => [
        variant.policy,
        variant.scenarios.find(item => item.scenarioId === cultId)?.holdoutBankruptcyRatePct ?? null
      ])
    ),
    verdict: !shippedBreaches
      ? `Nicht auswertbar: Die ausgelieferte Politik \`gap-aligned\` überschreitet die harte Grenze von \`${cultId}\` in diesem Lauf nicht (${
          shippedCultRate == null ? 'nicht gemessen' : `${shippedCultRate}%`
        } gegen ${cultCap == null ? '—' : `${cultCap}%`}). Ohne reproduzierten Bruch gibt es keine Ursache zuzuordnen — bei kleinem \`--runs\` ist das ein Stichprobeneffekt. Mit ${
          SIMULATION_CONSTANTS.runsPerScenario
        } Runs pro Szenario wiederholen.`
      : clearing.length && !independentConfirmation.agreesWithHoldout
        ? `Nicht auswertbar: Eine Phase besteht das Holdout-Gate von \`${cultId}\`, aber der unabhängige \`selection\`-Strom bestätigt die Richtung nicht (\`gap-aligned\` ${
            independentConfirmation.shippedCultRatePct == null
              ? 'nicht gemessen'
              : `${independentConfirmation.shippedCultRatePct}%`
          } gegen ${Object.entries(independentConfirmation.variantCultRatePct)
            .map(([policy, rate]) => `\`${policy}\` ${rate == null ? '—' : `${rate}%`}`)
            .join(' · ')}). Ein Effekt, der nur auf einer Kohorte auftritt, ist ein Stichprobeneffekt und keine Aussage über die Phase.`
        : clearing.length
        ? `Allein die Kadenz-Phase bringt das Holdout-Gate von \`${cultId}\` von FAIL (${shippedCultRate}% gegen ${cultCap}%) auf PASS (${clearing
            .map(variant => `${variant.policy} ${cultRateFor(variant)}%`)
            .join(', ')}). Der Bruch ist mindestens teilweise ein Artefakt der Simulationspolitik. Die Phase ist danach zu entscheiden, was das Spiel vorgibt — erst danach ist messbar, ob überhaupt noch ein Early-Runway-Eingriff nötig ist.`
        : `Der Bruch ist reproduziert (\`gap-aligned\` ${shippedCultRate}% gegen ${cultCap}%), aber keine Kadenz-Phase behebt ihn. Das Eröffnungsrisiko überlebt jede Phase, ist also ein echtes Early-Runway-Problem im Spiel und kein Artefakt der Simulationspolitik — ein Eingriff ist gerechtfertigt.`
  }

  return {
    cadenceProbeVersion: 1,
    runsPerScenario,
    policies: GIG_CADENCE_POLICIES,
    streams: STREAMS.map(stream => stream.id),
    // Derived from STREAMS so a newly added cohort cannot go undocumented.
    seedStrategy: STREAMS.map(stream =>
      stream.id === 'calibration'
        ? 'calibration: scenario-id-plus-run-index'
        : `${stream.id}: scenario-id#${stream.id === 'holdout' ? 'holdout' : stream.id}-plus-run-index`
    ).join('; '),
    conclusion,
    variants,
    cohorts: policies
  }
}

const fmtEur = value => (value == null ? '—' : `€${Math.round(value).toLocaleString('de-DE')}`)
const fmtPct = value => (value == null ? '—' : `${value}%`)
const gate = passed => (passed ? 'PASS' : 'FAIL')

export const renderCadenceMarkdown = report => {
  const cult = 'cult_hypergrowth'
  const rows = policy => report.cohorts.find(entry => entry.policy === policy)
  return `# Gig-Kadenz-Phasenvergleich (Phase 5, Schritt 1)

Erzeugt: ${report.generatedAt ?? '—'}
Runs pro Szenario und Stream: ${report.runsPerScenario} · Streams: ${report.streams.join(', ')}
Seed-Strategie: \`${report.seedStrategy}\`

## Frage

Der Holdout-Bruch in \`${cult}\` entsteht in Runs, die **vor dem ersten bezahlten Gig** insolvent werden. Wie viele unbezahlte Kostentage davor liegen, entscheidet die *Phase* der Gig-Kadenz — und die ist derzeit ein Artefakt: \`day % gigGapDays === 0\` lässt ein Szenario mit \`gigGapDays: 2\` an Tag 1 bewusst nicht spielen.

Verglichen werden drei Phasen auf **denselben Seeds**:

| Variante | Politik | Auftrittstage bei \`gigGapDays: 2\` |
| --- | --- | --- |
| A (ausgeliefert) | \`gap-aligned\` | 2, 4, 6, 8, 10 |
| B | \`gap-offset\` | 1, 3, 5, 7, 9 |
| C | \`first-income\` | erster erreichbarer Gig, danach Zweierkadenz ab diesem Tag |

Bei \`gigGapDays: 1\` sind alle drei identisch — solche Zeilen sind keine Bestätigung, sondern konstruktionsbedingt gleich.

## Ergebnis des Holdout-Gates je Variante

| Variante | Holdout-Gate | Verletzungen | max. Δ Geld (solvent) | max. Δ Fame/Gig (alle Runs) | max. Δ Fame/Gig (nur Runs mit Gig) |
| --- | --- | --- | --- | --- | --- |
${report.variants
  .map(
    variant =>
      `| \`${variant.policy}\`${variant.isShipped ? ' (aktuell)' : ''} | **${gate(
        variant.holdoutSafetyValidation.passed
      )}** | ${
        variant.holdoutSafetyValidation.failures.length
          ? variant.holdoutSafetyValidation.failures
              .map(failure => `\`${failure.scenarioId}\` ${failure.holdoutValuePct}% > ${failure.maximumPct}%`)
              .join('; ')
          : '—'
      } | ${fmtPct(variant.sideEffects.maxAbsSolventMoneyDeltaPct)} | ${fmtPct(variant.sideEffects.maxAbsFamePerGigDeltaPct)} | ${fmtPct(variant.sideEffects.maxAbsFamePerGigPlayedRunsDeltaPct)} |`
  )
  .join('\n')}

> Die beiden Fame-Spalten müssen zusammen gelesen werden. \`calculateAverageFameEarnedPerGig\` bewertet einen Run ohne jeden Gig mit 0, also hebt jede Variante, die die Zahl der gig-losen Runs senkt, den Wert über alle Runs an, ohne dass ein einziger Gig mehr Fame zahlt. Nur die rechte Spalte vergleicht denselben Nenner.

## \`${cult}\`: der Lauf vor dem ersten Gig (Holdout-Stream)

| Kennzahl | ${report.policies.map(policy => `\`${policy}\``).join(' | ')} |
| --- | ${report.policies.map(() => '---').join(' | ')} |
${[
  ['Insolvenzrate', cohort => fmtPct(cohort.bankruptcyRatePct)],
  ['davon vor dem ersten Gig', cohort => `${cohort.bankruptBeforeFirstGigCount} (${cohort.bankruptBeforeFirstGigShareOfInsolvenciesPct}%)`],
  ['Insolvenz vor erstem Gig (Rate)', cohort => fmtPct(cohort.bankruptBeforeFirstGigRatePct)],
  ['Tag des ersten Gigs (Median)', cohort => cohort.firstGigDayMedian ?? '—'],
  ['frühester erster Gig', cohort => cohort.firstGigDayEarliest ?? '—'],
  ['Runs ohne jeden Gig', cohort => cohort.neverPlayedCount],
  ['Ø Tage ohne Einnahme vor erstem Gig', cohort => cohort.daysBeforeFirstGigMean ?? '—'],
  ['Geld direkt vor erstem Gig (Median)', cohort => fmtEur(cohort.moneyBeforeFirstGigMedian)],
  ['Geld direkt vor erstem Gig (P10)', cohort => fmtEur(cohort.moneyBeforeFirstGigP10)],
  ['Ø Verpflichtungen vor erstem Gig', cohort => fmtEur(cohort.obligationsBeforeFirstGigMean)],
  ['Ø Ausgaben vor erstem Gig', cohort => fmtEur(cohort.spendBeforeFirstGigMean)],
  ['Runs mit blockierter Reise vor erstem Gig', cohort => fmtPct(cohort.blockedTravelBeforeFirstGigRunsPct)],
  ['erste blockierte Reise (Median-Tag)', cohort => cohort.firstBlockedTravelDayMedian ?? '—'],
  ['Ø Gigs', cohort => cohort.gigsPlayedMean ?? '—'],
  ['solventes Endgeld (Median)', cohort => fmtEur(cohort.solventFinalMoneyMedian)],
  ['Fame/Gig (alle Runs)', cohort => cohort.famePerGig],
  ['Fame/Gig (nur Runs mit Gig)', cohort => cohort.famePerGigPlayedRuns ?? '—']
]
  .map(
    ([label, read]) =>
      `| ${label} | ${report.policies
        .map(policy => {
          const cohort = rows(policy)?.scenarios.find(item => item.scenarioId === cult)?.streams.holdout
          return cohort ? read(cohort) : '—'
        })
        .join(' | ')} |`
  )
  .join('\n')}

## Alle Szenarien, Holdout-Insolvenz je Variante

| Szenario | Gap | ${report.policies.map(policy => `\`${policy}\``).join(' | ')} | harte Grenze | Designkorridor |
| --- | --- | ${report.policies.map(() => '---').join(' | ')} | --- | --- |
${(report.variants[0]?.scenarios ?? [])
  .map(scenario => {
    const cells = report.variants.map(variant => {
      const item = variant.scenarios.find(entry => entry.scenarioId === scenario.scenarioId)
      return `${fmtPct(item?.holdoutBankruptcyRatePct)}${item?.withinHardCap === false ? ' ❌' : ''}`
    })
    return `| \`${scenario.scenarioId}\` | ${scenario.gigGapDays}${
      scenario.phaseSensitive ? '' : ' (phasenneutral)'
    } | ${cells.join(' | ')} | ${fmtPct(scenario.hardCapPct)} | ${
      scenario.designCorridorPct ? `${scenario.designCorridorPct[0]}–${scenario.designCorridorPct[1]}%` : '—'
    } |`
  })
  .join('\n')}

## Schlussfolgerung

${report.conclusion.verdict}

${report.variants
    .map(variant => {
      const below = variant.scenarios.filter(
        item =>
          item.withinDesignCorridor === false &&
          item.designCorridorPct &&
          item.holdoutBankruptcyRatePct < item.designCorridorPct[0]
      )
      const above = variant.scenarios.filter(
        item =>
          item.withinDesignCorridor === false &&
          item.designCorridorPct &&
          item.holdoutBankruptcyRatePct > item.designCorridorPct[1]
      )
      // Which side of the corridor a scenario misses on decides the response, and
      // "outside the corridor" alone reads as too risky in both directions.
      return `- \`${variant.policy}\`: ${above.length ? `über dem Designkorridor: ${above.map(item => `\`${item.scenarioId}\``).join(', ')}` : 'kein Szenario über dem Designkorridor'}; ${
        below.length ? `unter dem Designkorridor: ${below.map(item => `\`${item.scenarioId}\``).join(', ')}` : 'kein Szenario unter dem Designkorridor'}`
    })
    .join('\n')}

Die Designkorridore (\`RISK_TARGETS\`) sind an der ausgelieferten Phase kalibriert. Verschiebt die Phase das Risiko um eine Größenordnung, sagt eine Korridorverletzung zuerst etwas über die Phase und erst danach über das Szenariodesign — die Korridore sollten deshalb nicht an eine Variante angepasst werden, deren Phase noch nicht entschieden ist.

Anteil der Insolvenzen, die vor dem ersten Gig eintreten (\`${cult}\`, Holdout): ${Object.entries(
    report.conclusion.cultBeforeFirstGigShareByPolicy
  )
    .map(([policy, share]) => `\`${policy}\` ${fmtPct(share)}`)
    .join(' · ')}

Bestätigung auf dem unabhängigen \`selection\`-Strom: ${
    report.conclusion.independentConfirmation?.agreesWithHoldout
      ? `**ja** — \`gap-aligned\` ${fmtPct(report.conclusion.independentConfirmation.shippedCultRatePct)} gegen ${Object.entries(
          report.conclusion.independentConfirmation.variantCultRatePct
        )
          .map(([policy, rate]) => `\`${policy}\` ${fmtPct(rate)}`)
          .join(' · ')}. Der Effekt ist damit nicht an die Kohorte gebunden, auf der er gefunden wurde.`
      : '**nein** — der Effekt zeigt sich nicht in derselben Richtung auf dem zweiten Strom, ist also möglicherweise ein Stichprobeneffekt.'
  }

> Diese Auswertung ändert keinen Produktionswert. Sie entscheidet nur, ob der nächste Schritt eine Korrektur der Simulationspolitik oder ein echter Early-Runway-Eingriff ist. Eine Variante, die das Gate besteht, ist Evidenz — kein Grund, sie deshalb zu übernehmen: die Phase muss zu dem passen, was das Spiel vorgibt.
`
}

export const renderProductionCadenceMarkdown = report => {
  const scenarioRows = Object.keys(report.candidate.scenarios)
    .map(id => {
      const control = report.control.scenarios[id]
      const candidate = report.candidate.scenarios[id]
      const comparison = report.comparisons[id]
      return `| \`${id}\` | ${fmtPct(control.bankruptcyRatePct)} | ${fmtPct(candidate.bankruptcyRatePct)} | ${fmtPct(comparison.pairedFamePerGig.deltaPct)} (${comparison.pairedFamePerGig.sampleSize}) | ${fmtPct(comparison.pairedSolventFinalMoney.deltaPct)} (${comparison.pairedSolventFinalMoney.sampleSize}) | ${fmtPct(comparison.finaleReachedDeltaPct)} | ${fmtPct(comparison.finaleCompletedDeltaPct)} | ${fmtPct(comparison.bankruptBeforeFirstGigRateDeltaPct)} |`
    })
    .join('\n')
  return `# Produktionsvalidierung der First-Income-Kadenz (Phase 5B)

Erzeugt: ${report.generatedAt ?? '—'}
Runs pro Szenario: ${report.runsPerScenario}
Seed-Namensraum: \`${report.seedNamespace}\`

## Vorab festgelegter Vergleich

- Kontrolle: \`gap-aligned\`
- Produktionskandidat: \`first-income\`
- Economy-Tuning: unverändert

| Szenario | Insolvenz Kontrolle | Insolvenz Kandidat | gepaartes Δ Fame/Gig (n) | gepaartes Δ solventes Endgeld (n) | Δ Finale erreicht | Δ Finale abgeschlossen | Δ Insolvenz vor erstem Gig |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${scenarioRows}

## Nicht blockierende Designhinweise

Die Korridore aus \`RISK_TARGETS\` bleiben Designhypothesen. Sie werden vollständig aus der Live-Konfiguration abgeleitet und blockieren diese Freigabe nicht.

${Object.entries(report.designWarnings)
  .map(([id, warning]) => `- \`${id}\`: ${fmtPct(warning.valuePct)} gegenüber ${warning.corridorPct[0]}–${warning.corridorPct[1]}% — **${warning.classification}**`)
  .join('\n')}

## Entscheidung

Status: **${report.status}**

Freigabe für Produktion: **${report.approvedForProduction ? 'ja' : 'nein'}**

Fehlgeschlagene Gates: ${report.failedGates.length ? report.failedGates.map(item => `\`${item}\``).join(', ') : 'keine'}

Die Validierung verändert keine Geldwerte. Ein fehlgeschlagenes Gate führt geschlossen zu keiner Produktionsempfehlung; es wird kein Ersatzkandidat auf diesem Seed-Strom gesucht.
`
}

const hashFile = async file =>
  crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex')

const git = command => {
  try {
    return execSync(command, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return null
  }
}
const gitRevision = () => process.env.GITHUB_SHA ?? git('git rev-parse HEAD')
const gitWorkingTreeDirty = () => getSourceWorkingTreeDirty(ROOT)

const parseArgs = argv => {
  const options = {
    write: true,
    runsPerScenario: PRODUCTION_CADENCE_VALIDATION.minimumRunsPerScenario
  }
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--no-write') options.write = false
    if (argv[index] === '--runs' && argv[index + 1]) {
      const runs = Number(argv[index + 1])
      if (!Number.isInteger(runs) || runs < 1) {
        throw new RangeError(`--runs expects a positive integer, received ${argv[index + 1]}`)
      }
      options.runsPerScenario = runs
      index += 1
    }
  }
  return options
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  logger.setLevel(LOG_LEVELS.ERROR)
  const options = parseArgs(process.argv.slice(2))
  const started = Date.now()
  const report = {
    ...runProductionCadenceValidation({ runsPerScenario: options.runsPerScenario }),
    generatedAt: new Date().toISOString(),
    metadata: {
      nodeVersion: process.version,
      // Same provenance the simulation and experiment artifacts carry. This report
      // holds the PR's central conclusion, so "which source state produced it" has
      // to be answerable from the file alone.
      sourceBaseCommit: gitRevision(),
      workingTreeDirty: gitWorkingTreeDirty(),
      // The shared list covers everything that can move a balance number; this
      // script's own contents decide what is measured, so it is hashed here
      // rather than added to that list — it cannot move the published simulation
      // or experiment numbers, and claiming otherwise would invent a dependency.
      cadenceProbeScriptSha256: await hashFile(fileURLToPath(import.meta.url)),
      balanceSourceSha256: await getBalanceSourceHash(ROOT),
      scenarioConfigSha256: getJsonHash(SCENARIOS),
      kpiConfigSha256: getJsonHash(KPI_TARGETS),
      riskTargetConfigSha256: getJsonHash(RISK_TARGETS)
    }
  }
  report.runtime = { durationMs: Date.now() - started }
  if (options.write) {
    await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true })
    await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(report, null, 2)}\n`)
    await fs.writeFile(OUTPUT_MARKDOWN, renderProductionCadenceMarkdown(report))
  }
  console.log(`[cadence-probe] ${report.runtime.durationMs} ms · ${report.status}`)
  console.log(
    `[cadence-probe] failed gates: ${report.failedGates.length ? report.failedGates.join(', ') : 'none'}`
  )
}
