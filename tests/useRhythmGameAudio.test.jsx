// TODO: Implement this
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

const mocks = vi.hoisted(() => ({
  stopMusic: vi.fn(),
  ensureAudioContext: vi.fn(async () => true),
  stopAudio: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
  getGigModifiers: vi.fn(() => ({})),
  calculateGigPhysics: vi.fn(() => ({
    multipliers: { drums: 1, guitar: 1, bass: 1 },
    hasPerfektionist: false,
    speedModifier: 1,
    hitWindows: { guitar: 100, drums: 100, bass: 100 }
  })),
  startMetalGenerator: vi.fn(async () => true),
  playMidiFile: vi.fn(async () => true),
  playSongFromData: vi.fn(async () => true),
  hasAudioAsset: vi.fn(() => false),
  startGigClock: vi.fn(),
  startGigPlayback: vi.fn(async () => true),
  getAudioContextTimeSec: vi.fn(() => 0),
  getToneStartTimeSec: vi.fn(v => v),
  getGigTimeMs: vi.fn(() => 0),
  parseSongNotes: vi.fn(() => []),
  generateNotesForSong: vi.fn(() => []),
  resolveSongPlaybackWindow: vi.fn(() => ({
    excerptStartMs: 0,
    excerptDurationMs: 1000
  })),
  handleError: vi.fn()
}))

vi.mock('../src/utils/AudioManager', () => ({
  audioManager: {
    stopMusic: mocks.stopMusic,
    ensureAudioContext: mocks.ensureAudioContext
  }
}))

vi.mock('../src/utils/audioEngine', () => ({
  startMetalGenerator: mocks.startMetalGenerator,
  playMidiFile: mocks.playMidiFile,
  playSongFromData: mocks.playSongFromData,
  hasAudioAsset: mocks.hasAudioAsset,
  startGigClock: mocks.startGigClock,
  startGigPlayback: mocks.startGigPlayback,
  stopAudio: mocks.stopAudio,
  getAudioContextTimeSec: mocks.getAudioContextTimeSec,
  getToneStartTimeSec: mocks.getToneStartTimeSec,
  getGigTimeMs: mocks.getGigTimeMs
}))

vi.mock('../src/utils/errorHandler', () => ({
  handleError: mocks.handleError,
  AudioError: class AudioError extends Error {}
}))

vi.mock('../src/utils/logger', () => ({
  logger: { warn: mocks.loggerWarn, error: mocks.loggerError, info: vi.fn() }
}))

vi.mock('../src/utils/simulationUtils', () => ({
  getGigModifiers: mocks.getGigModifiers,
  calculateGigPhysics: mocks.calculateGigPhysics
}))

vi.mock('../src/utils/rhythmUtils', () => ({
  parseSongNotes: mocks.parseSongNotes,
  generateNotesForSong: mocks.generateNotesForSong
}))

vi.mock('../src/utils/audio/songUtils', () => ({
  resolveSongPlaybackWindow: mocks.resolveSongPlaybackWindow
}))

vi.mock('../src/data/songs.js', () => ({
  SONGS_DB: [{ id: 'song_1', name: 'Song 1', bpm: 120, duration: 60 }]
}))

import { useRhythmGameAudio } from '../src/hooks/rhythmGame/useRhythmGameAudio'

describe('useRhythmGameAudio', () => {
  const baseState = {
    band: { harmony: 50 },
    gameMap: { nodes: { n1: { layer: 0 } } },
    player: { currentNodeId: 'n1' },
    setlist: [{ id: 'song_1', name: 'Song 1', bpm: 120, duration: 60 }],
    gigModifiers: {},
    currentGig: { songId: 'song_1' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fails fast on low harmony and sets audio not ready', () => {
    const setIsAudioReady = vi.fn()

    renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false
          }
        },
        setters: { setIsAudioReady },
        contextState: { ...baseState, band: { harmony: 0 } },
        contextActions: { addToast: vi.fn() }
      })
    )

    expect(mocks.stopMusic).toHaveBeenCalled()
    expect(setIsAudioReady).toHaveBeenCalledWith(false)
  })

  it('stops audio on unmount cleanup', () => {
    const setIsAudioReady = vi.fn()
    const { unmount } = renderHook(() =>
      useRhythmGameAudio({
        gameStateRef: {
          current: {
            lanes: [{}, {}, {}],
            hasSubmittedResults: false,
            isGameOver: false,
            notesVersion: 0
          }
        },
        setters: { setIsAudioReady },
        contextState: baseState,
        contextActions: { addToast: vi.fn() }
      })
    )

    unmount()
    expect(mocks.stopAudio).toHaveBeenCalled()
  })
})
