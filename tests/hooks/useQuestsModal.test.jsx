import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import {
  useQuestsModal,
  buildQuestsProps
} from '../../src/hooks/useQuestsModal'

// Mock the GameState context
vi.mock('../../src/context/GameState.jsx', () => ({
  useGameState: vi.fn(() => ({
    activeQuests: ['quest1', 'quest2'],
    player: { name: 'Test Player' }
  }))
}))

describe('buildQuestsProps', () => {
  it('should build props with provided values', () => {
    const onClose = vi.fn()
    const activeQuests = ['q1', 'q2']
    const player = { id: 1 }

    const props = buildQuestsProps(onClose, activeQuests, player)

    expect(props).toEqual({
      onClose,
      activeQuests: ['q1', 'q2'],
      player: { id: 1 }
    })
  })

  it('should default activeQuests to an empty array if falsy', () => {
    const onClose = vi.fn()
    const player = { id: 1 }

    const props = buildQuestsProps(onClose, undefined, player)

    expect(props.activeQuests).toEqual([])
  })

  it('should default activeQuests to an empty array if null', () => {
    const onClose = vi.fn()
    const player = { id: 1 }

    const props = buildQuestsProps(onClose, null, player)

    expect(props.activeQuests).toEqual([])
  })
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
      activeQuests: ['quest1', 'quest2'],
      player: { name: 'Test Player' }
    })
  })
})
