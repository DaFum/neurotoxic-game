import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { GAME_PHASES } from '../../src/context/gameConstants'

// Characterization traces for useAmpLogic (issue #3586). Every input runs in
// its own act() so the pinned behavior is independent of how the hook stores
// state internally. RNG values are scripted per call; once the script is
// exhausted getSafeRandom returns 0.999, which keeps every stochastic phase
// quiet for deltas below ~1998 ms (overheat drift excepted, see traces).

const rng = vi.hoisted(() => ({ queue: [], calls: 0 }))
const mockCompleteAmpCalibration = vi.fn()
const mockChangeScene = vi.fn()

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({
    completeAmpCalibration: mockCompleteAmpCalibration,
    changeScene: mockChangeScene
  }),
  useGameSelector: selector => selector({})
}))

vi.mock('../../src/utils/crypto', () => ({
  getSafeRandom: vi.fn(() => {
    rng.calls += 1
    return rng.queue.length > 0 ? rng.queue.shift() : 0.999
  }),
  secureRandom: vi.fn(() => 0.999),
  getSafeUUID: vi.fn(() => 'test-uuid')
}))

import { useAmpLogic } from '../../src/hooks/minigames/useAmpLogic'

const STAGE_KEYS = [
  'dialValue',
  'heat',
  'hijacksOverridden',
  'interference',
  'isAnomalyActive',
  'isHijackActive',
  'isOverdriveActive',
  'isOverheat',
  'targetValue',
  'voidResonance'
]

const fmt = r =>
  [
    `t=${r.timeLeft}`,
    `score=${r.score}`,
    `dial=${r.dialValue}`,
    `target=${r.targetValue}`,
    `heat=${r.heat}`,
    `od=${Number(r.isOverdriveActive)}`,
    `oh=${Number(r.isOverheat)}`,
    `anom=${Number(r.isAnomalyActive)}`,
    `res=${r.voidResonance}`,
    `hij=${Number(r.isHijackActive)}/${r.hijacksOverridden}`,
    `fb=${Number(r.isFeedbackLoopActive)}/${r.feedbackLoopsDampened}`,
    `int=${r.interference}`,
    `over=${Number(r.isGameOver)}`,
    `rng=${rng.calls}`
  ].join(' ')

/** The stage snapshot must agree with the published hook values. */
const expectStageConsistent = r => {
  const stage = r.gameStateRef.current
  expect(Object.keys(stage).sort()).toEqual(STAGE_KEYS)
  const { interference, ...rest } = stage
  expect(rest).toEqual({
    dialValue: r.dialValue,
    targetValue: r.targetValue,
    isOverdriveActive: r.isOverdriveActive,
    isOverheat: r.isOverheat,
    heat: r.heat,
    isAnomalyActive: r.isAnomalyActive,
    voidResonance: r.voidResonance,
    isHijackActive: r.isHijackActive,
    hijacksOverridden: r.hijacksOverridden
  })
  expect(Math.floor(interference)).toBe(r.interference)
}

/** Mounts the hook with a scripted mount-time RNG and returns a trace recorder. */
const mountTraced = (mountRng, options) => {
  rng.queue.push(...mountRng)
  const hook = renderHook(() => useAmpLogic(options))
  const trace = []
  const record = label => {
    expectStageConsistent(hook.result.current)
    trace.push(`${label}: ${fmt(hook.result.current)}`)
  }
  record('mount')
  const step = (label, fn, script = []) => {
    rng.queue.push(...script)
    act(() => {
      fn(hook.result.current)
    })
    expect(rng.queue).toEqual([])
    record(label)
  }
  return { ...hook, trace, step }
}

