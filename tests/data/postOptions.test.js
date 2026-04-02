import { test } from 'vitest'
import assert from 'node:assert/strict'
import { POST_OPTIONS } from '../../src/data/postOptions.js'
import { SOCIAL_PLATFORMS } from '../../src/data/platforms.js'

test('POST_OPTIONS is an array', () => {
  assert.ok(Array.isArray(POST_OPTIONS), 'POST_OPTIONS should be an array')
  assert.ok(POST_OPTIONS.length > 0, 'POST_OPTIONS should not be empty')
})

test('All POST_OPTIONS have valid structure', () => {
  POST_OPTIONS.forEach(option => {
    assert.equal(
      typeof option.id,
      'string',
      `Option ${option.id} missing string id`
    )
    assert.equal(
      typeof option.name,
      'string',
      `Option ${option.id} missing string name`
    )
    assert.equal(
      typeof option.platform,
      'string',
      `Option ${option.id} missing string platform`
    )
    assert.equal(
      typeof option.category,
      'string',
      `Option ${option.id} missing string category`
    )
    assert.ok(
      Array.isArray(option.badges),
      `Option ${option.id} missing array badges`
    )
    assert.ok(
      option.badges.every(b => typeof b === 'string'),
      `Option ${option.id} badges should be strings`
    )
    assert.equal(
      typeof option.condition,
      'function',
      `Option ${option.id} missing function condition`
    )
    assert.equal(
      typeof option.resolve,
      'function',
      `Option ${option.id} missing function resolve`
    )

    // Validate platform exists in SOCIAL_PLATFORMS
    const isValidPlatform = Object.values(SOCIAL_PLATFORMS).some(
      p => p.id === option.platform
    )
    assert.ok(
      isValidPlatform,
      `Option ${option.id} uses invalid platform: ${option.platform}`
    )
  })
})

test('All POST_OPTIONS have unique IDs', () => {
  const ids = new Set()
  POST_OPTIONS.forEach(option => {
    assert.ok(!ids.has(option.id), `Duplicate ID found: ${option.id}`)
    ids.add(option.id)
  })
})

test('POST_OPTIONS condition functions execute without errors', () => {
  const dummyState = {
    social: { reputationCooldown: 0, controversyLevel: 50 },
    activeQuests: [],
    player: { money: 1000 },
    band: { members: [{ name: 'Test' }] },
    lastGigStats: { score: 10000, accuracy: 80 }
  }

  POST_OPTIONS.forEach(option => {
    // Just ensure it doesn't throw when called with a valid state object
    assert.doesNotThrow(
      () => option.condition(dummyState),
      `Condition function for ${option.id} threw an error`
    )
  })
})

test('POST_OPTIONS resolve functions return valid structures', () => {
  const dummyArgs = {
    social: { loyalty: 50, influencers: {} },
    player: { money: 1000 },
    band: { members: [{ name: 'Test' }] },
    diceRoll: 0.5
  }

  POST_OPTIONS.forEach(option => {
    const result = option.resolve(dummyArgs)
    assert.ok(result, `Resolve function for ${option.id} returned nothing`)
    assert.equal(
      typeof result.success,
      'boolean',
      `Resolve function for ${option.id} missing boolean success`
    )
    assert.equal(
      typeof result.platform,
      'string',
      `Resolve function for ${option.id} missing string platform`
    )

    if (
      result.type === 'RNG_SUCCESS' ||
      result.type === 'RNG_FAIL' ||
      result.type === 'FIXED'
    ) {
      // valid type
    } else {
      assert.fail(
        `Resolve function for ${option.id} returned invalid type: ${result.type}`
      )
    }
  })
})
