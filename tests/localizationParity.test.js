import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCALES_ROOT = path.join(__dirname, '..', 'public', 'locales')
const EN_LOCALE_DIR = path.join(LOCALES_ROOT, 'en')
const DE_LOCALE_DIR = path.join(LOCALES_ROOT, 'de')

const extractPlaceholders = value => {
  if (typeof value !== 'string') {
    return []
  }

  const matches = value.match(/{{\s*([\w.]+)\s*}}/g) ?? []
  return matches.map(match => match.replace(/{{\s*|\s*}}/g, ''))
}

const flattenTranslations = (entry, parentKey = '') => {
  if (typeof entry === 'string') {
    return [{ key: parentKey, value: entry }]
  }

  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    return []
  }

  return Object.entries(entry).flatMap(([childKey, childValue]) => {
    const nextKey = parentKey ? `${parentKey}.${childKey}` : childKey
    return flattenTranslations(childValue, nextKey)
  })
}

const readLocaleJson = (directory, fileName) => {
  const localePath = path.join(directory, fileName)
  return JSON.parse(readFileSync(localePath, 'utf8'))
}

const toKeyMap = flattened =>
  flattened.reduce((accumulator, item) => {
    accumulator.set(item.key, item.value)
    return accumulator
  }, new Map())

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

    const englishKeys = flattenTranslations(english)
      .map(entry => entry.key)
      .sort()
    const germanKeys = flattenTranslations(german)
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
    const englishMap = toKeyMap(flattenTranslations(readLocaleJson(EN_LOCALE_DIR, fileName)))
    const germanMap = toKeyMap(flattenTranslations(readLocaleJson(DE_LOCALE_DIR, fileName)))

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
