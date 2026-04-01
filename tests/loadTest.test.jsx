import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRhythmGameInput } from '../src/hooks/rhythmGame/useRhythmGameInput.js'

vi.mock('../src/utils/audioEngine', () => ({
  getTransportState: vi.fn(() => 'started'),
  getGigTimeMs: vi.fn(() => 1000)
}))

describe('useRhythmGameInput - Load Test', () => {
  it('should handle 1000+ simultaneous inputs without crashing', () => {
    let hits = 0
    const gameStateRef = {
      current: {
        songTransitioning: false,
        isGameOver: false,
        hasSubmittedResults: false,
        lanes: [{ active: false }, { active: false }, { active: false }]
      }
    }
    const scoringActions = {
      handleHit: () => {
        hits++
      }
    }
    const contextState = { activeEvent: null }

    const { result } = renderHook(() =>
      useRhythmGameInput({ gameStateRef, scoringActions, contextState })
    )

    for (let i = 0; i < 1500; i++) {
      const lane = i % 3
      result.current.registerInput(lane, true)
    }

    expect(hits).toBeLessThanOrEqual(3)
  })
})
