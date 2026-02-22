import assert from 'node:assert'
import { test, mock } from 'node:test'

// --- Mocks ---

// Mock Logger
const mockLogger = {
  debug: mock.fn(),
  info: mock.fn(),
  warn: mock.fn(),
  error: mock.fn(),
  logs: []
}
mock.module('../src/utils/logger.js', { namedExports: { logger: mockLogger } })

// Mock Audio State
const mockAudioState = {
  isSetup: true,
  playRequestId: 0,
  guitar: { triggerAttackRelease: mock.fn() },
  bass: { triggerAttackRelease: mock.fn() },
  drumKit: {
    kick: { triggerAttackRelease: mock.fn() },
    snare: { triggerAttackRelease: mock.fn() },
    hihat: { triggerAttackRelease: mock.fn() },
    crash: { triggerAttackRelease: mock.fn() },
    ride: { triggerAttackRelease: mock.fn() }
  },
  midiLead: { triggerAttackRelease: mock.fn() },
  midiBass: { triggerAttackRelease: mock.fn() },
  midiDrumKit: {
    kick: { triggerAttackRelease: mock.fn() },
    snare: { triggerAttackRelease: mock.fn() },
    hihat: { triggerAttackRelease: mock.fn() },
    crash: { triggerAttackRelease: mock.fn() },
    ride: { triggerAttackRelease: mock.fn() }
  }
}
mock.module('../src/utils/audio/state.js', { namedExports: { audioState: mockAudioState } })

// Mock Tone.js
const mockTone = {
  getTransport: mock.fn(() => ({
    cancel: mock.fn(),
    stop: mock.fn(),
    start: mock.fn(),
    scheduleOnce: mock.fn(),
    position: 0,
    bpm: { value: 120 },
    state: 'stopped'
  })),
  now: mock.fn(() => 1000), // Fixed time: 1000s
  Frequency: mock.fn((midi) => ({
    toNote: () => 'C4',
    toFrequency: () => 440
  })),
  Time: mock.fn((val) => ({
    toSeconds: () => 0.5
  }))
}
mock.module('tone', { namedExports: mockTone })

// Mock @tonejs/midi
mock.module('@tonejs/midi', { namedExports: { Midi: class {} }, defaultExport: { Midi: class {} } })

// Mock Setup
const mockEnsureAudioContext = mock.fn(async () => true)
mock.module('../src/utils/audio/setup.js', { namedExports: { ensureAudioContext: mockEnsureAudioContext } })

// Mock Playback
mock.module('../src/utils/audio/playback.js', {
  namedExports: {
    stopAudioInternal: mock.fn(),
    stopAudio: mock.fn()
  }
})

// Mock Assets
mock.module('../src/utils/audio/assets.js', {
  namedExports: {
    midiUrlMap: {},
    loadAudioBuffer: mock.fn(),
    oggCandidates: []
  }
})

// Mock Shared Buffer Utils
mock.module('../src/utils/audio/sharedBufferUtils.js', {
  namedExports: {
    createAndConnectBufferSource: mock.fn()
  }
})

// Mock MidiUtils - We want to use the REAL getNoteName if possible, but for isolation we can mock it
// However, the optimization relies on getNoteName being efficient.
// If I mock it, I'm testing the call, not the implementation.
// But the SUT (System Under Test) is procedural.js.
// I'll mock midiUtils to verify `getNoteName` is called instead of `Tone.Frequency`.
const mockGetNoteName = mock.fn((midi) => {
    // Simple mock implementation
    return `Note${midi}`
})

// We need to allow other exports to pass through if needed, or mock them all.
// procedural.js uses: isPercussionTrack, isValidMidiNote, normalizeMidiPitch, getNoteName
mock.module('../src/utils/audio/midiUtils.js', {
  namedExports: {
    isPercussionTrack: mock.fn(),
    isValidMidiNote: mock.fn(),
    normalizeMidiPitch: mock.fn((n) => n.midi),
    getNoteName: mockGetNoteName
  }
})

// Import the module under test AFTER mocking
const { playNoteAtTime } = await import('../src/utils/audio/procedural.js')

// --- Tests ---

