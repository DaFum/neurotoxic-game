import assert from 'node:assert'
import { test } from 'node:test'

// Mock localStorage and window before import
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
}
globalThis.window = {}

test('AudioManager setup', async (t) => {
  // Setup mocks
  globalThis.localStorage = {
    getItem: () => '0.5',
    setItem: () => {},
    removeItem: () => {}
  }

  // Dynamic import to ensure globals are present
  const { audioManager } = await import('../src/utils/AudioManager.js')

  await t.test('audioManager singleton exists', () => {
    assert.ok(audioManager)
  })

  await t.test('audioManager has expected methods', () => {
    assert.equal(typeof audioManager.playMusic, 'function')
    assert.equal(typeof audioManager.playSFX, 'function')
    assert.equal(typeof audioManager.stopMusic, 'function')
  })
})
