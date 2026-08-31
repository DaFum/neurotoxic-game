import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  buildArtifactMetadata,
  validateArtifactMetadata
} from './utils/balance-report-metadata.mjs'

import {
  LOSS_ATTRIBUTION_SOURCES,
  SCENARIOS,
  SCENARIO_TENSION_TARGETS,
  buildScenarioTensionReview,
  createScenarioSeed,
  runSingleSimulation,
  summarizeScenario
} from './game-balance-simulation.mjs'
import {
  famePerGigWithinLimit,
  pairedFamePerGig
} from './game-balance-experiments.mjs'

export const TENSION_RUNS_PER_SCENARIO = 2_000
export const ATTRIBUTION_COHORTS = Object.freeze({
  calibration: '#scenario-tension-attribution-v1',
  holdout: '#scenario-tension-attribution-v1#holdout'
})
export const CONTROVERSY_PROFILES = Object.freeze([0, 50, 65, 80])
export const CHAOS_EVENT_LOSS_CANDIDATE = Object.freeze({
  id: 'negative-financial-events-1.25',
  scenarioId: 'chaos_tour',
  negativeFinancialEventMultiplier: 1.25,
  productionChange: false
})
const GROSS_SPEND_SOURCES = [
  'modifierGrossSpend',
  'venueGrossSpend',
  'taxGrossSpend',
  'otherGrossSpend'
]

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GENERATOR_PATHS = Object.freeze([
  'scripts/game-balance-tension-report.mjs',
  'scripts/game-balance-experiments.mjs',
  'scripts/game-balance-experiment-config.mjs',
  'scripts/game-balance-simulation.mjs',
  'scripts/utils/paired-statistics.mjs',
  'scripts/utils/balance-report-metadata.mjs'
])

export const buildReportMetadata = () =>
  buildArtifactMetadata({
    root: ROOT,
    generatorPaths: GENERATOR_PATHS,
    seedNamespace: ATTRIBUTION_COHORTS.calibration,
    runsPerScenario: TENSION_RUNS_PER_SCENARIO
  })

const insufficientDecision = rationale => ({
  status: 'insufficient_evidence',
  productionChange: false,
  rationale
})

const phaseDecision = (evidence, completeStatus, rationale) =>
  evidence?.complete
    ? { status: completeStatus, productionChange: false, rationale }
    : insufficientDecision(evidence?.reason ?? rationale)

export const createEvidenceResult = (complete, reason, fields = {}) => ({
  complete,
  ...fields,
  ...(complete ? {} : { reason })
})

export const hasCompleteTensionEvidence = (
  scenarios,
  calibrationReview,
  holdoutReview
) =>
  scenarios.length > 0 &&
  calibrationReview.scenarios.length === scenarios.length &&
  holdoutReview.scenarios.length === scenarios.length &&
  calibrationReview.scenarios.every(calibration => {
    const holdout = holdoutReview.scenarios.find(
      scenario => scenario.id === calibration.id
    )
    return (
      holdout &&
      Object.values(calibration.metrics).every(
        metric => metric.status !== 'insufficient_evidence'
      ) &&
      Object.values(holdout.metrics).every(
        metric => metric.status !== 'insufficient_evidence'
      )
    )
  })

export const reviewsDifferForScenarioIds = (
  calibrationReview,
  holdoutReview,
  scenarioIds
) =>
  scenarioIds.some(id => {
    const calibration = calibrationReview.scenarios.find(item => item.id === id)
    const holdout = holdoutReview.scenarios.find(item => item.id === id)
    if (!calibration || !holdout) return false
    return Object.entries(calibration.metrics).some(
      ([metric, result]) => result.status !== holdout.metrics[metric]?.status
    )
  })

const finiteOrNull = value => value === null || Number.isFinite(value)
const completeStats = (entry, includeShares) =>
  entry &&
  Number.isFinite(entry.total) &&
  Number.isFinite(entry.median) &&
  Number.isFinite(entry.p90) &&
  (!includeShares ||
    (finiteOrNull(entry.firstMaterialDrawdownSharePct) &&
      finiteOrNull(entry.bankruptcyPredecessorSharePct)))

