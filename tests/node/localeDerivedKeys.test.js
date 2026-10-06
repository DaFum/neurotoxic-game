import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { GAME_PHASES } from '../../src/context/gameConstants'
import { DEFAULT_BAND_STATE } from '../../src/context/initialState'
import { CHARACTERS } from '../../src/data/characters'
import {
  BETWEEN_TOUR_DECISION_PRIORITY,
  BETWEEN_TOUR_OPTIONS
} from '../../src/data/expedition/betweenTour'

// Keys the UI builds from a data id (`t(`ns:prefix.${id}`)`). A literal-key scan
// cannot see them, so each id family is checked against the data it comes from.
const LOCALES_ROOT = fileURLToPath(
  new URL('../../public/locales/', import.meta.url)
)

const read = (lang, ns) =>
  JSON.parse(readFileSync(join(LOCALES_ROOT, lang, `${ns}.json`), 'utf8'))

const expectKeys = (ns, keys) => {
  for (const lang of ['en', 'de']) {
    const data = read(lang, ns)
    for (const key of keys) {
      assert.equal(
        typeof data[key],
        'string',
        `${lang} ${ns}:${key} is missing`
      )
      assert.ok(data[key].trim().length > 0, `${lang} ${ns}:${key} is empty`)
    }
  }
}

test('every inventory item has a translated name', () => {
  expectKeys(
    'items',
    Object.keys(DEFAULT_BAND_STATE.inventory).map(id => `${id}.name`)
  )
})

test('every character equipment slot has a translated label', () => {
  const slots = new Set(
    Object.values(CHARACTERS).flatMap(character =>
      Object.keys(character.equipment ?? {})
    )
  )
  assert.ok(slots.size > 0)
  expectKeys(
    'ui',
    [...slots].map(slot => `equipment.slots.${slot}`)
  )
})

test('every between-tour decision and option has translated copy', () => {
  expectKeys('ui', [
    ...BETWEEN_TOUR_DECISION_PRIORITY.map(
      type => `expedition.betweenTour.${type}`
    ),
    ...Object.values(BETWEEN_TOUR_OPTIONS)
      .flat()
      .map(option => `expedition.betweenTour.option.${option}`)
  ])
})

test('every game phase has a chatter feed label', () => {
  expectKeys(
    'ui',
    Object.values(GAME_PHASES).map(phase => `chatter_labels.${phase}`)
  )
})

test('crisis source labels exist for the fixed source families', () => {
  expectKeys(
    'ui',
    [
      'expedition_cash',
      'expedition_route',
      'expedition_unpaid_obligation',
      'authority',
      'unknown'
    ].map(id => `expedition.crisis.source.${id}`)
  )
})
