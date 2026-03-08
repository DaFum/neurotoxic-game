import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readLocaleJson, flattenToEntries } from './utils/localeTestUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCALES_ROOT = path.join(__dirname, '..', 'public', 'locales')
const LOCALES = ['en', 'de']
const CHANGED_NAMESPACES = ['economy', 'minigame', 'ui', 'venues']

const hasKeyOrPrefix = (data, key) =>
  data[key] !== undefined ||
  Object.keys(data).some(existing => existing.startsWith(`${key}.`))

/**
 * Comprehensive tests for the recently changed locale files.
 * These tests focus on validating the structure, completeness, and consistency
 * of translations without being overly strict about the i18next-parser's
 * internal key generation patterns.
 */

// Test: All changed files are valid JSON
test('all changed locale files are valid JSON', () => {
  LOCALES.forEach(locale => {
    CHANGED_NAMESPACES.forEach(namespace => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const fileName = `${namespace}.json`

      assert.doesNotThrow(() => {
        readLocaleJson(localeDir, fileName)
      }, `${locale}/${namespace}.json should parse as valid JSON`)
    })
  })
})

// Test: Files have matching keys between locales
test('locale files have matching translation keys between en and de', () => {
  CHANGED_NAMESPACES.forEach(namespace => {
    const enData = readLocaleJson(
      path.join(LOCALES_ROOT, 'en'),
      `${namespace}.json`
    )
    const deData = readLocaleJson(
      path.join(LOCALES_ROOT, 'de'),
      `${namespace}.json`
    )

    const enKeys = Object.keys(enData).sort()
    const deKeys = Object.keys(deData).sort()

    assert.deepEqual(
      deKeys,
      enKeys,
      `${namespace}.json should have matching top-level keys between locales`
    )
  })
})

// Test: Nested structures match between locales
test('nested structures are consistent between locales', () => {
  CHANGED_NAMESPACES.forEach(namespace => {
    const enData = readLocaleJson(
      path.join(LOCALES_ROOT, 'en'),
      `${namespace}.json`
    )
    const deData = readLocaleJson(
      path.join(LOCALES_ROOT, 'de'),
      `${namespace}.json`
    )

    const enFlat = flattenToEntries(enData)
      .map(e => e.key)
      .sort()
    const deFlat = flattenToEntries(deData)
      .map(e => e.key)
      .sort()

    assert.deepEqual(
      deFlat,
      enFlat,
      `${namespace}.json should have matching flattened keys between locales`
    )
  })
})

// Test: No translation has non-string values (except objects and arrays)
test('all leaf translation values are strings', () => {
  LOCALES.forEach(locale => {
    CHANGED_NAMESPACES.forEach(namespace => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = readLocaleJson(localeDir, `${namespace}.json`)
      const entries = flattenToEntries(data)

      entries.forEach(entry => {
        assert.equal(
          typeof entry.value,
          'string',
          `${locale}/${namespace}.json key "${entry.key}" should have string value`
        )
      })
    })
  })
})

// Test: Placeholder variables match between locales
test('placeholder variables match between en and de', () => {
  CHANGED_NAMESPACES.forEach(namespace => {
    const enData = readLocaleJson(
      path.join(LOCALES_ROOT, 'en'),
      `${namespace}.json`
    )
    const deData = readLocaleJson(
      path.join(LOCALES_ROOT, 'de'),
      `${namespace}.json`
    )

    const enEntries = flattenToEntries(enData)
    const deEntries = flattenToEntries(deData)

    const enMap = new Map(enEntries.map(e => [e.key, e.value]))
    const deMap = new Map(deEntries.map(e => [e.key, e.value]))

    enMap.forEach((enValue, key) => {
      const deValue = deMap.get(key)

      if (typeof enValue === 'string' && typeof deValue === 'string') {
        const enPlaceholders = (enValue.match(/{{[^}]+}}/g) || []).sort()
        const dePlaceholders = (deValue.match(/{{[^}]+}}/g) || []).sort()

        assert.deepEqual(
          dePlaceholders,
          enPlaceholders,
          `${namespace}.json key "${key}" should have matching placeholders between locales`
        )
      }
    })
  })
})

// Test: Economy namespace has required structures
test('economy.json has required top-level structures', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'economy.json')

    const requiredKeys = ['gigExpenses', 'gigIncome', 'postGig', 'social']
    requiredKeys.forEach(key => {
      assert.ok(
        hasKeyOrPrefix(data, key),
        `${locale}/economy.json should have "${key}" structure`
      )
    })

    // Test specific sub-structures (flat or nested)
    assert.ok(
      data['gigExpenses.catering.label'] !== undefined ||
        data.gigExpenses?.catering !== undefined,
      `${locale}/economy.json should have gigExpenses.catering`
    )
    assert.ok(
      data['gigIncome.ticketSales.label'] !== undefined ||
        data.gigIncome?.ticketSales !== undefined,
      `${locale}/economy.json should have gigIncome.ticketSales`
    )
  })
})

