import { describe, it, expect, vi, beforeEach } from 'vitest'

// Deterministic RNG: default high value suppresses the stochastic phases
// (anomaly spawn, target drift, hijack); individual tests lower it to fire them.
let rngValue = 0.99
vi.mock('../../src/utils/crypto', () => ({
  getSafeRandom: vi.fn(() => rngValue)
}))
import { getSafeRandom } from '../../src/utils/crypto'

import {
  buildAmpUiSnapshot,
  stepAmpSimulation
} from '../../src/hooks/minigames/ampLogicUtils'

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
    vi.mocked(getSafeRandom).mockClear()
    vi.mocked(getSafeRandom).mockImplementation(() => rngValue)
  })

  it('no-ops when the game is already complete', () => {
    const sim = makeSim({ isComplete: true })
    const before = { ...sim }
    expect(stepAmpSimulation(sim, 1000)).toBe('skipped')
    expect(sim).toEqual(before)
  })

  it('no-ops on non-positive or non-finite delta', () => {
    for (const delta of [0, -50, Number.NaN, Number.POSITIVE_INFINITY]) {
      const sim = makeSim()
      expect(stepAmpSimulation(sim, delta)).toBe('skipped')
      expect(sim).toEqual(makeSim())
    }
    expect(getSafeRandom).not.toHaveBeenCalled()
  })

  it('decrements time, builds interference, and accumulates a perfect score', () => {
    const sim = makeSim()
    expect(stepAmpSimulation(sim, 1000)).toBe('advanced')
    expect(sim.timeLeft).toBeCloseTo(9)
    // dial === target => diff 0 => perfect 100 score, no multipliers/penalties.
    expect(sim.accumulatedScore).toBeCloseTo(100 * 1000)
    expect(sim.accumulatedMs).toBe(1000)
    expect(buildAmpUiSnapshot(sim).score).toBe(100)
    expect(sim.interference).toBeCloseTo(5)
  })

  it('completes and early-returns when time runs out', () => {
    const sim = makeSim({ timeLeft: 0.5 })
    expect(stepAmpSimulation(sim, 1000)).toBe('expired')
    expect(sim.timeLeft).toBe(0)
    // The expiry frame is not scored and draws no RNG.
    expect(sim.accumulatedMs).toBe(0)
    expect(sim.accumulatedScore).toBe(0)
    expect(getSafeRandom).not.toHaveBeenCalled()
  })

  it('heats up while overdrive is active', () => {
    const sim = makeSim({ isOverdriveActive: true })
    stepAmpSimulation(sim, 1000)
    expect(sim.heat).toBeCloseTo(35)
    expect(sim.isOverheat).toBe(false)
  })

  it('cools down and clears the overheat flag', () => {
    const sim = makeSim({ isOverheat: true, heat: 10 })
    stepAmpSimulation(sim, 1000)
    expect(sim.heat).toBe(0)
    expect(sim.isOverheat).toBe(false)
  })

  it('disables overdrive when a feedback loop triggers', () => {
    const sim = makeSim({ isOverdriveActive: true })

    // Set RNG: high for Anomaly, TargetDrift, Hijack; low for FeedbackLoop
    let calls = 0
    vi.mocked(getSafeRandom).mockImplementation(() => {
      calls++
      if (calls === 1) return 0.0001 // FeedbackLoop
      return 0.5 // Neutral for TargetDrift, too high for Anomaly/Hijack
    })

    stepAmpSimulation(sim, 100)

    expect(sim.isFeedbackLoopActive).toBe(true)

    // Should immediately disable overdrive
    expect(sim.isOverdriveActive).toBe(false)

    // Should max out interference
    expect(sim.interference).toBe(100)

    // Score: no overdrive bonus (disabled), no overheat, no hijack.
    // Base score = 100. Feedback loop penalty = 0.1. So 10 * 100ms = 1000.
    expect(sim.accumulatedScore).toBe(1000)
  })

  it('forces overdrive off repeatedly if a player attempts to re-enable it during an active feedback loop', () => {
    const sim = makeSim({
      isFeedbackLoopActive: true,
      isOverdriveActive: true // Simulating a player turning it on
    })

    stepAmpSimulation(sim, 100)

    // Should immediately disable overdrive
    expect(sim.isOverdriveActive).toBe(false)

    // Overdrive multiplier should not be applied to score
    expect(sim.accumulatedScore).toBe(1000)
  })

  it('proves feedback-loop overheating disables overdrive and applies penalties', () => {
    const sim = makeSim({ isOverdriveActive: true, heat: 95 })

    // Set RNG: high for Anomaly, TargetDrift, Hijack; low for FeedbackLoop
    let calls = 0
    vi.mocked(getSafeRandom).mockImplementation(() => {
      calls++
      if (calls === 1) return 0.0001 // FeedbackLoop
      return 0.5 // Neutral for TargetDrift, too high for Anomaly/Hijack
    })

    stepAmpSimulation(sim, 500)

    expect(sim.isFeedbackLoopActive).toBe(true)
    expect(sim.isOverheat).toBe(true)
    expect(sim.isOverdriveActive).toBe(false)

    // Base score = 100. Overheat penalty (0.5), Feedback penalty (0.1).
    // 100 * 0.5 * 0.1 = 5 per ms. Over 500ms = 2500.
    expect(sim.accumulatedScore).toBe(2500)
  })

  it('activates a hijack when RNG is below the threshold', () => {
    rngValue = 0.0001
    const sim = makeSim()
    stepAmpSimulation(sim, 5000)
    expect(sim.isHijackActive).toBe(true)
  })
})
