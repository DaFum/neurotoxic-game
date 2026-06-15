import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const readUiLocale = async locale => {
  const raw = await readFile(`public/locales/${locale}/ui.json`, 'utf8')
  return JSON.parse(raw)
}

// Item `type` values carried in the Roadie minigame (see getInitialGameState in
// src/hooks/minigames/useRoadieLogic.ts). Each needs a HUD label key, otherwise
// RoadieHUD falls back to "Unknown item" while carrying that item.
const ROADIE_CARRIED_TYPES = ['AMP', 'DRUMS', 'GUITAR', 'CONTRABAND']

describe('roadie run HUD item-type locale keys', () => {
  it('defines flat EN and DE labels for every carried item type', async () => {
    const en = await readUiLocale('en')
    const de = await readUiLocale('de')

    for (const type of ROADIE_CARRIED_TYPES) {
      const key = `roadieRun.itemTypes.${type}`
      for (const [locale, record] of [
        ['en', en],
        ['de', de]
      ]) {
        assert.equal(
          typeof record[key],
          'string',
          `${locale} ui.json missing flat key "${key}"`
        )
        assert.notEqual(
          record[key].trim(),
          '',
          `${locale} ui.json key "${key}" must be non-empty`
        )
      }
    }
  })
})
