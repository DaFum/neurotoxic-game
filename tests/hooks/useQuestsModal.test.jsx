import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useQuestsModal } from '../../src/hooks/useQuestsModal'
import { useGameState } from '../../src/context/GameState.jsx'

// Mock the GameState context
vi.mock('../../src/context/GameState.jsx', () => ({
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

  it('should pass through undefined or null activeQuests safely', () => {
    return import('../../src/context/GameState.jsx').then(({ useGameState }) => {
      // Mock undefined
      useGameState.mockReturnValueOnce({
        activeQuests: undefined,
        player: { name: 'Test Player' }
      })
      const { result: res1 } = renderHook(() => useQuestsModal())
      expect(res1.current.questsProps).toEqual({
        onClose: expect.any(Function),
        activeQuests: [],
        player: { name: 'Test Player' }
      })

      // Mock null
      useGameState.mockReturnValueOnce({
        activeQuests: null,
        player: { name: 'Test Player' }
      })
      const { result: res2 } = renderHook(() => useQuestsModal())
      expect(res2.current.questsProps).toEqual({
        onClose: expect.any(Function),
        activeQuests: [],
        player: { name: 'Test Player' }
      })
    })
  })
})
