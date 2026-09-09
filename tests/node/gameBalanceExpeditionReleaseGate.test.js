/**
 * @fileoverview Release-eligibility gate for the v15 balance artifact (G6 Task 15).
 *
 * Correctness and release eligibility are separate verdicts. This pins the
 * second one, because it is the one that decides whether a number in the
 * report may be quoted as evidence.
 *
 * The predicate used to be `passed && isReleaseRun && noShortfalls &&
 * capturedRuntime.ok`, and `capturedRuntime.ok` only proves the evidence file
 * is well-formed and fingerprint-matched. A single valid runtime row could
 * therefore flip the artifact to "release evidence" while the outcome-mix
 * corridor findings still stood and the measured median sat outside the
 * 20-30 minute window.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  loadCapturedRuntimeEvidence,
  summarizeRuntimeDurations,
  MIN_RUNTIME_SAMPLES,
  RUNTIME_EVIDENCE_SCHEMA_VERSION,
  TARGET_CORRIDOR_MIN_MINUTES,
  TARGET_CORRIDOR_MAX_MINUTES
} from '../../scripts/game-balance-expedition-runtime.mjs'
import { checkStrategyDominance } from '../../scripts/game-balance-expedition-runner.mjs'
import { computeReleaseBlockers } from '../../scripts/game-balance-expedition.mjs'

const FINGERPRINT = 'c'.repeat(64)

/**
 * Builds one valid captured sample of the requested duration.
 *
 * @param {number} index
 * @param {number} minutes
 */
const sampleOf = (index, minutes) => {
  const startedAtMs = 1_000_000 + index * 10_000_000
  const realDurationMs = Math.round(minutes * 60_000)
  return {
    buildProfileId: 'clean_sponsor',
    startedAtMs,
    finalizedAtMs: startedAtMs + realDurationMs,
    realDurationMs,
    outcome: 'completed',
    meaningfulNodes: 8
  }
}

/**
 * Writes a captured-evidence artifact into a throwaway repo root.
 *
 * @param {Array<Record<string, unknown>>} samples
 */
const withEvidence = async samples => {
  const root = await mkdtemp(path.join(tmpdir(), 'release-gate-'))
  await mkdir(path.join(root, 'docs', 'superpowers', 'reports'), {
    recursive: true
  })
  await writeFile(
    path.join(
      root,
      'docs',
      'superpowers',
      'reports',
      'roguelite-expedition-runtime-evidence.json'
    ),
    JSON.stringify({
      schemaVersion: RUNTIME_EVIDENCE_SCHEMA_VERSION,
      sourceFingerprint: FINGERPRINT,
      samples
    }),
    'utf8'
  )
  return root
}

/**
 * The shipped predicate, over the parts a test can construct.
 *
 * @remarks
 * `computeReleaseBlockers` is imported rather than mirrored. The previous
 * version reimplemented the blocker logic, so the suite could have dropped the
 * sample-count or corridor check and every assertion here would still pass
 * while the artifact regained a false `releaseEligible` - a test pinning its
 * own copy of the gate rather than the gate.
 */
const releaseBlockersFor = ({ captured, corridorFindings = [] }) =>
  computeReleaseBlockers({
    passed: true,
    hardFailures: [],
    isReleaseRun: true,
    sampleCount: 2000,
    coverageShortfalls: [],
    capturedRuntime: captured,
    runtimeSummary: captured.ok
      ? summarizeRuntimeDurations(captured.samples)
      : {
          inTargetCorridor: false,
          medianMinutes: 0,
          corridorStatus: 'no_samples'
        },
    corridorFindings
  })

test('one valid runtime sample is not release evidence', async () => {
  const root = await withEvidence([sampleOf(0, 25)])
  const captured = await loadCapturedRuntimeEvidence(root, FINGERPRINT)

  // The loader accepts it - a partial capture is still worth summarizing.
  assert.equal(captured.ok, true)
  assert.equal(captured.samples.length, 1)

  // The release gate does not.
  const blockers = releaseBlockersFor({ captured })
  assert.equal(blockers.length, 1)
  assert.match(blockers[0], /only 1 captured runtime sample/)
})

