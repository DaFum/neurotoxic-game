import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Single-owner guarantees from issue #3586: inputs, ticks and hazard commands
// update one simulation model, and the stage and React snapshots are written
// from it synchronously instead of after a commit effect.

const rng = vi.hoisted(() => ({ queue: [] }))
const mockCompleteAmpCalibration = vi.fn()

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({
    completeAmpCalibration: mockCompleteAmpCalibration,
    changeScene: vi.fn()
  }),
  useGameSelector: selector => selector({})
}))

vi.mock('../../src/utils/crypto', () => ({
  getSafeRandom: vi.fn(() =>
    rng.queue.length > 0 ? rng.queue.shift() : 0.999
  ),
  secureRandom: vi.fn(() => 0.999),
  getSafeUUID: vi.fn(() => 'test-uuid')
}))

import { useAmpLogic } from '../../src/hooks/minigames/useAmpLogic'

/** Mounts with target 500 (one mount-time roll of 0.5). */
const mount = () => {
  rng.queue.push(0.5)
  return renderHook(() => useAmpLogic())
}

describe('useAmpLogic single-owner model', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    rng.queue.length = 0
  })

  it('a tick in the same act observes an overdrive setter call', () => {
    const { result } = mount()
    act(() => {
      result.current.setDialValue(500)
      result.current.setIsOverdriveActive(true)
      result.current.update(1000)
    })
    expect(result.current.heat).toBe(35)
    expect(result.current.score).toBe(150)
  })

  it('composes functional dial updaters and feeds them to the next tick', () => {
    const { result } = mount()
    act(() => {
      result.current.setDialValue(prev => prev + 100)
      result.current.setDialValue(prev => prev + 100)
      result.current.setDialValue(prev => prev - 50)
      result.current.update(1000)
    })
    expect(result.current.dialValue).toBe(650)
    // diff 150 => 100 - 15 = 85
    expect(result.current.score).toBe(85)
  })

  it('writes the stage snapshot synchronously, without waiting for effects', () => {
    const { result } = mount()
    const stageRef = result.current.gameStateRef
    let duringAct
    act(() => {
      result.current.setIsOverdriveActive(true)
      result.current.update(400)
      duringAct = { ...stageRef.current }
    })
    expect(duringAct).toMatchObject({
      isOverdriveActive: true,
      heat: 14,
      interference: 2
    })
    act(() => {
      result.current.purgeInterference()
      duringAct = { ...stageRef.current }
    })
    expect(duringAct.interference).toBe(0)
    act(() => result.current.update(100))
    // Stage interference stays fractional; React receives the floor.
    expect(stageRef.current.interference).toBe(0.5)
    expect(result.current.interference).toBe(0)
    expect(result.current.gameStateRef).toBe(stageRef)
  })

  it('republishes interference after a purge rebuilds to the previous integer', () => {
    const { result } = mount()
    act(() => result.current.update(400))
    expect(result.current.interference).toBe(2)
    act(() => result.current.purgeInterference())
    expect(result.current.interference).toBe(0)
    act(() => result.current.update(400))
    expect(result.current.gameStateRef.current.interference).toBe(2)
    expect(result.current.interference).toBe(2)
  })

  it('reports counters from the same model the hazard commands mutate', () => {
    const { result } = mount()
    act(() => {
      rng.queue.push(0.0001) // feedback loop spawns on this tick
      result.current.update(100)
      result.current.dampenFeedback()
      result.current.dampenFeedback()
      result.current.purgeInterference()
      result.current.finishMinigame()
    })
    expect(mockCompleteAmpCalibration).toHaveBeenCalledExactlyOnceWith(
      10,
      0,
      1,
      0,
      1
    )
  })
})
