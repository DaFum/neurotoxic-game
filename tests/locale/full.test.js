import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { readLocaleJson, flattenToEntries } from '../utils/localeTestUtils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCALES_ROOT = path.join(__dirname, '..', '..', 'public', 'locales')

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
  const locales = await fs.readdir(LOCALES_ROOT)
  const LOCALES = locales.filter(l => !l.startsWith('.'))
  const enFiles = await fs.readdir(path.join(LOCALES_ROOT, 'en'))
  const NAMESPACES = enFiles
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))

  const allData = new Map()

  for (const locale of LOCALES) {
    for (const namespace of NAMESPACES) {
      try {
        const data = await readLocaleJson(
          path.join(LOCALES_ROOT, locale),
          `${namespace}.json`
        )
        const entries = flattenToEntries(data)
        allData.set(`${locale}/${namespace}`, { data, entries })
      } catch (_e) {
        // file might be missing or bad
      }
    }
  }

  await t.test('venues.json city names logic', async () => {
    for (const locale of LOCALES) {
      const localeData = allData.get(`${locale}/venues`)
      if (!localeData) continue
      const { entries } = localeData
      const nameEntries = entries.filter(e => e.key.endsWith('.name'))
      assert.ok(
        nameEntries.length > 0,
        `${locale}/venues.json should have venue/city name entries`
      )
      nameEntries.forEach(entry => {
        assert.equal(typeof entry.value, 'string')
      })
    }
  })

  await t.test(
    'economy namespace placeholders are consistent between locales',
    async () => {
      const enData = allData.get('en/economy')
      if (!enData) return
      const { entries: enEntries } = enData
      const enKeys = new Set(enEntries.map(e => e.key))

      for (const locale of LOCALES) {
        if (locale === 'en') continue
        const localeData = allData.get(`${locale}/economy`)
        if (!localeData) continue
        const { entries: deEntries } = localeData

        const deKeys = new Set(deEntries.map(e => e.key))
        assert.deepEqual(
          deKeys,
          enKeys,
          `Keys in ${locale}/economy.json should match en/economy.json exactly`
        )

        const deMap = new Map(deEntries.map(e => [e.key, e.value]))

        enEntries.forEach(e => {
          if (typeof e.value === 'string') {
            const deVal = deMap.get(e.key)
            assert.ok(
              deVal !== undefined,
              `Missing translation for key ${e.key} in ${locale}`
            )
            if (typeof deVal === 'string') {
              const enPlaceholders = (e.value.match(/{{[^}]+}}/g) || []).sort()
              const dePlaceholders = (deVal.match(/{{[^}]+}}/g) || []).sort()
              assert.deepEqual(
                dePlaceholders,
                enPlaceholders,
                `economy.json key "${e.key}" should have matching placeholders in ${locale}`
              )
            }
          }
        })
      }
    }
  )

  await t.test('ui.json featureList has valid structure', async () => {
    for (const locale of LOCALES) {
      const localeData = allData.get(`${locale}/ui`)
      if (!localeData) continue
      const { data } = localeData
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
      for (const namespace of NAMESPACES) {
        const localeData = allData.get(`${locale}/${namespace}`)
        if (!localeData) continue
        const { entries } = localeData
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
      for (const namespace of NAMESPACES) {
        const localeData = allData.get(`${locale}/${namespace}`)
        if (!localeData) continue
        const { entries } = localeData
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
      for (const namespace of NAMESPACES) {
        const enData = allData.get(`en/${namespace}`)
        if (!enData) continue
        const { entries: enEntries } = enData
        const enKeys = new Set(enEntries.map(e => e.key))
        for (const locale of LOCALES) {
          if (locale === 'en') continue
          const localeData = allData.get(`${locale}/${namespace}`)
          if (!localeData) continue
          const { entries } = localeData
          const locKeys = new Set(entries.map(e => e.key))
          assert.deepEqual(
            locKeys,
            enKeys,
            `${locale}/${namespace}.json keys mismatch`
          )
        }
      }
    }
  )

  await t.test(
    'ui.json has loading and postGig related translation keys',
    async () => {
      for (const locale of LOCALES) {
        const localeData = allData.get(`${locale}/ui`)
        if (!localeData) continue
        const { data } = localeData
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
        const localeData = allData.get(`${locale}/economy`)
        if (!localeData) continue
        const { entries } = localeData
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
      const localeData = allData.get(`${locale}/minigame`)
      if (!localeData) continue
      const { entries } = localeData
      const tourbusKeys = entries.filter(e => e.key.startsWith('tourbus'))
      assert.ok(tourbusKeys.length >= 5)
    }
  })

  await t.test(
    'venues.json has same number of venues in all locales',
    async () => {
      const enData = allData.get('en/venues')
      if (!enData) return
      const { entries: enEntries } = enData
      const enVenueCount = enEntries.filter(e => e.key.endsWith('.name')).length
      for (const locale of LOCALES) {
        if (locale === 'en') continue
        const localeData = allData.get(`${locale}/venues`)
        if (!localeData) continue
        const { entries } = localeData
        const venueCount = entries.filter(e => e.key.endsWith('.name')).length
        assert.equal(venueCount, enVenueCount)
      }
    }
  )

  await t.test('no duplicate keys exist within each locale file', async () => {
    for (const locale of LOCALES) {
      for (const namespace of NAMESPACES) {
        const filePath = path.join(LOCALES_ROOT, locale, `${namespace}.json`)
        let rawText
        try {
          rawText = await fs.readFile(filePath, 'utf8')
        } catch (_e) {
          continue
        }

        let hasDuplicates = false
        let duplicateDetails = []
        let currentLevelKeys = new Set()
        let objectStack = []

        let inString = false
        let isEscaped = false

        for (let i = 0; i < rawText.length; i++) {
          const char = rawText[i]

          if (!inString) {
            if (char === '"') {
              inString = true
            } else if (char === '{') {
              objectStack.push(currentLevelKeys)
              currentLevelKeys = new Set()
            } else if (char === '}') {
              currentLevelKeys = objectStack.pop() || new Set()
            } else if (char === ':') {
              // we just passed a key. Let's backtrack to find the string.
              let j = i - 1
              while (j >= 0 && /\s/.test(rawText[j])) j--
              if (j >= 0 && rawText[j] === '"') {
                let k = j - 1
                while (
                  (k >= 0 && rawText[k] !== '"') ||
                  (k > 0 && rawText[k - 1] === '\\')
                ) {
                  k--
                }
                const keyName = rawText.slice(k + 1, j).replace(/\\"/g, '"')
                if (currentLevelKeys.has(keyName)) {
                  hasDuplicates = true
                  duplicateDetails.push(keyName)
                } else {
                  currentLevelKeys.add(keyName)
                }
              }
            }
          } else {
            if (isEscaped) {
              isEscaped = false
            } else if (char === '\\') {
              isEscaped = true
            } else if (char === '"') {
              inString = false
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
