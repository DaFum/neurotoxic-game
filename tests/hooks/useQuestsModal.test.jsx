import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useQuestsModal } from '../../src/hooks/useQuestsModal'
import { useGameState } from '../../src/context/GameState.tsx'

// Mock the GameState context
vi.mock('../../src/context/GameState.tsx', () => ({
  useGameState: vi.fn(() => ({
    activeQuests: [
      { id: 'quest1', label: 'Quest 1' },
      { id: 'quest2', label: 'Quest 2' }
    ],
    player: { name: 'Test Player' }
  }))
}))

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
    // Override the mock for this specific test
    vi.mocked(useGameState).mockReturnValueOnce({
      player: { name: 'Test Player' },
      activeQuests: undefined
    })

    const { result: resultUndefined } = renderHook(() => useQuestsModal())
    expect(resultUndefined.current.questsProps).toEqual({
      onClose: expect.any(Function),
      player: { name: 'Test Player' },
      activeQuests: []
    })

    vi.mocked(useGameState).mockReturnValueOnce({
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
