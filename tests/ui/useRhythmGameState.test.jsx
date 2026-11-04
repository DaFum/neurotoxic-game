import { describe, it, expect } from 'vitest'
import { act, renderHook } from '@testing-library/react'
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
  it('resets every gameplay and HUD category while preserving runtime services and physics (#3519)', () => {
    const { result } = renderHook(() => useRhythmGameState())
    const ref = result.current.gameStateRef
    const game = ref.current
    const defaults = structuredClone({ ...game, rng: undefined })
    const uiDefaults = { ...result.current.state }
    const rng = () => 0.25
    const settleUnhitNotes = () => {}
    Object.assign(game, {
      notes: [{ time: 123 }],
      projectiles: [{}],
      nextMissCheckIndex: 3,
      score: 1234,
      combo: 5,
      health: 12,
      overload: 88,
      progress: 70,
      stats: { perfectHits: 4, hits: 3, misses: 2, maxCombo: 7, peakHype: 9 },
      isToxicMode: true,
      isGameOver: true,
      hasSubmittedResults: true,
      totalDuration: 999,
      songTransitioning: true,
      setlistCompleted: true,
      songStats: [{}],
      lastEndedSongIndex: 2,
      notesVersion: 4,
      currentSongStartScore: 900,
      currentSongStartHits: 2,
      currentSongStartPerfectHits: 3,
      currentSongStartMisses: 1,
      transportPausedByOverlay: true,
      userPaused: true,
      rivalPenaltyActive: true,
      toxicTimeTotal: 500,
      toxicModeEndTime: 1000,
      corruptionLevel: 80,
      isCorruptionBurstActive: true,
      corruptionBurstEndTime: 2000,
      lastTickTimeMs: 100,
      gigIntroFired: true,
      gigMidFired: true,
      lastGigEventSongIndex: 1,
      sequenceAttemptId: 42,
      rng,
      settleUnhitNotes
    })
    game.speed = 777
    game.modifiers = { drumMultiplier: 2 }
    game.lanes[0].active = true
    game.lanes[0].hitWindow = 333
    const lanes = game.lanes
    const modifiers = game.modifiers
    act(() => {
      const setters = result.current.setters
      setters.setScore(1234)
      setters.setCombo(5)
      setters.setHealth(12)
      setters.setOverload(88)
      setters.setIsToxicMode(true)
      setters.setIsGameOver(true)
      setters.setAccuracy(44)
      setters.setCorruptionState(80, true)
      setters.setIsCorruptionBurstActive(true)
      setters.setCorruptionBurstEndTime(2000)
      setters.setAudioStatus('failed')
      setters.setFailureKind('stage')
    })

    act(() => result.current.resetGameplayState())

    expect(result.current.gameStateRef).toBe(ref)
    expect(ref.current).toBe(game)
    expect(game.rng).toBe(rng)
    expect(game.settleUnhitNotes).toBe(settleUnhitNotes)
    expect(game.sequenceAttemptId).toBe(42)
    expect(game.rivalPenaltyActive).toBe(true)
    expect(game.speed).toBe(777)
    expect(game.modifiers).toBe(modifiers)
    expect(game.lanes).toBe(lanes)
    expect(game.lanes[0].hitWindow).toBe(333)
    expect(game.lanes.every(lane => !lane.active)).toBe(true)
    for (const key of Object.keys(defaults)) {
      if (
        [
          'rng',
          'lanes',
          'modifiers',
          'speed',
          'sequenceAttemptId',
          'rivalPenaltyActive'
        ].includes(key)
      )
        continue
      expect(game[key], key).toEqual(defaults[key])
    }
    expect(game.gigIntroFired).toBe(false)
    expect(game.gigMidFired).toBe(false)
    expect(game.lastGigEventSongIndex).toBe(-1)
    expect(result.current.state).toEqual({
      ...uiDefaults,
      audioStatus: 'failed',
      failureKind: 'stage'
    })
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