export const hasCompleteAttributionEvidence = summary =>
  LOSS_ATTRIBUTION_SOURCES.every(source =>
    completeStats(summary?.actualLossAttribution?.[source], true)
  ) &&
  GROSS_SPEND_SOURCES.every(source =>
    completeStats(summary?.grossSpendAttribution?.[source], false)
  )

export const hasCompleteControversyEvidence = profiles =>
  profiles.length === CONTROVERSY_PROFILES.length &&
  CONTROVERSY_PROFILES.every(level => {
    const summary = profiles.find(
      profile => profile.controversyLevel === level
    )?.summary
    return (
      summary?.bankruptcy?.sampleSize === TENSION_RUNS_PER_SCENARIO &&
      Number.isFinite(summary.bankruptcy.ratePct) &&
      Number.isFinite(summary.tourPaths?.finaleCompletedPct) &&
      Number.isFinite(summary.avgFinalControversy)
    )
  })

export const hasCompleteScenarioReviewEvidence = (
  calibrationReview,
  holdoutReview,
  scenarioIds
) =>
  scenarioIds.every(id =>
    [calibrationReview, holdoutReview].every(review => {
      const scenario = review.scenarios.find(item => item.id === id)
      const metrics = Object.values(scenario?.metrics ?? {})
      return (
        metrics.length > 0 &&
        metrics.every(
          metric =>
            metric.status !== 'insufficient_evidence' &&
            Number.isFinite(metric.observed)
        )
      )
    })
  )

export const validateReportProvenance = report =>
  validateArtifactMetadata(report?.metadata, {
    root: ROOT,
    generatorPaths: GENERATOR_PATHS,
    seedNamespace: ATTRIBUTION_COHORTS.calibration,
    runsPerScenario: TENSION_RUNS_PER_SCENARIO
  })

export const buildPhaseDecisions = evidence => ({
  phase6B: phaseDecision(
    evidence.lossAttributionEvidence,
    'diagnostic_complete',
    'Chaos actual-loss attribution is complete; no candidate was selected.'
  ),
  phase6C: phaseDecision(
    evidence.controversyEvidence,
    'diagnostic_complete',
    'All controversy profiles are measured; no runtime value changed.'
  ),
  phase6D: phaseDecision(
    evidence.bootstrapFestivalEvidence,
    evidence.bootstrapFestivalEvidence?.status === 'unstable'
      ? 'boundary_uncertain'
      : 'diagnostic_complete',
    'Bootstrap and Festival evidence is complete; corridor differences remain diagnostic.'
  ),
  phase7: phaseDecision(
    evidence.progressionEvidence,
    'diagnostic_complete',
    'Progression evidence is complete; no production value changed.'
  )
})

const runCohort = (scenario, namespace) => {
  const runs = Array.from({ length: TENSION_RUNS_PER_SCENARIO }, (_, index) =>
    runSingleSimulation(
      scenario,
      createScenarioSeed(`${scenario.id}${namespace}`, index)
    )
  )
  return summarizeScenario(runs)
}

export const buildChaosCandidateAcceptance = ({
  candidate,
  famePerGig,
  materialLossSources
}) => {
  const criteria = {
    bankruptcy:
      candidate.financialStress.bankruptcyRatePct >= 4 &&
      candidate.financialStress.bankruptcyRatePct <= 7,
    bankruptcyBeforeFirstGig:
      candidate.financialStress.bankruptcyBeforeFirstGigPct <= 1,
    finaleCompleted: candidate.tourPaths.finaleCompletedPct >= 90,
    famePerGig: famePerGigWithinLimit(famePerGig, 5),
    negativeEventsMaterial: materialLossSources.includes('negative_events')
  }
  return { criteria, passed: Object.values(criteria).every(Boolean) }
}

