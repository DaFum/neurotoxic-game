import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const WORKSHOP_MODULE_IDS = [
  'mw_4color_carousel',
  'mw_manual_press',
  'mw_eco_ink_supply',
  'mw_conveyor_dryer',
  'mw_heat_press_box',
  'mw_vinyl_cutter',
  'mw_embroidery_machine',
  'mw_badge_press',
  'mw_hot_foil_station',
  'mw_cassette_dubber',
  'mw_sticker_bot',
  'mw_storage_racks',
  'mw_mailorder_script',
  'mw_bandcamp_bot',
  'mw_darkweb_vendor',
  'mw_hype_drop_machine'
]

const WORKSHOP_SLOT_IDS = [
  'mw_print',
  'mw_drying',
  'mw_cutting',
  'mw_packaging',
  'mw_storage',
  'mw_specialty',
  'mw_sales',
  'mw_automation'
]

const readAssetsLocale = async locale => {
  const raw = await readFile(`public/locales/${locale}/assets.json`, 'utf8')
  return JSON.parse(raw)
}

const assertNonEmptyString = (record, key, locale) => {
  assert.equal(
    typeof record[key],
    'string',
    `${locale} assets.json missing string key ${key}`
  )
  assert.notEqual(record[key].trim(), '', `${locale} ${key} must be non-empty`)
}

describe('workshop asset locale keys', () => {
  it('defines EN and DE names/descriptions for every workshop module', async () => {
    const en = await readAssetsLocale('en')
    const de = await readAssetsLocale('de')

    for (const moduleId of WORKSHOP_MODULE_IDS) {
      for (const suffix of ['name', 'description']) {
        const key = `module.${moduleId}.${suffix}`
        assertNonEmptyString(en, key, 'en')
        assertNonEmptyString(de, key, 'de')
      }
    }
  })

  it('defines EN and DE labels for every workshop slot', async () => {
    const en = await readAssetsLocale('en')
    const de = await readAssetsLocale('de')

    for (const slotId of WORKSHOP_SLOT_IDS) {
      const key = `slot.${slotId}`
      assertNonEmptyString(en, key, 'en')
      assertNonEmptyString(de, key, 'de')
    }
  })
})
