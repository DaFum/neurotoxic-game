import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { AudioEngineProvider } from '../../src/context/AudioEngineContext'
import { useRhythmGameState } from '../../src/hooks/rhythmGame/useRhythmGameState'

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
  describe('DEV test hook', () => {
    const engine = {
      getTransportState: () => 'started',
      getGigTimeMs: () => 1234
    }
    const wrapper = ({ children }) => (
      <AudioEngineProvider engine={engine}>{children}</AudioEngineProvider>
    )

    it('reads back lane, pause, transport and hit/miss state as copies', () => {
      const { result, unmount } = renderHook(() => useRhythmGameState(), {
        wrapper
      })
      const game = result.current.gameStateRef.current
      game.lanes[0].active = true
      game.userPaused = true
      game.stats.perfectHits = 2
      game.stats.hits = 3
      game.stats.misses = 1

      const snapshot = window.neurotoxicTestHooks.rhythm.getSnapshot()
      expect(snapshot).toEqual({
        laneActive: [true, false, false],
        userPaused: true,
        transportState: 'started',
        gigTimeMs: 1234,
        hits: 5,
        misses: 1
      })

      snapshot.laneActive[1] = true
      expect(game.lanes[1].active).toBe(false)
      unmount()
    })

    it('is unregistered on unmount', () => {
      const { unmount } = renderHook(() => useRhythmGameState(), { wrapper })
      expect(window.neurotoxicTestHooks.rhythm).toBeDefined()

      unmount()

      expect(window.neurotoxicTestHooks?.rhythm).toBeUndefined()
    })
  })
})