export const buildChaosCandidateComparison = scenario => {
  const namespace = `${ATTRIBUTION_COHORTS.calibration}#chaos-event-loss-1.25`
  const pairs = Array.from(
    { length: TENSION_RUNS_PER_SCENARIO },
    (_, index) => {
      const seed = createScenarioSeed(`${scenario.id}${namespace}`, index)
      return {
        control: runSingleSimulation(scenario, seed),
        candidate: runSingleSimulation(
          {
            ...scenario,
            negativeFinancialEventMultiplier:
              CHAOS_EVENT_LOSS_CANDIDATE.negativeFinancialEventMultiplier
          },
          seed
        )
      }
    }
  )
  const control = summarizeScenario(pairs.map(pair => pair.control))
  const candidate = summarizeScenario(pairs.map(pair => pair.candidate))
  const famePerGig = pairedFamePerGig(
    pairs.map(pair => ({
      control: {
        gigsPlayed: pair.control.gigsPlayed,
        fameEarned: pair.control.fameAccounting.earned
      },
      candidate: {
        gigsPlayed: pair.candidate.gigsPlayed,
        fameEarned: pair.candidate.fameAccounting.earned
      }
    }))
  )
  const materialLossSources = Object.entries(candidate.actualLossAttribution)
    .sort(([, left], [, right]) => right.total - left.total)
    .slice(0, 3)
    .map(([source]) => source)
  const acceptance = buildChaosCandidateAcceptance({
    candidate,
    famePerGig,
    materialLossSources
  })
  return {
    candidate: CHAOS_EVENT_LOSS_CANDIDATE,
    seedNamespace: namespace,
    control,
    result: candidate,
    pairedFamePerGig: famePerGig,
    materialLossSources,
    acceptance
  }
}

export const buildTensionReport = async () => {
  const scenarios = SCENARIOS.filter(
    scenario => SCENARIO_TENSION_TARGETS[scenario.id]
  )
  const cohorts = Object.fromEntries(
    Object.entries(ATTRIBUTION_COHORTS).map(([name, namespace]) => [
      name,
      scenarios.map(scenario => ({
        id: scenario.id,
        name: scenario.name,
        summary: runCohort(scenario, namespace)
      }))
    ])
  )
  const calibrationReview = buildScenarioTensionReview({
    results: cohorts.calibration,
    minimumSampleSize: TENSION_RUNS_PER_SCENARIO
  })
  const holdoutReview = buildScenarioTensionReview({
    results: cohorts.holdout,
    minimumSampleSize: TENSION_RUNS_PER_SCENARIO
  })
  const scandal = scenarios.find(scenario => scenario.id === 'scandal_recovery')
  const controversyComparison = scandal
    ? CONTROVERSY_PROFILES.map(level => ({
        controversyLevel: level,
        summary: runCohort(
          {
            ...scandal,
            initialOverrides: {
              ...scandal.initialOverrides,
              social: {
                ...scandal.initialOverrides?.social,
                controversyLevel: level
              }
            }
          },
          `${ATTRIBUTION_COHORTS.calibration}#controversy-${level}`
        )
      }))
    : []
  const tensionComplete = hasCompleteTensionEvidence(
    scenarios,
    calibrationReview,
    holdoutReview
  )
  const tensionUnstable =
    tensionComplete &&
    reviewsDifferForScenarioIds(
      calibrationReview,
      holdoutReview,
      scenarios.map(scenario => scenario.id)
    )
  const summariesFor = id =>
    [cohorts.calibration, cohorts.holdout].map(
      stream => stream.find(scenario => scenario.id === id)?.summary
    )
  const completeSamples = summaries =>
    summaries.every(
      summary => summary?.bankruptcy?.sampleSize === TENSION_RUNS_PER_SCENARIO
    )
  const chaosSummaries = summariesFor('chaos_tour')
  const chaos = scenarios.find(scenario => scenario.id === 'chaos_tour')
  const chaosCandidateComparison = chaos
    ? buildChaosCandidateComparison(chaos)
    : null
  const bootstrapFestivalSummaries = [
    ...summariesFor('bootstrap_struggle'),
    ...summariesFor('festival_push')
  ]
  const controversyComplete = hasCompleteControversyEvidence(
    controversyComparison
  )
  const progressionFieldsPresent = bootstrapFestivalSummaries.every(summary => {
    const paths = summary?.purchasePaths
    return (
      paths &&
      Number.isFinite(paths.firstPurchaseDayMedian) &&
      Number.isFinite(paths.avgLiquidityDeferrals) &&
      Number.isFinite(paths.catalogSharePurchasedPct) &&
      Number.isFinite(paths.avgResidualMoneyAfterPurchase) &&
      Number.isFinite(summary.gigsToAffordHqUpgrade) &&
      Number.isFinite(summary.gigsToAffordVanUpgrade) &&
      Number.isFinite(paths.modulePaybackGigs)
    )
  })
  const evidence = {
    tensionEvidence: {
      complete: tensionComplete,
      status: tensionUnstable
        ? 'unstable'
        : tensionComplete
          ? 'stable'
          : 'insufficient_evidence'
    },
    lossAttributionEvidence: createEvidenceResult(
      completeSamples(chaosSummaries) &&
        chaosSummaries.every(hasCompleteAttributionEvidence),
      'Chaos actual-loss attribution is incomplete.'
    ),
    controversyEvidence: createEvidenceResult(
      controversyComplete,
      'All 0/50/65/80 controversy cohorts with 2,000 runs are required.'
    ),
    bootstrapFestivalEvidence: createEvidenceResult(
      completeSamples(bootstrapFestivalSummaries) &&
        hasCompleteScenarioReviewEvidence(calibrationReview, holdoutReview, [
          'bootstrap_struggle',
          'festival_push'
        ]),
      'Bootstrap and Festival cohorts are incomplete.',
      {
        status: reviewsDifferForScenarioIds(calibrationReview, holdoutReview, [
          'bootstrap_struggle',
          'festival_push'
        ])
          ? 'unstable'
          : 'stable'
      }
    ),
    progressionEvidence: createEvidenceResult(
      completeSamples(bootstrapFestivalSummaries) && progressionFieldsPresent,
      'Progression requires purchase timing, deferrals, catalogue share, residual money, and HQ/van/module payback.'
    )
  }
  return {
    generatedAt: new Date().toISOString(),
    metadata: await buildReportMetadata(),
    contract: {
      runsPerScenario: TENSION_RUNS_PER_SCENARIO,
      cohorts: ATTRIBUTION_COHORTS,
      candidateSelection: false
    },
    cohorts,
    controversyComparison,
    chaosCandidateComparison,
    tensionReview: { calibration: calibrationReview, holdout: holdoutReview },
    evidence,
    decisions: buildPhaseDecisions(evidence)
  }
}