describe('useAmpLogic (fixed RNG and delta traces)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    rng.queue.length = 0
    rng.calls = 0
  })
  afterEach(() => vi.useRealTimers())

  it('makes exactly one RNG call at mount for the initial target', () => {
    const { result, trace } = mountTraced([0.25])
    expect(rng.calls).toBe(1)
    expect(result.current.targetValue).toBe(300)
    expect(trace).toMatchInlineSnapshot(`
      [
        "mount: t=15 score=100 dial=500 target=300 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
      ]
    `)
  })

  it('trace A: functional dial setters, score cadence and expiry frame', () => {
    const onResult = vi.fn()
    const onContinue = vi.fn()
    const h = mountTraced([0.5], { onResult, onContinue })
    h.step('dial=480', r => r.setDialValue(480))
    h.step('tick 16', r => r.update(16))
    h.step('tick 250', r => r.update(250))
    h.step('tick 1000', r => r.update(1000))
    h.step('dial+=20', r => r.setDialValue(prev => prev + 20))
    h.step('dial+=7', r => r.setDialValue(prev => prev + 7))
    h.step('tick 733.3', r => r.update(733.3))
    h.step('tick 0', r => r.update(0))
    h.step('tick -50', r => r.update(-50))
    h.step('tick NaN', r => r.update(Number.NaN))
    h.step('tick 20000 (expiry)', r => r.update(20_000))
    h.step('tick 1000 (after)', r => r.update(1000))
    expect(h.trace).toMatchInlineSnapshot(`
      [
        "mount: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "dial=480: t=15 score=100 dial=480 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "tick 16: t=14.984 score=98 dial=480 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=4",
        "tick 250: t=14.734 score=98 dial=480 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=1 over=0 rng=7",
        "tick 1000: t=13.734 score=98 dial=480 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=6 over=0 rng=10",
        "dial+=20: t=13.734 score=98 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=6 over=0 rng=10",
        "dial+=7: t=13.734 score=98 dial=507 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=6 over=0 rng=10",
        "tick 733.3: t=13.0007 score=98.47681188415946 dial=507 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=9 over=0 rng=13",
        "tick 0: t=13.0007 score=98.47681188415946 dial=507 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=9 over=0 rng=13",
        "tick -50: t=13.0007 score=98.47681188415946 dial=507 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=9 over=0 rng=13",
        "tick NaN: t=13.0007 score=98.47681188415946 dial=507 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=9 over=0 rng=13",
        "tick 20000 (expiry): t=0 score=98.47681188415946 dial=507 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=9 over=1 rng=13",
        "tick 1000 (after): t=0 score=98.47681188415946 dial=507 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=9 over=1 rng=13",
      ]
    `)
    expect(onResult.mock.calls).toMatchInlineSnapshot(`
      [
        [
          98.47681188415946,
        ],
      ]
    `)
    expect(mockCompleteAmpCalibration).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(9_999))
    expect(onContinue).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onContinue).toHaveBeenCalledTimes(1)
    act(() => vi.advanceTimersByTime(20_000))
    expect(onContinue).toHaveBeenCalledTimes(1)
    expect(mockChangeScene).not.toHaveBeenCalled()
  })

  it('trace B: overdrive heat, overheat, forced drift and cooldown', () => {
    const h = mountTraced([0.25])
    h.step('dial=300', r => r.setDialValue(300))
    h.step('overdrive on', r => r.setIsOverdriveActive(true))
    h.step('tick 1000', r => r.update(1000))
    h.step('tick 1000', r => r.update(1000))
    // Overheat this frame: drift chance 0.2 * 10 clamps to 1 and fires.
    h.step('tick 1000 (overheat)', r => r.update(1000), [0.999, 0.999, 0.75])
    h.step('toggle overdrive', r => r.setIsOverdriveActive(prev => !prev))
    h.step('tick 400', r => r.update(400), [0.999, 0.1, 0.25])
    h.step('tick 1000', r => r.update(1000))
    h.step('tick 1000', r => r.update(1000))
    h.step('tick 1000', r => r.update(1000))
    h.step('tick 500', r => r.update(500))
    h.step('finish', r => r.finishMinigame())
    h.step('finish again', r => r.finishMinigame())
    expect(h.trace).toMatchInlineSnapshot(`
      [
        "mount: t=15 score=100 dial=500 target=300 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "dial=300: t=15 score=100 dial=300 target=300 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "overdrive on: t=15 score=100 dial=300 target=300 heat=0 od=1 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "tick 1000: t=14 score=150 dial=300 target=300 heat=35 od=1 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=5 over=0 rng=5",
        "tick 1000: t=13 score=150 dial=300 target=300 heat=70 od=1 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=10 over=0 rng=9",
        "tick 1000 (overheat): t=12 score=115 dial=300 target=400 heat=100 od=0 oh=1 anom=0 res=0 hij=0/0 fb=0/0 int=15 over=0 rng=13",
        "toggle overdrive: t=12 score=115 dial=300 target=400 heat=100 od=1 oh=1 anom=0 res=0 hij=0/0 fb=0/0 int=15 over=0 rng=13",
        "tick 400: t=11.6 score=107.3529411764706 dial=300 target=300 heat=90 od=0 oh=1 anom=0 res=0 hij=0/0 fb=0/0 int=17 over=0 rng=17",
        "tick 1000: t=10.6 score=92.05 dial=300 target=499.6 heat=65 od=0 oh=1 anom=0 res=0 hij=0/0 fb=0/0 int=22 over=0 rng=21",
        "tick 1000: t=9.6 score=80.56666666666666 dial=300 target=699.2 heat=40 od=0 oh=1 anom=0 res=0 hij=0/0 fb=0/0 int=27 over=0 rng=25",
        "tick 1000: t=8.6 score=71.1125 dial=300 target=898.8000000000001 heat=15 od=0 oh=1 anom=0 res=0 hij=0/0 fb=0/0 int=32 over=0 rng=29",
        "tick 500: t=8.1 score=67.0463768115942 dial=300 target=1000 heat=2.5 od=0 oh=1 anom=0 res=0 hij=0/0 fb=0/0 int=34 over=0 rng=33",
        "finish: t=8.1 score=67.0463768115942 dial=300 target=1000 heat=2.5 od=0 oh=1 anom=0 res=0 hij=0/0 fb=0/0 int=34 over=1 rng=33",
        "finish again: t=8.1 score=67.0463768115942 dial=300 target=1000 heat=2.5 od=0 oh=1 anom=0 res=0 hij=0/0 fb=0/0 int=34 over=1 rng=33",
      ]
    `)
    expect(mockCompleteAmpCalibration.mock.calls).toMatchInlineSnapshot(`
      [
        [
          67.0463768115942,
          0,
          0,
          0,
          0,
        ],
      ]
    `)
    act(() => vi.advanceTimersByTime(9_999))
    expect(mockChangeScene).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(mockChangeScene).toHaveBeenCalledExactlyOnceWith(GAME_PHASES.GIG)
  })

  it('trace C: feedback loop, guarded dampening and purges', () => {
    const h = mountTraced([0.5])
    h.step('purge at zero', r => r.purgeInterference())
    h.step('dial=500', r => r.setDialValue(500))
    h.step('tick 100 (feedback)', r => r.update(100), [0.0001])
    h.step('overdrive on', r => r.setIsOverdriveActive(true))
    h.step('tick 500', r => r.update(500))
    h.step('dampen', r => r.dampenFeedback())
    h.step('dampen again', r => r.dampenFeedback())
    h.step('tick 250', r => r.update(250))
    h.step('purge', r => r.purgeInterference())
    h.step('tick 1000', r => r.update(1000))
    h.step('finish', r => r.finishMinigame())
    expect(h.trace).toMatchInlineSnapshot(`
      [
        "mount: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "purge at zero: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "dial=500: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "tick 100 (feedback): t=14.9 score=10 dial=500 target=500 heat=2.5 od=0 oh=0 anom=0 res=0 hij=0/0 fb=1/0 int=100 over=0 rng=4",
        "overdrive on: t=14.9 score=10 dial=500 target=500 heat=2.5 od=1 oh=0 anom=0 res=0 hij=0/0 fb=1/0 int=100 over=0 rng=4",
        "tick 500: t=14.4 score=10 dial=500 target=500 heat=15 od=0 oh=0 anom=0 res=0 hij=0/0 fb=1/0 int=100 over=0 rng=6",
        "dampen: t=14.4 score=10 dial=500 target=500 heat=15 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/1 int=100 over=0 rng=6",
        "dampen again: t=14.4 score=10 dial=500 target=500 heat=15 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/1 int=100 over=0 rng=6",
        "tick 250: t=14.15 score=36.470588235294116 dial=500 target=500 heat=11.25 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/1 int=100 over=0 rng=9",
        "purge: t=14.15 score=36.470588235294116 dial=500 target=500 heat=11.25 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/1 int=0 over=0 rng=9",
        "tick 1000: t=13.15 score=70.8108108108108 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/1 int=5 over=0 rng=12",
        "finish: t=13.15 score=70.8108108108108 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/1 int=5 over=1 rng=12",
      ]
    `)
    expect(mockCompleteAmpCalibration.mock.calls).toMatchInlineSnapshot(`
      [
        [
          70.8108108108108,
          0,
          2,
          0,
          1,
        ],
      ]
    `)
  })

  it('trace D: anomaly target choice, resonance, overheat clear and hijack override', () => {
    const h = mountTraced([0.5])
    h.step('overdrive on', r => r.setIsOverdriveActive(true))
    // feedback no, anomaly spawn, target pick (>0.5 => 950), drift skipped, hijack no
    h.step('tick 100 (anomaly)', r => r.update(100), [0.999, 0.001, 0.7])
    h.step('dial=940', r => r.setDialValue(940))
    h.step('tick 1000', r => r.update(1000))
    h.step('tick 1000', r => r.update(1000))
    h.step('tick 1000 (overheat)', r => r.update(1000), [0.999, 0.999, 0.6])
    // feedback no, drift no (0.2 chance at 100 ms), hijack spawn
    h.step('tick 100 (hijack)', r => r.update(100), [0.999, 0.5, 0.0001])
    h.step('tick 100', r => r.update(100))
    h.step('override', r => r.overrideHijack())
    h.step('override again', r => r.overrideHijack())
    h.step('tick 100', r => r.update(100), [0.999, 0.5])
    h.step('tick 20000 (expiry)', r => r.update(20_000))
    expect(h.trace).toMatchInlineSnapshot(`
      [
        "mount: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "overdrive on: t=15 score=100 dial=500 target=500 heat=0 od=1 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "tick 100 (anomaly): t=14.9 score=82.5 dial=500 target=950 heat=3.5 od=1 oh=0 anom=1 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=5",
        "dial=940: t=14.9 score=82.5 dial=940 target=950 heat=3.5 od=1 oh=0 anom=1 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=5",
        "tick 1000: t=13.9 score=142.5 dial=940 target=950 heat=38.5 od=1 oh=0 anom=1 res=20 hij=0/0 fb=0/0 int=5 over=0 rng=7",
        "tick 1000: t=12.9 score=145.35714285714286 dial=940 target=950 heat=73.5 od=1 oh=0 anom=1 res=40 hij=0/0 fb=0/0 int=10 over=0 rng=9",
        "tick 1000 (overheat): t=11.9 score=113.79032258064517 dial=940 target=990 heat=100 od=0 oh=1 anom=0 res=40 hij=0/0 fb=0/0 int=15 over=0 rng=13",
        "tick 100 (hijack): t=11.8 score=110.53125 dial=940 target=990 heat=97.5 od=0 oh=1 anom=0 res=40 hij=1/0 fb=0/0 int=16 over=0 rng=16",
        "tick 100: t=11.700000000000001 score=107.46969696969697 dial=940 target=990 heat=95 od=0 oh=1 anom=0 res=40 hij=1/0 fb=0/0 int=16 over=0 rng=18",
        "override: t=11.700000000000001 score=107.46969696969697 dial=940 target=990 heat=95 od=0 oh=1 anom=0 res=40 hij=0/1 fb=0/0 int=16 over=0 rng=18",
        "override again: t=11.700000000000001 score=107.46969696969697 dial=940 target=990 heat=95 od=0 oh=1 anom=0 res=40 hij=0/1 fb=0/0 int=16 over=0 rng=18",
        "tick 100: t=11.600000000000001 score=105.70588235294117 dial=940 target=990 heat=92.5 od=0 oh=1 anom=0 res=40 hij=0/1 fb=0/0 int=17 over=0 rng=21",
        "tick 20000 (expiry): t=0 score=105.70588235294117 dial=940 target=990 heat=92.5 od=0 oh=1 anom=0 res=40 hij=0/1 fb=0/0 int=17 over=1 rng=21",
      ]
    `)
    expect(mockCompleteAmpCalibration.mock.calls).toMatchInlineSnapshot(`
      [
        [
          105.70588235294117,
          40,
          0,
          1,
          0,
        ],
      ]
    `)
  })

  it('trace E: anomaly picks the low extreme when the target roll is <= 0.5', () => {
    const h = mountTraced([0.5])
    h.step('overdrive on', r => r.setIsOverdriveActive(true))
    h.step('tick 100 (anomaly)', r => r.update(100), [0.999, 0.001, 0.5])
    h.step('overdrive off', r => r.setIsOverdriveActive(false))
    h.step('tick 100', r => r.update(100))
    expect(h.trace).toMatchInlineSnapshot(`
      [
        "mount: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "overdrive on: t=15 score=100 dial=500 target=500 heat=0 od=1 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
        "tick 100 (anomaly): t=14.9 score=82.5 dial=500 target=50 heat=3.5 od=1 oh=0 anom=1 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=5",
        "overdrive off: t=14.9 score=82.5 dial=500 target=50 heat=3.5 od=0 oh=0 anom=1 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=5",
        "tick 100: t=14.8 score=68.75 dial=500 target=50 heat=2 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=1 over=0 rng=8",
      ]
    `)
  })

  it('batched ticks in one act match the same ticks in separate acts', () => {
    const deltas = [16, 16, 100, 250, 500, 1000, 33, 1000]
    const script = () => {
      rng.queue.push(0.5)
    }

    script()
    const separate = renderHook(() => useAmpLogic())
    act(() => separate.result.current.setDialValue(470))
    act(() => separate.result.current.setIsOverdriveActive(true))
    for (const d of deltas) act(() => separate.result.current.update(d))
    act(() => separate.result.current.finishMinigame())
    const separateTrace = fmt(separate.result.current)
    const separateCalls = rng.calls
    separate.unmount()

    rng.calls = 0
    script()
    const batched = renderHook(() => useAmpLogic())
    act(() => batched.result.current.setDialValue(470))
    act(() => batched.result.current.setIsOverdriveActive(true))
    act(() => {
      for (const d of deltas) batched.result.current.update(d)
    })
    expectStageConsistent(batched.result.current)
    act(() => batched.result.current.finishMinigame())

    expect(fmt(batched.result.current)).toBe(separateTrace)
    expect(rng.calls).toBe(separateCalls)
    expect(mockCompleteAmpCalibration).toHaveBeenCalledTimes(2)
    expect(mockCompleteAmpCalibration.mock.calls[1]).toEqual(
      mockCompleteAmpCalibration.mock.calls[0]
    )
    expect(separateTrace).toMatchInlineSnapshot(
      `"t=12.085 score=108.80017152658662 dial=470 target=699.6 heat=100 od=0 oh=1 anom=0 res=0 hij=0/0 fb=0/0 int=14 over=1 rng=33"`
    )
    expect(mockCompleteAmpCalibration.mock.calls[0]).toMatchInlineSnapshot(`
      [
        108.80017152658662,
        0,
        0,
        0,
        0,
      ]
    `)
  })

  describe('terminal ticks', () => {
    it('expires on the tick that reaches exactly 15 s without scoring it', () => {
      const h = mountTraced([0.5])
      h.step('dial=450', r => r.setDialValue(450))
      for (let i = 1; i <= 14; i++) {
        act(() => h.result.current.update(1000))
      }
      h.step('after 14 s', () => {})
      h.step('tick 1000 (expiry)', r => r.update(1000))
      expect(h.trace).toMatchInlineSnapshot(`
        [
          "mount: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
          "dial=450: t=15 score=100 dial=450 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
          "after 14 s: t=1 score=95 dial=450 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=70 over=0 rng=43",
          "tick 1000 (expiry): t=0 score=95 dial=450 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=70 over=1 rng=43",
        ]
      `)
      expect(mockCompleteAmpCalibration.mock.calls).toMatchInlineSnapshot(`
        [
          [
            95,
            0,
            0,
            0,
            0,
          ],
        ]
      `)
    })

    it('clamps an overshooting tick to zero time', () => {
      const h = mountTraced([0.5])
      h.step('tick 14000.5', r => r.update(14_000.5))
      h.step('tick 5000 (expiry)', r => r.update(5000))
      expect(h.result.current.timeLeft).toBe(0)
      expect(h.trace).toMatchInlineSnapshot(`
        [
          "mount: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
          "tick 14000.5: t=0.9994999999999994 score=1.8004000000000002 dial=500 target=599.8 heat=0 od=0 oh=0 anom=0 res=0 hij=1/0 fb=1/0 int=100 over=0 rng=5",
          "tick 5000 (expiry): t=0 score=1.8004000000000002 dial=500 target=599.8 heat=0 od=0 oh=0 anom=0 res=0 hij=1/0 fb=1/0 int=100 over=1 rng=5",
        ]
      `)
      expect(mockCompleteAmpCalibration.mock.calls).toMatchInlineSnapshot(`
        [
          [
            1.8004000000000002,
            0,
            0,
            0,
            0,
          ],
        ]
      `)
    })

    it('reports score 0 when the first tick already expires', () => {
      const h = mountTraced([0.5])
      h.step('tick 15000 (expiry)', r => r.update(15_000))
      expect(rng.calls).toBe(1)
      expect(mockCompleteAmpCalibration).toHaveBeenCalledExactlyOnceWith(
        0,
        0,
        0,
        0,
        0
      )
      expect(h.trace).toMatchInlineSnapshot(`
        [
          "mount: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
          "tick 15000 (expiry): t=0 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=1 rng=1",
        ]
      `)
    })

    it('immediate manual finish reports 0 and leaves score and time unchanged', () => {
      const h = mountTraced([0.5])
      h.step('finish', r => r.finishMinigame())
      expect(h.result.current.score).toBe(100)
      expect(h.result.current.timeLeft).toBe(15)
      expect(mockCompleteAmpCalibration).toHaveBeenCalledExactlyOnceWith(
        0,
        0,
        0,
        0,
        0
      )
    })

    it('ignores ticks and finish calls after expiry', () => {
      const h = mountTraced([0.5])
      h.step('tick 1000', r => r.update(1000))
      h.step('tick 20000 (expiry)', r => r.update(20_000))
      const before = h.trace.at(-1).replace(/^[^:]+: /, '')
      h.step('tick 1000 (after)', r => r.update(1000))
      h.step('finish (after)', r => r.finishMinigame())
      expect(h.trace.at(-1).replace(/^[^:]+: /, '')).toBe(before)
      expect(mockCompleteAmpCalibration).toHaveBeenCalledTimes(1)
    })

    it('still applies dial and overdrive setters after game over', () => {
      const h = mountTraced([0.5])
      h.step('finish', r => r.finishMinigame())
      h.step('dial=123', r => r.setDialValue(123))
      h.step('overdrive on', r => r.setIsOverdriveActive(true))
      h.step('tick 1000 (after)', r => r.update(1000))
      expect(h.trace).toMatchInlineSnapshot(`
        [
          "mount: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=0 rng=1",
          "finish: t=15 score=100 dial=500 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=1 rng=1",
          "dial=123: t=15 score=100 dial=123 target=500 heat=0 od=0 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=1 rng=1",
          "overdrive on: t=15 score=100 dial=123 target=500 heat=0 od=1 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=1 rng=1",
          "tick 1000 (after): t=15 score=100 dial=123 target=500 heat=0 od=1 oh=0 anom=0 res=0 hij=0/0 fb=0/0 int=0 over=1 rng=1",
        ]
      `)
    })
  })

  describe('ten-second continuation', () => {
    it('routes standalone play to GIG exactly once at 10 s', () => {
      const h = mountTraced([0.5])
      h.step('tick 20000 (expiry)', r => r.update(20_000))
      act(() => vi.advanceTimersByTime(9_999))
      expect(mockChangeScene).not.toHaveBeenCalled()
      h.step('dial=10 (rerender)', r => r.setDialValue(10))
      act(() => vi.advanceTimersByTime(1))
      expect(mockChangeScene).toHaveBeenCalledExactlyOnceWith(GAME_PHASES.GIG)
      act(() => vi.advanceTimersByTime(30_000))
      expect(mockChangeScene).toHaveBeenCalledTimes(1)
    })

    it('is a no-op with onResult and no onContinue', () => {
      const onResult = vi.fn()
      const h = mountTraced([0.5], { onResult })
      h.step('finish', r => r.finishMinigame())
      act(() => vi.advanceTimersByTime(30_000))
      expect(onResult).toHaveBeenCalledExactlyOnceWith(0)
      expect(mockChangeScene).not.toHaveBeenCalled()
      expect(mockCompleteAmpCalibration).not.toHaveBeenCalled()
    })

    it('does not fire after unmount', () => {
      const onContinue = vi.fn()
      const h = mountTraced([0.5], { onContinue })
      h.step('finish', r => r.finishMinigame())
      h.unmount()
      act(() => vi.advanceTimersByTime(30_000))
      expect(onContinue).not.toHaveBeenCalled()
      expect(mockCompleteAmpCalibration).toHaveBeenCalledTimes(1)
    })
  })
})
