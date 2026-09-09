/**
 * @fileoverview Unit tests for Expedition Runtime Duration Evidence (G6 Task 14).
 *
 * Verifies:
 * - Runtime sample creation adheres to IClock conventions.
 * - Validation guards against negative or non-finite values and invalid outcomes.
 * - Percentiles (p25, median, p75) are correctly calculated.
 * - 20-30 minute target is evaluated as a product corridor.
 * - Samples are never synthetically inferred from simulator steps.
 */

import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  createExpeditionRuntimeSample,
  isValidRuntimeSample,
  summarizeRuntimeDurations,
  SYNTHETIC_RUNTIME_FIXTURE_SAMPLES,
  loadCapturedRuntimeEvidence,
  RUNTIME_EVIDENCE_SCHEMA_VERSION,
  TARGET_CORRIDOR_MIN_MINUTES,
  TARGET_CORRIDOR_MAX_MINUTES
} from '../../scripts/game-balance-expedition-runtime.mjs'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createFixedClock } from '../../src/utils/clock.ts'

describe('Expedition Runtime Duration Evidence (G6 Task 14)', () => {
  it('validates proper runtime samples and rejects malformed objects', () => {
    const valid = {
      buildProfileId: 'baseline_roadtested',
      startedAtMs: 1000,
      finalizedAtMs: 7000,
      realDurationMs: 6000,
      outcome: 'completed',
      meaningfulNodes: 12
    }
    assert.equal(isValidRuntimeSample(valid), true)

    assert.equal(isValidRuntimeSample(null), false)
    assert.equal(
      isValidRuntimeSample({ ...valid, outcome: 'invalid_outcome' }),
      false
    )
    assert.equal(
      isValidRuntimeSample({ ...valid, realDurationMs: -100 }),
      false
    )
    assert.equal(isValidRuntimeSample({ ...valid, finalizedAtMs: 500 }), false)
    assert.equal(
      isValidRuntimeSample({ ...valid, realDurationMs: 99999 }),
      false
    ) // mismatch with end - start
    assert.equal(isValidRuntimeSample({ ...valid, meaningfulNodes: -1 }), false)
  })

  it('creates runtime sample using injected IClock', () => {
    const fixedClock = createFixedClock(1500000)
    const sample = createExpeditionRuntimeSample(
      {
        buildProfileId: 'scout_intel',
        startedAtMs: 1000000,
        outcome: 'extracted',
        meaningfulNodes: 8
      },
      fixedClock
    )

    assert.equal(sample.startedAtMs, 1000000)
    assert.equal(sample.finalizedAtMs, 1500000)
    assert.equal(sample.realDurationMs, 500000)
    assert.equal(sample.outcome, 'extracted')
    assert.equal(sample.meaningfulNodes, 8)
  })

  it('correctly calculates median, p25, p75 and checks the 20-30 min target corridor', () => {
    const summary = summarizeRuntimeDurations(SYNTHETIC_RUNTIME_FIXTURE_SAMPLES)

    assert.equal(summary.count, 10)
    assert.ok(summary.minMs > 0)
    assert.ok(summary.maxMs >= summary.minMs)
    assert.ok(summary.p25Ms <= summary.medianMs)
    assert.ok(summary.medianMs <= summary.p75Ms)

    // Check minutes conversion
    assert.equal(
      summary.medianMinutes,
      Math.round((summary.medianMs / 60000) * 10) / 10
    )
    assert.ok(summary.medianMinutes >= TARGET_CORRIDOR_MIN_MINUTES)
    assert.ok(summary.medianMinutes <= TARGET_CORRIDOR_MAX_MINUTES)
    assert.equal(summary.inTargetCorridor, true)
    assert.equal(summary.corridorStatus, 'on_target')
  })

  it('handles empty sample set gracefully', () => {
    const emptySummary = summarizeRuntimeDurations([])
    assert.equal(emptySummary.count, 0)
    assert.equal(emptySummary.medianMs, 0)
    assert.equal(emptySummary.inTargetCorridor, false)
    assert.equal(emptySummary.corridorStatus, 'no_samples')
  })

  describe('captured runtime evidence (G6 Task 14)', () => {
    const FINGERPRINT = 'a'.repeat(64)

    const writeEvidence = async body => {
      const root = await mkdtemp(path.join(tmpdir(), 'runtime-evidence-'))
      await mkdir(path.join(root, 'docs', 'superpowers', 'reports'), {
        recursive: true
      })
      if (body !== null) {
        await writeFile(
          path.join(
            root,
            'docs',
            'superpowers',
            'reports',
            'roguelite-expedition-runtime-evidence.json'
          ),
          typeof body === 'string' ? body : JSON.stringify(body),
          'utf8'
        )
      }
      return root
    }

    const sample = {
      buildProfileId: 'clean_sponsor',
      startedAtMs: 1000,
      finalizedAtMs: 1500000,
      realDurationMs: 1499000,
      outcome: 'completed',
      meaningfulNodes: 12
    }

    it('rejects missing evidence rather than falling back to literals', async () => {
      const root = await writeEvidence(null)
      const result = await loadCapturedRuntimeEvidence(root, FINGERPRINT)
      assert.equal(result.ok, false)
      assert.match(result.reason, /no captured playtest evidence/)
      assert.deepEqual(result.samples, [])
    })

    it('rejects evidence captured against a different source fingerprint', async () => {
      const root = await writeEvidence({
        schemaVersion: RUNTIME_EVIDENCE_SCHEMA_VERSION,
        sourceFingerprint: 'b'.repeat(64),
        samples: [sample]
      })
      const result = await loadCapturedRuntimeEvidence(root, FINGERPRINT)
      assert.equal(result.ok, false)
      assert.match(result.reason, /stale/)
    })

    it('rejects malformed samples and empty cohorts', async () => {
      const emptyRoot = await writeEvidence({
        schemaVersion: RUNTIME_EVIDENCE_SCHEMA_VERSION,
        sourceFingerprint: FINGERPRINT,
        samples: []
      })
      assert.match(
        (await loadCapturedRuntimeEvidence(emptyRoot, FINGERPRINT)).reason,
        /no samples/
      )

      const badRoot = await writeEvidence({
        schemaVersion: RUNTIME_EVIDENCE_SCHEMA_VERSION,
        sourceFingerprint: FINGERPRINT,
        samples: [{ ...sample, realDurationMs: 5 }]
      })
      assert.match(
        (await loadCapturedRuntimeEvidence(badRoot, FINGERPRINT)).reason,
        /malformed/
      )
    })

    it('accepts evidence captured against the current source', async () => {
      const root = await writeEvidence({
        schemaVersion: RUNTIME_EVIDENCE_SCHEMA_VERSION,
        sourceFingerprint: FINGERPRINT,
        capturedAt: '2026-09-07T00:00:00.000Z',
        samples: [sample]
      })
      const result = await loadCapturedRuntimeEvidence(root, FINGERPRINT)
      assert.equal(result.ok, true)
      assert.equal(result.samples.length, 1)
      assert.equal(result.capturedAt, '2026-09-07T00:00:00.000Z')
    })
  })
})
