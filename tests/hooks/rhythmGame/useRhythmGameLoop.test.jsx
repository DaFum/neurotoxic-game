// TODO: Implement this
import { describe, it, vi, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRhythmGameLoop } from '../../../src/hooks/rhythmGame/useRhythmGameLoop.js'

vi.mock('../../../src/utils/audioEngine.js', () => ({
  getGigTimeMs: () => 1000,
  getTransportState: () => 'started',
  pauseAudio: vi.fn(),
  resumeAudio: vi.fn(),
  stopAudio: vi.fn()
}))

vi.mock('../../../src/utils/hecklerLogic.js', () => ({
  trySpawnProjectile: () => null,
  processProjectiles: (session, projectiles) => projectiles,
  createHecklerSession: () => ({})
}))

vi.mock('../../../src/utils/gigStats.js', () => ({
  buildGigStatsSnapshot: () => ({})
}))

describe('useRhythmGameLoop', () => {
  it('should initialize and return update function', () => {
    const gameStateRef = {
      current: {
        isGameOver: false,
        songTransitioning: false,
        transportPausedByOverlay: false,
        totalDuration: 10000,
        progress: 0,
        projectiles: [],
        health: 100,
        combo: 0,
        rng: () => 0.5,
        isToxicMode: false,
        toxicTimeTotal: 0,
        setlistCompleted: false,
        notes: [],
        nextMissCheckIndex: 0
      }
    }
    const scoringActions = { handleMiss: vi.fn() }
    const setters = { setIsToxicMode: vi.fn() }
    const contextState = { activeEvent: null }
    const contextActions = { setLastGigStats: vi.fn(), endGig: vi.fn() }

    const { result } = renderHook(() =>
      useRhythmGameLoop({
        gameStateRef,
        scoringActions,
        setters,
        contextState,
        contextActions
      })
    )

    expect(typeof result.current.update).toBe('function')

    act(() => {
      result.current.update(16)
    })

    expect(gameStateRef.current.progress).toBe(10) // 1000 / 10000 * 100
  })
})
