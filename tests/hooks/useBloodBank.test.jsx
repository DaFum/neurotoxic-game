import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBloodBank } from '../../src/hooks/useBloodBank'
import * as GameStateContext from '../../src/context/GameState'

vi.mock('../../src/context/GameState', () => ({
  useGameState: vi.fn()
}))

describe('useBloodBank', () => {
  let mockBloodBankDonate

  beforeEach(() => {
    vi.clearAllMocks()
    mockBloodBankDonate = vi.fn()

    GameStateContext.useGameState.mockReturnValue({
      bloodBankDonate: mockBloodBankDonate,
      player: {
        fameLevel: 1
      },
      band: {
        harmony: 80,
        members: [
          { id: 'm1', stamina: 100 },
          { id: 'm2', stamina: 100 }
        ]
      }
    })
  })

  it('calculates config correctly based on player fame level', () => {
    // multiplier = 1 + (1 * 0.2) = 1.2
    // moneyGain = Math.floor(100 * 1.2) = 120
    const { result } = renderHook(() => useBloodBank())

    expect(result.current.config.moneyGain).toBe(120)
    expect(result.current.config.harmonyCost).toBe(15)
    expect(result.current.config.staminaCost).toBe(30)
    expect(result.current.config.controversyGain).toBe(5)
  })

  it('determines canDonate to be true when conditions are met', () => {
    const { result } = renderHook(() => useBloodBank())

    // Band has 80 harmony (>15), members have 100 stamina (>40)
    expect(result.current.canDonate).toBe(true)
  })

  it('determines canDonate to be false when harmony equals the cost boundary exactly', () => {
    GameStateContext.useGameState.mockReturnValue({
      bloodBankDonate: mockBloodBankDonate,
      player: { fameLevel: 1 },
      band: {
        harmony: 15, // exactly the cost, but requires > cost
        members: [{ id: 'm1', stamina: 100 }]
      }
    })

    const { result } = renderHook(() => useBloodBank())
    expect(result.current.canDonate).toBe(false)
  })

  it('determines canDonate to be false when harmony is too low', () => {
    GameStateContext.useGameState.mockReturnValue({
      bloodBankDonate: mockBloodBankDonate,
      player: { fameLevel: 1 },
      band: {
        harmony: 10, // <= 15
        members: [{ id: 'm1', stamina: 100 }]
      }
    })

    const { result } = renderHook(() => useBloodBank())
    expect(result.current.canDonate).toBe(false)
  })

  it('determines canDonate to be false when a member has too little stamina', () => {
    GameStateContext.useGameState.mockReturnValue({
      bloodBankDonate: mockBloodBankDonate,
      player: { fameLevel: 1 },
      band: {
        harmony: 80,
        members: [
          { id: 'm1', stamina: 100 },
          { id: 'm2', stamina: 30 } // Required is 30+10 = 40
        ]
      }
    })

    const { result } = renderHook(() => useBloodBank())
    expect(result.current.canDonate).toBe(false)
  })

  it('manages modal visibility state', () => {
    const { result } = renderHook(() => useBloodBank())

    expect(result.current.showBloodBank).toBe(false)

    act(() => {
      result.current.openBloodBank()
    })

    expect(result.current.showBloodBank).toBe(true)

    act(() => {
      result.current.closeBloodBank()
    })

    expect(result.current.showBloodBank).toBe(false)
  })

  it('triggers donation correctly and closes modal', () => {
    const { result } = renderHook(() => useBloodBank())

    act(() => {
      result.current.openBloodBank()
    })

    expect(result.current.showBloodBank).toBe(true)

    act(() => {
      result.current.triggerDonate()
    })

    expect(mockBloodBankDonate).toHaveBeenCalledWith({
      moneyGain: 120,
      harmonyCost: 15,
      staminaCost: 30,
      controversyGain: 5,
      successToast: {
        message: 'ui:blood_bank.success_toast',
        type: 'success'
      }
    })

    expect(result.current.showBloodBank).toBe(false)
  })

  it('does not trigger donation if canDonate is false', () => {
    GameStateContext.useGameState.mockReturnValue({
      bloodBankDonate: mockBloodBankDonate,
      player: { fameLevel: 1 },
      band: { harmony: 10, members: [{ id: 'm1', stamina: 100 }] } // canDonate false
    })

    const { result } = renderHook(() => useBloodBank())

    act(() => {
      result.current.triggerDonate()
    })

    expect(mockBloodBankDonate).not.toHaveBeenCalled()
  })
})
