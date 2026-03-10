import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  trySpawnProjectile: vi.fn(),
  updateProjectiles: vi.fn(v => v),
  checkCollisions: vi.fn(v => v),
  getGigTimeMs: vi.fn(() => 0),
  getTransportState: vi.fn(() => 'started'),
  pauseAudio: vi.fn(),
  resumeAudio: vi.fn(),
  stopAudio: vi.fn(),
  buildGigStatsSnapshot: vi.fn(() => ({ done: true }))
}))

vi.mock('../src/utils/hecklerLogic', () => ({
  createHecklerSession: vi.fn(() => ({ projectiles: [] })),
  trySpawnProjectile: mocks.trySpawnProjectile,
  updateProjectiles: mocks.updateProjectiles,
  checkCollisions: mocks.checkCollisions,
  createHecklerSession: () => ({ pool: [], nextId: 0 })
}))

vi.mock('../src/utils/audioEngine', () => ({
  getGigTimeMs: mocks.getGigTimeMs,
  getTransportState: mocks.getTransportState,
  pauseAudio: mocks.pauseAudio,
  resumeAudio: mocks.resumeAudio,
  stopAudio: mocks.stopAudio
}))

vi.mock('../src/utils/gigStats', () => ({
  buildGigStatsSnapshot: mocks.buildGigStatsSnapshot
}))

import { useRhythmGameLoop } from '../src/hooks/rhythmGame/useRhythmGameLoop'

describe('useRhythmGameLoop', () => {
  let gameStateRef
  let handleMiss
  let setIsToxicMode
  let setLastGigStats
  let endGig

  beforeEach(() => {
    vi.clearAllMocks()
    handleMiss = vi.fn()
    setIsToxicMode = vi.fn()
    setLastGigStats = vi.fn()
    endGig = vi.fn()
    gameStateRef = {
      current: {
        isGameOver: false,
        songTransitioning: false,
        transportPausedByOverlay: false,
        totalDuration: 1000,
        progress: 0,
        projectiles: [],
        health: 100,
        rng: () => 0.5,
        isToxicMode: false,
        toxicModeEndTime: 0,
        toxicTimeTotal: 0,
        setlistCompleted: false,
        notes: [],
        nextMissCheckIndex: 0,
        hasSubmittedResults: false,
        score: 0,
        stats: {},
        songStats: []
      }
    }
  })

  const setup = activeEvent =>
    renderHook(() =>
      useRhythmGameLoop({
        gameStateRef,
        scoringActions: { handleMiss },
        setters: { setIsToxicMode },
        contextState: { activeEvent },
        contextActions: { setLastGigStats, endGig }
      })
    )

  it('pauses audio when overlay event is active and transport started', () => {
    mocks.getTransportState.mockReturnValue('started')
    const { result } = setup({ id: 'event' })

    result.current.update(16)

    expect(mocks.pauseAudio).toHaveBeenCalled()
    expect(gameStateRef.current.transportPausedByOverlay).toBe(true)
  })

  it('resumes audio after overlay pause when transport paused', () => {
    mocks.getTransportState.mockReturnValue('paused')
    gameStateRef.current.transportPausedByOverlay = true
    const { result } = setup(null)

    result.current.update(16)

    expect(mocks.resumeAudio).toHaveBeenCalled()
    expect(gameStateRef.current.transportPausedByOverlay).toBe(false)
  })

  it('finalizes gig when setlist completed near track end', () => {
    mocks.getTransportState.mockReturnValue('started')
    mocks.getGigTimeMs.mockReturnValue(999)
    gameStateRef.current.setlistCompleted = true
    const { result } = setup(null)

    result.current.update(16)

    expect(setLastGigStats).toHaveBeenCalled()
    expect(mocks.stopAudio).toHaveBeenCalled()
    expect(endGig).toHaveBeenCalled()
  })

  it('handles missed notes branch and increments misses', () => {
    mocks.getTransportState.mockReturnValue('started')
    mocks.getGigTimeMs.mockReturnValue(2000)
    gameStateRef.current.totalDuration = 3000
    gameStateRef.current.notes = [{ time: 1000, visible: true, hit: false }]

    const { result } = setup(null)
    result.current.update(16)

    expect(handleMiss).toHaveBeenCalledWith(1, false)
  })
})
