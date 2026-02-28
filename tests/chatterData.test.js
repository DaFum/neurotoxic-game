import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ALLOWED_DEFAULT_SCENES,
  CHATTER_DB,
  getRandomChatter
} from '../src/data/chatter.js'

const buildState = (scene, overrides = {}) => ({
  currentScene: scene,
  player: {
    currentNodeId: 'none',
    money: 500,
    day: 1,
    totalTravels: 0,
    fame: 0,
    fameLevel: 0,
    van: { fuel: 100, condition: 100, upgrades: [] },
    ...overrides.player
  },
  band: {
    members: [{ name: 'Matze', mood: 80, stamina: 100 }],
    harmony: 80,
    luck: 0,
    inventory: {
      strings: true,
      cables: true,
      drum_parts: true,
      golden_pick: false,
      shirts: 50,
      hoodies: 20,
      patches: 100,
      cds: 30,
      vinyl: 10
    },
    ...overrides.band
  },
  social: {
    instagram: 228,
    tiktok: 64,
    youtube: 14,
    viral: 0,
    ...overrides.social
  },
  gameMap: { nodes: {} },
  gigModifiers: {
    promo: false,
    soundcheck: false,
    merch: false,
    catering: false,
    guestlist: false,
    ...overrides.gigModifiers
  }
})

const getActivatedConditionalEntries = state =>
  CHATTER_DB.filter(
    entry => typeof entry.condition === 'function' && entry.condition(state)
  )

const getConditionDelta = ({ activeState, inactiveState }) => {
  const inactiveEntries = new Set(getActivatedConditionalEntries(inactiveState))
  return getActivatedConditionalEntries(activeState).filter(
    entry => !inactiveEntries.has(entry)
  )
}

test('getRandomChatter supports default chatter in all top-level scenes', () => {
  const scenes = ['MENU', 'OVERWORLD', 'PREGIG', 'POSTGIG']

  scenes.forEach(scene => {
    const chatter = getRandomChatter(buildState(scene))
    assert.ok(chatter, `Expected chatter for scene: ${scene}`)
    assert.strictEqual(typeof chatter.text, 'string')
  })
})

test('disallowed scenes are not in ALLOWED_DEFAULT_SCENES', () => {
  const disallowedScenes = ['GIG', 'SETTINGS', 'CREDITS', 'GAMEOVER']

  disallowedScenes.forEach(scene => {
    assert.strictEqual(ALLOWED_DEFAULT_SCENES.includes(scene), false)
  })
})

// --- NEW: Condition-based chatter categories ---

test('harmony chatter fires when band.harmony is low', () => {
  const state = buildState('OVERWORLD', { band: { harmony: 25 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text.includes('talk')
  )
  assert.ok(matches.length > 0, 'Expected low-harmony chatter to activate')
})

test('harmony chatter fires when band.harmony is high', () => {
  const state = buildState('OVERWORLD', { band: { harmony: 92 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text.includes('locked in')
  )
  assert.ok(matches.length > 0, 'Expected high-harmony chatter to activate')
})

test('van chatter fires when fuel is low', () => {
  const lowFuelState = buildState('OVERWORLD', {
    player: { van: { fuel: 15, condition: 100 } }
  })
  const highFuelState = buildState('OVERWORLD', {
    player: { van: { fuel: 95, condition: 100 } }
  })
  const matches = getConditionDelta({
    activeState: lowFuelState,
    inactiveState: highFuelState
  })
  assert.ok(matches.length > 0, 'Expected low-fuel chatter to activate')
})

test('van chatter fires when condition is critical', () => {
  const state = buildState('OVERWORLD', {
    player: { van: { fuel: 100, condition: 20 } }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text.toLowerCase().includes('van')
  )
  assert.ok(
    matches.length > 0,
    'Expected bad-condition van chatter to activate'
  )
})

test('tour progression chatter fires for late tour', () => {
  const matches = getConditionDelta({
    activeState: buildState('OVERWORLD', { player: { day: 28 } }),
    inactiveState: buildState('OVERWORLD', { player: { day: 5 } })
  })
  assert.ok(matches.length > 0, 'Expected late-tour chatter to activate')
})

test('tour progression chatter fires for early tour', () => {
  const matches = getConditionDelta({
    activeState: buildState('OVERWORLD', { player: { day: 1 } }),
    inactiveState: buildState('OVERWORLD', { player: { day: 8 } })
  })
  assert.ok(matches.length > 0, 'Expected early-tour chatter to activate')
})

test('fame chatter fires when fameLevel >= 2', () => {
  const state = buildState('OVERWORLD', { player: { fameLevel: 2, fame: 200 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text.includes('recognize')
  )
  assert.ok(matches.length > 0, 'Expected fame-level chatter to activate')
})

test('fame chatter fires when fame is low', () => {
  const state = buildState('OVERWORLD', { player: { fame: 20, fameLevel: 0 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text.includes('nobodies')
  )
  assert.ok(matches.length > 0, 'Expected low-fame chatter to activate')
})

test('inventory chatter fires when strings are missing', () => {
  const state = buildState('OVERWORLD', {
    band: {
      inventory: {
        strings: false,
        cables: true,
        drum_parts: true,
        golden_pick: false,
        shirts: 50,
        hoodies: 20,
        patches: 100,
        cds: 30,
        vinyl: 10
      }
    }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text.includes('strings')
  )
  assert.ok(matches.length > 0, 'Expected missing-strings chatter to activate')
})

test('inventory chatter fires for golden pick', () => {
  const state = buildState('OVERWORLD', {
    band: {
      inventory: {
        strings: true,
        cables: true,
        drum_parts: true,
        golden_pick: true,
        shirts: 50,
        hoodies: 20,
        patches: 100,
        cds: 30,
        vinyl: 10
      }
    }
  })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text.includes('golden pick')
  )
  assert.ok(matches.length > 0, 'Expected golden-pick chatter to activate')
})

test('gig modifier chatter fires when catering is booked', () => {
  const matches = getConditionDelta({
    activeState: buildState('OVERWORLD', { gigModifiers: { catering: true } }),
    inactiveState: buildState('OVERWORLD', {
      gigModifiers: { catering: false }
    })
  })
  assert.ok(matches.length > 0, 'Expected catering chatter to activate')
})

test('gig modifier chatter fires when nothing is booked', () => {
  const matches = getConditionDelta({
    activeState: buildState('OVERWORLD', {
      gigModifiers: {
        soundcheck: false,
        promo: false,
        catering: false,
        merch: false,
        guestlist: false
      }
    }),
    inactiveState: buildState('OVERWORLD', {
      gigModifiers: {
        soundcheck: true,
        promo: true,
        catering: true,
        merch: false,
        guestlist: false
      }
    })
  })
  assert.ok(matches.length > 0, 'Expected no-modifiers chatter to activate')
})

test('luck chatter fires when luck is high', () => {
  const matches = getConditionDelta({
    activeState: buildState('OVERWORLD', { band: { luck: 5 } }),
    inactiveState: buildState('OVERWORLD', { band: { luck: 0 } })
  })
  assert.ok(matches.length > 0, 'Expected high-luck chatter to activate')
})

test('luck chatter fires when luck is negative', () => {
  const state = buildState('OVERWORLD', { band: { luck: -5 } })
  const matches = CHATTER_DB.filter(
    e =>
      typeof e.condition === 'function' &&
      e.condition(state) &&
      e.text.includes('cursed')
  )
  assert.ok(matches.length > 0, 'Expected bad-luck chatter to activate')
})
