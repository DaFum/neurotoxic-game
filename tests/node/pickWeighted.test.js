import assert from 'node:assert/strict'
import test from 'node:test'
import { pickWeighted } from '../../src/utils/selectionUtils'
import { mulberry32 } from '../../src/utils/seededRng'
import { pickRarity } from '../../src/utils/contrabandUtils'
import { CONTRABAND_RARITY_WEIGHTS } from '../../src/data/contraband'
import { MINIGAME_CONFIG } from '../../src/hooks/preGig/preGigUtils'

// Verbatim copies of the pre-migration pickers, kept here as the oracle that
// proves the shared helper does not shift any seeded stream.
const legacyCursor = (roll, entries) => {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  if (total <= 0) return 'CLUB_GIG'
  let cursor = roll * total
  for (const entry of entries) {
    cursor -= entry.weight
    if (cursor < 0) return entry.value
  }
  return entries[entries.length - 1]?.value ?? 'CLUB_GIG'
}

const legacyLessEqual = (roll01, entries) => {
  const total = entries.reduce((sum, item) => sum + item.weight, 0)
  let roll = roll01 * total
  for (const item of entries) {
    roll -= item.weight
    if (roll <= 0) return item.value
  }
  return entries.at(-1)?.value ?? null
}

const legacyCumulative = (roll01, entries) => {
  const total = entries.reduce((sum, item) => sum + item.weight, 0)
  const randomVal = roll01 * total
  let cumulative = 0
  let chosen = 'roadie'
  for (const item of entries) {
    cumulative += item.weight
    if (randomVal < cumulative) {
      chosen = item.value
      break
    }
  }
  return chosen
}

const sweepRolls = () => {
  const rolls = []
  const rng = mulberry32(0xc0ffee)
  for (let i = 0; i < 20000; i++) rolls.push(rng())
  for (let k = 0; k < 1000; k++) rolls.push(k / 1000)
  rolls.push(0, 0.5, 1 - Number.EPSILON / 2)
  return rolls
}

const asRng = value => () => value

test('pickWeighted matches the expedition map picker for every roll', () => {
  const entries = [
    { value: 'CLUB_GIG', weight: 2 * 1.2 },
    { value: 'FESTIVAL', weight: 0.8 },
    { value: 'SUPPLY_STOP', weight: 1 },
    { value: 'REST_STOP', weight: 0.6 }
  ]
  for (const roll of sweepRolls()) {
    assert.equal(
      pickWeighted(entries, asRng(roll)),
      legacyCursor(roll, entries),
      `roll ${roll}`
    )
  }
})

test('pickWeighted matches the contraband rarity picker for every roll', () => {
  const entries = Object.entries(CONTRABAND_RARITY_WEIGHTS).map(
    ([value, weight]) => ({ value, weight })
  )
  for (const roll of sweepRolls()) {
    assert.equal(
      pickRarity(asRng(roll)),
      legacyCursor(roll, entries),
      `roll ${roll}`
    )
  }
})

test('pickWeighted matches the pre-gig minigame picker for every roll', () => {
  for (const last of [null, 'roadie', 'kabelsalat', 'amp']) {
    const entries = Object.keys(MINIGAME_CONFIG).map(id => ({
      value: id,
      weight: last === id ? 0.2 : MINIGAME_CONFIG[id].weight
    }))
    for (const roll of sweepRolls()) {
      assert.equal(
        pickWeighted(entries, asRng(roll)) ?? 'roadie',
        legacyCumulative(roll, entries),
        `last ${last} roll ${roll}`
      )
    }
  }
})

test('pickWeighted matches the pressure and chatter pickers off the exact boundary', () => {
  const entries = [
    { value: 'a', weight: 3.5 },
    { value: 'b', weight: 1 },
    { value: 'c', weight: 0.25 },
    { value: 'd', weight: 7 }
  ]
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  const boundaries = new Set()
  let running = 0
  for (const entry of entries) {
    running += entry.weight
    boundaries.add(running / total)
  }
  for (const roll of sweepRolls()) {
    if (boundaries.has(roll)) continue
    assert.equal(
      pickWeighted(entries, asRng(roll)),
      legacyLessEqual(roll, entries),
      `roll ${roll}`
    )
  }
})

test('pickWeighted treats an exact interval edge as the next entry (half-open intervals)', () => {
  const entries = [
    { value: 'a', weight: 1 },
    { value: 'b', weight: 1 }
  ]
  // The retired `roll <= 0` pickers gave the shared edge to the earlier entry.
  assert.equal(legacyLessEqual(0.5, entries), 'a')
  assert.equal(pickWeighted(entries, asRng(0.5)), 'b')
})

test('pickWeighted never picks a zero-weight entry, even at roll 0', () => {
  const entries = [
    { value: 'dead', weight: 0 },
    { value: 'live', weight: 2 }
  ]
  assert.equal(pickWeighted(entries, asRng(0)), 'live')
  assert.equal(legacyLessEqual(0, entries), 'dead')
})

test('pickWeighted consumes exactly one rng draw, even when nothing is pickable', () => {
  let calls = 0
  const rng = () => {
    calls++
    return 0.3
  }
  pickWeighted([{ value: 'a', weight: 1 }], rng)
  assert.equal(calls, 1)
  assert.equal(pickWeighted([], rng), null)
  assert.equal(calls, 2)
  assert.equal(pickWeighted([{ value: 'a', weight: 0 }], rng), null)
  assert.equal(calls, 3)
})

test('pickWeighted returns null past the total and normalizes bad weights and rolls', () => {
  const entries = [
    { value: 'a', weight: 1 },
    { value: 'b', weight: Number.NaN },
    { value: 'c', weight: -5 }
  ]
  assert.equal(pickWeighted(entries, asRng(1.5)), null)
  assert.equal(pickWeighted(entries, asRng(Number.NaN)), 'a')
  assert.equal(pickWeighted(entries, asRng(0.99)), 'a')
})
