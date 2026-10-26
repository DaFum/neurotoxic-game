import { describe, it, expect, vi } from 'vitest'
import { processRhythmGameTick } from '../../src/utils/rhythmGameLoopUtils'

const createStateRef = overrides => ({
  isGameOver: false,
  songTransitioning: false,
  userPaused: false,
  isCorruptionBurstActive: false,
  corruptionBurstEndTime: 0,
  corruptionLevel: 0,
  stats: { corruptionLevel: 0, misses: 0, perfectHits: 0, hits: 0 },
  notes: [{ time: 100, lane: 0, hit: false, visible: true }],
  projectiles: [],
  lanes: [],
  health: 100,
  combo: 0,
  progress: 0,
  totalDuration: 10_000,
  nextMissCheckIndex: 0,
  rng: () => 0.99,
  isToxicMode: false,
  toxicModeEndTime: 0,
  toxicTimeTotal: 0,
  setlistCompleted: false,
  hasSubmittedResults: false,
  transportPausedByOverlay: false,
  ...overrides
})

const tick = (stateRef, { handleMiss, pauseAudio }) =>
  processRhythmGameTick({
    stateRef,
    isTransportRunning: true,
    transportState: 'started',
    activeEvent: null,
    dimensionsRef: { current: { width: 800, height: 600 } },
    hecklerSessionRef: { current: { active: false, projectiles: [] } },
    deltaMS: 16,
    handleCollision: vi.fn(),
    setIsToxicMode: vi.fn(),
    setIsCorruptionBurstActive: vi.fn(),
    handleMiss,
    finalizeGigCallback: vi.fn(),
    // Far past the note's miss window: an unpaused tick must miss it.
    getGigTimeMs: () => 5_000,
    pauseAudio,
    resumeAudio: vi.fn(),
    setCorruptionState: vi.fn(),
    disableCorruptionBurstAudio: vi.fn()
  })

describe('processRhythmGameTick under the pause menu (#3375)', () => {
  it('registers no misses and pauses a stray running transport', () => {
    const handleMiss = vi.fn()
    const pauseAudio = vi.fn()
    const stateRef = createStateRef({ userPaused: true })

    tick(stateRef, { handleMiss, pauseAudio })

    expect(handleMiss).not.toHaveBeenCalled()
    expect(stateRef.nextMissCheckIndex).toBe(0)
    expect(pauseAudio).toHaveBeenCalledTimes(1)
  })

  it('still processes misses once the pause menu is closed', () => {
    const handleMiss = vi.fn()
    const stateRef = createStateRef({ userPaused: false })

    tick(stateRef, { handleMiss, pauseAudio: vi.fn() })

    expect(handleMiss).toHaveBeenCalled()
  })
})
