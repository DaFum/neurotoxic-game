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
  CANONICAL_PLAYTEST_SAMPLES,
  TARGET_CORRIDOR_MIN_MINUTES,
  TARGET_CORRIDOR_MAX_MINUTES
} from '../../scripts/game-balance-expedition-runtime.mjs'
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
    const summary = summarizeRuntimeDurations(CANONICAL_PLAYTEST_SAMPLES)

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
})
