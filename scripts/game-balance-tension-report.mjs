import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  SCENARIOS,
  SCENARIO_TENSION_TARGETS,
  buildScenarioTensionReview,
  createScenarioSeed,
  runSingleSimulation,
  summarizeScenario
} from './game-balance-simulation.mjs'

export const TENSION_RUNS_PER_SCENARIO = 2_000
export const ATTRIBUTION_COHORTS = Object.freeze({
  calibration: '#scenario-tension-attribution-v1',
  holdout: '#scenario-tension-attribution-v1#holdout'
})
export const CONTROVERSY_PROFILES = Object.freeze([0, 50, 65, 80])

export const buildReportMetadata = ({
  runGit = execFileSync,
  env = process.env
} = {}) => {
  let sourceBaseCommit = env.GITHUB_SHA ?? null
  let workingTreeDirty = false
  try {
    sourceBaseCommit = runGit('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf8'
    }).trim()
  } catch {
    // CI archives may not include .git; GITHUB_SHA remains reproducible there.
  }
  try {
    workingTreeDirty =
      runGit('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()
        .length > 0
  } catch {
    // Without a worktree there is no local dirty state to report.
  }
  return { sourceBaseCommit, workingTreeDirty }
}

const insufficientDecision = rationale => ({
  status: 'insufficient_evidence',
  productionChange: false,
  rationale
})

const phaseDecision = (evidence, completeStatus, rationale) =>
  evidence?.complete
    ? { status: completeStatus, productionChange: false, rationale }
    : insufficientDecision(evidence?.reason ?? rationale)

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
    evidence.tensionEvidence?.status === 'unstable' ? 'boundary_uncertain' : 'diagnostic_complete',
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

