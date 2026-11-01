/**
 * @fileoverview The note-data and procedural synthesis fallbacks must not
 * anchor the gig clock before the audio context is ready (#3459). A
 * closed-context rebuild inside `ensureAudioContext()` can outlast
 * `GIG_LEAD_IN_MS`; anchoring first would put the explicit transport start in
 * the past and auto-miss the opening notes. These tests drive the real
 * strategy, transport preparation and backends against a gated context.
 */

import assert from 'node:assert/strict'
import { test, mock } from 'node:test'
import {
  createMockAudioState,
  createMockLogger
} from '../utils/nodeAudioMockFactories.js'

const RAW_NOW_SEC = 100
const ADVANCED_NOW_SEC = 105
const LOOK_AHEAD_SEC = 0.15
let rawNowSec = RAW_NOW_SEC

// --- Gated audio context ---

/** @type {(value: boolean) => void} */
let releaseAudioContext = () => {}
/** @type {() => void} */
let markAudioContextReached = () => {}
/** @type {Promise<void>} */
let audioContextReached = Promise.resolve()

const armAudioContextGate = () => {
  audioContextReached = new Promise(resolve => {
    markAudioContextReached = resolve
  })
}

const mockEnsureAudioContext = mock.fn(
  () =>
    /** @type {Promise<boolean>} */ (
      new Promise(resolve => {
        releaseAudioContext = resolve
        markAudioContextReached()
      })
    )
)

mock.module(new URL('../../src/utils/audio/context.ts', import.meta.url).href, {
  namedExports: {
    ensureAudioContext: mockEnsureAudioContext,
    getAudioContextTimeSec: () => rawNowSec,
    /** @param {number} rawSec */
    getToneStartTimeSec: rawSec => rawSec + LOOK_AHEAD_SEC,
    getRawAudioContext: () => ({ currentTime: rawNowSec }),
    /** @param {() => unknown} fn */
    withAudioContext: async fn => await fn()
  }
})

// --- Tone.js ---

const mockTransport = {
  cancel: mock.fn(),
  stop: mock.fn(),
  /** @type {import('node:test').Mock<(time: number, offset?: number) => void>} */
  start: mock.fn((_time, _offset) => {}),
  scheduleOnce: mock.fn(() => 1),
  clear: mock.fn(),
  position: 0,
  bpm: { value: 120 },
  loop: false,
  state: 'stopped'
}

class MockPart {
  start() {
    MockPart.started += 1
    return this
  }
  dispose() {}
}
MockPart.started = 0

class MockSequence {
  start() {
    MockSequence.started += 1
    return this
  }
  dispose() {}
}
MockSequence.started = 0

mock.module('tone', {
  namedExports: {
    getTransport: () => mockTransport,
    getContext: () => ({ lookAhead: LOOK_AHEAD_SEC }),
    Part: MockPart,
    Sequence: MockSequence,
    now: () => rawNowSec + LOOK_AHEAD_SEC,
    Time: () => ({ toSeconds: () => 0.5 }),
    Frequency: () => ({ toNote: () => 'C4', toFrequency: () => 440 })
  }
})

// --- Audio stack neighbours ---

const mockAudioState = {
  ...createMockAudioState({ includeMidi: true, includeLoop: true }),
  part: null,
  transportScheduledStart: null,
  transportDeferredStart: null
}
mock.module(new URL('../../src/utils/audio/state.ts', import.meta.url).href, {
  namedExports: {
    audioState: mockAudioState,
    resetGigState: mock.fn(),
    releaseAudioResource: mock.fn()
  }
})

const mockStartGigClock = mock.fn()
mock.module(
  new URL('../../src/utils/audio/gigPlayback.ts', import.meta.url).href,
  {
    namedExports: {
      startGigClock: mockStartGigClock,
      startGigPlayback: mock.fn(async () => false)
    }
  }
)

mock.module(new URL('../../src/utils/audio/assets.ts', import.meta.url).href, {
  namedExports: {
    hasAudioAsset: () => false,
    midiUrlMap: {},
    loadAudioBuffer: mock.fn(),
    oggCandidates: []
  }
})

mock.module(
  new URL('../../src/utils/audio/cleanupUtils.ts', import.meta.url).href,
  {
    namedExports: {
      stopTransportAndClear: mock.fn(),
      clearTransportEvent: mock.fn(),
      cleanupTransportEvents: mock.fn()
    }
  }
)

