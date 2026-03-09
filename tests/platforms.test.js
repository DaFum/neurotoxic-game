import assert from 'node:assert/strict'
import { test } from 'node:test'
import { SOCIAL_PLATFORMS } from '../src/data/platforms.js'

test('SOCIAL_PLATFORMS data integrity', () => {
  assert.ok(SOCIAL_PLATFORMS, 'SOCIAL_PLATFORMS should be defined')
  assert.strictEqual(typeof SOCIAL_PLATFORMS, 'object', 'SOCIAL_PLATFORMS should be an object')
  assert.ok(Object.keys(SOCIAL_PLATFORMS).length > 0, 'SOCIAL_PLATFORMS should not be empty')

  for (const [key, platform] of Object.entries(SOCIAL_PLATFORMS)) {
    // Check id
    assert.strictEqual(typeof platform.id, 'string', `Platform ${key} should have a string id`)
    assert.strictEqual(platform.id, key.toLowerCase(), `Platform ${key} id should be lowercase of key`)

    // Check label
    assert.strictEqual(typeof platform.label, 'string', `Platform ${key} should have a string label`)
    assert.ok(platform.label.length > 0, `Platform ${key} label should not be empty`)

    // Check multiplier
    assert.strictEqual(typeof platform.multiplier, 'number', `Platform ${key} should have a numeric multiplier`)
    assert.ok(platform.multiplier > 0, `Platform ${key} multiplier should be greater than 0`)
  }
})
