import assert from 'node:assert'
import { test, mock } from 'node:test'

test('AudioManager Tests', async t => {
  // Setup global mocks
  globalThis.localStorage = {
    getItem: mock.fn(() => null),
    setItem: mock.fn(),
    removeItem: mock.fn()
  }

  const mockAudioEngine = {
    setSFXVolume: mock.fn(),
    setMusicVolume: mock.fn(),
    playSFX: mock.fn(),
    stopAudio: mock.fn(),
    resumeAudio: mock.fn(),
    getTransportState: mock.fn(() => 'stopped'),
    setDestinationMute: mock.fn(() => false),
    setupAudio: mock.fn(),
    ensureAudioContext: mock.fn(async () => true),
    isAmbientOggPlaying: mock.fn(() => false),
    playRandomAmbientOgg: mock.fn(async () => true),
    playRandomAmbientMidi: mock.fn(async () => true),
    disposeAudio: mock.fn()
  }

  mock.module('../src/utils/audioEngine.js', { namedExports: mockAudioEngine })

  // Import the module under test
  const { audioManager } = await import('../src/utils/AudioManager.js')

  await t.test('initializes with default values', () => {
    // Init runs on import
    assert.equal(audioManager.musicVolume, 0.5)
    assert.equal(audioManager.sfxVolume, 0.5)
  })

  await t.test('setMusicVolume updates volume and calls engine', () => {
    const callsBefore = mockAudioEngine.setMusicVolume.mock.calls.length
    audioManager.setMusicVolume(0.8)
    assert.equal(audioManager.musicVolume, 0.8)

    const calls = mockAudioEngine.setMusicVolume.mock.calls
    assert.strictEqual(calls.length, callsBefore + 1)
    const args = calls[calls.length - 1].arguments
    assert.equal(args[0], 0.8)
  })

  await t.test('toggleMute updates mute state', () => {
    // Reset state for isolation
    audioManager.muted = false

    const callsBefore = mockAudioEngine.setDestinationMute.mock.calls.length
    const initialMute = audioManager.muted
    const newMute = audioManager.toggleMute()
    assert.equal(newMute, !initialMute)
    assert.equal(audioManager.muted, !initialMute)

    const callsAfter = mockAudioEngine.setDestinationMute.mock.calls
    assert.strictEqual(callsAfter.length, callsBefore + 1)
    assert.strictEqual(callsAfter[callsAfter.length - 1].arguments[0], newMute)
  })

  await t.test(
    'resumeMusic resumes paused transport via engine facade',
    async () => {
      mockAudioEngine.getTransportState.mock.mockImplementation(() => 'paused')
      const result = await audioManager.resumeMusic()
      assert.equal(result, true)
      assert.equal(mockAudioEngine.resumeAudio.mock.calls.length > 0, true)
    }
  )

  await t.test('startAmbient calls playRandomAmbientOgg', async () => {
    const callsBefore = mockAudioEngine.playRandomAmbientOgg.mock.calls.length
    const result = await audioManager.startAmbient()
    assert.strictEqual(
      mockAudioEngine.playRandomAmbientOgg.mock.calls.length,
      callsBefore + 1
    )
    assert.strictEqual(result, true)
  })
})
