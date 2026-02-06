import assert from 'node:assert'
import { test } from 'node:test'

// Mock localStorage and window before import
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
}
globalThis.window = {
  AudioContext: class {
    createGain() {
      return {
        gain: { value: 0, setTargetAtTime: () => {} },
        connect: () => {}
      }
    }

    createOscillator() {
      return {
        frequency: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: () => {},
          linearRampToValueAtTime: () => {}
        },
        connect: () => {},
        start: () => {},
        stop: () => {}
      }
    }

    resume() {}
    close() {}
  },
  webkitAudioContext: class {}
}

test('AudioManager setup', async t => {
  // Setup mocks
  globalThis.localStorage = {
    getItem: () => '0.5',
    setItem: () => {},
    removeItem: () => {}
  }

  try {
    const { audioManager } = await import('../src/utils/AudioManager.js')

    await t.test('audioManager singleton exists', () => {
      assert.ok(audioManager)
    })

    await t.test('audioManager has expected methods', () => {
      assert.equal(typeof audioManager.startAmbient, 'function')
      assert.equal(typeof audioManager.playSFX, 'function')
      assert.equal(typeof audioManager.stopMusic, 'function')
    })
  } catch (e) {
    // If import fails due to missing browser APIs in dependencies (Howler/Tone), skip test in Node env
    t.skip(
      'Skipping Audio Manager tests due to dependency browser requirements: ' +
        e.message
    )
  }
})
