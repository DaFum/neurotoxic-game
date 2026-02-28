import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  extractPlaceholders,
  flattenToEntries,
  readLocaleJson,
  toKeyMap
} from './utils/localeTestUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCALES_ROOT = path.join(__dirname, '..', 'public', 'locales')
const EN_LOCALE_DIR = path.join(LOCALES_ROOT, 'en')
const DE_LOCALE_DIR = path.join(LOCALES_ROOT, 'de')

test('english and german locale folders contain identical namespace files', () => {
  const englishFiles = readdirSync(EN_LOCALE_DIR).filter(file => file.endsWith('.json')).sort()
  const germanFiles = readdirSync(DE_LOCALE_DIR).filter(file => file.endsWith('.json')).sort()

  assert.deepEqual(
    germanFiles,
    englishFiles,
    `Locale namespace mismatch. en=${englishFiles.join(', ')} de=${germanFiles.join(', ')}`
  )
})

test('english and german locale files expose identical translation keys', () => {
  const englishFiles = readdirSync(EN_LOCALE_DIR).filter(file => file.endsWith('.json'))

  englishFiles.forEach(fileName => {
    const english = readLocaleJson(EN_LOCALE_DIR, fileName)
    const german = readLocaleJson(DE_LOCALE_DIR, fileName)

    const englishKeys = flattenToEntries(english)
      .map(entry => entry.key)
      .sort()
    const germanKeys = flattenToEntries(german)
      .map(entry => entry.key)
      .sort()

    assert.deepEqual(
      germanKeys,
      englishKeys,
      `Key mismatch in ${fileName}.\nen=${englishKeys.join(', ')}\nde=${germanKeys.join(', ')}`
    )
  })
})

test('english and german locale strings share placeholder variables', () => {
  const englishFiles = readdirSync(EN_LOCALE_DIR).filter(file => file.endsWith('.json'))

  englishFiles.forEach(fileName => {
    const englishMap = toKeyMap(flattenToEntries(readLocaleJson(EN_LOCALE_DIR, fileName)))
    const germanMap = toKeyMap(flattenToEntries(readLocaleJson(DE_LOCALE_DIR, fileName)))

    englishMap.forEach((englishValue, key) => {
      const germanValue = germanMap.get(key)
      const englishPlaceholders = extractPlaceholders(englishValue).sort()
      const germanPlaceholders = extractPlaceholders(germanValue).sort()

      assert.deepEqual(
        germanPlaceholders,
        englishPlaceholders,
        `Placeholder mismatch in ${fileName}:${key}. en=${englishPlaceholders.join(', ')} de=${germanPlaceholders.join(', ')}`
      )
    })
  })
})
