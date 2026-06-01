import { test } from 'vitest'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { POST_OPTIONS } from '../../src/data/postOptions'
import { SOCIAL_PLATFORMS } from '../../src/data/platforms'

const LIFESTYLE_POST_IDS = [
  'lifestyle_tour_diary',
  'lifestyle_fan_dinner',
  'lifestyle_behind_the_scenes',
  'lifestyle_gear_care'
]

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

test('Lifestyle POST_OPTIONS use locale keys for names and messages', () => {
  const source = readFileSync('src/data/postOptions.ts', 'utf8')
  const enUi = JSON.parse(readFileSync('public/locales/en/ui.json', 'utf8'))
  const deUi = JSON.parse(readFileSync('public/locales/de/ui.json', 'utf8'))

  for (const id of LIFESTYLE_POST_IDS) {
    const optionBlockPattern = new RegExp(`id:\\s*'${id}'[\\s\\S]*?\\n  }`)
    const optionBlock = source.match(optionBlockPattern)?.[0] ?? ''
    const nameKey = `postOptions.lifestyle.${id}.name`
    const messageKey = `postOptions.lifestyle.${id}.message`

    assert.match(
      optionBlock,
      new RegExp(`i18n\\.t\\(\\s*'ui:${escapeRegExp(nameKey)}'`),
      `${id} should read its name from ui:${nameKey}`
    )
    assert.match(
      optionBlock,
      new RegExp(`i18n\\.t\\(\\s*'ui:${escapeRegExp(messageKey)}'`),
      `${id} should read its resolve.message from ui:${messageKey}`
    )

    for (const [locale, ui] of [
      ['en', enUi],
      ['de', deUi]
    ]) {
      assert.equal(
        typeof ui[nameKey],
        'string',
        `${locale}/ui.json missing ${nameKey}`
      )
      assert.equal(
        typeof ui[messageKey],
        'string',
        `${locale}/ui.json missing ${messageKey}`
      )
    }
  }
})