test('a full cohort outside the pacing corridor is not release evidence', async () => {
  // Twenty valid samples, every one of them far too long.
  const slow = Array.from({ length: MIN_RUNTIME_SAMPLES }, (_, index) =>
    sampleOf(index, TARGET_CORRIDOR_MAX_MINUTES + 15)
  )
  const root = await withEvidence(slow)
  const captured = await loadCapturedRuntimeEvidence(root, FINGERPRINT)
  assert.equal(captured.ok, true)
  assert.equal(captured.samples.length, MIN_RUNTIME_SAMPLES)

  const summary = summarizeRuntimeDurations(captured.samples)
  assert.equal(summary.inTargetCorridor, false)
  assert.equal(summary.corridorStatus, 'slow')

  const blockers = releaseBlockersFor({ captured })
  // The shipped wording, not a paraphrase of it. Pinning 'median is outside
  // the target corridor' was only ever pinning this test's own copy.
  assert.equal(blockers.length, 1)
  assert.match(blockers[0], /median .* is outside the .* corridor \(slow\)/)
})

test('a full in-corridor cohort clears the pacing condition', async () => {
  const inCorridor = Array.from({ length: MIN_RUNTIME_SAMPLES }, (_, index) =>
    sampleOf(
      index,
      (TARGET_CORRIDOR_MIN_MINUTES + TARGET_CORRIDOR_MAX_MINUTES) / 2
    )
  )
  const root = await withEvidence(inCorridor)
  const captured = await loadCapturedRuntimeEvidence(root, FINGERPRINT)

  assert.deepEqual(releaseBlockersFor({ captured }), [])
})

test('persistent outcome-mix corridor findings block release evidence', async () => {
  const inCorridor = Array.from({ length: MIN_RUNTIME_SAMPLES }, (_, index) =>
    sampleOf(index, 25)
  )
  const root = await withEvidence(inCorridor)
  const captured = await loadCapturedRuntimeEvidence(root, FINGERPRINT)

  // A profile that completes every seed in both cohorts: a Task 7 corridor
  // finding, not a dominance block.
  const summary = over => ({
    completedRate: 0.5,
    extractedRate: 0.5,
    failedRate: 0,
    meanNodes: 8,
    meanMoney: 1000,
    meanDepth: 8,
    meanFame: 100,
    ...over
  })
  const cohort = {
    profileSummaries: {
      a: summary({ completedRate: 1, extractedRate: 0 }),
      b: summary(),
      c: summary()
    }
  }
  const dominance = checkStrategyDominance(cohort, cohort)
  assert.equal(dominance.ok, true, 'this is a corridor finding, not a block')
  assert.ok(dominance.corridorFindings.length > 0)

  const blockers = releaseBlockersFor({
    captured,
    corridorFindings: dominance.corridorFindings
  })
  assert.equal(blockers.length, 1)
  assert.match(blockers[0], /unresolved balance corridor finding/)
})

test('97% extraction is an outcome corridor finding in both cohorts', () => {
  const summary = {
    completedRate: 0.03,
    extractedRate: 0.97,
    failedRate: 0,
    meanNodes: 8,
    meanMoney: 1000,
    meanDepth: 8,
    meanFame: 100
  }
  const cohort = { profileSummaries: { diy_repair: summary } }
  const result = checkStrategyDominance(cohort, cohort)
  assert.ok(
    result.corridorFindings.some(
      finding =>
        finding.includes('extractedRate') && finding.includes('calibration')
    )
  )
  assert.ok(
    result.corridorFindings.some(
      finding =>
        finding.includes('extractedRate') && finding.includes('holdout')
    )
  )
})

test('a missing failure rate is checked in both cohorts', () => {
  const summary = {
    completedRate: 0.5,
    extractedRate: 0.5,
    failedRate: 0,
    meanNodes: 8,
    meanMoney: 1000,
    meanDepth: 8,
    meanFame: 100
  }
  const cohort = { profileSummaries: { clean_sponsor: summary } }
  const result = checkStrategyDominance(cohort, cohort)
  assert.ok(
    result.corridorFindings.some(
      finding =>
        finding.includes('failedRate') && finding.includes('calibration')
    )
  )
  assert.ok(
    result.corridorFindings.some(
      finding => finding.includes('failedRate') && finding.includes('holdout')
    )
  )
})
