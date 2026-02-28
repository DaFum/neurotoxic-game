import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import assert from 'node:assert/strict'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const readLocaleFile = locale => {
  const localePath = path.join(
    __dirname,
    '..',
    'public',
    'locales',
    locale,
    'chatter.json'
  )
  return JSON.parse(readFileSync(localePath, 'utf8'))
}

test('english chatter should not contain unresolved templated venue placeholders', () => {
  const englishChatter = readLocaleFile('en')
  const unresolvedEntries = Object.entries(englishChatter).filter(([, value]) =>
    /\{\{.*?\}\}|\$\{.*?\}|\bis buzzing about (any|overworld|pregig|gig|postgig)\.|\b(ANY|OVERWORLD|PREGIG|GIG|POSTGIG)\b/.test(
      value
    )
  )

  assert.equal(
    unresolvedEntries.length,
    0,
    `Found unresolved placeholder entries: ${unresolvedEntries.map(([key]) => key).join(', ')}`
  )
})

test('english chatter should avoid duplicated prepositions in venue names', () => {
  const englishChatter = readLocaleFile('en')
  const duplicatedAtEntries = Object.entries(englishChatter).filter(
    ([, value]) => /\bat\s+at\b/i.test(value.replace(/\s+/g, ' '))
  )

  assert.equal(
    duplicatedAtEntries.length,
    0,
    `Found duplicated "at At" entries: ${duplicatedAtEntries.map(([key]) => key).join(', ')}`
  )
})

test('english and german chatter should have matching key parity', () => {
  const englishChatter = readLocaleFile('en')
  const germanChatter = readLocaleFile('de')

  const englishKeys = new Set(Object.keys(englishChatter))
  const germanKeys = new Set(Object.keys(germanChatter))

  const missingInGerman = [...englishKeys].filter(key => !germanKeys.has(key))
  const missingInEnglish = [...germanKeys].filter(key => !englishKeys.has(key))

  assert.equal(
    missingInGerman.length + missingInEnglish.length,
    0,
    `Chatter key parity mismatch. missing in de: ${missingInGerman.join(', ')} | missing in en: ${missingInEnglish.join(', ')}`
  )
})
