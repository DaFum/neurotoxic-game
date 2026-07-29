import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import {
  ATTRIBUTION_COHORTS,
  CHAOS_EVENT_LOSS_CANDIDATE,
  CONTROVERSY_PROFILES,
  TENSION_RUNS_PER_SCENARIO,
  buildReportMetadata,
  buildChaosCandidateAcceptance,
  buildPhaseDecisions,
  createEvidenceResult,
  hasCompleteTensionEvidence,
  hasCompleteAttributionEvidence,
  hasCompleteScenarioReviewEvidence,
  hasCompleteControversyEvidence,
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

test('Chaos Tour evaluates one diagnostic event-loss candidate', () => {
  assert.deepEqual(CHAOS_EVENT_LOSS_CANDIDATE, {
    id: 'negative-financial-events-1.25',
    scenarioId: 'chaos_tour',
    negativeFinancialEventMultiplier: 1.25,
    productionChange: false
  })
})

test('Chaos Fame acceptance fails closed without paired coverage', () => {
  const acceptance = buildChaosCandidateAcceptance({
    candidate: {
      financialStress: {
        bankruptcyRatePct: 5,
        bankruptcyBeforeFirstGigPct: 0.5
      },
      tourPaths: { finaleCompletedPct: 95 }
    },
    famePerGig: {
      deltaPct: 0,
      sufficientEvidence: false
    },
    materialLossSources: ['negative_events']
  })

  assert.equal(acceptance.criteria.famePerGig, false)
  assert.equal(acceptance.passed, false)
})

test('generated diagnostics identify source and generator fingerprints', async () => {
  const metadata = await buildReportMetadata()
  assert.match(metadata.sourceFingerprint, /^[0-9a-f]{64}$/)
  assert.match(metadata.generatorFingerprint, /^[0-9a-f]{64}$/)
  assert.equal(typeof metadata.workingTreeDirty, 'boolean')
  assert.equal(metadata.seedNamespace, ATTRIBUTION_COHORTS.calibration)
  assert.equal(metadata.runsPerScenario, TENSION_RUNS_PER_SCENARIO)
})

test('artifact writer creates a missing reports directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tension-report-'))
  const reportDir = path.join(root, 'nested', 'reports')
  try {
    await writeTensionArtifacts(
      {
        generatedAt: 'test',
        metadata: {
          sourceFingerprint: '0'.repeat(64),
          generatorFingerprint: '0'.repeat(64),
          seedNamespace: ATTRIBUTION_COHORTS.calibration,
          runsPerScenario: 0,
          workingTreeDirty: false,
          artifactSchemaVersion: 1
        },
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

test('provenance validation rejects missing fingerprint metadata', async () => {
  assert.deepEqual(await validateReportProvenance({ metadata: {} }), {
    valid: false,
    reason: 'invalid_artifact_metadata'
  })
})

test('phase evidence validators reject empty and non-finite output objects', () => {
  assert.equal(hasCompleteAttributionEvidence({}), false)
  assert.equal(
    hasCompleteAttributionEvidence({
      actualLossAttribution: {},
      grossSpendAttribution: {}
    }),
    false
  )
  assert.equal(
    hasCompleteControversyEvidence([
      {
        controversyLevel: 0,
        summary: {
          bankruptcy: { sampleSize: 2_000, ratePct: Number.NaN },
          tourPaths: { finaleCompletedPct: 90 },
          avgFinalControversy: 5
        }
      }
    ]),
    false
  )
  assert.equal(
    hasCompleteScenarioReviewEvidence(
      { scenarios: [{ id: 'festival_push', metrics: {} }] },
      { scenarios: [{ id: 'festival_push', metrics: {} }] },
      ['festival_push']
    ),
    false
  )
})