const buildMarkdown = report => {
  const scenarioRows = report.cohorts.calibration.flatMap(calibration => {
    const holdout = report.cohorts.holdout.find(
      item => item.id === calibration.id
    )
    return [
      `| ${calibration.name} | Calibration | ${calibration.summary.financialStress.bankruptcyRatePct}% | ${calibration.summary.financialStress.bankruptcyBeforeFirstGigPct}% | ${calibration.summary.financialStress.bankruptcyAfterFirstGigPct}% | ${calibration.summary.financialStress.everBelowTightPct}% | ${calibration.summary.financialStress.p90MaxDrawdownPct}% | ${calibration.summary.tourPaths.finaleCompletedPct}% |`,
      `| ${holdout.name} | Holdout | ${holdout.summary.financialStress.bankruptcyRatePct}% | ${holdout.summary.financialStress.bankruptcyBeforeFirstGigPct}% | ${holdout.summary.financialStress.bankruptcyAfterFirstGigPct}% | ${holdout.summary.financialStress.everBelowTightPct}% | ${holdout.summary.financialStress.p90MaxDrawdownPct}% | ${holdout.summary.tourPaths.finaleCompletedPct}% |`
    ]
  })
  const lossRows = report.cohorts.calibration.map(scenario => {
    const top = Object.entries(scenario.summary.actualLossAttribution)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 3)
      .map(([source, values]) => `${source}: €${values.total}`)
      .join('; ')
    return `| ${scenario.name} | ${top} |`
  })
  const controversyRows = report.controversyComparison.map(
    profile =>
      `| ${profile.controversyLevel} | ${profile.summary.bankruptcy.ratePct}% | ${profile.summary.avgFinalControversy} | ${profile.summary.tourPaths.finaleCompletedPct}% |`
  )
  const progressionRows = report.cohorts.calibration.map(scenario => {
    const paths = scenario.summary.purchasePaths
    return `| ${scenario.name} | ${paths.firstPurchaseDayMedian ?? '—'} | ${paths.catalogSharePurchasedPct}% | ${paths.avgLiquidityDeferrals} | €${paths.avgResidualMoneyAfterPurchase ?? '—'} | ${scenario.summary.gigsToAffordHqUpgrade}/${scenario.summary.gigsToAffordVanUpgrade}/— |`
  })
  const chaos = report.chaosCandidateComparison
  return [
    '# Phase 6A-7 Scenario Tension Diagnostics',
    '',
    `Generated: ${report.generatedAt}`,
    `Source fingerprint: ${report.metadata.sourceFingerprint}; generator fingerprint: ${report.metadata.generatorFingerprint}; schema: ${report.metadata.artifactSchemaVersion}; dirty: ${report.metadata.workingTreeDirty}`,
    `Cohorts: ${report.contract.runsPerScenario} runs each; calibration ${report.contract.cohorts.calibration}; holdout ${report.contract.cohorts.holdout}; candidate selection: ${report.contract.candidateSelection}.`,
    '',
    '## Tension matrix',
    '',
    '| Scenario | Cohort | Bankruptcy | Before gig | After gig | Ever <€500 | P90 drawdown | Finale completed |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...scenarioRows,
    '',
    `Cohort comparison: **${report.evidence.tensionEvidence.status}**. Corridor differences are diagnostic, not missing evidence.`,
    '',
    '## Top actual loss sources (Calibration)',
    '',
    '| Scenario | Top 3 |',
    '| --- | --- |',
    ...lossRows,
    '',
    'Gross gig spending is published separately in JSON under `grossSpendAttribution` and never drives drawdown fields.',
    '',
    '## Chaos event-loss candidate',
    '',
    chaos
      ? `Diagnostic only: ×${chaos.candidate.negativeFinancialEventMultiplier}; production change: ${chaos.candidate.productionChange ? 'yes' : 'no'}; bankruptcy: ${chaos.result.financialStress.bankruptcyRatePct}%; before first gig: ${chaos.result.financialStress.bankruptcyBeforeFirstGigPct}%; finale completed: ${chaos.result.tourPaths.finaleCompletedPct}%; paired Fame per gig: ${chaos.pairedFamePerGig.deltaPct}%; material loss sources: ${chaos.materialLossSources.join(', ')}; acceptance: ${chaos.acceptance.passed ? 'passed' : 'failed'}.`
      : 'Chaos candidate was not measured.',
    '',
    '## Scandal controversy comparison',
    '',
    '| Start controversy | Bankruptcy | Final controversy | Finale completed |',
    '| ---: | ---: | ---: | ---: |',
    ...controversyRows,
    '',
    '## Progression diagnostics',
    '',
    '| Scenario | First purchase day | Catalogue share | Liquidity deferrals | Residual money | HQ/Van/Module payback evidence |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...progressionRows,
    '',
    '## Phase decisions',
    '',
    ...Object.entries(report.decisions).map(
      ([phase, decision]) =>
        `- **${phase}:** ${decision.status}; production change: ${decision.productionChange ? 'yes' : 'no'} — ${decision.rationale}`
    ),
    '',
    '## Next experiments',
    '',
    '- Do not change Bootstrap costs; its tension profile is already material.',
    '- Treat Chaos/Festival corridor crossings as boundary uncertainty, not missing data.',
    '- Complete module payback evidence before any Phase 7 candidate.',
    '- Use actual-loss sources, never gross spend, to choose a Chaos candidate family.'
  ].join('\n')
}

export const writeTensionArtifacts = async (report, reportDir) => {
  await fs.mkdir(reportDir, { recursive: true })
  await fs.writeFile(
    path.join(reportDir, 'scenario-tension-attribution.json'),
    `${JSON.stringify(report, null, 2)}\n`
  )
  await fs.writeFile(
    path.join(reportDir, 'scenario-tension-attribution.md'),
    `${buildMarkdown(report)}\n`
  )
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const reportDir = path.join(root, 'reports')
  if (process.argv.includes('--validate-provenance')) {
    const report = JSON.parse(
      await fs.readFile(
        path.join(reportDir, 'scenario-tension-attribution.json'),
        'utf8'
      )
    )
    const validation = await validateReportProvenance(report)
    if (!validation.valid) {
      throw new Error(
        `Invalid tension report provenance: ${validation.reason ?? validation.changedFiles?.join(', ')}`
      )
    }
  } else {
    await writeTensionArtifacts(await buildTensionReport(), reportDir)
  }
}
