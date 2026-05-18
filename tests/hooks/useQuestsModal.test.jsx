import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useQuestsModal } from '../../src/hooks/useQuestsModal'

const DEFAULT_STATE = Object.freeze({
  activeQuests: [
    { id: 'quest1', label: 'Quest 1' },
    { id: 'quest2', label: 'Quest 2' }
  ],
  player: { name: 'Test Player' }
})

// Hoisted holder so the mock factory and tests share a single source of truth
// for the mocked game state. Multi-selector hooks call `useGameSelector` once
// per slice; reading from a shared ref guarantees every selector sees the
// same snapshot (avoids the `mockReturnValueOnce` foot-gun).
const mocks = vi.hoisted(() => ({ state: null }))

vi.mock('../../src/context/GameState.tsx', () => {
  const useGameState = vi.fn(() => mocks.state)
  return {
    useGameState,
    useGameActions: useGameState,
    useGameSelector: selector => selector(mocks.state)
  }
})

const setMockState = next => {
  mocks.state = next
}

setMockState({ ...DEFAULT_STATE })

afterEach(() => {
  setMockState({ ...DEFAULT_STATE })
})

describe('useQuestsModal', () => {
  it('should initialize with showQuests as false', () => {
    const { result } = renderHook(() => useQuestsModal())
    expect(result.current.showQuests).toBe(false)
  })

  it('should set showQuests to true when openQuests is called', () => {
    const { result } = renderHook(() => useQuestsModal())

    act(() => {
      result.current.openQuests()
    })

    expect(result.current.showQuests).toBe(true)
  })

  it('should set showQuests to false when closeQuests is called', () => {
    const { result } = renderHook(() => useQuestsModal())

    act(() => {
      result.current.openQuests()
    })
    expect(result.current.showQuests).toBe(true)

    act(() => {
      result.current.closeQuests()
    })
    expect(result.current.showQuests).toBe(false)
  })

  it('should generate questsProps with game state', () => {
    const { result } = renderHook(() => useQuestsModal())

    expect(result.current.questsProps).toEqual({
      onClose: expect.any(Function),
      activeQuests: [
        { id: 'quest1', label: 'Quest 1' },
        { id: 'quest2', label: 'Quest 2' }
      ],
      player: { name: 'Test Player' }
    })
  })

  it('should correctly pass through undefined or null activeQuests', () => {
    setMockState({
      player: { name: 'Test Player' },
      activeQuests: undefined
    })

    const { result: resultUndefined } = renderHook(() => useQuestsModal())
    expect(resultUndefined.current.questsProps).toEqual({
      onClose: expect.any(Function),
      player: { name: 'Test Player' },
      activeQuests: []
    })

    setMockState({
      player: { name: 'Test Player' },
      activeQuests: null
    })

    const { result: resultNull } = renderHook(() => useQuestsModal())
    expect(resultNull.current.questsProps).toEqual({
      onClose: expect.any(Function),
      player: { name: 'Test Player' },
      activeQuests: []
    })
  })
})