test('playNoteAtTime Tests', async (t) => {

  t.beforeEach(() => {
    mockAudioState.guitar.triggerAttackRelease.mock.resetCalls()
    mockAudioState.bass.triggerAttackRelease.mock.resetCalls()
    mockAudioState.drumKit.kick.triggerAttackRelease.mock.resetCalls()
    mockAudioState.drumKit.snare.triggerAttackRelease.mock.resetCalls()
    mockAudioState.drumKit.hihat.triggerAttackRelease.mock.resetCalls()
    mockAudioState.drumKit.crash.triggerAttackRelease.mock.resetCalls()
    mockTone.Frequency.mock.resetCalls()
    mockGetNoteName.mock.resetCalls()
  })

  await t.test('Guitar: Uses getNoteName instead of Tone.Frequency', async () => {
    const midiPitch = 60
    const lane = 'guitar'
    const time = 1000
    const velocity = 100

    playNoteAtTime(midiPitch, lane, time, velocity)

    // Expected Optimization: Tone.Frequency should NOT be called
    assert.strictEqual(mockTone.Frequency.mock.calls.length, 0, 'Tone.Frequency should NOT be called')

    // Expected Optimization: getNoteName SHOULD be called
    assert.strictEqual(mockGetNoteName.mock.calls.length, 1, 'getNoteName SHOULD be called')
    assert.strictEqual(mockGetNoteName.mock.calls[0].arguments[0], midiPitch)

    // Verify Output
    assert.strictEqual(mockAudioState.guitar.triggerAttackRelease.mock.calls.length, 1)
    const args = mockAudioState.guitar.triggerAttackRelease.mock.calls[0].arguments
    assert.strictEqual(args[0], `Note${midiPitch}`, 'Should use note name from getNoteName')
    assert.strictEqual(args[2], time)
  })

  await t.test('Bass: Uses getNoteName instead of Tone.Frequency', async () => {
    const midiPitch = 40
    const lane = 'bass'
    const time = 1000
    const velocity = 100

    playNoteAtTime(midiPitch, lane, time, velocity)

    assert.strictEqual(mockTone.Frequency.mock.calls.length, 0, 'Tone.Frequency should NOT be called')
    assert.strictEqual(mockGetNoteName.mock.calls.length, 1, 'getNoteName SHOULD be called')

    assert.strictEqual(mockAudioState.bass.triggerAttackRelease.mock.calls.length, 1)
    const args = mockAudioState.bass.triggerAttackRelease.mock.calls[0].arguments
    assert.strictEqual(args[0], `Note${midiPitch}`)
  })

  await t.test('Drums: Kick (MIDI 36)', async () => {
    const midiPitch = 36
    const lane = 'drums'
    const time = 1000
    const velocity = 100

    playNoteAtTime(midiPitch, lane, time, velocity)

    // Drums don't use Tone.Frequency in legacy or new code (they use fixed strings or internal mapping)
    // But we want to verify the mapping works.
    assert.strictEqual(mockAudioState.drumKit.kick.triggerAttackRelease.mock.calls.length, 1)
    const args = mockAudioState.drumKit.kick.triggerAttackRelease.mock.calls[0].arguments
    // Expect 'C1', '8n', time, velocity (scaled 0-1)
    assert.strictEqual(args[0], 'C1')
    assert.strictEqual(args[1], '8n')
  })

  await t.test('Drums: Snare (MIDI 38)', async () => {
    const midiPitch = 38
    const lane = 'drums'
    const time = 1000
    const velocity = 100

    playNoteAtTime(midiPitch, lane, time, velocity)

    assert.strictEqual(mockAudioState.drumKit.snare.triggerAttackRelease.mock.calls.length, 1)
    // Snare (Layered) takes duration, time, velocity
    const args = mockAudioState.drumKit.snare.triggerAttackRelease.mock.calls[0].arguments
    assert.strictEqual(args[0], '16n')
  })

  await t.test('Drums: HiHat (MIDI 42)', async () => {
    const midiPitch = 42
    const lane = 'drums'
    const time = 1000
    const velocity = 100

    playNoteAtTime(midiPitch, lane, time, velocity)

    assert.strictEqual(mockAudioState.drumKit.hihat.triggerAttackRelease.mock.calls.length, 1)
    // HiHat (MetalSynth) takes freq, duration, time, velocity (scaled)
    const args = mockAudioState.drumKit.hihat.triggerAttackRelease.mock.calls[0].arguments
    assert.strictEqual(args[0], 8000)
    assert.strictEqual(args[1], '32n')
  })
})
