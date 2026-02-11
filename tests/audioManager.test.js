import assert from 'node:assert'
import { test, mock } from 'node:test'

test('AudioManager Tests', async (t) => {
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
        setupAudio: mock.fn(),
        ensureAudioContext: mock.fn(async () => true),
        isAmbientOggPlaying: mock.fn(() => false),
        playRandomAmbientOgg: mock.fn(async () => true),
        playRandomAmbientMidi: mock.fn(async () => true),
        disposeAudio: mock.fn()
    }

    const mockTone = {
        getDestination: mock.fn(() => ({ mute: false })),
        getTransport: mock.fn(() => ({ state: 'stopped' }))
    }

    // Mock modules
    mock.module('tone', { namedExports: mockTone })
    mock.module('../src/utils/audioEngine.js', { namedExports: mockAudioEngine })

    // Import the module under test
    const { audioManager } = await import('../src/utils/AudioManager.js')

    await t.test('initializes with default values', () => {
        // Init runs on import
        assert.equal(audioManager.musicVolume, 0.5)
        assert.equal(audioManager.sfxVolume, 0.5)
    })

    await t.test('setMusicVolume updates volume and calls engine', () => {
        audioManager.setMusicVolume(0.8)
        assert.equal(audioManager.musicVolume, 0.8)
        assert.strictEqual(mockAudioEngine.setMusicVolume.mock.calls.length > 0, true)
        // Get last call args
        const calls = mockAudioEngine.setMusicVolume.mock.calls
        const args = calls[calls.length - 1].arguments
        assert.equal(args[0], 0.8)
    })

    await t.test('toggleMute updates mute state', () => {
        const initialMute = audioManager.muted
        const newMute = audioManager.toggleMute()
        assert.equal(newMute, !initialMute)
        assert.equal(audioManager.muted, !initialMute)
    })

    await t.test('startAmbient calls playRandomAmbientOgg', async () => {
        await audioManager.startAmbient()
        assert.strictEqual(mockAudioEngine.playRandomAmbientOgg.mock.calls.length > 0, true)
    })
})
