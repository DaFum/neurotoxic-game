import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { CONTRABAND_BY_RARITY } from '../../src/data/contraband'
import { CRAFTING_RECIPES } from '../../src/data/craftingRecipes'

const CONTRABAND_DB = Object.values(CONTRABAND_BY_RARITY).flat()

const readItemsLocale = async locale => {
  const raw = await readFile(`public/locales/${locale}/items.json`, 'utf8')
  return JSON.parse(raw)
}

const assertNonEmptyString = (record, key, locale) => {
  assert.equal(
    typeof record[key],
    'string',
    `${locale} items.json missing flat string key "${key}"`
  )
  assert.notEqual(
    record[key].trim(),
    '',
    `${locale} items.json key "${key}" must be non-empty`
  )
}

describe('contraband locale keys', () => {
  it('defines flat EN and DE name/description keys for every contraband item', async () => {
    // Regression: i18n runs with keySeparator:false, so contraband strings must
    // live under flat dotted keys ("contraband.<id>.name"). A nested object
    // would not resolve and would surface "Unknown Item" in the UI.
    const en = await readItemsLocale('en')
    const de = await readItemsLocale('de')

    for (const item of CONTRABAND_DB) {
      for (const suffix of ['name', 'description']) {
        const key = `contraband.${item.id}.${suffix}`
        assertNonEmptyString(en, key, 'en')
        assertNonEmptyString(de, key, 'de')
      }
    }
  })

  it('has no nested "contraband" object that would shadow flat keys', async () => {
    const en = await readItemsLocale('en')
    const de = await readItemsLocale('de')
    assert.equal(
      Object.hasOwn(en, 'contraband'),
      false,
      'en items.json must not contain a nested "contraband" object'
    )
    assert.equal(
      Object.hasOwn(de, 'contraband'),
      false,
      'de items.json must not contain a nested "contraband" object'
    )
  })

  it('defines flat EN and DE label/desc keys for every crafting recipe', async () => {
    const en = await readItemsLocale('en')
    const de = await readItemsLocale('de')

    for (const recipe of Object.values(CRAFTING_RECIPES)) {
      for (const suffix of ['label', 'desc']) {
        const key = `crafting.${recipe.id}.${suffix}`
        assertNonEmptyString(en, key, 'en')
        assertNonEmptyString(de, key, 'de')
      }
    }
  })
})
