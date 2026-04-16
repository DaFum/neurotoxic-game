import test from 'node:test'
import assert from 'node:assert/strict'
import i18n from '../../src/i18n.js'

test('i18n runtime configuration', () => {
  assert.ok(i18n, 'i18n instance should exist')

  // Basic config
  assert.equal(
    i18n.options.fallbackLng[0],
    'en',
    'Fallback language should be English'
  )
  assert.ok(
    i18n.options.supportedLngs.includes('en'),
    'Supported languages should include English'
  )
  assert.ok(
    i18n.options.supportedLngs.includes('de'),
    'Supported languages should include German'
  )
  assert.equal(i18n.options.load, 'languageOnly', 'Load should be languageOnly')

  // Namespaces
  const expectedNamespaces = [
    'ui',
    'items',
    'venues',
    'events',
    'economy',
    'chatter',
    'minigame',
    'unlocks',
    'traits'
  ]
  expectedNamespaces.forEach(ns => {
    assert.ok(i18n.options.ns.includes(ns), `Namespaces should include '${ns}'`)
  })
  assert.equal(i18n.options.defaultNS, 'ui', 'Default namespace should be "ui"')

  // Other options
  assert.equal(
    i18n.options.keySeparator,
    false,
    'Key separator should be false'
  )
  assert.equal(
    i18n.options.interpolation.escapeValue,
    false,
    'Interpolation escapeValue should be false'
  )

  // Backend
  assert.equal(
    i18n.options.backend.loadPath,
    '/locales/{{lng}}/{{ns}}.json',
    'Backend loadPath should be correct'
  )

  // React
  assert.equal(
    i18n.options.react.useSuspense,
    true,
    'React useSuspense should be true'
  )
})
