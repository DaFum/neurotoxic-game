import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRhythmGameState } from '../src/hooks/rhythmGame/useRhythmGameState'

describe('useRhythmGameState', () => {
  it('initializes expected UI and ref state values', () => {
    const { result } = renderHook(() => useRhythmGameState())

    expect(result.current.state.score).toBe(0)
    expect(result.current.state.combo).toBe(0)
    expect(result.current.state.health).toBe(100)
    expect(result.current.state.isGameOver).toBe(false)
    expect(result.current.gameStateRef.current.lanes).toHaveLength(3)
    expect(result.current.gameStateRef.current.setlistCompleted).toBe(false)
  })
})
