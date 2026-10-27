import { describe, it, expect, vi } from 'vitest'
import { processRhythmGameTick } from '../../src/utils/rhythmGameLoopUtils'

const createStateRef = notes => ({
  isGameOver: false,
  songTransitioning: false,
  userPaused: false,
  isCorruptionBurstActive: false,
  corruptionBurstEndTime: 0,
  corruptionLevel: 0,
  stats: { corruptionLevel: 0, misses: 0, perfectHits: 0, hits: 0 },
  notes,
  projectiles: [],
  lanes: [],
  health: 100,
  combo: 0,
  progress: 0,
  totalDuration: 100_000,
  nextMissCheckIndex: 0,
  rng: () => 0.99,
  isToxicMode: false,
  toxicModeEndTime: 0,
  toxicTimeTotal: 0,
  setlistCompleted: false,
  hasSubmittedResults: false,
  transportPausedByOverlay: false
})

const tick = (stateRef, now, handleMiss, getLaneHitWindow) =>
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
    getLaneHitWindow,
    finalizeGigCallback: vi.fn(),
    getGigTimeMs: () => now,
    pauseAudio: vi.fn(),
    resumeAudio: vi.fn(),
    setCorruptionState: vi.fn(),
    disableCorruptionBurstAudio: vi.fn()
  })

describe('note expiry follows the effective hit window (#3389)', () => {
  const makeNote = () => ({
    time: 1000,
    laneIndex: 0,
    hit: false,
    visible: true
  })

  it('keeps a note hittable past 300 ms while its boosted window is open', () => {
    const note = makeNote()
    const stateRef = createStateRef([note])
    const handleMiss = vi.fn()
    tick(stateRef, 1305, handleMiss, () => 321)
    expect(handleMiss).not.toHaveBeenCalled()
    expect(note.visible).toBe(true)
  })

  it('misses it exactly once after the effective deadline', () => {
    const note = makeNote()
    const stateRef = createStateRef([note])
    const handleMiss = vi.fn()
    tick(stateRef, 1322, handleMiss, () => 321)
    tick(stateRef, 1400, handleMiss, () => 321)
    expect(handleMiss).toHaveBeenCalledTimes(1)
    expect(handleMiss).toHaveBeenCalledWith(1, false)
    expect(note.visible).toBe(false)
  })

  it('keeps the fixed 300 ms grace when the window is narrower', () => {
    const note = makeNote()
    const stateRef = createStateRef([note])
    const handleMiss = vi.fn()
    tick(stateRef, 1299, handleMiss, () => 100)
    expect(handleMiss).not.toHaveBeenCalled()
    tick(stateRef, 1301, handleMiss, () => 100)
    expect(handleMiss).toHaveBeenCalledTimes(1)
  })
})
