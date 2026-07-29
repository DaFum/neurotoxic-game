import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ATTRIBUTION_COHORTS,
  CONTROVERSY_PROFILES,
  TENSION_RUNS_PER_SCENARIO,
  buildReportMetadata,
  buildPhaseDecisions
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

test('phase decisions fail closed without measured evidence', () => {
  const decisions = buildPhaseDecisions({
    calibrationReview: null,
    holdoutReview: null
  })
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

test('phase decisions fail closed when holdout contradicts calibration', () => {
  const review = status => ({
    scenarios: [
      {
        id: 'chaos_tour',
        status,
        metrics: { bankruptcyRatePct: { status } }
      }
    ]
  })
  const decisions = buildPhaseDecisions({
    calibrationReview: review('within_target'),
    holdoutReview: review('review')
  })
  for (const decision of Object.values(decisions)) {
    assert.equal(decision.status, 'insufficient_evidence')
    assert.equal(decision.productionChange, false)
  }
})

test('phase decisions complete only when calibration and holdout agree', () => {
  const review = {
    scenarios: [
      {
        id: 'chaos_tour',
        status: 'within_target',
        metrics: { bankruptcyRatePct: { status: 'within_target' } }
      }
    ]
  }
  const decisions = buildPhaseDecisions({
    calibrationReview: review,
    holdoutReview: structuredClone(review)
  })
  assert.equal(decisions.phase6B.status, 'diagnostic_complete')
})