mock.module(
  new URL('../../src/utils/audio/transportControl.ts', import.meta.url).href,
  {
    namedExports: {
      stopAudio: mock.fn(),
      stopAudioInternal: mock.fn()
    }
  }
)

const generatedNotes = [{ time: 1000, laneIndex: 0, hit: false, visible: true }]
const mockGenerateNotesForSong = mock.fn(() => generatedNotes)
mock.module(new URL('../../src/utils/rhythmUtils.ts', import.meta.url).href, {
  namedExports: {
    generateNotesForSong: mockGenerateNotesForSong,
    calculateTimeFromTicks: mock.fn(() => 0),
    preprocessTempoMap: mock.fn(() => []),
    sanitizeTempoMap: mock.fn(() => [])
  }
})

mock.module(new URL('../../src/utils/logger.ts', import.meta.url).href, {
  namedExports: { logger: createMockLogger() }
})

// --- Real modules under test ---
// None of these is mocked: the strategy reaches the real transport preparation
// and backends, so only the audio context itself is gated.

await import('../../src/utils/audio/playbackUtils')
await import('../../src/utils/audio/midiPlayback')
await import('../../src/utils/audio/proceduralMetal')
const { playAudioForSong } =
  await import('../../src/utils/audio/playbackStrategies')
const { GIG_LEAD_IN_MS } = await import('../../src/utils/audio/rhythmGameTypes')

const expectedStartSec =
  ADVANCED_NOW_SEC + GIG_LEAD_IN_MS / 1000 + LOOK_AHEAD_SEC

const reset = () => {
  rawNowSec = RAW_NOW_SEC
  mockAudioState.playRequestId = 0
  mockAudioState.loop = null
  mockAudioState.part = null
  mockStartGigClock.mock.resetCalls()
  mockTransport.start.mock.resetCalls()
  mockEnsureAudioContext.mock.resetCalls()
  mockGenerateNotesForSong.mock.resetCalls()
  MockPart.started = 0
  MockSequence.started = 0
  armAudioContextGate()
}

/**
 * Starts a song, holds it at `ensureAudioContext()` while the context clock
 * runs past the lead-in, then releases the context.
 *
 * @param {Record<string, unknown>} song - Song passed to the strategy.
 * @param {Array<Record<string, unknown>>} notes - Pre-authored rhythm notes.
 */
const playThroughSlowContext = async (song, notes) => {
  const pending = playAudioForSong(
    /** @type {never} */ (song),
    /** @type {never} */ (notes),
    () => {},
    () => 0.5
  )
  await audioContextReached

  assert.equal(mockEnsureAudioContext.mock.callCount(), 1)
  assert.equal(mockStartGigClock.mock.callCount(), 0)
  assert.equal(mockTransport.start.mock.callCount(), 0)

  // The rebuild outlasts the whole lead-in before the context is ready.
  rawNowSec = ADVANCED_NOW_SEC
  assert.ok(ADVANCED_NOW_SEC - RAW_NOW_SEC > GIG_LEAD_IN_MS / 1000)
  releaseAudioContext(true)
  await pending

  assert.equal(mockStartGigClock.mock.callCount(), 1)
  assert.equal(mockTransport.start.mock.callCount(), 1)
  const clockStartSec =
    mockStartGigClock.mock.calls[0].arguments[0].startTimeSec
  const transportStartSec = mockTransport.start.mock.calls[0].arguments[0]
  assert.ok(Math.abs(clockStartSec - expectedStartSec) < 1e-9)
  assert.strictEqual(transportStartSec, clockStartSec)
}

test('note-data synthesis anchors the clock after a slow context rebuild (#3459)', async () => {
  reset()
  await playThroughSlowContext(
    {
      id: 'song',
      name: 'Song',
      bpm: 120,
      tpb: 480,
      notes: [{ t: 0, p: 60, v: 100, lane: 'guitar' }]
    },
    [{ time: 1000, laneIndex: 0, hit: false, visible: true }]
  )
  assert.equal(MockPart.started, 1)
  assert.equal(MockSequence.started, 0)
})

test('procedural metal anchors the clock after a slow context rebuild (#3459)', async () => {
  reset()
  await playThroughSlowContext(
    { id: 'song', name: 'Song', bpm: 120, duration: 30, difficulty: 2 },
    []
  )
  assert.equal(mockGenerateNotesForSong.mock.callCount(), 1)
  assert.equal(MockPart.started, 0)
  assert.equal(MockSequence.started, 1)
})
