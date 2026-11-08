import assert from 'node:assert/strict'
import { test, mock } from 'node:test'

test('AudioManager Tests', async t => {
  // Setup global mocks
  globalThis.localStorage = {
    getItem: mock.fn(() => null),
    setItem: mock.fn(),
    removeItem: mock.fn()
  }

  // AudioManager imports the low-level modules directly (not the
  // audioEngine.ts hub), so each one is mocked with the exports it uses.
  const mockAudioModules = {
    'setup.ts': { setupAudio: mock.fn() },
    'context.ts': { ensureAudioContext: mock.fn(async () => true) },
    'dispose.ts': { disposeAudio: mock.fn() },
    'sfx.ts': {
      playSFX: mock.fn(),
      setSFXVolume: mock.fn(),
      setMusicVolume: mock.fn()
    },
    'transportControl.ts': {
      isAmbientOggPlaying: mock.fn(() => false),
      stopAudio: mock.fn(),
      resumeAudio: mock.fn(async () => true),
      getTransportState: mock.fn(() => 'stopped'),
      setDestinationMute: mock.fn(() => false)
    },
    'ambient.ts': {
      playRandomAmbientOgg: mock.fn(async () => true),
      playRandomAmbientMidi: mock.fn(async () => true)
    }
  }
  for (const [file, namedExports] of Object.entries(mockAudioModules)) {
    mock.module(
      new URL(`../../src/utils/audio/${file}`, import.meta.url).href,
      { namedExports }
    )
  }
  const mockAudioEngine = Object.assign({}, ...Object.values(mockAudioModules))

  // Import the module under test
  const { audioManager } = await import('../../src/utils/audio/AudioManager')

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

  await t.test(
    'resumeMusic waits for the backend and emits its settled state',
    async () => {
      mockAudioEngine.getTransportState.mock.mockImplementation(() => 'paused')
      let finishResume
      mockAudioEngine.resumeAudio.mock.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            finishResume = resolve
          })
      )
      const listener = mock.fn()
      const unsubscribe = audioManager.subscribe(listener)
      const resume = audioManager.resumeMusic()
      await Promise.resolve()
      const emittedEarly = listener.mock.calls.length
      finishResume(false)
      const result = await resume
      unsubscribe()
      assert.equal(emittedEarly, 0)
      assert.equal(result, false)
      assert.equal(listener.mock.calls.length, 1)
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

  await t.test(
    'a stale ambient rejection leaves newer music playing',
    async () => {
      audioManager.stopMusic()
      let rejectOld
      mockAudioEngine.playRandomAmbientOgg.mock.mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectOld = reject
          })
      )
      const oldStart = audioManager.startAmbient()
      audioManager.stopMusic()
      assert.equal(await audioManager.startAmbient(), true)
      const stops = mockAudioEngine.stopAudio.mock.calls.length
      rejectOld(new Error('old request failed'))
      assert.equal(await oldStart, false)
      assert.equal(mockAudioEngine.stopAudio.mock.calls.length, stops)
      assert.equal(audioManager.currentSongId, 'ambient')
    }
  )

  await t.test('setMusicVolume rejects non-finite values', () => {
    const callsBefore = mockAudioEngine.setMusicVolume.mock.calls.length
    const result = audioManager.setMusicVolume(Number.NaN)
    assert.equal(result, false)
    assert.equal(mockAudioEngine.setMusicVolume.mock.calls.length, callsBefore)
  })

  await t.test('setSFXVolume rejects non-finite values', () => {
    const callsBefore = mockAudioEngine.setSFXVolume.mock.calls.length
    const result = audioManager.setSFXVolume(Number.POSITIVE_INFINITY)
    assert.equal(result, false)
    assert.equal(mockAudioEngine.setSFXVolume.mock.calls.length, callsBefore)
  })

  await t.test(
    'init still marks prefs as loaded when localStorage read fails',
    () => {
      const originalGetItem = globalThis.localStorage.getItem
      globalThis.localStorage.getItem = mock.fn(() => {
        throw new Error('storage denied')
      })

      audioManager.prefsLoaded = false
      audioManager.init()

      assert.equal(audioManager.prefsLoaded, true)
      globalThis.localStorage.getItem = originalGetItem
    }
  )
})
