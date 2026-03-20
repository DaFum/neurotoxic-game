import path from 'node:path'
import fs from 'node:fs/promises'
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
test('all changed locale files are valid JSON', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      await Promise.all(
        CHANGED_NAMESPACES.map(async namespace => {
          const localeDir = path.join(LOCALES_ROOT, locale)
          const fileName = `${namespace}.json`

          try {
            await readLocaleJson(localeDir, fileName)
            assert.ok(true)
          } catch (err) {
            assert.fail(`${locale}/${namespace}.json should parse as valid JSON: ${err.message}`)
          }
        })
      )
    })
  )
})

// Test: Files have matching keys between locales
test('locale files have matching translation keys between en and de', async () => {
  await Promise.all(
    CHANGED_NAMESPACES.map(async namespace => {
      const [enData, deData] = await Promise.all([
        readLocaleJson(path.join(LOCALES_ROOT, 'en'), `${namespace}.json`),
        readLocaleJson(path.join(LOCALES_ROOT, 'de'), `${namespace}.json`)
      ])

      const enKeys = Object.keys(enData).sort()
      const deKeys = Object.keys(deData).sort()

      assert.deepEqual(
        deKeys,
        enKeys,
        `${namespace}.json should have matching top-level keys between locales`
      )
    })
  )
})

// Test: Nested structures match between locales
test('nested structures are consistent between locales', async () => {
  await Promise.all(
    CHANGED_NAMESPACES.map(async namespace => {
      const [enData, deData] = await Promise.all([
        readLocaleJson(path.join(LOCALES_ROOT, 'en'), `${namespace}.json`),
        readLocaleJson(path.join(LOCALES_ROOT, 'de'), `${namespace}.json`)
      ])

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
  )
})

// Test: No translation has non-string values (except objects and arrays)
test('all leaf translation values are strings', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      await Promise.all(
        CHANGED_NAMESPACES.map(async namespace => {
          const localeDir = path.join(LOCALES_ROOT, locale)
          const data = await readLocaleJson(localeDir, `${namespace}.json`)
          const entries = flattenToEntries(data)

          entries.forEach(entry => {
            assert.equal(
              typeof entry.value,
              'string',
              `${locale}/${namespace}.json key "${entry.key}" should have string value`
            )
          })
        })
      )
    })
  )
})

// Test: Placeholder variables match between locales
test('placeholder variables match between en and de', async () => {
  await Promise.all(
    CHANGED_NAMESPACES.map(async namespace => {
      const [enData, deData] = await Promise.all([
        readLocaleJson(path.join(LOCALES_ROOT, 'en'), `${namespace}.json`),
        readLocaleJson(path.join(LOCALES_ROOT, 'de'), `${namespace}.json`)
      ])

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
  )
})

// Test: Economy namespace has required structures
test('economy.json has required top-level structures', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = await readLocaleJson(localeDir, 'economy.json')

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
  )
})

// Test: Minigame namespace has tourbus structure
test('minigame.json has tourbus structure', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = await readLocaleJson(localeDir, 'minigame.json')

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
  )
})

// Test: UI namespace has major sections
test('ui.json has required major sections', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = await readLocaleJson(localeDir, 'ui.json')

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
  )
})

// Test: UI namespace featureList array is valid
test('ui.json featureList is present in valid nested or flat form', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = await readLocaleJson(localeDir, 'ui.json')

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
  )
})

// Test: Venues namespace has location entries
test('venues.json has venue and city names', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = await readLocaleJson(localeDir, 'venues.json')

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
  )
})

// Test: No translations with only whitespace
test('no translations contain only whitespace', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      await Promise.all(
        CHANGED_NAMESPACES.map(async namespace => {
          const localeDir = path.join(LOCALES_ROOT, locale)
          const data = await readLocaleJson(localeDir, `${namespace}.json`)
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
      )
    })
  )
})

// Test: Currency format consistency
test('economy.json uses consistent currency formatting', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = await readLocaleJson(localeDir, 'economy.json')
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
  )
})

