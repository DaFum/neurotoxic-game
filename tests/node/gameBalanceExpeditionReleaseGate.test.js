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
 * Mirrors the suite's release predicate over the parts a test can construct.
 *
 * @param {{
 *   captured: Awaited<ReturnType<typeof loadCapturedRuntimeEvidence>>,
 *   corridorFindings?: string[]
 * }} input
 */
const releaseBlockersFor = ({ captured, corridorFindings = [] }) => {
  const blockers = []
  if (!captured.ok) {
    blockers.push(`no usable pacing evidence: ${captured.reason}`)
  } else if (captured.samples.length < MIN_RUNTIME_SAMPLES) {
    blockers.push(
      `only ${captured.samples.length} captured runtime sample(s), ${MIN_RUNTIME_SAMPLES} required`
    )
  } else if (!summarizeRuntimeDurations(captured.samples).inTargetCorridor) {
    blockers.push('median is outside the target corridor')
  }
  if (corridorFindings.length > 0) {
    blockers.push(
      `${corridorFindings.length} unresolved balance corridor finding(s)`
    )
  }
  return blockers
}

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
  assert.deepEqual(blockers, ['median is outside the target corridor'])
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
