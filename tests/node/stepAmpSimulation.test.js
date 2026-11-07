import { describe, it, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// Deterministic RNG: default high value suppresses the stochastic phases
// (anomaly spawn, target drift, hijack); individual tests lower it to fire them.
let rngValue = 0.99
const getSafeRandom = mock.fn(() => rngValue)
mock.module(new URL('../../src/utils/crypto.ts', import.meta.url).href, {
  // The other exports only satisfy transitive imports; the simulation reads
  // getSafeRandom alone.
  namedExports: {
    getSafeRandom,
    secureRandom: () => rngValue,
    getSecureRandomUint32: () => 0,
    getSafeUUID: () => 'mock-uuid-test',
    resetSecureRandomBatch: () => {}
  }
})

const { buildAmpUiSnapshot, stepAmpSimulation } =
  await import('../../src/hooks/minigames/ampLogicUtils.ts')

// Same tolerance as Vitest's default `toBeCloseTo` (2 digits).
const assertCloseTo = (actual, expected) => {
  assert.ok(
    Math.abs(actual - expected) < 0.005,
    `expected ${actual} to be close to ${expected}`
  )
}

function makeSim(overrides = {}) {
  return {
    dialValue: 500,
    targetValue: 500,
    timeLeft: 10,
    accumulatedScore: 0,
    accumulatedMs: 0,
    isComplete: false,
    isOverdriveActive: false,
    heat: 0,
    isOverheat: false,
    voidResonance: 0,
    isAnomalyActive: false,
    isHijackActive: false,
    hijacksOverridden: 0,
    isFeedbackLoopActive: false,
    feedbackLoopsDampened: 0,
    interference: 0,
    purgesUsed: 0,
    ...overrides
  }
}

describe('stepAmpSimulation', () => {
  beforeEach(() => {
    rngValue = 0.99
    getSafeRandom.mock.resetCalls()
    getSafeRandom.mock.mockImplementation(() => rngValue)
  })

  it('no-ops when the game is already complete', () => {
    const sim = makeSim({ isComplete: true })
    const before = { ...sim }
    assert.equal(stepAmpSimulation(sim, 1000), 'skipped')
    assert.deepEqual(sim, before)
  })

  it('no-ops on non-positive or non-finite delta', () => {
    for (const delta of [0, -50, Number.NaN, Number.POSITIVE_INFINITY]) {
      const sim = makeSim()
      assert.equal(stepAmpSimulation(sim, delta), 'skipped')
      assert.deepEqual(sim, makeSim())
    }
    assert.equal(getSafeRandom.mock.callCount(), 0)
  })

  it('decrements time, builds interference, and accumulates a perfect score', () => {
    const sim = makeSim()
    assert.equal(stepAmpSimulation(sim, 1000), 'advanced')
    assertCloseTo(sim.timeLeft, 9)
    // dial === target => diff 0 => perfect 100 score, no multipliers/penalties.
    assertCloseTo(sim.accumulatedScore, 100 * 1000)
    assert.equal(sim.accumulatedMs, 1000)
    assert.equal(buildAmpUiSnapshot(sim).score, 100)
    assertCloseTo(sim.interference, 5)
  })

  it('completes and early-returns when time runs out', () => {
    const sim = makeSim({ timeLeft: 0.5 })
    assert.equal(stepAmpSimulation(sim, 1000), 'expired')
    assert.equal(sim.timeLeft, 0)
    // The expiry frame is not scored and draws no RNG.
    assert.equal(sim.accumulatedMs, 0)
    assert.equal(sim.accumulatedScore, 0)
    assert.equal(getSafeRandom.mock.callCount(), 0)
  })

  it('heats up while overdrive is active', () => {
    const sim = makeSim({ isOverdriveActive: true })
    stepAmpSimulation(sim, 1000)
    assertCloseTo(sim.heat, 35)
    assert.equal(sim.isOverheat, false)
  })

  it('cools down and clears the overheat flag', () => {
    const sim = makeSim({ isOverheat: true, heat: 10 })
    stepAmpSimulation(sim, 1000)
    assert.equal(sim.heat, 0)
    assert.equal(sim.isOverheat, false)
  })

  it('disables overdrive when a feedback loop triggers', () => {
    const sim = makeSim({ isOverdriveActive: true })

    // Set RNG: high for Anomaly, TargetDrift, Hijack; low for FeedbackLoop
    let calls = 0
    getSafeRandom.mock.mockImplementation(() => {
      calls++
      if (calls === 1) return 0.0001 // FeedbackLoop
      return 0.5 // Neutral for TargetDrift, too high for Anomaly/Hijack
    })

    stepAmpSimulation(sim, 100)

    assert.equal(sim.isFeedbackLoopActive, true)

    // Should immediately disable overdrive
    assert.equal(sim.isOverdriveActive, false)

    // Should max out interference
    assert.equal(sim.interference, 100)

    // Score: no overdrive bonus (disabled), no overheat, no hijack.
    // Base score = 100. Feedback loop penalty = 0.1. So 10 * 100ms = 1000.
    assert.equal(sim.accumulatedScore, 1000)
  })

  it('forces overdrive off repeatedly if a player attempts to re-enable it during an active feedback loop', () => {
    const sim = makeSim({
      isFeedbackLoopActive: true,
      isOverdriveActive: true // Simulating a player turning it on
    })

    stepAmpSimulation(sim, 100)

    // Should immediately disable overdrive
    assert.equal(sim.isOverdriveActive, false)

    // Overdrive multiplier should not be applied to score
    assert.equal(sim.accumulatedScore, 1000)
  })

  it('proves feedback-loop overheating disables overdrive and applies penalties', () => {
    const sim = makeSim({ isOverdriveActive: true, heat: 95 })

    // Set RNG: high for Anomaly, TargetDrift, Hijack; low for FeedbackLoop
    let calls = 0
    getSafeRandom.mock.mockImplementation(() => {
      calls++
      if (calls === 1) return 0.0001 // FeedbackLoop
      return 0.5 // Neutral for TargetDrift, too high for Anomaly/Hijack
    })

    stepAmpSimulation(sim, 500)

    assert.equal(sim.isFeedbackLoopActive, true)
    assert.equal(sim.isOverheat, true)
    assert.equal(sim.isOverdriveActive, false)

    // Base score = 100. Overheat penalty (0.5), Feedback penalty (0.1).
    // 100 * 0.5 * 0.1 = 5 per ms. Over 500ms = 2500.
    assert.equal(sim.accumulatedScore, 2500)
  })

  it('activates a hijack when RNG is below the threshold', () => {
    rngValue = 0.0001
    const sim = makeSim()
    stepAmpSimulation(sim, 5000)
    assert.equal(sim.isHijackActive, true)
  })
})
