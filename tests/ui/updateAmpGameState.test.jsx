import { describe, it, expect, vi, beforeEach } from 'vitest'

// Deterministic RNG: default high value suppresses the stochastic phases
// (anomaly spawn, target drift, hijack); individual tests lower it to fire them.
let rngValue = 0.99
vi.mock('../../src/utils/crypto', () => ({
  getSafeRandom: () => rngValue
}))

import { updateAmpGameState } from '../../src/hooks/minigames/ampLogicUtils'

function makeRefs(overrides = {}) {
  return {
    isCompleteRef: { current: false },
    timeLeftRef: { current: 10 },
    heatRef: { current: 0 },
    isOverheatRef: { current: false },
    isOverdriveActiveRef: { current: false },
    isAnomalyActiveRef: { current: false },
    isHijackActiveRef: { current: false },
    interferenceRef: { current: 0 },
    dialValueRef: { current: 500 },
    targetValueRef: { current: 500 },
    accumulatedScoreRef: { current: 0 },
    accumulatedMsRef: { current: 0 },
    voidResonanceRef: { current: 0 },
    ...overrides
  }
}

function makeSetters() {
  return {
    setTimeLeft: vi.fn(),
    handleComplete: vi.fn(),
    setIsOverdriveActive: vi.fn(),
    setIsOverheat: vi.fn(),
    setHeat: vi.fn(),
    setIsAnomalyActive: vi.fn(),
    setTargetValue: vi.fn(),
    setIsHijackActive: vi.fn(),
    setScore: vi.fn(),
    setVoidResonance: vi.fn()
  }
}

describe('updateAmpGameState', () => {
  beforeEach(() => {
    rngValue = 0.99
  })

  it('no-ops when the game is already complete', () => {
    const refs = makeRefs({ isCompleteRef: { current: true } })
    const setters = makeSetters()
    updateAmpGameState(1000, refs, setters)
    expect(setters.setTimeLeft).not.toHaveBeenCalled()
    expect(setters.handleComplete).not.toHaveBeenCalled()
  })

  it('no-ops on non-positive or non-finite delta', () => {
    const setters = makeSetters()
    updateAmpGameState(0, makeRefs(), setters)
    updateAmpGameState(Number.NaN, makeRefs(), setters)
    expect(setters.setTimeLeft).not.toHaveBeenCalled()
  })

  it('decrements time, builds interference, and accumulates a perfect score', () => {
    const refs = makeRefs()
    const setters = makeSetters()
    updateAmpGameState(1000, refs, setters)
    expect(refs.timeLeftRef.current).toBeCloseTo(9)
    expect(setters.setTimeLeft).toHaveBeenCalledWith(9)
    // dial === target => diff 0 => perfect 100 score, no multipliers/penalties.
    expect(refs.accumulatedScoreRef.current).toBeCloseTo(100 * 1000)
    expect(refs.accumulatedMsRef.current).toBe(1000)
    expect(setters.setScore).toHaveBeenCalledWith(100)
    expect(refs.interferenceRef.current).toBeCloseTo(5)
  })

  it('completes and early-returns when time runs out', () => {
    const refs = makeRefs({ timeLeftRef: { current: 0.5 } })
    const setters = makeSetters()
    updateAmpGameState(1000, refs, setters)
    expect(refs.timeLeftRef.current).toBe(0)
    expect(setters.setTimeLeft).toHaveBeenCalledWith(0)
    expect(setters.handleComplete).toHaveBeenCalledTimes(1)
    expect(setters.setScore).not.toHaveBeenCalled()
  })

  it('heats up while overdrive is active', () => {
    const refs = makeRefs({ isOverdriveActiveRef: { current: true } })
    const setters = makeSetters()
    updateAmpGameState(1000, refs, setters)
    expect(refs.heatRef.current).toBeCloseTo(35)
    expect(setters.setHeat).toHaveBeenCalledWith(35)
    expect(setters.setIsOverheat).not.toHaveBeenCalled()
  })

  it('cools down and clears the overheat flag', () => {
    const refs = makeRefs({
      isOverheatRef: { current: true },
      heatRef: { current: 10 }
    })
    const setters = makeSetters()
    updateAmpGameState(1000, refs, setters)
    expect(refs.heatRef.current).toBe(0)
    expect(refs.isOverheatRef.current).toBe(false)
    expect(setters.setIsOverheat).toHaveBeenCalledWith(false)
  })

  it('activates a hijack when RNG is below the threshold', () => {
    rngValue = 0.0001
    const refs = makeRefs()
    const setters = makeSetters()
    updateAmpGameState(5000, refs, setters)
    expect(refs.isHijackActiveRef.current).toBe(true)
    expect(setters.setIsHijackActive).toHaveBeenCalledWith(true)
  })
})