// Summary test: Overall file health
test('changed locale files are structurally sound', async () => {
  let totalKeys = 0
  let totalFiles = 0

  await Promise.all(
    LOCALES.map(async locale => {
      await Promise.all(
        CHANGED_NAMESPACES.map(async namespace => {
          const localeDir = path.join(LOCALES_ROOT, locale)
          const data = await readLocaleJson(localeDir, `${namespace}.json`)
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
      )
    })
  )

  // Verify we processed all expected files
  assert.equal(totalFiles, LOCALES.length * CHANGED_NAMESPACES.length)

  // Verify we have a reasonable number of translations
  assert.ok(
    totalKeys > 100,
    `Should have substantial number of translations (found ${totalKeys})`
  )
})

// Test: No duplicate keys in any namespace
test('no duplicate keys exist within each locale file', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      await Promise.all(
        CHANGED_NAMESPACES.map(async namespace => {
          const localeDir = path.join(LOCALES_ROOT, locale)
          const fileName = `${namespace}.json`
          const filePath = path.join(localeDir, fileName)
          const rawText = await fs.readFile(filePath, 'utf8')

          // Use JSON.parse with a reviver to track keys in the current object
          const checkDuplicatesReviver = () => {
            return function(key, value) {
              // the "this" context points to the object currently being parsed
              // Unfortunately JSON.parse's reviver doesn't give us raw access easily.
              // Let's use a simpler regex that looks at actual line indentation or basic structure,
              // but the best way is tracking via a manual parse.
              return value;
            }
          };

          // Actually, let's use a more robust regex for JSON duplicate checking.
          // It's known that `JSON.parse` natively deduplicates keys, making the last one win.
          // A safer regex matches the exact keys on the top level or within their exact block,
          // but since this is just a health check, reporting *any* repeated string literal key name across the whole file
          // is fine UNLESS they are deliberately duplicated in different nested scopes (like "title").
          // If they are nested scopes like "title" or "description", then a global regex will falsely flag them.

          // Instead, since JSON.parse handles keys recursively, we can write a tiny custom token parser or
          // use the previous flat technique, but with raw keys.

          // Wait, the test explicitly failed with "description, title, type" etc, which are clearly validly repeated keys in nested objects!
          // So we should NOT check for global duplicate string keys.
          // We need to parse the JSON and check for duplicates within the SAME object.

          // A simple way to check for duplicates in the *same* object:
          // Check the parsed keys count against the raw matched keys count... no, nested counts.
          // Let's just use a simple regex that checks for duplicate keys within the same curly braces if possible,
          // OR we can just skip this test or use a JSON parser that catches duplicates.
          // The prompt says "report any repeated key names for the same namespace".
          // Actually, our previous flattened approach was better for identifying true duplicates (full paths).

          // Let's parse the file manually looking for duplicates at the same level.
          let hasDuplicates = false;
          let duplicateDetails = [];

          // It's much easier to just use `json-parse-even-better-errors` or similar,
          // but we don't have it. We can implement a naive proxy parse.
          // For now, let's fix the logic by tracking keys per object.

          let currentLevelKeys = [];
          let objectStack = [];

          // Extremely naive tokenizer
          const tokens = rawText.match(/([{}[\]])|("([^"\\]|\\.)*"\s*:)/g) || [];

          for (const token of tokens) {
            if (token === '{') {
              objectStack.push(currentLevelKeys);
              currentLevelKeys = new Set();
            } else if (token === '}') {
              currentLevelKeys = objectStack.pop() || new Set();
            } else if (token.endsWith(':')) {
              const key = token.slice(1, token.lastIndexOf('"')).replace(/\\"/g, '"');
              if (currentLevelKeys.has(key)) {
                hasDuplicates = true;
                duplicateDetails.push(key);
              } else {
                currentLevelKeys.add(key);
              }
            }
          }

          assert.equal(
            hasDuplicates,
            false,
            `${locale}/${namespace}.json should not have duplicate keys. Found: ${duplicateDetails.join(', ')}`
          )
        })
      )
    })
  )
})

// Test: Special characters are properly escaped
test('translations properly handle special characters', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      await Promise.all(
        CHANGED_NAMESPACES.map(async namespace => {
          const localeDir = path.join(LOCALES_ROOT, locale)
          const fileName = `${namespace}.json`
          const filePath = path.join(localeDir, fileName)
          const rawText = await fs.readFile(filePath, 'utf8')

          assert.doesNotThrow(() => {
            JSON.parse(rawText)
          }, `${locale}/${namespace}.json must have valid escape sequences and quote correctness`)
        })
      )
    })
  )
})

// Test: UI namespace has postGig structure (related to changed file)
test('ui.json has postGig related translation keys', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = await readLocaleJson(localeDir, 'ui.json')

      assert.ok(
        hasKeyOrPrefix(data, 'postGig'),
        `${locale}/ui.json should have postGig structure`
      )
    })
  )
})

// Test: Economy namespace has reasonable numeric placeholders
test('economy.json numeric placeholders use valid variable names', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = await readLocaleJson(localeDir, 'economy.json')
      const entries = flattenToEntries(data)

      entries.forEach(entry => {
        if (typeof entry.value === 'string') {
          const placeholders = entry.value.match(/{{[^}]+}}/g) || []

          placeholders.forEach(placeholder => {
            // Ensure placeholder contains only valid characters
            const content = placeholder.slice(2, -2).trim()

            assert.ok(
              /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(content),
              `${locale}/economy.json key "${entry.key}" has invalid placeholder format: ${placeholder}`
            )
          })
        }
      })
    })
  )
})

// Test: Minigame namespace structure completeness
test('minigame.json has comprehensive tourbus keys', async () => {
  await Promise.all(
    LOCALES.map(async locale => {
      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = await readLocaleJson(localeDir, 'minigame.json')
      const entries = flattenToEntries(data)

      const tourbusKeys = entries.filter(e => e.key.startsWith('tourbus'))

      assert.ok(
        tourbusKeys.length >= 5,
        `${locale}/minigame.json should have at least 5 tourbus-related keys`
      )
    })
  )
})

// Test: Venues namespace consistency between locales
test('venues.json has same number of venues in all locales', async () => {
  const enData = await readLocaleJson(path.join(LOCALES_ROOT, 'en'), 'venues.json')
  const enEntries = flattenToEntries(enData)
  const enVenueCount = enEntries.filter(e => e.key.endsWith('.name')).length

  await Promise.all(
    LOCALES.map(async locale => {
      if (locale === 'en') return

      const localeDir = path.join(LOCALES_ROOT, locale)
      const data = await readLocaleJson(localeDir, 'venues.json')
      const entries = flattenToEntries(data)
      const venueCount = entries.filter(e => e.key.endsWith('.name')).length

      assert.equal(
        venueCount,
        enVenueCount,
        `${locale}/venues.json should have same number of venues as en locale`
      )
    })
  )
})
