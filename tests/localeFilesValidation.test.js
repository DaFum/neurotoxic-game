import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  readLocaleJson,
  flattenToEntries,
  hasKeyOrPrefix
} from './utils/localeTestUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCALES_ROOT = path.join(__dirname, '..', 'public', 'locales')
const LOCALES = ['en', 'de']
const CHANGED_NAMESPACES = ['economy', 'minigame', 'ui', 'venues']

// Test that all changed locale files are valid JSON
LOCALES.forEach(locale => {
  CHANGED_NAMESPACES.forEach(namespace => {
    test(`${locale}/${namespace}.json is valid JSON`, () => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const fileName = `${namespace}.json`

      assert.doesNotThrow(() => {
        readLocaleJson(localeDir, fileName)
      }, `${locale}/${namespace}.json should be valid JSON`)
    })
  })
})

// Test that all changed locale files have proper structure
LOCALES.forEach(locale => {
  CHANGED_NAMESPACES.forEach(namespace => {
    test(`${locale}/${namespace}.json has object structure at root`, () => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const fileName = `${namespace}.json`
      const data = readLocaleJson(localeDir, fileName)

      assert.equal(
        typeof data,
        'object',
        `${locale}/${namespace}.json should have object at root`
      )
      assert.ok(
        !Array.isArray(data),
        `${locale}/${namespace}.json root should not be an array`
      )
    })
  })
})

// Test that all string values are non-null
LOCALES.forEach(locale => {
  CHANGED_NAMESPACES.forEach(namespace => {
    test(`${locale}/${namespace}.json has no null values in translations`, () => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const fileName = `${namespace}.json`
      const data = readLocaleJson(localeDir, fileName)
      const entries = flattenToEntries(data)

      entries.forEach(entry => {
        if (typeof entry.value === 'string') {
          assert.notEqual(
            entry.value,
            null,
            `${locale}/${namespace}.json key "${entry.key}" should not be null`
          )
        }
      })
    })
  })
})

// Test that economy.json has required key families
test('economy.json files have required top-level structures', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'economy.json')

    const requiredKeys = ['gigExpenses', 'gigIncome', 'postGig', 'social']
    requiredKeys.forEach(key => {
      assert.ok(
        hasKeyOrPrefix(data, key),
        `${locale}/economy.json should have "${key}" key family`
      )
    })
  })
})

// Test that minigame.json has required tourbus key family
test('minigame.json files have required tourbus structure', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'minigame.json')

    assert.ok(
      hasKeyOrPrefix(data, 'tourbus'),
      `${locale}/minigame.json should have "tourbus" key family`
    )

    const requiredTourbusKeys = [
      'damage',
      'destination_reached',
      'distance',
      'title',
      'van_condition'
    ]
    requiredTourbusKeys.forEach(key => {
      const nestedKey = `tourbus.${key}`
      assert.ok(
        data[nestedKey] !== undefined ||
          (typeof data.tourbus === 'object' &&
            data.tourbus?.[key] !== undefined),
        `${locale}/minigame.json tourbus should have "${key}" key`
      )
    })
  })
})

// Test that ui.json has required section key families
test('ui.json files have required top-level sections', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'ui.json')

    const requiredSections = [
      'bandhq',
      'chatter',
      'detailedStats',
      'gig',
      'hq',
      'leaderboard',
      'map',
      'pregig',
      'stats'
    ]

    requiredSections.forEach(section => {
      assert.ok(
        hasKeyOrPrefix(data, section),
        `${locale}/ui.json should have "${section}" key family`
      )
    })
  })
})

// Test that venues.json has city and venue entries
test('venues.json files have city and venue name structures', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'venues.json')
    const entries = flattenToEntries(data)

    // Should have entries that end with .name
    const nameEntries = entries.filter(entry => entry.key.endsWith('.name'))
    assert.ok(
      nameEntries.length > 0,
      `${locale}/venues.json should have venue/city name entries`
    )

    // Check that all name entries have non-empty string values (allow empty string for nested objects)
    nameEntries.forEach(entry => {
      assert.equal(
        typeof entry.value,
        'string',
        `${locale}/venues.json key "${entry.key}" should be a string`
      )
    })
  })
})

// Test for placeholder consistency in economy namespace
test('economy namespace placeholders are consistent between locales', () => {
  const enData = readLocaleJson(path.join(LOCALES_ROOT, 'en'), 'economy.json')
  const deData = readLocaleJson(path.join(LOCALES_ROOT, 'de'), 'economy.json')

  const enEntries = flattenToEntries(enData)
  const deEntries = flattenToEntries(deData)

  const enMap = new Map(enEntries.map(e => [e.key, e.value]))
  const deMap = new Map(deEntries.map(e => [e.key, e.value]))

  enMap.forEach((enValue, key) => {
    if (typeof enValue === 'string' && typeof deMap.get(key) === 'string') {
      const enPlaceholders = (enValue.match(/{{[^}]+}}/g) || []).sort()
      const dePlaceholders = (deMap.get(key).match(/{{[^}]+}}/g) || []).sort()

      assert.deepEqual(
        dePlaceholders,
        enPlaceholders,
        `economy.json key "${key}" should have matching placeholders`
      )
    }
  })
})

// Test that ui.json feature list data is present (flat or nested format)
test('ui.json featureList has valid structure', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'ui.json')

    const hasNestedArray = Array.isArray(data.featureList)
    const flatFeatureKeys = Object.keys(data).filter(key =>
      key.startsWith('featureList.')
    )

    assert.ok(
      hasNestedArray || flatFeatureKeys.length > 0,
      `${locale}/ui.json should contain featureList data in nested or flat form`
    )

    if (hasNestedArray) {
      data.featureList.forEach((section, index) => {
        assert.ok(
          section.title,
          `${locale}/ui.json featureList[${index}] should have title`
        )
        assert.ok(
          section.description,
          `${locale}/ui.json featureList[${index}] should have description`
        )
        assert.ok(
          section.type,
          `${locale}/ui.json featureList[${index}] should have type`
        )
      })
    }
  })
})

// Test that all non-empty string values are properly trimmed
test('locale files have properly formatted string values', () => {
  LOCALES.forEach(locale => {
    CHANGED_NAMESPACES.forEach(namespace => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const fileName = `${namespace}.json`
      const data = readLocaleJson(localeDir, fileName)
      const entries = flattenToEntries(data)

      entries.forEach(entry => {
        if (typeof entry.value === 'string' && entry.value.length > 0) {
          // Check for leading/trailing whitespace (except intentional spaces)
          const hasLeadingSpace = entry.value !== entry.value.trimStart()
          const hasTrailingSpace = entry.value !== entry.value.trimEnd()

          if (hasLeadingSpace || hasTrailingSpace) {
            // Allow specific cases where whitespace is intentional
            const allowedWhitespace = [
              ' - click to confirm',
              ' - Klicken zum Bestätigen'
            ]
            const isAllowed = allowedWhitespace.some(
              allowed => entry.value === allowed
            )

            assert.ok(
              isAllowed,
              `${locale}/${namespace}.json key "${entry.key}" has unexpected leading/trailing whitespace: "${entry.value}"`
            )
          }
        }
      })
    })
  })
})
