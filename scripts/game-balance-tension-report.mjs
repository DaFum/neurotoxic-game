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

export const buildReportMetadata = () => ({
  sourceBaseCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8'
  }).trim(),
  workingTreeDirty:
    execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()
      .length > 0
})

const insufficientDecision = rationale => ({
  status: 'insufficient_evidence',
  productionChange: false,
  rationale
})

export const buildPhaseDecisions = ({ calibrationReview, holdoutReview }) => {
  const isMeasured = review =>
    review?.scenarios?.length > 0 &&
    review.scenarios.every(
      scenario => scenario.status !== 'insufficient_evidence'
    )
  const calibrationById = new Map(
    (calibrationReview?.scenarios ?? []).map(scenario => [scenario.id, scenario])
  )
  const holdoutById = new Map(
    (holdoutReview?.scenarios ?? []).map(scenario => [scenario.id, scenario])
  )
  const sameEvidence =
    calibrationById.size === holdoutById.size &&
    [...calibrationById].every(([id, calibration]) => {
      const holdout = holdoutById.get(id)
      if (!holdout || calibration.status !== holdout.status) return false
      const calibrationMetrics = Object.entries(calibration.metrics ?? {})
      return (
        calibrationMetrics.length === Object.keys(holdout.metrics ?? {}).length &&
        calibrationMetrics.every(
          ([metric, result]) =>
            result.status === holdout.metrics?.[metric]?.status
        )
      )
    })
  const measured =
    isMeasured(calibrationReview) && isMeasured(holdoutReview) && sameEvidence
  if (!measured)
    return {
      phase6B: insufficientDecision(
        'Chaos tuning requires complete tension attribution.'
      ),
      phase6C: insufficientDecision(
        'Scandal profile selection requires all controversy cohorts.'
      ),
      phase6D: insufficientDecision(
        'Bootstrap and Festival remain observation-only without complete cohorts.'
      ),
      phase7: insufficientDecision(
        'Progression tuning requires measured purchase-path evidence.'
      )
    }
  return {
    phase6B: {
      status: 'diagnostic_complete',
      productionChange: false,
      rationale:
        'No event-severity candidate is selected by diagnostic cohorts.'
    },
    phase6C: {
      status: 'diagnostic_complete',
      productionChange: false,
      rationale:
        'Controversy profiles are diagnostic and do not alter runtime values.'
    },
    phase6D: {
      status: 'observe',
      productionChange: false,
      rationale:
        'Bootstrap contracts and Festival uncertainty remain non-blocking.'
    },
    phase7: {
      status: 'diagnostic_complete',
      productionChange: false,
      rationale: 'Purchase paths are measured separately from economy tuning.'
    }
  }
}

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
    decisions: buildPhaseDecisions({ calibrationReview, holdoutReview })
  }
}

const buildMarkdown = report =>
  [
    '# Phase 6A-7 Scenario Tension Diagnostics',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Both diagnostic streams use ${report.contract.runsPerScenario} runs per scenario and select no production candidate.`,
    '',
    '## Decisions',
    '',
    ...Object.entries(report.decisions).map(
      ([phase, decision]) =>
        `- **${phase}:** ${decision.status}; production change: ${decision.productionChange ? 'yes' : 'no'} — ${decision.rationale}`
    )
  ].join('\n')

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const report = buildTensionReport()
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  await fs.writeFile(
    path.join(root, 'reports/scenario-tension-attribution.json'),
    `${JSON.stringify(report, null, 2)}\n`
  )
  await fs.writeFile(
    path.join(root, 'reports/scenario-tension-attribution.md'),
    `${buildMarkdown(report)}\n`
  )
}
