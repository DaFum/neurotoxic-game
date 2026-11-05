import { describe, it, expect } from 'vitest'
import { processRhythmGameTick } from '../../src/utils/rhythmGameLoopUtils'
import { createHecklerSession } from '../../src/utils/hecklerLogic'
import { mulberry32 } from '../../src/utils/seededRng'

const createRun = () => {
  const stateRef = {
    notes: [],
    projectiles: [],
    health: 20,
    combo: 60,
    totalDuration: 120_000,
    nextMissCheckIndex: 0,
    lastTickTimeMs: 0,
    rng: mulberry32(123)
  }
  const session = createHecklerSession()
  const tick = (now, deltaMS, overrides = {}) =>
    processRhythmGameTick({
      stateRef,
      isTransportRunning: true,
      transportState: 'started',
      activeEvent: null,
      dimensionsRef: { current: { width: 800, height: 600 } },
      hecklerSessionRef: { current: session },
      deltaMS,
      handleCollision: () => {},
      setIsToxicMode: () => {},
      setIsCorruptionBurstActive: () => {},
      handleMiss: () => {},
      finalizeGigCallback: () => {},
      getGigTimeMs: () => now,
      pauseAudio: () => {},
      resumeAudio: () => true,
      setCorruptionState: () => {},
      disableCorruptionBurstAudio: () => {},
      ...overrides
    })
  return { stateRef, session, tick }
}

describe('heckler gameplay timing', () => {
  it('spawns identical seeded hazards for equal gameplay time at 30, 60 and 144 FPS', () => {
    const counts = [30, 60, 144].map(fps => {
      const { tick, session } = createRun()
      for (let frame = 1; frame <= fps * 60; frame++) {
        tick((frame * 1000) / fps, 1000 / fps)
      }
      return session.nextId
    })
    expect(counts[0]).toBeGreaterThan(0)
    expect(counts).toEqual([counts[0], counts[0], counts[0]])
  })

  it('does not spawn while the gameplay clock is frozen or the game is paused', () => {
    const { tick, stateRef, session } = createRun()
    stateRef.rng = () => 0
    tick(100, 100)
    const count = session.nextId
    for (let frame = 0; frame < 100; frame++) tick(100, 16)
    expect(session.nextId).toBe(count)
    stateRef.userPaused = true
    tick(100, 5000)
    expect(session.nextId).toBe(count)
    stateRef.userPaused = false
    tick(200, 16)
    expect(session.nextId).toBe(count + 6)
  })

  it('starts opportunities from the new song clock after a reset', () => {
    const { tick, stateRef, session } = createRun()
    stateRef.rng = () => 0
    tick(1000, 1000)
    const count = session.nextId
    tick(0, 16)
    expect(session.nextId).toBe(count)
    tick(100, 100)
    expect(session.nextId).toBe(count + 6)
  })
})