export const buildTensionReport = () => {
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
  const calibrationById = new Map(
    calibrationReview.scenarios.map(scenario => [scenario.id, scenario])
  )
  const holdoutById = new Map(
    holdoutReview.scenarios.map(scenario => [scenario.id, scenario])
  )
  const tensionComplete =
    calibrationReview.scenarios.length === scenarios.length &&
    holdoutReview.scenarios.length === scenarios.length &&
    [...calibrationById].every(([id, calibration]) => {
      const holdout = holdoutById.get(id)
      return holdout &&
        Object.values(calibration.metrics).every(metric => metric.status !== 'insufficient_evidence') &&
        Object.values(holdout.metrics).every(metric => metric.status !== 'insufficient_evidence')
    })
  const tensionUnstable = tensionComplete && [...calibrationById].some(([id, calibration]) => {
    const holdout = holdoutById.get(id)
    return Object.entries(calibration.metrics).some(
      ([metric, result]) => result.status !== holdout.metrics[metric].status
    )
  })
  const summariesFor = id => [cohorts.calibration, cohorts.holdout]
    .map(stream => stream.find(scenario => scenario.id === id)?.summary)
  const completeSamples = summaries => summaries.every(
    summary => summary?.bankruptcy?.sampleSize === TENSION_RUNS_PER_SCENARIO
  )
  const chaosSummaries = summariesFor('chaos_tour')
  const bootstrapFestivalSummaries = [
    ...summariesFor('bootstrap_struggle'),
    ...summariesFor('festival_push')
  ]
  const controversyComplete =
    controversyComparison.length === CONTROVERSY_PROFILES.length &&
    controversyComparison.every(
      profile => profile.summary?.bankruptcy?.sampleSize === TENSION_RUNS_PER_SCENARIO
    )
  const progressionFieldsPresent = bootstrapFestivalSummaries.every(summary => {
    const paths = summary?.purchasePaths
    return paths &&
      Number.isFinite(paths.firstPurchaseDayMedian) &&
      Number.isFinite(paths.avgLiquidityDeferrals) &&
      Number.isFinite(paths.catalogSharePurchasedPct) &&
      Number.isFinite(paths.avgResidualMoneyAfterPurchase) &&
      Number.isFinite(summary.gigsToAffordHqUpgrade) &&
      Number.isFinite(summary.gigsToAffordVanUpgrade) &&
      Number.isFinite(paths.modulePaybackGigs)
  })
  const evidence = {
    tensionEvidence: {
      complete: tensionComplete,
      status: tensionUnstable ? 'unstable' : tensionComplete ? 'stable' : 'insufficient_evidence'
    },
    lossAttributionEvidence: {
      complete: completeSamples(chaosSummaries) && chaosSummaries.every(
        summary => summary?.actualLossAttribution && summary?.grossSpendAttribution
      ),
      reason: 'Chaos actual-loss attribution is incomplete.'
    },
    controversyEvidence: {
      complete: controversyComplete,
      reason: 'All 0/50/65/80 controversy cohorts with 2,000 runs are required.'
    },
    bootstrapFestivalEvidence: {
      complete: completeSamples(bootstrapFestivalSummaries),
      reason: 'Bootstrap and Festival cohorts are incomplete.'
    },
    progressionEvidence: {
      complete: completeSamples(bootstrapFestivalSummaries) && progressionFieldsPresent,
      reason: 'Progression requires purchase timing, deferrals, catalogue share, residual money, and HQ/van/module payback.'
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    metadata: buildReportMetadata(),
    contract: {
      runsPerScenario: TENSION_RUNS_PER_SCENARIO,
      cohorts: ATTRIBUTION_COHORTS,
      candidateSelection: false
    },
    cohorts,
    controversyComparison,
    tensionReview: { calibration: calibrationReview, holdout: holdoutReview },
    evidence,
    decisions: buildPhaseDecisions(evidence)
  }
}

const buildMarkdown = report => {
  const scenarioRows = report.cohorts.calibration.flatMap(calibration => {
    const holdout = report.cohorts.holdout.find(item => item.id === calibration.id)
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
  const controversyRows = report.controversyComparison.map(profile =>
    `| ${profile.controversyLevel} | ${profile.summary.bankruptcy.ratePct}% | ${profile.summary.avgFinalControversy} | ${profile.summary.tourPaths.finaleCompletedPct}% |`
  )
  const progressionRows = report.cohorts.calibration.map(scenario => {
    const paths = scenario.summary.purchasePaths
    return `| ${scenario.name} | ${paths.firstPurchaseDayMedian ?? '—'} | ${paths.catalogSharePurchasedPct}% | ${paths.avgLiquidityDeferrals} | €${paths.avgResidualMoneyAfterPurchase ?? '—'} | ${scenario.summary.gigsToAffordHqUpgrade}/${scenario.summary.gigsToAffordVanUpgrade}/— |`
  })
  return [
    '# Phase 6A-7 Scenario Tension Diagnostics', '',
    `Generated: ${report.generatedAt}`,
    `Source: ${report.metadata.sourceBaseCommit ?? 'unavailable'}; dirty: ${report.metadata.workingTreeDirty}`,
    `Cohorts: ${report.contract.runsPerScenario} runs each; calibration ${report.contract.cohorts.calibration}; holdout ${report.contract.cohorts.holdout}; candidate selection: ${report.contract.candidateSelection}.`, '',
    '## Tension matrix', '',
    '| Scenario | Cohort | Bankruptcy | Before gig | After gig | Ever <€500 | P90 drawdown | Finale completed |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |', ...scenarioRows, '',
    `Cohort comparison: **${report.evidence.tensionEvidence.status}**. Corridor differences are diagnostic, not missing evidence.`, '',
    '## Top actual loss sources (Calibration)', '', '| Scenario | Top 3 |', '| --- | --- |', ...lossRows, '',
    'Gross gig spending is published separately in JSON under `grossSpendAttribution` and never drives drawdown fields.', '',
    '## Scandal controversy comparison', '', '| Start controversy | Bankruptcy | Final controversy | Finale completed |', '| ---: | ---: | ---: | ---: |', ...controversyRows, '',
    '## Progression diagnostics', '', '| Scenario | First purchase day | Catalogue share | Liquidity deferrals | Residual money | HQ/Van/Module payback evidence |', '| --- | ---: | ---: | ---: | ---: | --- |', ...progressionRows, '',
    '## Phase decisions', '', ...Object.entries(report.decisions).map(
      ([phase, decision]) => `- **${phase}:** ${decision.status}; production change: ${decision.productionChange ? 'yes' : 'no'} — ${decision.rationale}`
    ), '',
    '## Next experiments', '',
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
  const report = buildTensionReport()
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  await writeTensionArtifacts(report, path.join(root, 'reports'))
}
