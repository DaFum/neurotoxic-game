import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { readLocaleJson, flattenToEntries } from '../utils/localeTestUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCALES_ROOT = path.join(__dirname, '..', '..', 'public', 'locales')
const LOCALES = ['en', 'de']
const CHANGED_NAMESPACES = ['economy', 'minigame', 'ui', 'venues']

const hasKeyOrPrefix = (obj, prefix) => {
  if (!obj || typeof obj !== 'object') return false
  if (prefix in obj) return true
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith(`${prefix}.`)) return true
    if (typeof value === 'object' && !Array.isArray(value)) {
      if (hasKeyOrPrefix(value, prefix)) return true
    }
  }
  return false
}

test('Full locale validation tests', async t => {
  const allData = new Map()

  for (const locale of LOCALES) {
    for (const namespace of CHANGED_NAMESPACES) {
      const data = await readLocaleJson(
        path.join(LOCALES_ROOT, locale),
        `${namespace}.json`
      )
      const entries = flattenToEntries(data)
      allData.set(`${locale}/${namespace}`, { data, entries })
    }
  }

  await t.test('venues.json city names logic', async () => {
    for (const locale of LOCALES) {
      const { entries } = allData.get(`${locale}/venues`)
      const nameEntries = entries.filter(e => e.key.endsWith('.name'))
      assert.ok(
        nameEntries.length > 0,
        `${locale}/venues.json should have venue/city name entries`
      )
      nameEntries.forEach(entry => assert.equal(typeof entry.value, 'string'))
    }
  })

  await t.test(
    'economy namespace placeholders are consistent between locales',
    async () => {
      const { entries: enEntries } = allData.get('en/economy')
      const { entries: deEntries } = allData.get('de/economy')

      const deMap = new Map(deEntries.map(e => [e.key, e.value]))

      enEntries.forEach(e => {
        if (
          typeof e.value === 'string' &&
          typeof deMap.get(e.key) === 'string'
        ) {
          const enPlaceholders = (e.value.match(/{{[^}]+}}/g) || []).sort()
          const dePlaceholders = (
            deMap.get(e.key).match(/{{[^}]+}}/g) || []
          ).sort()
          assert.deepEqual(
            dePlaceholders,
            enPlaceholders,
            `economy.json key "${e.key}" should have matching placeholders`
          )
        }
      })
    }
  )

  await t.test('ui.json featureList has valid structure', async () => {
    for (const locale of LOCALES) {
      const { data } = allData.get(`${locale}/ui`)
      const hasNestedArray = Array.isArray(data.featureList)
      const flatFeatureKeys = Object.keys(data).filter(key =>
        key.startsWith('featureList.')
      )
      assert.ok(hasNestedArray || flatFeatureKeys.length > 0)
      if (hasNestedArray) {
        data.featureList.forEach(section => {
          assert.ok(section.title)
          assert.ok(section.description)
          assert.ok(section.type)
        })
      }
    }
  })

  await t.test('locale files formatting string values', async () => {
    for (const locale of LOCALES) {
      for (const namespace of CHANGED_NAMESPACES) {
        const { entries } = allData.get(`${locale}/${namespace}`)
        entries.forEach(entry => {
          if (typeof entry.value === 'string' && entry.value.length > 0) {
            const hasLeadingSpace = entry.value !== entry.value.trimStart()
            const hasTrailingSpace = entry.value !== entry.value.trimEnd()
            if (hasLeadingSpace || hasTrailingSpace) {
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
      }
    }
  })

  await t.test('no empty string values and balanced HTML', async () => {
    for (const locale of LOCALES) {
      for (const namespace of CHANGED_NAMESPACES) {
        const { entries } = allData.get(`${locale}/${namespace}`)
        entries.forEach(entry => {
          if (typeof entry.value === 'string') {
            assert.ok(
              entry.value.trim().length > 0,
              `${locale}/${namespace}.json key "${entry.key}" should not be whitespace-only`
            )
            if (entry.value.includes('<')) {
              const openTags = (entry.value.match(/<[^/][^>]*>/g) || []).length
              const closeTags = (entry.value.match(/<\/[^>]+>/g) || []).length
              const selfClosing = (entry.value.match(/<[^>]+\/>/g) || []).length
              assert.ok(
                openTags - selfClosing === closeTags,
                `${locale}/${namespace}.json key "${entry.key}" may have unbalanced HTML tags`
              )
            }
          }
        })
      }
    }
  })

  await t.test(
    'locale files have similar translation counts between locales',
    async () => {
      for (const namespace of CHANGED_NAMESPACES) {
        const { entries: enEntries } = allData.get(`en/${namespace}`)
        for (const locale of LOCALES) {
          if (locale === 'en') continue
          const { entries } = allData.get(`${locale}/${namespace}`)
          assert.equal(
            entries.length,
            enEntries.length,
            `${locale}/${namespace}.json translation count mismatch`
          )
        }
      }
    }
  )

  await t.test(
    'ui.json has loading and postGig related translation keys',
    async () => {
      for (const locale of LOCALES) {
        const { data } = allData.get(`${locale}/ui`)
        const hasLoading =
          data.loading !== undefined ||
          Object.keys(data).some(key => key.toLowerCase().includes('loading'))
        assert.ok(
          hasLoading,
          `${locale}/ui.json should have loading state translation`
        )
        assert.ok(
          hasKeyOrPrefix(data, 'postGig'),
          `${locale}/ui.json should have postGig structure`
        )
      }
    }
  )

  await t.test(
    'economy.json uses consistent currency formatting and placeholders',
    async () => {
      for (const locale of LOCALES) {
        const { entries } = allData.get(`${locale}/economy`)
        const currencyEntries = entries.filter(
          e =>
            typeof e.value === 'string' &&
            e.value.includes('{{') &&
            (e.value.includes('€') || e.value.includes('sold'))
        )
        currencyEntries.forEach(entry => {
          if (entry.value.includes('€')) {
            assert.ok(
              /{{(cost|value|amount|percent|rate|sold|capacity|buyers)}}/.test(
                entry.value
              )
            )
          }
        })
        entries.forEach(entry => {
          if (typeof entry.value === 'string') {
            const placeholders = entry.value.match(/{{[^}]+}}/g) || []
            placeholders.forEach(placeholder => {
              const content = placeholder.slice(2, -2).trim()
              assert.ok(
                /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(content),
                `${locale}/economy.json key "${entry.key}" has invalid placeholder format: ${placeholder}`
              )
            })
          }
        })
      }
    }
  )

  await t.test('minigame.json has comprehensive tourbus keys', async () => {
    for (const locale of LOCALES) {
      const { entries } = allData.get(`${locale}/minigame`)
      const tourbusKeys = entries.filter(e => e.key.startsWith('tourbus'))
      assert.ok(tourbusKeys.length >= 5)
    }
  })

  await t.test(
    'venues.json has same number of venues in all locales',
    async () => {
      const { entries: enEntries } = allData.get('en/venues')
      const enVenueCount = enEntries.filter(e => e.key.endsWith('.name')).length
      for (const locale of LOCALES) {
        if (locale === 'en') continue
        const { entries } = allData.get(`${locale}/venues`)
        const venueCount = entries.filter(e => e.key.endsWith('.name')).length
        assert.equal(venueCount, enVenueCount)
      }
    }
  )

  await t.test('no duplicate keys exist within each locale file', async () => {
    for (const locale of LOCALES) {
      for (const namespace of CHANGED_NAMESPACES) {
        const filePath = path.join(LOCALES_ROOT, locale, `${namespace}.json`)
        const rawText = await fs.readFile(filePath, 'utf8')
        let hasDuplicates = false
        let duplicateDetails = []
        let currentLevelKeys = new Set()
        let objectStack = []
        const tokens = rawText.match(/([{}[\]])|("([^"\\]|\\.)*"\s*:)/g) || []
        for (const token of tokens) {
          if (token === '{') {
            objectStack.push(currentLevelKeys)
            currentLevelKeys = new Set()
          } else if (token === '}') {
            currentLevelKeys = objectStack.pop() || new Set()
          } else if (token.endsWith(':')) {
            const key = token
              .slice(1, token.lastIndexOf('"'))
              .replace(/\\"/g, '"')
            if (currentLevelKeys.has(key)) {
              hasDuplicates = true
              duplicateDetails.push(key)
            } else {
              currentLevelKeys.add(key)
            }
          }
        }
        assert.equal(
          hasDuplicates,
          false,
          `${locale}/${namespace}.json should not have duplicate keys. Found: ${duplicateDetails.join(', ')}`
        )
      }
    }
  })
})