// Test: Minigame namespace has tourbus structure
test('minigame.json has tourbus structure', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'minigame.json')

    assert.ok(
      hasKeyOrPrefix(data, 'tourbus'),
      `${locale}/minigame.json should have tourbus structure`
    )

    const requiredTourbusKeys = [
      'damage',
      'destination_reached',
      'distance',
      'title',
      'van_condition'
    ]

    requiredTourbusKeys.forEach(key => {
      assert.ok(
        data[`tourbus.${key}`] !== undefined ||
          data.tourbus?.[key] !== undefined,
        `${locale}/minigame.json tourbus should have "${key}"`
      )
    })
  })
})

// Test: UI namespace has major sections
test('ui.json has required major sections', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'ui.json')

    const requiredSections = [
      'bandhq',
      'detailedStats',
      'gig',
      'leaderboard',
      'pregig',
      'stats'
    ]

    requiredSections.forEach(section => {
      assert.ok(
        hasKeyOrPrefix(data, section),
        `${locale}/ui.json should have "${section}" section`
      )
    })
  })
})

// Test: UI namespace featureList array is valid
test('ui.json featureList is present in valid nested or flat form', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'ui.json')

    const hasNestedArray = Array.isArray(data.featureList)
    const flatFeatureKeys = Object.keys(data).filter(key =>
      key.startsWith('featureList.')
    )

    assert.ok(
      hasNestedArray || flatFeatureKeys.length > 0,
      `${locale}/ui.json should include featureList content`
    )

    if (hasNestedArray) {
      assert.ok(
        data.featureList.length > 0,
        `${locale}/ui.json featureList should not be empty`
      )
    }
  })
})

// Test: Venues namespace has location entries
test('venues.json has venue and city names', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'venues.json')

    // venues.json uses dot notation at the top level
    const keys = Object.keys(data)
    const nameKeys = keys.filter(k => k.endsWith('.name'))

    assert.ok(
      nameKeys.length > 0,
      `${locale}/venues.json should have location name entries`
    )

    // Check specific known venues exist
    assert.ok(
      data['berlin.name'],
      `${locale}/venues.json should have berlin.name entry`
    )
    assert.ok(
      data['leipzig.name'],
      `${locale}/venues.json should have leipzig.name entry`
    )
  })
})

// Test: No translations with only whitespace
test('no translations contain only whitespace', () => {
  LOCALES.forEach(locale => {
    CHANGED_NAMESPACES.forEach(namespace => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = readLocaleJson(localeDir, `${namespace}.json`)
      const entries = flattenToEntries(data)

      entries.forEach(entry => {
        if (typeof entry.value === 'string' && entry.value.length > 0) {
          assert.ok(
            entry.value.trim().length > 0,
            `${locale}/${namespace}.json key "${entry.key}" should not be whitespace-only`
          )
        }
      })
    })
  })
})

// Test: Currency format consistency
test('economy.json uses consistent currency formatting', () => {
  LOCALES.forEach(locale => {
    const localeDir = path.join(LOCALES_ROOT, locale)
    const data = readLocaleJson(localeDir, 'economy.json')
    const entries = flattenToEntries(data)

    const currencyEntries = entries.filter(
      e =>
        e.value.includes('{{') &&
        (e.value.includes('€') || e.value.includes('sold'))
    )

    // Verify currency placeholders use consistent variable names
    currencyEntries.forEach(entry => {
      if (entry.value.includes('€')) {
        // Should use placeholders like {{cost}}, {{value}}, etc.
        const hasValidPlaceholder =
          /{{(cost|value|amount|percent|rate|sold|capacity|buyers)}}/.test(
            entry.value
          )

        assert.ok(
          hasValidPlaceholder,
          `${locale}/economy.json key "${entry.key}" should use standard currency placeholder`
        )
      }
    })
  })
})

// Summary test: Overall file health
test('changed locale files are structurally sound', () => {
  let totalKeys = 0
  let totalFiles = 0

  LOCALES.forEach(locale => {
    CHANGED_NAMESPACES.forEach(namespace => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = readLocaleJson(localeDir, `${namespace}.json`)
      const entries = flattenToEntries(data)

      totalKeys += entries.length
      totalFiles++

      // Basic sanity checks
      assert.ok(
        entries.length > 0,
        `${locale}/${namespace}.json should have translations`
      )
      assert.ok(
        Object.keys(data).length > 0,
        `${locale}/${namespace}.json should have top-level keys`
      )
    })
  })

  // Verify we processed all expected files
  assert.equal(totalFiles, LOCALES.length * CHANGED_NAMESPACES.length)

  // Verify we have a reasonable number of translations
  assert.ok(
    totalKeys > 100,
    `Should have substantial number of translations (found ${totalKeys})`
  )
})
