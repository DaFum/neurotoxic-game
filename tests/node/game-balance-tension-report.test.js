import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  ATTRIBUTION_COHORTS,
  CONTROVERSY_PROFILES,
  TENSION_RUNS_PER_SCENARIO,
  buildReportMetadata,
  buildPhaseDecisions,
  createEvidenceResult,
  hasCompleteTensionEvidence,
  reviewsDifferForScenarioIds,
  validateReportProvenance,
  writeTensionArtifacts
} from '../../scripts/game-balance-tension-report.mjs'

test('tension cohorts are disjoint selection-free 2000-run diagnostics', () => {
  assert.equal(TENSION_RUNS_PER_SCENARIO, 2_000)
  assert.deepEqual(ATTRIBUTION_COHORTS, {
    calibration: '#scenario-tension-attribution-v1',
    holdout: '#scenario-tension-attribution-v1#holdout'
  })
  assert.deepEqual(CONTROVERSY_PROFILES, [0, 50, 65, 80])
})

test('generated diagnostics identify their clean source commit', () => {
  const metadata = buildReportMetadata()
  assert.match(metadata.sourceBaseCommit, /^[0-9a-f]{7,40}$/)
  assert.equal(typeof metadata.workingTreeDirty, 'boolean')
})

test('report metadata falls back when git is unavailable', () => {
  const unavailable = () => {
    throw new Error('git unavailable')
  }
  assert.deepEqual(
    buildReportMetadata({ runGit: unavailable, env: { GITHUB_SHA: 'ci-sha' } }),
    { sourceBaseCommit: 'ci-sha', workingTreeDirty: false }
  )
  assert.deepEqual(buildReportMetadata({ runGit: unavailable, env: {} }), {
    sourceBaseCommit: null,
    workingTreeDirty: false
  })
})

test('artifact writer creates a missing reports directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tension-report-'))
  const reportDir = path.join(root, 'nested', 'reports')
  try {
    await writeTensionArtifacts(
      {
        generatedAt: 'test',
        metadata: { sourceBaseCommit: null, workingTreeDirty: false },
        decisions: {},
        contract: {
          runsPerScenario: 0,
          cohorts: {},
          candidateSelection: false
        },
        cohorts: { calibration: [], holdout: [] },
        controversyComparison: [],
        evidence: { tensionEvidence: { status: 'insufficient_evidence' } }
      },
      reportDir
    )
    assert.equal(
      JSON.parse(
        await fs.readFile(
          path.join(reportDir, 'scenario-tension-attribution.json'),
          'utf8'
        )
      ).generatedAt,
      'test'
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test('phase decisions fail closed without measured evidence', () => {
  const decisions = buildPhaseDecisions({})
  assert.deepEqual(Object.keys(decisions), [
    'phase6B',
    'phase6C',
    'phase6D',
    'phase7'
  ])
  for (const decision of Object.values(decisions)) {
    assert.equal(decision.productionChange, false)
    assert.equal(decision.status, 'insufficient_evidence')
  }
})

test('phase decisions use independent evidence gates', () => {
  const decisions = buildPhaseDecisions({
    tensionEvidence: { complete: true, status: 'unstable' },
    lossAttributionEvidence: { complete: true },
    controversyEvidence: { complete: false, reason: 'missing controversy' },
    bootstrapFestivalEvidence: { complete: true, status: 'unstable' },
    progressionEvidence: { complete: false, reason: 'missing payback' }
  })
  assert.equal(decisions.phase6B.status, 'diagnostic_complete')
  assert.equal(decisions.phase6C.status, 'insufficient_evidence')
  assert.equal(decisions.phase6D.status, 'boundary_uncertain')
  assert.equal(decisions.phase7.status, 'insufficient_evidence')
})

test('empty scenario sets are insufficient and completed evidence has no failure reason', () => {
  assert.equal(
    hasCompleteTensionEvidence([], { scenarios: [] }, { scenarios: [] }),
    false
  )
  assert.deepEqual(createEvidenceResult(true, 'failure text'), {
    complete: true
  })
  assert.deepEqual(createEvidenceResult(false, 'failure text'), {
    complete: false,
    reason: 'failure text'
  })
})

test('phase stability only compares scenarios owned by that phase', () => {
  const review = (chaos, festival) => ({
    scenarios: [
      { id: 'chaos_tour', metrics: { bankruptcyRatePct: { status: chaos } } },
      {
        id: 'festival_push',
        metrics: { bankruptcyRatePct: { status: festival } }
      }
    ]
  })
  const calibration = review('below_target', 'within_target')
  const holdout = review('within_target', 'within_target')
  assert.equal(
    reviewsDifferForScenarioIds(calibration, holdout, [
      'bootstrap_struggle',
      'festival_push'
    ]),
    false
  )
  assert.equal(
    reviewsDifferForScenarioIds(calibration, holdout, ['chaos_tour']),
    true
  )
})

test('provenance validation requires an existing ancestor and reports-only diff', () => {
  const calls = []
  const runGit = (_command, args) => {
    calls.push(args)
    if (args[0] === 'diff')
      return 'reports/scenario-tension-attribution.json\nreports/scenario-tension-attribution.md\n'
    return ''
  }
  assert.equal(
    validateReportProvenance(
      { metadata: { sourceBaseCommit: 'source' } },
      { runGit, head: 'HEAD' }
    ).valid,
    true
  )
  assert.deepEqual(
    calls.map(args => args[0]),
    ['cat-file', 'merge-base', 'diff']
  )
})
