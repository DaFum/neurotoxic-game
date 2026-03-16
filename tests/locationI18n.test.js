// TODO: Implement this
import assert from 'node:assert'
import { test } from 'node:test'
import { translateLocation } from '../src/utils/locationI18n.js'

test('translateLocation', async t => {
  const mockT = (key, options) => {
    const mockTranslations = {
      'venues:club.name': 'The Underground Club',
      'venues:festival.name': 'Open Air Festival'
    }
    return mockTranslations[key] || options.defaultValue || key
  }

  await t.test('translates known location keys correctly', () => {
    assert.strictEqual(translateLocation(mockT, 'club'), 'The Underground Club')
    // If a location is already prefixed with VENUE_NAMESPACE, toVenueKey returns it unmodified.
    // Thus, fully qualified keys like 'venues:festival.name' are resolved directly.
    assert.strictEqual(
      translateLocation(mockT, 'venues:festival.name'),
      'Open Air Festival'
    )
  })

  await t.test('returns fallback for missing t function', () => {
    assert.strictEqual(translateLocation(null, 'club'), 'Unknown')
    assert.strictEqual(
      translateLocation(undefined, 'club', 'Fallback Location'),
      'Fallback Location'
    )
  })

  await t.test('returns fallback for missing or empty location', () => {
    assert.strictEqual(translateLocation(mockT, null), 'Unknown')
    assert.strictEqual(translateLocation(mockT, ''), 'Unknown')
  })

  await t.test('formats raw venue string if translation is missing', () => {
    // If t() returns empty string or key itself, the function strips prefix and replaces underscores
    assert.strictEqual(translateLocation(mockT, 'venues:dive_bar'), 'dive bar')
  })

  await t.test(
    'formats raw venue string if translation explicitly returns an empty string',
    () => {
      const mockTEmpty = () => ''
      assert.strictEqual(
        translateLocation(mockTEmpty, 'venues:dive_bar'),
        'dive bar'
      )
    }
  )

  await t.test(
    'returns location or fallback if not a venue key and no translation exists',
    () => {
      assert.strictEqual(
        translateLocation(mockT, 'random_place'),
        'random_place'
      )
    }
  )
})
