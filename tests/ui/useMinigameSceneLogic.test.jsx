import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MINIGAME_TYPES } from '../../src/context/gameConstants'

const mockCompleteRoadieMinigame = vi.fn()
let mockState = {}

vi.mock('../../src/context/GameState', () => ({
  useGameActions: () => ({
    completeRoadieMinigame: mockCompleteRoadieMinigame,
    completeAmpCalibration: vi.fn()
  }),
  useGameSelector: selector => selector(mockState)
}))

const { useMinigameSceneLogic } =
  await import('../../src/hooks/useMinigameSceneLogic')

describe('useMinigameSceneLogic — Roadie skip', () => {
  const stash = {
    c_left_at_hq: { id: 'c_left_at_hq', stacks: 1 },
    c_packed: { id: 'c_packed', stacks: 2 }
  }

  beforeEach(() => vi.clearAllMocks())

  const skipWith = expedition => {
    mockState = {
      band: { stash },
      expedition,
      minigame: { type: MINIGAME_TYPES.ROADIE }
    }
    const onComplete = vi.fn()
    const { result } = renderHook(() =>
      useMinigameSceneLogic({ logic: {}, uiState: {}, onComplete })
    )
    act(() => result.current.handleSkip())
    expect(onComplete).toHaveBeenCalledTimes(1)
  }

  it('forfeits the packed item the Roadie run escorts during a Tour (#3467)', () => {
    skipWith({
      status: 'active',
      cargo: {
        contraband: [{ stashKey: 'c_packed', instanceId: null, stacks: 1 }]
      }
    })

    expect(mockCompleteRoadieMinigame).toHaveBeenCalledWith(100, 0, 'c_packed')
  })

  it('reports no item when nothing is packed during a Tour', () => {
    skipWith({ status: 'active', cargo: { contraband: [] } })

    expect(mockCompleteRoadieMinigame).toHaveBeenCalledWith(100, 0, undefined)
  })

  it('keeps the whole stash outside a Tour', () => {
    skipWith({ status: 'idle' })

    expect(mockCompleteRoadieMinigame).toHaveBeenCalledWith(
      100,
      0,
      'c_left_at_hq'
    )
  })
})
